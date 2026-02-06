import httpx

from app.config import settings
from app.services.geocoding import LatLng

GOOGLE_DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"


async def get_transit_times(
    source_a: LatLng, source_b: LatLng, destination: LatLng
) -> tuple[float, float]:
    origins = f"{source_a['lat']},{source_a['lng']}|{source_b['lat']},{source_b['lng']}"
    destinations = f"{destination['lat']},{destination['lng']}"

    params = {
        "origins": origins,
        "destinations": destinations,
        "mode": "transit",
        "key": settings.google_places_api_key,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_DISTANCE_MATRIX_URL, params=params)

    if resp.status_code != 200:
        raise RuntimeError(f"Google Distance Matrix API error: {resp.status_code}")

    data = resp.json()

    if data.get("status") != "OK":
        raise RuntimeError(
            f"Google Distance Matrix error: {data.get('status')} - {data.get('error_message', '')}"
        )

    element_a = data["rows"][0]["elements"][0]
    element_b = data["rows"][1]["elements"][0]

    if element_a["status"] != "OK" or element_b["status"] != "OK":
        failed = element_a["status"] if element_a["status"] != "OK" else element_b["status"]
        raise RuntimeError(f"Distance Matrix element error: {failed}")

    time_a: float = element_a["duration"]["value"]
    time_b: float = element_b["duration"]["value"]

    return time_a, time_b
