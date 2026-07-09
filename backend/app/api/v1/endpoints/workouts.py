"""Workout endpoints — exercise library, plans, and workout logs."""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import pagination
from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.workout import (
    ExerciseResponse,
    WorkoutLogCreate,
    WorkoutLogResponse,
    WorkoutLogUpdate,
    WorkoutPlanCreate,
    WorkoutPlanResponse,
    WorkoutSetCreate,
    WorkoutSetResponse,
)
from app.services.workout_service import WorkoutService

router = APIRouter(prefix="/workouts", tags=["Workouts"])


# ── Exercise Library ──────────────────────────────────────────────────────────

@router.get("/exercises", response_model=List[ExerciseResponse])
async def list_exercises(
    search: str = Query("", description="Search by exercise name"),
    category: Optional[str] = Query(None),
    pages: dict = Depends(pagination),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list:
    svc = WorkoutService(db)
    if search or category:
        return await svc.search_exercises(search, category)
    return await svc.list_exercises(skip=pages["skip"], limit=pages["limit"])


# ── Plans ─────────────────────────────────────────────────────────────────────

@router.post("/plans", response_model=WorkoutPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    data: WorkoutPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).create_plan(current_user.id, data)


@router.get("/plans", response_model=List[WorkoutPlanResponse])
async def list_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).get_user_plans(current_user.id)


@router.post("/plans/{plan_id}/favorite", response_model=WorkoutPlanResponse)
async def toggle_favorite(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).toggle_favorite_plan(current_user.id, plan_id)


# ── Logs ─────────────────────────────────────────────────────────────────────

@router.post("/logs", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def start_workout(
    data: WorkoutLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).start_workout(current_user.id, data)


@router.get("/logs", response_model=List[WorkoutLogResponse])
async def list_logs(
    pages: dict = Depends(pagination),
    date: Optional[str] = Query(None, description="Filter by YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).get_user_logs(
        current_user.id, skip=pages["skip"], limit=pages["limit"], log_date=date
    )


@router.get("/logs/{log_id}", response_model=WorkoutLogResponse)
async def get_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).get_log_detail(current_user.id, log_id)


@router.patch("/logs/{log_id}", response_model=WorkoutLogResponse)
async def update_log(
    log_id: str,
    data: WorkoutLogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).complete_workout(current_user.id, log_id, data)


@router.post("/logs/{log_id}/sets", response_model=WorkoutSetResponse, status_code=status.HTTP_201_CREATED)
async def add_set(
    log_id: str,
    data: WorkoutSetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WorkoutService(db).add_set(current_user.id, log_id, data)
