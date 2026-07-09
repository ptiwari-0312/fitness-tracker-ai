"""Meal and meal log repositories."""
from typing import List

from sqlalchemy import and_, desc, func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meal import Meal, MealLog
from app.repositories.base import BaseRepository


class MealRepository(BaseRepository[Meal]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Meal, db)

    async def search(self, query: str, limit: int = 20) -> List[Meal]:
        result = await self.db.execute(
            select(Meal).where(Meal.name.ilike(f"%{query}%")).limit(limit)
        )
        return list(result.scalars().all())


class MealLogRepository(BaseRepository[MealLog]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(MealLog, db)

    async def get_by_date(self, user_id: str, log_date: str) -> List[MealLog]:
        result = await self.db.execute(
            select(MealLog)
            .options(selectinload(MealLog.meal))
            .where(and_(MealLog.user_id == user_id, MealLog.log_date == log_date))
            .order_by(MealLog.meal_type)
        )
        return list(result.scalars().all())

    async def get_daily_totals(self, user_id: str, log_date: str) -> dict:
        result = await self.db.execute(
            select(
                func.sum(MealLog.calories).label("calories"),
                func.sum(MealLog.protein_g).label("protein_g"),
                func.sum(MealLog.carbs_g).label("carbs_g"),
                func.sum(MealLog.fat_g).label("fat_g"),
                func.count().label("count"),
            ).where(and_(MealLog.user_id == user_id, MealLog.log_date == log_date))
        )
        row = result.first()
        return {
            "calories": row.calories or 0.0,
            "protein_g": row.protein_g or 0.0,
            "carbs_g": row.carbs_g or 0.0,
            "fat_g": row.fat_g or 0.0,
            "count": row.count or 0,
        }
