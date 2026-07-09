"""User account and profile model."""
from enum import Enum
from typing import List, Optional

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BaseModel


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class FitnessGoal(str, Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    MAINTAIN = "maintain"
    ENDURANCE = "endurance"
    FLEXIBILITY = "flexibility"


class User(Base, BaseModel):
    __tablename__ = "users"

    # ── Credentials ──────────────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Profile ───────────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    goal: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Gamification ─────────────────────────────────────────────────────────
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Relationships ────────────────────────────────────────────────────────
    weight_logs: Mapped[List["WeightLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    workout_logs: Mapped[List["WorkoutLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    meal_logs: Mapped[List["MealLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    water_logs: Mapped[List["WaterLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    habits: Mapped[List["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    ai_conversations: Mapped[List["AIConversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    workout_plans: Mapped[List["WorkoutPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
