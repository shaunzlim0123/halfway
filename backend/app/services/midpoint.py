from app.services.geocoding import LatLng
from app.services.routing import get_transit_times

MIDPOINT_MAX_ITERATIONS = 3
MIDPOINT_CONVERGENCE_THRESHOLD = 0.1
MIDPOINT_DAMPING_FACTOR = 0.3
LONG_DISTANCE_THRESHOLD = 3600  # 60 min in seconds


class MidpointResult:
    def __init__(
        self,
        midpoint: LatLng,
        travel_time_a: int,
        travel_time_b: int,
        warning: str | None = None,
    ):
        self.midpoint = midpoint
        self.travel_time_a = travel_time_a
        self.travel_time_b = travel_time_b
        self.warning = warning


def geographic_midpoint(a: LatLng, b: LatLng) -> LatLng:
    return {"lat": (a["lat"] + b["lat"]) / 2, "lng": (a["lng"] + b["lng"]) / 2}


def _shift_toward_slower(
    candidate: LatLng,
    source_a: LatLng,
    source_b: LatLng,
    time_a: float,
    time_b: float,
) -> LatLng:
    target = source_a if time_a > time_b else source_b
    return {
        "lat": candidate["lat"] + MIDPOINT_DAMPING_FACTOR * (target["lat"] - candidate["lat"]),
        "lng": candidate["lng"] + MIDPOINT_DAMPING_FACTOR * (target["lng"] - candidate["lng"]),
    }


async def find_fair_midpoint(location_a: LatLng, location_b: LatLng) -> MidpointResult:
    candidate = geographic_midpoint(location_a, location_b)
    time_a = 0.0
    time_b = 0.0

    for _ in range(MIDPOINT_MAX_ITERATIONS):
        time_a, time_b = await get_transit_times(location_a, location_b, candidate)

        max_time = max(time_a, time_b)
        diff = abs(time_a - time_b)

        if max_time == 0 or diff / max_time < MIDPOINT_CONVERGENCE_THRESHOLD:
            break

        candidate = _shift_toward_slower(candidate, location_a, location_b, time_a, time_b)

    warning = None
    if max(time_a, time_b) > LONG_DISTANCE_THRESHOLD:
        warning = "Public transport time exceeds 60 minutes. Consider alternative meeting locations."

    return MidpointResult(
        midpoint=candidate,
        travel_time_a=round(time_a),
        travel_time_b=round(time_b),
        warning=warning,
    )
