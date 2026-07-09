"""Workout-related models: Exercise library, WorkoutPlan, WorkoutLog."""
from enum import Enum
from typing import List, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BaseModel


class MuscleGroup(str, Enum):
    CHEST = "chest"
    BACK = "back"
    SHOULDERS = "shoulders"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    CORE = "core"
    LEGS = "legs"
    GLUTES = "glutes"
    CARDIO = "cardio"
    FULL_BODY = "full_body"


class ExerciseCategory(str, Enum):
    STRENGTH = "strength"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"
    BALANCE = "balance"
    HIIT = "hiit"
    YOGA = "yoga"


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Exercise(Base, BaseModel):
    """Master exercise library — seeded at startup, user-extensible."""
    __tablename__ = "exercises"

    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    muscle_groups: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # comma-separated
    difficulty: Mapped[str] = mapped_column(String(20), default=DifficultyLevel.BEGINNER, nullable=False)
    equipment: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    calories_per_minute: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    workout_sets: Mapped[List["WorkoutSet"]] = relationship(back_populates="exercise")


class WorkoutPlan(Base, BaseModel):
    """A named training plan belonging to a user."""
    __tablename__ = "workout_plans"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    goal: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    duration_weeks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_per_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="workout_plans")
    workout_logs: Mapped[List["WorkoutLog"]] = relationship(back_populates="plan", cascade="all, delete-orphan")


class WorkoutLog(Base, BaseModel):
    """A single completed (or in-progress) workout session."""
    __tablename__ = "workout_logs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    plan_id: Mapped[Optional[str]] = mapped_column(ForeignKey("workout_plans.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    completed_at: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    calories_burned: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="workout_logs")
    plan: Mapped[Optional["WorkoutPlan"]] = relationship(back_populates="workout_logs")
    sets: Mapped[List["WorkoutSet"]] = relationship(back_populates="workout_log", cascade="all, delete-orphan")


class WorkoutSet(Base, BaseModel):
    """Individual exercise set within a workout session."""
    __tablename__ = "workout_sets"

    workout_log_id: Mapped[str] = mapped_column(ForeignKey("workout_logs.id"), nullable=False, index=True)
    exercise_id: Mapped[str] = mapped_column(ForeignKey("exercises.id"), nullable=False)
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    workout_log: Mapped["WorkoutLog"] = relationship(back_populates="sets")
    exercise: Mapped["Exercise"] = relationship(back_populates="workout_sets")
