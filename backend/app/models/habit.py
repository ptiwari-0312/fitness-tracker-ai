"""Habit definition and daily completion tracking."""
from enum import Enum
from typing import List, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BaseModel


class HabitType(str, Enum):
    SLEEP = "sleep"
    WORKOUT = "workout"
    WATER = "water"
    PROTEIN = "protein"
    STEPS = "steps"
    MEDITATION = "meditation"
    CUSTOM = "custom"


class Habit(Base, BaseModel):
    """A recurring daily habit tracked by the user."""
    __tablename__ = "habits"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    habit_type: Mapped[str] = mapped_column(String(20), nullable=False, default=HabitType.CUSTOM)
    target_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # hours, ml, steps, etc.
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship(back_populates="habits")
    logs: Mapped[List["HabitLog"]] = relationship(back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base, BaseModel):
    """Daily completion record for a habit."""
    __tablename__ = "habit_logs"

    habit_id: Mapped[str] = mapped_column(ForeignKey("habits.id"), nullable=False, index=True)
    log_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # actual achieved value
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    habit: Mapped["Habit"] = relationship(back_populates="logs")
