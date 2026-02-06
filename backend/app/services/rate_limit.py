import time

MAX_SESSIONS_PER_HOUR = 10
ONE_HOUR_S = 60 * 60

_ip_counts: dict[str, dict] = {}


def check_rate_limit(ip: str) -> bool:
    now = time.time()
    entry = _ip_counts.get(ip)

    if entry is None or now > entry["reset_at"]:
        _ip_counts[ip] = {"count": 1, "reset_at": now + ONE_HOUR_S}
        return True

    if entry["count"] >= MAX_SESSIONS_PER_HOUR:
        return False

    entry["count"] += 1
    return True
