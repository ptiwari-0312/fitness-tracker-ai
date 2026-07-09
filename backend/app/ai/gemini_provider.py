"""Google Gemini provider via the google-generativeai SDK."""
from typing import List

import google.generativeai as genai

from app.ai.base import AIProvider, AIResponse, ChatMessage
from app.core.config import settings
from app.core.exceptions import AIProviderException


class GeminiProvider(AIProvider):
    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise AIProviderException("GEMINI_API_KEY is not configured")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(settings.GEMINI_MODEL)

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return settings.GEMINI_MODEL

    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AIResponse:
        try:
            # Gemini uses a flat prompt; we concatenate the history.
            prompt_parts = []
            for msg in messages:
                prefix = "System" if msg.role == "system" else msg.role.capitalize()
                prompt_parts.append(f"{prefix}: {msg.content}")
            prompt = "\n".join(prompt_parts) + "\nAssistant:"

            response = self._model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            return AIResponse(
                content=response.text,
                provider=self.provider_name,
                model=self.model_name,
            )
        except Exception as exc:
            raise AIProviderException(f"Gemini error: {exc}") from exc

    async def health_check(self) -> bool:
        try:
            genai.list_models()
            return True
        except Exception:
            return False
