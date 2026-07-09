"""Habit and habit log repositories."""
from typing import List, Optional

from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.habit import Habit, HabitLog
from app.repositories.base import BaseRepository


class HabitRepository(BaseRepository[Habit]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Habit, db)

    async def get_user_habits(self, user_id: str, active_only: bool = True) -> List[Habit]:
        stmt = select(Habit).where(Habit.user_id == user_id)
        if active_only:
            stmt = stmt.where(Habit.is_active == True)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class HabitLogRepository(BaseRepository[HabitLog]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HabitLog, db)

    async def get_by_date(self, habit_id: str, log_date: str) -> Optional[HabitLog]:
        result = await self.db.execute(
            select(HabitLog).where(
                and_(HabitLog.habit_id == habit_id, HabitLog.log_date == log_date)
            )
        )
        return result.scalars().first()

    async def get_user_logs_for_date(self, user_id: str, log_date: str) -> List[HabitLog]:
        result = await self.db.execute(
            select(HabitLog)
            .join(Habit)
            .where(and_(Habit.user_id == user_id, HabitLog.log_date == log_date))
        )
        return list(result.scalars().all())
