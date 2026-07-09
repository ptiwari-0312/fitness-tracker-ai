"""Groq vision API for meal image analysis (llama-3.2-11b-vision-preview)."""
import base64
import json
import re
from typing import List

import httpx

from app.core.config import settings

_MEAL_PROMPT = """\
You are a nutrition expert analyzing a meal photo.
Identify every visible food item, estimate its quantity, and calculate nutrition.
Reply with ONLY a valid JSON object — no explanation, no markdown fences.

Format:
{
  "items": [
    {"name": "chapatti", "quantity": "2 pieces", "calories": 160, "protein_g": 5.0, "carbs_g": 30.0, "fat_g": 3.0},
    {"name": "dal", "quantity": "100g bowl", "calories": 80, "protein_g": 5.0, "carbs_g": 12.0, "fat_g": 1.0}
  ],
  "total_calories": 240,
  "description": "2 chapatti with dal",
  "confidence": "high"
}"""


class GroqVisionProvider:
    _BASE = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self) -> None:
        self._api_key = settings.GROQ_API_KEY
        self._model = settings.GROQ_VISION_MODEL

    def is_configured(self) -> bool:
        return bool(self._api_key and self._api_key.strip())

    async def analyze_meal_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
        """Send image to Groq vision model and return structured nutrition data."""
        b64 = base64.b64encode(image_bytes).decode()
        data_url = f"data:{mime_type};base64,{b64}"

        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url, "detail": "auto"}},
                        {"type": "text", "text": _MEAL_PROMPT},
                    ],
                }
            ],
            "max_tokens": 512,
            "temperature": 0.1,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                self._BASE,
                json=payload,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()

        content = resp.json()["choices"][0]["message"]["content"].strip()

        # Extract JSON — strip markdown fences if model adds them
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if not match:
            raise ValueError(f"No JSON in Groq response: {content[:300]}")

        return json.loads(match.group())
