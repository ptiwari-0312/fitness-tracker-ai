"""
Central application configuration loaded from environment variables.
Pydantic-settings validates types and provides IDE auto-complete.
"""
from functools import lru_cache
from typing import List, Literal

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "FitnessTracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    # ── Server ───────────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-32-chars-minimum"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./fitness_tracker.db"

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL

    # ── AI Provider ──────────────────────────────────────────────────────────
    AI_PROVIDER: Literal["openai", "gemini", "ollama", "claude"] = "openai"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"

    # ── Groq (vision) ────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_VISION_MODEL: str = "llama-3.2-11b-vision-preview"

    # ── Anthropic / Claude (vision) ───────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_VISION_MODEL: str = "claude-haiku-4-5-20251001"

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # ── Logging ──────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    # ── Pagination ───────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — reads .env once per process."""
    return Settings()


settings = get_settings()
