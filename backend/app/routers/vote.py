import logging
import random
import time

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Session, Venue, Vote
from app.schemas import VoteRequest, VoteResponse
from app.services.session_utils import generate_id

logger = logging.getLogger(__name__)

SESSION_TTL_S = 24 * 60 * 60

router = APIRouter()


@router.post("/api/sessions/{session_id}/vote", response_model=None)
async def submit_vote(
    session_id: str,
    body: VoteRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        if not body.venueId or not body.voter:
            return JSONResponse(
                {"error": "venueId and voter are required"}, status_code=400
            )

        if body.voter not in ("user_a", "user_b"):
            return JSONResponse(
                {"error": "voter must be user_a or user_b"}, status_code=400
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

        if session.status != "voting":
            return JSONResponse(
                {"error": "Session is not in voting phase"}, status_code=400
            )

        # Validate venue exists for this session
        venue_result = await db.execute(
            select(Venue).where(Venue.session_id == session_id, Venue.id == body.venueId)
        )
        if not venue_result.scalar_one_or_none():
            return JSONResponse(
                {"error": "Venue not found in this session"}, status_code=400
            )

        # Check if voter already voted
        existing = await db.execute(
            select(Vote).where(Vote.session_id == session_id, Vote.voter == body.voter)
        )
        if existing.scalar_one_or_none():
            return JSONResponse({"error": "You have already voted"}, status_code=400)

        # Insert vote
        db.add(
            Vote(
                id=generate_id(),
                session_id=session_id,
                venue_id=body.venueId,
                voter=body.voter,
                created_at=int(time.time()),
            )
        )
        await db.commit()

        # Check if both votes are in
        all_votes_result = await db.execute(
            select(Vote).where(Vote.session_id == session_id)
        )
        all_votes = all_votes_result.scalars().all()

        if len(all_votes) == 2:
            vote_a = next((v for v in all_votes if v.voter == "user_a"), None)
            vote_b = next((v for v in all_votes if v.voter == "user_b"), None)

            if not vote_a or not vote_b:
                return JSONResponse({"error": "Invalid vote data"}, status_code=500)

            if vote_a.venue_id == vote_b.venue_id:
                winner_id = vote_a.venue_id
            else:
                winner_id = random.choice([vote_a.venue_id, vote_b.venue_id])

            session.winner_venue_id = winner_id
            session.status = "completed"
            session.updated_at = int(time.time())
            await db.commit()

            return VoteResponse(all_votes_in=True, winner_id=winner_id)

        return VoteResponse(all_votes_in=False)

    except Exception as e:
        logger.error("Error submitting vote: %s", e)
        return JSONResponse({"error": "Failed to submit vote"}, status_code=500)
