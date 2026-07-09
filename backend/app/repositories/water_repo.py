"""Water log repository."""
from typing import List

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.water import WaterLog
from app.repositories.base import BaseRepository


class WaterRepository(BaseRepository[WaterLog]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WaterLog, db)

    async def get_by_date(self, user_id: str, log_date: str) -> List[WaterLog]:
        result = await self.db.execute(
            select(WaterLog)
            .where(and_(WaterLog.user_id == user_id, WaterLog.log_date == log_date))
            .order_by(WaterLog.logged_at)
        )
        return list(result.scalars().all())

    async def get_daily_total(self, user_id: str, log_date: str) -> float:
        result = await self.db.execute(
            select(func.sum(WaterLog.amount_ml)).where(
                and_(WaterLog.user_id == user_id, WaterLog.log_date == log_date)
            )
        )
        return result.scalar() or 0.0

    async def get_range(self, user_id: str, start_date: str, end_date: str) -> List[WaterLog]:
        result = await self.db.execute(
            select(WaterLog).where(
                and_(
                    WaterLog.user_id == user_id,
                    WaterLog.log_date >= start_date,
                    WaterLog.log_date <= end_date,
                )
            )
        )
        return list(result.scalars().all())
