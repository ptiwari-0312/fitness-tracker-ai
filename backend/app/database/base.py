"""
SQLAlchemy declarative base and shared column mixins.
All models import Base from here — keeps the import graph clean for Alembic.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


class UUIDMixin:
    """UUID primary key — compatible with both SQLite and PostgreSQL."""
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )


class TimestampMixin:
    """Automatic created_at / updated_at columns on every table."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class BaseModel(UUIDMixin, TimestampMixin):
    """Combine UUID PK + timestamps — inherit in every domain model."""
    pass
