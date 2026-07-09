"""Habit tracker schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    habit_type: str = "custom"
    target_value: Optional[float] = None
    unit: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class HabitResponse(BaseModel):
    id: str
    name: str
    habit_type: str
    target_value: Optional[float]
    unit: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    is_active: bool
    streak: int
    best_streak: int

    model_config = {"from_attributes": True}


class HabitLogCreate(BaseModel):
    log_date: str           # YYYY-MM-DD
    is_completed: bool = False
    value: Optional[float] = None
    notes: Optional[str] = None


class HabitLogResponse(HabitLogCreate):
    id: str
    habit_id: str

    model_config = {"from_attributes": True}


class DailyHabitSummary(BaseModel):
    log_date: str
    total_habits: int
    completed: int
    completion_rate: float
    habits: List[dict]
