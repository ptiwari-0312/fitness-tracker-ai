"""Habit creation, daily check-in, and streak tracking."""
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.habit import Habit, HabitLog
from app.repositories.habit_repo import HabitLogRepository, HabitRepository
from app.schemas.habit import DailyHabitSummary, HabitCreate, HabitLogCreate, HabitUpdate


class HabitService:
    def __init__(self, db: AsyncSession) -> None:
        self._habit_repo = HabitRepository(db)
        self._log_repo = HabitLogRepository(db)

    async def create_habit(self, user_id: str, data: HabitCreate) -> Habit:
        habit = Habit(user_id=user_id, **data.model_dump())
        return await self._habit_repo.create(habit)

    async def update_habit(self, user_id: str, habit_id: str, data: HabitUpdate) -> Habit:
        habit = await self._habit_repo.get_by_id(habit_id)
        if not habit:
            raise NotFoundException("Habit", habit_id)
        if habit.user_id != user_id:
            raise ForbiddenException()
        return await self._habit_repo.update(habit, data.model_dump(exclude_none=True))

    async def delete_habit(self, user_id: str, habit_id: str) -> None:
        habit = await self._habit_repo.get_by_id(habit_id)
        if not habit:
            raise NotFoundException("Habit", habit_id)
        if habit.user_id != user_id:
            raise ForbiddenException()
        await self._habit_repo.delete(habit)

    async def get_user_habits(self, user_id: str) -> List[Habit]:
        return await self._habit_repo.get_user_habits(user_id)

    async def log_habit(self, user_id: str, habit_id: str, data: HabitLogCreate) -> HabitLog:
        habit = await self._habit_repo.get_by_id(habit_id)
        if not habit:
            raise NotFoundException("Habit", habit_id)
        if habit.user_id != user_id:
            raise ForbiddenException()

        existing = await self._log_repo.get_by_date(habit_id, data.log_date)
        if existing:
            updated = await self._log_repo.update(existing, data.model_dump(exclude_none=True))
        else:
            log = HabitLog(habit_id=habit_id, **data.model_dump())
            updated = await self._log_repo.create(log)

        # Recalculate streak when marked complete
        if data.is_completed:
            await self._update_streak(habit)

        return updated

    async def get_daily_summary(self, user_id: str, log_date: str) -> DailyHabitSummary:
        habits = await self._habit_repo.get_user_habits(user_id)
        logs = await self._log_repo.get_user_logs_for_date(user_id, log_date)
        log_map = {l.habit_id: l for l in logs}

        completed = sum(1 for h in habits if log_map.get(h.id, {}) and log_map[h.id].is_completed)
        total = len(habits)
        rate = (completed / total * 100) if total else 0.0

        habits_detail = [
            {
                "id": h.id,
                "name": h.name,
                "icon": h.icon,
                "color": h.color,
                "is_completed": log_map.get(h.id, None) and log_map[h.id].is_completed,
                "value": log_map.get(h.id, None) and log_map[h.id].value,
                "streak": h.streak,
            }
            for h in habits
        ]

        return DailyHabitSummary(
            log_date=log_date,
            total_habits=total,
            completed=completed,
            completion_rate=round(rate, 1),
            habits=habits_detail,
        )

    async def _update_streak(self, habit: Habit) -> None:
        habit.streak += 1
        if habit.streak > habit.best_streak:
            habit.best_streak = habit.streak
