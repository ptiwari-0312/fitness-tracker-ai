"""Weight tracking and progress analysis service."""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.weight import WeightLog
from app.repositories.weight_repo import WeightRepository
from app.schemas.weight import WeightLogCreate, WeightProgressResponse


class WeightService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = WeightRepository(db)

    async def log_weight(self, user_id: str, data: WeightLogCreate) -> WeightLog:
        existing = await self._repo.get_by_date(user_id, data.log_date)
        if existing:
            raise ConflictException(f"Weight already logged for {data.log_date}. Use update instead.")
        log = WeightLog(user_id=user_id, **data.model_dump())
        return await self._repo.create(log)

    async def update_log(self, user_id: str, log_id: str, data: WeightLogCreate) -> WeightLog:
        log = await self._repo.get_by_id(log_id)
        if not log:
            raise NotFoundException("WeightLog", log_id)
        if log.user_id != user_id:
            raise ForbiddenException()
        return await self._repo.update(log, data.model_dump(exclude_none=True))

    async def get_progress(
        self, user_id: str, target_weight: Optional[float], height_cm: Optional[float]
    ) -> WeightProgressResponse:
        logs = await self._repo.get_user_logs(user_id, limit=90)
        if not logs:
            return WeightProgressResponse(
                logs=[], starting_weight=None, current_weight=None,
                target_weight=target_weight, total_change=None, bmi=None
            )

        sorted_logs = sorted(logs, key=lambda x: x.log_date)
        starting = sorted_logs[0].weight_kg
        current = sorted_logs[-1].weight_kg
        bmi = self._calculate_bmi(current, height_cm)

        return WeightProgressResponse(
            logs=sorted_logs,
            starting_weight=starting,
            current_weight=current,
            target_weight=target_weight,
            total_change=round(current - starting, 2),
            bmi=bmi,
        )

    def _calculate_bmi(self, weight_kg: float, height_cm: Optional[float]) -> Optional[float]:
        if not height_cm:
            return None
        height_m = height_cm / 100
        return round(weight_kg / (height_m ** 2), 1)
