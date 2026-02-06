import logging
import time

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Session
from app.schemas import JoinResponse, JoinSessionRequest
from app.services.geocoding import snap_to_road

logger = logging.getLogger(__name__)

SESSION_TTL_S = 24 * 60 * 60

router = APIRouter()


@router.post("/api/sessions/{session_id}/join", response_model=None)
async def join_session(
    session_id: str,
    body: JoinSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        if not isinstance(body.lat, (int, float)) or not isinstance(body.lng, (int, float)):
            return JSONResponse(
                {"error": "lat and lng are required numbers"}, status_code=400
            )

        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one_or_none()

        if not session:
            return JSONResponse({"error": "Session not found"}, status_code=404)

        age = int(time.time()) - session.created_at
        if age > SESSION_TTL_S:
            return JSONResponse(
                {"error": "Session expired", "expired": True}, status_code=410
            )

        if session.status != "waiting_for_b":
            return JSONResponse(
                {"error": "Session is not waiting for User B"}, status_code=400
            )

        if session.pin_code and session.pin_code != body.pinCode:
            return JSONResponse({"error": "Incorrect PIN code"}, status_code=403)

        snap_result = await snap_to_road({"lat": body.lat, "lng": body.lng})
        if not snap_result:
            return JSONResponse(
                {"error": "Could not find a road near your pin. Please try a different location."},
                status_code=400,
            )

        session.user_b_lat = snap_result["snapped"]["lat"]
        session.user_b_lng = snap_result["snapped"]["lng"]
        session.user_b_label = snap_result["address"]
        session.status = "ready_to_compute"
        session.updated_at = int(time.time())
        await db.commit()

        return JoinResponse(success=True)
    except Exception as e:
        logger.error("Error joining session: %s", e)
        return JSONResponse({"error": "Failed to join session"}, status_code=500)
