"""Claude (Anthropic) vision provider for meal image analysis."""
import base64
import json
import re

import anthropic

from app.core.config import settings

_MEAL_PROMPT = """\
You are a nutrition expert analyzing a meal photo.
Identify every visible food item, estimate its quantity, and calculate nutrition.
Reply with ONLY a valid JSON object — no explanation, no markdown fences.

Format exactly:
{
  "items": [
    {"name": "chapatti", "quantity": "2 pieces", "calories": 160, "protein_g": 5.0, "carbs_g": 30.0, "fat_g": 3.0},
    {"name": "dal", "quantity": "100g bowl", "calories": 80, "protein_g": 5.0, "carbs_g": 12.0, "fat_g": 1.0}
  ],
  "total_calories": 240,
  "description": "2 chapatti with dal",
  "confidence": "high"
}"""


class ClaudeVisionProvider:
    def __init__(self) -> None:
        self._api_key = settings.ANTHROPIC_API_KEY
        self._model = settings.ANTHROPIC_VISION_MODEL

    def is_configured(self) -> bool:
        return bool(self._api_key and self._api_key.strip())

    async def analyze_meal_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
        """Send image to Claude and return structured nutrition data."""
        b64 = base64.b64encode(image_bytes).decode()

        # Use AsyncAnthropic — works correctly inside FastAPI's running event loop
        client = anthropic.AsyncAnthropic(api_key=self._api_key)
        response = await client.messages.create(
            model=self._model,
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime_type,
                                "data": b64,
                            },
                        },
                        {"type": "text", "text": _MEAL_PROMPT},
                    ],
                }
            ],
        )

        content = response.content[0].text.strip()

        match = re.search(r'\{.*\}', content, re.DOTALL)
        if not match:
            raise ValueError(f"No JSON in Claude response: {content[:300]}")

        return json.loads(match.group())
