import json
import logging
import time

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Session, Venue
from app.schemas import ComputeResponse
from app.services.midpoint import find_fair_midpoint, geographic_midpoint
from app.services.places import search_venues
from app.services.session_utils import generate_id
from app.services.venue_enrichment import enrich_venues

logger = logging.getLogger(__name__)

SESSION_TTL_S = 24 * 60 * 60

router = APIRouter()


@router.post("/api/sessions/{session_id}/compute", response_model=None)
async def compute_midpoint(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
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

        if session.status != "ready_to_compute":
            return JSONResponse(
                {"error": "Session is not ready to compute"}, status_code=400
            )

        if session.user_b_lat is None or session.user_b_lng is None:
            return JSONResponse(
                {"error": "User B location not set"}, status_code=400
            )

        session.status = "computing"
        session.updated_at = int(time.time())
        await db.commit()

        location_a = {"lat": session.user_a_lat, "lng": session.user_a_lng}
        location_b = {"lat": session.user_b_lat, "lng": session.user_b_lng}

        # Stage 1: Find fair midpoint
        midpoint = geographic_midpoint(location_a, location_b)
        travel_time_a: int | None = None
        travel_time_b: int | None = None
        warning: str | None = None

        try:
            mp_result = await find_fair_midpoint(location_a, location_b)
            midpoint = mp_result.midpoint
            travel_time_a = mp_result.travel_time_a
            travel_time_b = mp_result.travel_time_b
            warning = mp_result.warning
        except Exception as mp_err:
            logger.error("Midpoint computation failed, using geographic fallback: %s", mp_err)
            warning = "Could not compute public transport times. Using geographic midpoint."

        # Stage 2: Search for venues
        raw_venues: list[dict] = []
        try:
            raw_venues = await search_venues(midpoint)
        except Exception as venue_err:
            logger.error("Venue search failed: %s", venue_err)

        # Stage 3: Enrich venues with AI
        enrichments: dict[str, dict] = {}
        try:
            enrichments = await enrich_venues(raw_venues)
        except Exception as enrich_err:
            logger.error("Venue enrichment failed: %s", enrich_err)

        # Store venues in database
        for venue in raw_venues:
            name = venue.get("displayName", {}).get("text", "")
            enrichment = enrichments.get(name)
            db.add(
                Venue(
                    id=generate_id(),
                    session_id=session_id,
                    google_place_id=venue.get("id", ""),
                    name=name,
                    address=venue.get("formattedAddress"),
                    lat=venue["location"]["latitude"],
                    lng=venue["location"]["longitude"],
                    rating=venue.get("rating") or 0,
                    user_rating_count=venue.get("userRatingCount") or 0,
                    price_level=venue.get("priceLevel"),
                    google_maps_uri=venue.get("googleMapsUri"),
                    types=json.dumps(venue.get("types")) if venue.get("types") else None,
                    description=enrichment.get("description") if enrichment else None,
                    cuisine_tags=(
                        json.dumps(enrichment["cuisineTags"]) if enrichment and enrichment.get("cuisineTags") else None
                    ),
                    vibe_tags=(
                        json.dumps(enrichment["vibeTags"]) if enrichment and enrichment.get("vibeTags") else None
                    ),
                    best_for=(
                        json.dumps(enrichment["bestFor"]) if enrichment and enrichment.get("bestFor") else None
                    ),
                    signature_dish=enrichment.get("signatureDish") if enrichment else None,
                )
            )

        # Update session
        session.midpoint_lat = midpoint["lat"]
        session.midpoint_lng = midpoint["lng"]
        session.user_a_travel_time = travel_time_a
        session.user_b_travel_time = travel_time_b
        session.warning = warning
        session.status = "voting"
        session.updated_at = int(time.time())
        await db.commit()

        return ComputeResponse(success=True)

    except Exception as e:
        logger.error("Error computing midpoint: %s", e)
        # Reset status on total failure
        try:
            result = await db.execute(select(Session).where(Session.id == session_id))
            session = result.scalar_one_or_none()
            if session:
                session.status = "ready_to_compute"
                session.updated_at = int(time.time())
                await db.commit()
        except Exception:
            pass
        return JSONResponse(
            {"error": "Failed to compute midpoint and venues"}, status_code=500
        )
