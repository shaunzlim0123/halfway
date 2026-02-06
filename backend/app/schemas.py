from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, field_serializer


def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# --- Request bodies ---


class CreateSessionRequest(BaseModel):
    lat: float
    lng: float


class JoinSessionRequest(BaseModel):
    lat: float
    lng: float
    pinCode: str | None = None


class VoteRequest(BaseModel):
    venueId: str
    voter: str


# --- Response bodies ---


class CreateSessionResponse(CamelModel):
    session_id: str
    share_url: str
    pin_code: str


class JoinResponse(BaseModel):
    success: bool = True


class ComputeResponse(BaseModel):
    success: bool = True


class VoteResponse(CamelModel):
    all_votes_in: bool
    winner_id: str | None = None


class VenueOut(CamelModel):
    id: str
    session_id: str
    google_place_id: str
    name: str
    address: str | None
    lat: float
    lng: float
    rating: float
    user_rating_count: int
    price_level: str | None
    google_maps_uri: str | None
    types: str | None
    description: str | None
    cuisine_tags: str | None
    vibe_tags: str | None
    best_for: str | None
    signature_dish: str | None


class VoteOut(CamelModel):
    id: str
    session_id: str
    venue_id: str
    voter: str
    created_at: Any

    @field_serializer("created_at")
    def serialize_created_at(self, v: Any) -> str:
        if isinstance(v, int):
            return datetime.fromtimestamp(v, tz=timezone.utc).isoformat()
        return str(v)


class SessionOut(CamelModel):
    id: str
    status: str
    user_a_lat: float
    user_a_lng: float
    user_a_label: str | None
    user_b_lat: float | None
    user_b_lng: float | None
    user_b_label: str | None
    midpoint_lat: float | None
    midpoint_lng: float | None
    user_a_travel_time: int | None
    user_b_travel_time: int | None
    travel_mode: str
    winner_venue_id: str | None
    pin_code: str | None
    warning: str | None
    created_at: Any
    updated_at: Any
    venues: list[VenueOut] = []
    votes: list[VoteOut] = []

    @field_serializer("created_at", "updated_at")
    def serialize_timestamp(self, v: Any) -> str:
        if isinstance(v, int):
            return datetime.fromtimestamp(v, tz=timezone.utc).isoformat()
        return str(v)
