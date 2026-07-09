"""
Abstract AI provider interface.
Business logic only speaks to AIProvider — concrete implementations are swappable
by changing AI_PROVIDER in .env without touching any service or API code.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ChatMessage:
    role: str       # "system" | "user" | "assistant"
    content: str


@dataclass
class AIResponse:
    content: str
    provider: str
    model: str
    tokens_used: Optional[int] = None


class AIProvider(ABC):
    """Contract that every LLM provider must fulfil."""

    @abstractmethod
    async def chat(
        self,
        messages: List[ChatMessage],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AIResponse:
        """Send a conversation to the LLM and return its reply."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the provider is reachable and the key is valid."""
        ...

    @property
    @abstractmethod
    def provider_name(self) -> str: ...

    @property
    @abstractmethod
    def model_name(self) -> str: ...
