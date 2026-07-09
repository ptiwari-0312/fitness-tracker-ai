"""Ollama local LLM provider via its REST API."""
from typing import List

import httpx

from app.ai.base import AIProvider, AIResponse, ChatMessage
from app.core.config import settings
from app.core.exceptions import AIProviderException


class OllamaProvider(AIProvider):
    def __init__(self) -> None:
        self._base_url = settings.OLLAMA_BASE_URL.rstrip("/")

    @property
    def provider_name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return settings.OLLAMA_MODEL

    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AIResponse:
        payload = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        }
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                response = await client.post(f"{self._base_url}/api/chat", json=payload)
                response.raise_for_status()
                data = response.json()
            return AIResponse(
                content=data["message"]["content"],
                provider=self.provider_name,
                model=self.model_name,
            )
        except httpx.HTTPError as exc:
            raise AIProviderException(f"Ollama HTTP error: {exc}") from exc
        except Exception as exc:
            raise AIProviderException(f"Ollama error: {exc}") from exc

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self._base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False
