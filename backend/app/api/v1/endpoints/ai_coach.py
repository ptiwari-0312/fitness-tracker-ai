"""AI Coach endpoints — chat and weekly summary."""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.ai_coach import ChatRequest, ChatResponse, WeeklySummaryResponse
from app.services.ai_service import AICoachService

router = APIRouter(prefix="/ai", tags=["AI Coach"])


def _user_context(user: User) -> dict:
    return {
        "name": user.name,
        "goal": user.goal,
        "age": user.age,
        "weight_kg": user.weight_kg,
        "target_weight_kg": user.target_weight_kg,
        "streak_days": user.streak_days,
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Send a message to the AI coach and receive a contextual reply."""
    return await AICoachService(db).chat(current_user.id, request, _user_context(current_user))


@router.post("/chat/new-session")
async def new_session(_: User = Depends(get_current_user)) -> dict:
    """Generate a fresh session ID for a new conversation."""
    return {"session_id": str(uuid.uuid4())}


@router.get("/weekly-summary", response_model=WeeklySummaryResponse)
async def weekly_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WeeklySummaryResponse:
    """Generate an AI-powered weekly progress summary."""
    return await AICoachService(db).weekly_summary(current_user.id, _user_context(current_user))
