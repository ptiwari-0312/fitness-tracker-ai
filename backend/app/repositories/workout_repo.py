"""Workout-related repositories."""
from typing import List, Optional

from sqlalchemy import and_, desc, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workout import Exercise, WorkoutLog, WorkoutPlan, WorkoutSet
from app.repositories.base import BaseRepository


class ExerciseRepository(BaseRepository[Exercise]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Exercise, db)

    async def search(self, query: str = "", category: Optional[str] = None, limit: int = 50) -> List[Exercise]:
        stmt = select(Exercise)
        if query:
            stmt = stmt.where(Exercise.name.ilike(f"%{query}%"))
        if category:
            stmt = stmt.where(Exercise.category == category)
        stmt = stmt.limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class WorkoutPlanRepository(BaseRepository[WorkoutPlan]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WorkoutPlan, db)

    async def get_user_plans(self, user_id: str) -> List[WorkoutPlan]:
        result = await self.db.execute(
            select(WorkoutPlan)
            .where(and_(WorkoutPlan.user_id == user_id, WorkoutPlan.is_active == True))
            .order_by(desc(WorkoutPlan.created_at))
        )
        return list(result.scalars().all())


class WorkoutLogRepository(BaseRepository[WorkoutLog]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WorkoutLog, db)

    async def get_user_logs(
        self, user_id: str, skip: int = 0, limit: int = 20, log_date: Optional[str] = None
    ) -> List[WorkoutLog]:
        stmt = (
            select(WorkoutLog)
            .options(selectinload(WorkoutLog.sets).selectinload(WorkoutSet.exercise))
            .where(WorkoutLog.user_id == user_id)
        )
        if log_date:
            stmt = stmt.where(WorkoutLog.started_at == log_date)
        stmt = stmt.order_by(desc(WorkoutLog.created_at)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_with_sets(self, log_id: str) -> Optional[WorkoutLog]:
        result = await self.db.execute(
            select(WorkoutLog)
            .options(selectinload(WorkoutLog.sets).selectinload(WorkoutSet.exercise))
            .where(WorkoutLog.id == log_id)
        )
        return result.scalars().first()

    async def count_completed_this_week(self, user_id: str, week_start: str) -> int:
        result = await self.db.execute(
            select(WorkoutLog).where(
                and_(
                    WorkoutLog.user_id == user_id,
                    WorkoutLog.is_completed == True,
                    WorkoutLog.created_at >= week_start,
                )
            )
        )
        return len(result.scalars().all())
