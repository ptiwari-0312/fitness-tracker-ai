"""Weight log schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WeightLogCreate(BaseModel):
    log_date: str           # YYYY-MM-DD
    weight_kg: float = Field(..., ge=20, le=500)
    body_fat_pct: Optional[float] = Field(None, ge=0, le=100)
    muscle_mass_kg: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class WeightLogResponse(WeightLogCreate):
    id: str
    user_id: str

    model_config = {"from_attributes": True}


class WeightProgressResponse(BaseModel):
    logs: List[WeightLogResponse]
    starting_weight: Optional[float]
    current_weight: Optional[float]
    target_weight: Optional[float]
    total_change: Optional[float]
    bmi: Optional[float]
