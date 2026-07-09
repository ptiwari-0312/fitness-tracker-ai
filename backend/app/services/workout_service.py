"""Workout business logic — plans, logging, completion."""
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.workout import Exercise, WorkoutLog, WorkoutPlan, WorkoutSet
from app.repositories.workout_repo import (
    ExerciseRepository,
    WorkoutLogRepository,
    WorkoutPlanRepository,
)
from app.schemas.workout import (
    WorkoutLogCreate,
    WorkoutLogUpdate,
    WorkoutPlanCreate,
    WorkoutSetCreate,
)


class WorkoutService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._exercise_repo = ExerciseRepository(db)
        self._plan_repo = WorkoutPlanRepository(db)
        self._log_repo = WorkoutLogRepository(db)

    # ── Exercise library ─────────────────────────────────────────────────────

    async def search_exercises(self, query: str = "", category: Optional[str] = None) -> list:
        return await self._exercise_repo.search(query, category)

    async def list_exercises(self, skip: int = 0, limit: int = 50) -> list:
        return await self._exercise_repo.get_all(skip=skip, limit=limit)

    # ── Plans ────────────────────────────────────────────────────────────────

    async def create_plan(self, user_id: str, data: WorkoutPlanCreate) -> WorkoutPlan:
        plan = WorkoutPlan(user_id=user_id, **data.model_dump())
        return await self._plan_repo.create(plan)

    async def get_user_plans(self, user_id: str) -> List[WorkoutPlan]:
        return await self._plan_repo.get_user_plans(user_id)

    async def toggle_favorite_plan(self, user_id: str, plan_id: str) -> WorkoutPlan:
        plan = await self._plan_repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundException("WorkoutPlan", plan_id)
        if plan.user_id != user_id:
            raise ForbiddenException()
        plan.is_favorite = not plan.is_favorite
        return plan

    # ── Logs ─────────────────────────────────────────────────────────────────

    async def start_workout(self, user_id: str, data: WorkoutLogCreate) -> WorkoutLog:
        log = WorkoutLog(user_id=user_id, **data.model_dump())
        created = await self._log_repo.create(log)
        # Reload with sets eagerly so the response serializer doesn't trigger lazy IO
        return await self._log_repo.get_with_sets(created.id)

    async def _resolve_exercise_id(self, exercise_id: Optional[str], exercise_name: Optional[str], fallback_name: str) -> str:
        """Return a valid exercise_id, finding or creating one as needed."""
        if exercise_id:
            return exercise_id
        name = (exercise_name or fallback_name).strip() or "Custom Exercise"
        results = await self._exercise_repo.search(query=name, limit=1)
        if results:
            return results[0].id
        exercise = Exercise(
            name=name,
            category="strength",
            difficulty="beginner",
            is_custom=True,
        )
        created = await self._exercise_repo.create(exercise)
        return created.id

    async def add_set(self, user_id: str, log_id: str, data: WorkoutSetCreate) -> WorkoutSet:
        log = await self._log_repo.get_by_id(log_id)
        if not log:
            raise NotFoundException("WorkoutLog", log_id)
        if log.user_id != user_id:
            raise ForbiddenException()

        exercise_id = await self._resolve_exercise_id(data.exercise_id, data.exercise_name, log.name)
        set_data = data.model_dump(exclude={"exercise_id", "exercise_name"})
        ws = WorkoutSet(workout_log_id=log_id, exercise_id=exercise_id, **set_data)
        self._db.add(ws)
        await self._db.flush()

        # Reload the set with its exercise relationship eagerly loaded
        result = await self._db.execute(
            select(WorkoutSet)
            .options(selectinload(WorkoutSet.exercise))
            .where(WorkoutSet.id == ws.id)
        )
        return result.scalars().one()

    async def complete_workout(self, user_id: str, log_id: str, data: WorkoutLogUpdate) -> WorkoutLog:
        log = await self._log_repo.get_by_id(log_id)
        if not log:
            raise NotFoundException("WorkoutLog", log_id)
        if log.user_id != user_id:
            raise ForbiddenException()
        updated = await self._log_repo.update(log, data.model_dump(exclude_none=True))
        return await self._log_repo.get_with_sets(updated.id)

    async def get_user_logs(self, user_id: str, skip: int = 0, limit: int = 20, log_date: Optional[str] = None) -> List[WorkoutLog]:
        return await self._log_repo.get_user_logs(user_id, skip=skip, limit=limit, log_date=log_date)

    async def get_log_detail(self, user_id: str, log_id: str) -> WorkoutLog:
        log = await self._log_repo.get_with_sets(log_id)
        if not log:
            raise NotFoundException("WorkoutLog", log_id)
        if log.user_id != user_id:
            raise ForbiddenException()
        return log
