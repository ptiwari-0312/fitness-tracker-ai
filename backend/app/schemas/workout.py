"""Workout request/response schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ExerciseResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: str
    muscle_groups: Optional[str]
    difficulty: str
    equipment: Optional[str]
    instructions: Optional[str]
    calories_per_minute: Optional[float]

    model_config = {"from_attributes": True}


class WorkoutSetCreate(BaseModel):
    exercise_id: Optional[str] = None   # resolved from exercise_name if not given
    exercise_name: Optional[str] = None  # free-form fallback
    set_number: int = Field(..., ge=1)
    reps: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    distance_km: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class WorkoutSetResponse(BaseModel):
    id: str
    workout_log_id: str
    exercise_id: str
    set_number: int
    reps: Optional[int]
    weight_kg: Optional[float]
    duration_seconds: Optional[int]
    distance_km: Optional[float]
    notes: Optional[str]
    exercise: Optional[ExerciseResponse] = None

    model_config = {"from_attributes": True}


class WorkoutLogCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    plan_id: Optional[str] = None
    notes: Optional[str] = None
    started_at: Optional[str] = None


class WorkoutLogUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    calories_burned: Optional[float] = Field(None, ge=0)
    is_completed: Optional[bool] = None


class WorkoutLogResponse(BaseModel):
    id: str
    name: str
    plan_id: Optional[str]
    notes: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    duration_minutes: Optional[int]
    calories_burned: Optional[float]
    is_completed: bool
    sets: List[WorkoutSetResponse] = []
    # datetime is serialized to ISO string by FastAPI — no manual str conversion needed
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkoutPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    goal: Optional[str] = None
    duration_weeks: Optional[int] = Field(None, ge=1, le=52)
    days_per_week: Optional[int] = Field(None, ge=1, le=7)


class WorkoutPlanResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    goal: Optional[str]
    duration_weeks: Optional[int]
    days_per_week: Optional[int]
    is_active: bool
    is_favorite: bool
    created_at: datetime

    model_config = {"from_attributes": True}
