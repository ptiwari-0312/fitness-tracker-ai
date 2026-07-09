"""Weight log repository."""
from typing import List, Optional

from sqlalchemy import and_, asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.weight import WeightLog
from app.repositories.base import BaseRepository


class WeightRepository(BaseRepository[WeightLog]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WeightLog, db)

    async def get_user_logs(
        self, user_id: str, limit: int = 90
    ) -> List[WeightLog]:
        result = await self.db.execute(
            select(WeightLog)
            .where(WeightLog.user_id == user_id)
            .order_by(desc(WeightLog.log_date))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_latest(self, user_id: str) -> Optional[WeightLog]:
        result = await self.db.execute(
            select(WeightLog)
            .where(WeightLog.user_id == user_id)
            .order_by(desc(WeightLog.log_date))
            .limit(1)
        )
        return result.scalars().first()

    async def get_by_date(self, user_id: str, log_date: str) -> Optional[WeightLog]:
        result = await self.db.execute(
            select(WeightLog).where(
                and_(WeightLog.user_id == user_id, WeightLog.log_date == log_date)
            )
        )
        return result.scalars().first()
