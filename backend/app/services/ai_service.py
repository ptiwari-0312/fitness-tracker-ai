"""
AI Coach service — orchestrates conversation history, prompt building,
and weekly summary generation. Completely decoupled from the LLM provider.
"""
import uuid
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import AIProvider, ChatMessage
from app.ai.factory import get_ai_provider
from app.models.ai_conversation import AIConversation, MessageRole
from app.repositories.ai_repo import AIConversationRepository
from app.repositories.meal_repo import MealLogRepository
from app.repositories.water_repo import WaterRepository
from app.repositories.weight_repo import WeightRepository
from app.repositories.workout_repo import WorkoutLogRepository
from app.schemas.ai_coach import ChatRequest, ChatResponse, WeeklySummaryResponse

_SYSTEM_PROMPT = """You are an expert AI fitness coach embedded in a health tracking app.
You have access to the user's fitness data. Be encouraging, specific, and actionable.
Keep responses concise (under 200 words) unless asked for details.
When suggesting workouts or meals, be mindful of stated injuries, preferences, and goals.
Format responses in a conversational way — no excessive markdown."""


class AICoachService:
    def __init__(self, db: AsyncSession) -> None:
        self._ai: AIProvider = get_ai_provider()
        self._conv_repo = AIConversationRepository(db)
        self._workout_repo = WorkoutLogRepository(db)
        self._meal_repo = MealLogRepository(db)
        self._water_repo = WaterRepository(db)
        self._weight_repo = WeightRepository(db)

    async def chat(self, user_id: str, request: ChatRequest, user_context: dict) -> ChatResponse:
        """Send a message and get a contextual AI response."""
        history = await self._conv_repo.get_session_history(request.session_id, user_id)

        messages: List[ChatMessage] = [
            ChatMessage(role=MessageRole.SYSTEM, content=self._build_system_prompt(user_context))
        ]
        # Append conversation history (last 10 turns for token efficiency)
        for turn in history[-10:]:
            messages.append(ChatMessage(role=turn.role, content=turn.content))
        messages.append(ChatMessage(role=MessageRole.USER, content=request.message))

        ai_response = await self._ai.chat(messages, temperature=0.7, max_tokens=512)

        # Persist both turns
        user_turn = AIConversation(
            user_id=user_id,
            session_id=request.session_id,
            role=MessageRole.USER,
            content=request.message,
        )
        assistant_turn = AIConversation(
            user_id=user_id,
            session_id=request.session_id,
            role=MessageRole.ASSISTANT,
            content=ai_response.content,
            provider=ai_response.provider,
            model=ai_response.model,
            tokens_used=str(ai_response.tokens_used),
        )
        await self._conv_repo.create(user_turn)
        await self._conv_repo.create(assistant_turn)

        return ChatResponse(
            session_id=request.session_id,
            message=ai_response.content,
            provider=ai_response.provider,
            model=ai_response.model,
            suggestions=self._extract_suggestions(ai_response.content),
        )

    async def weekly_summary(self, user_id: str, user_context: dict) -> WeeklySummaryResponse:
        """Generate a personalised weekly progress summary."""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = today

        # Gather this week's data
        workouts = await self._workout_repo.get_user_logs(user_id, limit=50)
        completed_workouts = [w for w in workouts if w.is_completed]

        weight_logs = await self._weight_repo.get_user_logs(user_id, limit=14)
        water_logs = await self._water_repo.get_range(user_id, str(week_start), str(week_end))

        # Build data summary for the LLM
        data_summary = f"""
User profile: {user_context}
Week: {week_start} to {week_end}
Completed workouts this week: {len(completed_workouts)}
Weight logs (last 14 days): {[{'date': w.log_date, 'kg': w.weight_kg} for w in weight_logs]}
Water intake entries this week: {len(water_logs)} entries
"""
        prompt = f"""
{data_summary}

Generate a weekly fitness summary with:
1. Weight trend analysis
2. Workout consistency assessment
3. Hydration assessment
4. 3 specific, actionable recommendations for next week
5. A motivational closing message

Respond in JSON with keys: weight_trend, workout_assessment, hydration_assessment, recommendations (list of 3), motivational_message
"""
        messages = [
            ChatMessage(role="system", content=_SYSTEM_PROMPT),
            ChatMessage(role="user", content=prompt),
        ]
        ai_response = await self._ai.chat(messages, temperature=0.5, max_tokens=800)

        # Parse structured response or fall back to plain text
        recommendations, motivational = self._parse_weekly_response(ai_response.content)

        weight_change = None
        if len(weight_logs) >= 2:
            sorted_logs = sorted(weight_logs, key=lambda x: x.log_date)
            weight_change = round(sorted_logs[-1].weight_kg - sorted_logs[0].weight_kg, 2)

        avg_water = (
            sum(w.amount_ml for w in water_logs) / max(len(water_logs), 1)
            if water_logs else 0.0
        )

        return WeeklySummaryResponse(
            week_start=str(week_start),
            week_end=str(week_end),
            weight_trend="losing" if (weight_change or 0) < -0.2 else "gaining" if (weight_change or 0) > 0.2 else "stable",
            weight_change_kg=weight_change,
            workout_sessions=len(completed_workouts),
            workout_goal_met=len(completed_workouts) >= 3,
            avg_daily_water_ml=round(avg_water, 1),
            avg_daily_calories=0.0,  # TODO: aggregate from meal_logs
            habit_completion_rate=0.0,  # TODO: aggregate from habit_logs
            recommendations=recommendations,
            motivational_message=motivational,
        )

    def _build_system_prompt(self, user_context: dict) -> str:
        profile_text = f"User: {user_context.get('name', 'User')}, Goal: {user_context.get('goal', 'general fitness')}"
        return f"{_SYSTEM_PROMPT}\n\nCurrent user context: {profile_text}"

    def _extract_suggestions(self, text: str) -> List[str]:
        """Pull out quick-reply suggestions from common patterns."""
        suggestions = []
        lower = text.lower()
        if "water" in lower or "hydrat" in lower:
            suggestions.append("How much water should I drink today?")
        if "workout" in lower or "exercise" in lower:
            suggestions.append("Give me a quick workout")
        if "meal" in lower or "eat" in lower or "food" in lower:
            suggestions.append("Suggest a healthy meal")
        return suggestions[:3]

    def _parse_weekly_response(self, content: str) -> tuple[List[str], str]:
        """Best-effort extraction from LLM response."""
        import json, re
        try:
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                recs = data.get("recommendations", [])
                msg = data.get("motivational_message", content[:200])
                return recs, msg
        except Exception:
            pass
        return ["Keep up the great work!", "Stay consistent", "Focus on recovery"], content[:200]
