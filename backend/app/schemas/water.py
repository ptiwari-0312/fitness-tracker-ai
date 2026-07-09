"""Water intake schemas."""
from pydantic import BaseModel, Field


class WaterLogCreate(BaseModel):
    log_date: str               # YYYY-MM-DD
    amount_ml: float = Field(..., ge=1, le=5000)
    logged_at: str              # ISO datetime string


class WaterLogResponse(WaterLogCreate):
    id: str
    user_id: str

    model_config = {"from_attributes": True}


class DailyWaterSummary(BaseModel):
    log_date: str
    total_ml: float
    goal_ml: float
    percentage: float
    entries: int
