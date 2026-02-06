import logging
import time

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Session, Venue, Vote
from app.schemas import (
    CreateSessionRequest,
    CreateSessionResponse,
    SessionOut,
    VenueOut,
    VoteOut,
)
from app.services.geocoding import snap_to_road
from app.services.rate_limit import check_rate_limit
from app.services.session_utils import generate_pin_code, generate_session_id, get_share_url

logger = logging.getLogger(__name__)

SESSION_TTL_S = 24 * 60 * 60  # 24 hours in seconds

router = APIRouter()


@router.post("/api/sessions", response_model=None)
async def create_session(
    body: CreateSessionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        ip = (
            (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
            or request.headers.get("x-real-ip")
            or "unknown"
        )
        if not check_rate_limit(ip):
            return JSONResponse(
                {"error": "Too many sessions. Try again later."}, status_code=429
            )

        if not isinstance(body.lat, (int, float)) or not isinstance(body.lng, (int, float)):
            return JSONResponse(
                {"error": "lat and lng are required numbers"}, status_code=400
            )

        snap_result = await snap_to_road({"lat": body.lat, "lng": body.lng})
        if not snap_result:
            return JSONResponse(
                {"error": "Could not find a road near your pin. Please try a different location."},
                status_code=400,
            )

        session_id = generate_session_id()
        pin_code = generate_pin_code()
        now = int(time.time())

        session = Session(
            id=session_id,
            status="waiting_for_b",
            user_a_lat=snap_result["snapped"]["lat"],
            user_a_lng=snap_result["snapped"]["lng"],
            user_a_label=snap_result["address"],
            travel_mode="transit",
            pin_code=pin_code,
            created_at=now,
            updated_at=now,
        )
        db.add(session)
        await db.commit()

        return CreateSessionResponse(
            session_id=session_id,
            share_url=get_share_url(session_id),
            pin_code=pin_code,
        )
    except Exception as e:
        logger.error("Error creating session: %s", e)
        return JSONResponse({"error": "Failed to create session"}, status_code=500)


@router.get("/api/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    try:
        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one_or_none()

        if not session:
            return JSONResponse({"error": "Session not found"}, status_code=404)

        age = int(time.time()) - session.created_at
        if age > SESSION_TTL_S:
            return JSONResponse(
                {"error": "Session expired", "expired": True}, status_code=410
            )

        venues_result = await db.execute(
            select(Venue).where(Venue.session_id == session_id)
        )
        session_venues = venues_result.scalars().all()

        votes_result = await db.execute(
            select(Vote).where(Vote.session_id == session_id)
        )
        session_votes = votes_result.scalars().all()

        out = SessionOut.model_validate(session)
        out.venues = [VenueOut.model_validate(v) for v in session_venues]
        out.votes = [VoteOut.model_validate(v) for v in session_votes]

        return JSONResponse(out.model_dump(by_alias=True))
    except Exception as e:
        logger.error("Error fetching session: %s", e)
        return JSONResponse({"error": "Failed to fetch session"}, status_code=500)
