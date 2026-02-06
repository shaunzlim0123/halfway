import math
from typing import Any

import httpx

from app.config import settings
from app.services.geocoding import LatLng

GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"

INITIAL_SEARCH_RADIUS = 800
MAX_SEARCH_RADIUS = 3000
RADIUS_MULTIPLIER = 1.5
MIN_VENUES = 5
MAX_VENUES = 8

MIN_RATING = 4.0
MIN_REVIEWS = 50
RELAXED_MIN_RATING = 3.8
RELAXED_MIN_REVIEWS = 30

VENUE_TYPES = ["restaurant", "cafe"]


async def _search_nearby(center: LatLng, radius: float) -> list[dict[str, Any]]:
    api_key = settings.google_places_api_key
    if not api_key:
        raise RuntimeError("GOOGLE_PLACES_API_KEY is not set")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_PLACES_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": (
                    "places.id,places.displayName,places.formattedAddress,"
                    "places.location,places.rating,places.userRatingCount,"
                    "places.priceLevel,places.googleMapsUri,places.types"
                ),
            },
            json={
                "includedTypes": VENUE_TYPES,
                "maxResultCount": 20,
                "rankPreference": "POPULARITY",
                "locationRestriction": {
                    "circle": {
                        "center": {
                            "latitude": center["lat"],
                            "longitude": center["lng"],
                        },
                        "radius": radius,
                    }
                },
            },
        )

    if resp.status_code != 200:
        raise RuntimeError(f"Google Places API error: {resp.status_code} - {resp.text}")

    data = resp.json()
    return data.get("places", [])


def _filter_venues(
    venues: list[dict[str, Any]], min_rating: float, min_reviews: int
) -> list[dict[str, Any]]:
    return [
        v
        for v in venues
        if (v.get("rating") or 0) >= min_rating
        and (v.get("userRatingCount") or 0) >= min_reviews
    ]


def _score_and_sort(venues: list[dict[str, Any]]) -> list[dict[str, Any]]:
    def score(v: dict[str, Any]) -> float:
        rating = v.get("rating") or 0
        count = max(v.get("userRatingCount") or 1, 1)
        return rating * math.log10(count)

    return sorted(venues, key=score, reverse=True)


async def search_venues(midpoint: LatLng) -> list[dict[str, Any]]:
    radius = INITIAL_SEARCH_RADIUS
    filtered: list[dict[str, Any]] = []

    while radius <= MAX_SEARCH_RADIUS:
        raw = await _search_nearby(midpoint, radius)
        filtered = _filter_venues(raw, MIN_RATING, MIN_REVIEWS)

        if len(filtered) >= MIN_VENUES:
            break
        radius = round(radius * RADIUS_MULTIPLIER)

    if len(filtered) < MIN_VENUES:
        raw = await _search_nearby(midpoint, MAX_SEARCH_RADIUS)
        filtered = _filter_venues(raw, RELAXED_MIN_RATING, RELAXED_MIN_REVIEWS)

    scored = _score_and_sort(filtered)
    return scored[:MAX_VENUES]
