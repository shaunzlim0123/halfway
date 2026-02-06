import json
import logging
from typing import Any

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a local restaurant and cafe expert. For each venue provided, generate:
1. A short 2-3 sentence description of what makes this place special
2. Cuisine tags (e.g., ["Japanese", "Ramen", "Izakaya"])
3. Vibe tags (e.g., ["Cozy", "Date night", "Trendy"])
4. Best-for labels (e.g., ["Casual catch-up", "Groups of 2-4"])
5. A signature dish or drink the place is likely known for

Base your response on the venue name, type, location, rating, and price level.
Return a valid JSON array with one object per venue. Each object must have these exact keys:
"name", "description", "cuisineTags", "vibeTags", "bestFor", "signatureDish"

Return ONLY the JSON array, no markdown formatting or code blocks."""


def _build_user_message(venues: list[dict[str, Any]]) -> str:
    simplified = [
        {
            "name": v.get("displayName", {}).get("text", ""),
            "types": v.get("types", []),
            "rating": v.get("rating"),
            "reviews": v.get("userRatingCount"),
            "address": v.get("formattedAddress", ""),
            "priceLevel": v.get("priceLevel", "UNKNOWN"),
        }
        for v in venues
    ]
    return json.dumps(simplified, indent=2)


async def enrich_venues(
    venues: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    enrichment_map: dict[str, dict[str, Any]] = {}

    if not venues:
        return enrichment_map

    api_key = settings.anthropic_api_key
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set, skipping venue enrichment")
        return enrichment_map

    client = anthropic.AsyncAnthropic(api_key=api_key)

    for attempt in range(2):
        try:
            message = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": _build_user_message(venues)}],
            )

            text_block = next((c for c in message.content if c.type == "text"), None)
            if not text_block:
                raise ValueError("No text content in response")

            raw_text = text_block.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.lstrip("`").removeprefix("json").strip()
                raw_text = raw_text.rstrip("`").strip()

            enrichments: list[dict[str, Any]] = json.loads(raw_text)

            for enrichment in enrichments:
                enrichment_map[enrichment["name"]] = enrichment

            return enrichment_map

        except Exception as e:
            if attempt == 0:
                logger.warning("Venue enrichment attempt 1 failed, retrying: %s", e)
                continue
            logger.error("Venue enrichment failed after 2 attempts: %s", e)

    return enrichment_map
