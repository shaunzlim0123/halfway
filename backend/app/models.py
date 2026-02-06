from sqlalchemy import String, Float, Integer, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="waiting_for_b")
    user_a_lat: Mapped[float] = mapped_column(Float, nullable=False)
    user_a_lng: Mapped[float] = mapped_column(Float, nullable=False)
    user_a_label: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_b_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    user_b_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    user_b_label: Mapped[str | None] = mapped_column(Text, nullable=True)
    midpoint_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    midpoint_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    user_a_travel_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_b_travel_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    travel_mode: Mapped[str] = mapped_column(String, nullable=False, default="transit")
    winner_venue_id: Mapped[str | None] = mapped_column(String, nullable=True)
    pin_code: Mapped[str | None] = mapped_column(String, nullable=True)
    warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[int] = mapped_column(Integer, nullable=False)


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("sessions.id"), nullable=False)
    google_place_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    user_rating_count: Mapped[int] = mapped_column(Integer, nullable=False)
    price_level: Mapped[str | None] = mapped_column(String, nullable=True)
    google_maps_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    types: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cuisine_tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    vibe_tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    best_for: Mapped[str | None] = mapped_column(Text, nullable=True)
    signature_dish: Mapped[str | None] = mapped_column(Text, nullable=True)


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("sessions.id"), nullable=False)
    venue_id: Mapped[str] = mapped_column(String, ForeignKey("venues.id"), nullable=False)
    voter: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[int] = mapped_column(Integer, nullable=False)
