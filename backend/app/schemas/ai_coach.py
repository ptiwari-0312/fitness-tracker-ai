"""AI Coach chat and summary schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str       # user | assistant
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[dict] = None  # optional extra context (today's stats, etc.)


class ChatResponse(BaseModel):
    session_id: str
    message: str
    provider: str
    model: str
    suggestions: Optional[List[str]] = None     # quick-reply chips


class WeeklySummaryResponse(BaseModel):
    week_start: str
    week_end: str
    weight_trend: Optional[str]                 # "losing" | "gaining" | "stable"
    weight_change_kg: Optional[float]
    workout_sessions: int
    workout_goal_met: bool
    avg_daily_water_ml: float
    avg_daily_calories: float
    habit_completion_rate: float
    recommendations: List[str]
    motivational_message: str


class ConversationHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatMessage]
    created_at: str
