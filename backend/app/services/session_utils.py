import random

from nanoid import generate

from app.config import settings


def generate_session_id() -> str:
    return generate(size=12)


def generate_id() -> str:
    return generate(size=21)


def get_share_url(session_id: str) -> str:
    return f"{settings.base_url}/session/{session_id}"


def generate_pin_code() -> str:
    return str(random.randint(1000, 9999))
