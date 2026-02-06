from typing import TypedDict

import httpx

from app.config import settings

GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"


class LatLng(TypedDict):
    lat: float
    lng: float


class SnapResult(TypedDict):
    snapped: LatLng
    address: str


async def snap_to_road(point: LatLng) -> SnapResult | None:
    params = {
        "latlng": f"{point['lat']},{point['lng']}",
        "result_type": "street_address|route|premise",
        "key": settings.google_places_api_key,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_GEOCODING_URL, params=params)

    if resp.status_code != 200:
        return None

    data = resp.json()

    if data.get("status") != "OK" or not data.get("results"):
        return None

    result = data["results"][0]
    location = result.get("geometry", {}).get("location")

    if not location:
        return None

    return {
        "snapped": {"lat": location["lat"], "lng": location["lng"]},
        "address": result["formatted_address"],
    }
