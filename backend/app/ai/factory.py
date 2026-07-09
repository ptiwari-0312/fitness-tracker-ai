"""
AI provider factory — reads AI_PROVIDER from config and returns the correct implementation.
New providers require only a new class + one branch here.
"""
from functools import lru_cache

from app.ai.base import AIProvider
from app.core.config import settings
from app.core.exceptions import AIProviderException


@lru_cache(maxsize=1)
def get_ai_provider() -> AIProvider:
    """Singleton — instantiated once and reused for all requests."""
    provider = settings.AI_PROVIDER.lower()

    if provider == "openai":
        from app.ai.openai_provider import OpenAIProvider
        return OpenAIProvider()

    if provider == "gemini":
        from app.ai.gemini_provider import GeminiProvider
        return GeminiProvider()

    if provider == "ollama":
        from app.ai.ollama_provider import OllamaProvider
        return OllamaProvider()

    if provider == "claude":
        from app.ai.claude_provider import ClaudeProvider
        return ClaudeProvider()

    raise AIProviderException(
        f"Unknown AI provider '{provider}'. Valid options: openai, gemini, ollama, claude"
    )
