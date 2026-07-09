"""OpenAI ChatCompletion provider."""
from typing import List

from openai import AsyncOpenAI

from app.ai.base import AIProvider, AIResponse, ChatMessage
from app.core.config import settings
from app.core.exceptions import AIProviderException


class OpenAIProvider(AIProvider):
    def __init__(self) -> None:
        if not settings.OPENAI_API_KEY:
            raise AIProviderException("OPENAI_API_KEY is not configured")
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return settings.OPENAI_MODEL

    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AIResponse:
        try:
            response = await self._client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return AIResponse(
                content=response.choices[0].message.content or "",
                provider=self.provider_name,
                model=self.model_name,
                tokens_used=response.usage.total_tokens if response.usage else None,
            )
        except Exception as exc:
            raise AIProviderException(f"OpenAI error: {exc}") from exc

    async def health_check(self) -> bool:
        try:
            await self._client.models.list()
            return True
        except Exception:
            return False
