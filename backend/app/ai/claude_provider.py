"""Anthropic Claude provider for AI coach chat."""
from typing import List

import anthropic

from app.ai.base import AIProvider, AIResponse, ChatMessage
from app.core.config import settings
from app.core.exceptions import AIProviderException


class ClaudeProvider(AIProvider):
    def __init__(self) -> None:
        self._api_key = settings.ANTHROPIC_API_KEY
        self._model = settings.ANTHROPIC_VISION_MODEL  # reuse same model config

    @property
    def provider_name(self) -> str:
        return "claude"

    @property
    def model_name(self) -> str:
        return self._model

    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AIResponse:
        if not self._api_key:
            raise AIProviderException("ANTHROPIC_API_KEY is not set")

        # Separate system prompt from conversation messages
        system_prompt = ""
        api_messages = []
        for m in messages:
            if m.role == "system":
                system_prompt = m.content
            else:
                api_messages.append({"role": m.role, "content": m.content})

        try:
            client = anthropic.AsyncAnthropic(api_key=self._api_key)
            response = await client.messages.create(
                model=self._model,
                max_tokens=max_tokens,
                system=system_prompt or anthropic.NOT_GIVEN,
                messages=api_messages,
            )
            return AIResponse(
                content=response.content[0].text,
                provider=self.provider_name,
                model=self._model,
                tokens_used=response.usage.input_tokens + response.usage.output_tokens,
            )
        except anthropic.APIError as exc:
            raise AIProviderException(f"Claude API error: {exc}") from exc
        except Exception as exc:
            raise AIProviderException(f"Claude error: {exc}") from exc

    async def health_check(self) -> bool:
        try:
            client = anthropic.AsyncAnthropic(api_key=self._api_key)
            await client.messages.create(
                model=self._model,
                max_tokens=10,
                messages=[{"role": "user", "content": "hi"}],
            )
            return True
        except Exception:
            return False
