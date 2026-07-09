"""Water intake service."""
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.water import WaterLog
from app.repositories.water_repo import WaterRepository
from app.schemas.water import DailyWaterSummary, WaterLogCreate

# Default daily goal — users can override in profile (not yet in schema but easily added)
DEFAULT_DAILY_GOAL_ML = 2500.0


class WaterService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = WaterRepository(db)

    async def add_water(self, user_id: str, data: WaterLogCreate) -> WaterLog:
        log = WaterLog(user_id=user_id, **data.model_dump())
        return await self._repo.create(log)

    async def get_daily_entries(self, user_id: str, log_date: str) -> List[WaterLog]:
        return await self._repo.get_by_date(user_id, log_date)

    async def get_daily_summary(self, user_id: str, log_date: str) -> DailyWaterSummary:
        total = await self._repo.get_daily_total(user_id, log_date)
        entries = await self._repo.get_by_date(user_id, log_date)
        pct = min((total / DEFAULT_DAILY_GOAL_ML) * 100, 100.0)
        return DailyWaterSummary(
            log_date=log_date,
            total_ml=total,
            goal_ml=DEFAULT_DAILY_GOAL_ML,
            percentage=round(pct, 1),
            entries=len(entries),
        )
