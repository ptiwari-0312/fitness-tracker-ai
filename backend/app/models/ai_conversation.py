"""AI Coach conversation history model."""
from enum import Enum
from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BaseModel


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class AIConversation(Base, BaseModel):
    """A single message turn in a user's AI coach conversation."""
    __tablename__ = "ai_conversations"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)  # groups messages in one chat session
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # which AI provider answered
    model: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    tokens_used: Mapped[Optional[int]] = mapped_column(String(20), nullable=True)

    user: Mapped["User"] = relationship(back_populates="ai_conversations")
