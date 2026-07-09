"""Habit tracker endpoints."""
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.habit import (
    DailyHabitSummary,
    HabitCreate,
    HabitLogCreate,
    HabitLogResponse,
    HabitResponse,
    HabitUpdate,
)
from app.services.habit_service import HabitService

router = APIRouter(prefix="/habits", tags=["Habits"])


@router.get("/", response_model=List[HabitResponse])
async def list_habits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService(db).get_user_habits(current_user.id)


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService(db).create_habit(current_user.id, data)


@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: str,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService(db).update_habit(current_user.id, habit_id, data)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await HabitService(db).delete_habit(current_user.id, habit_id)


@router.post("/{habit_id}/log", response_model=HabitLogResponse)
async def log_habit(
    habit_id: str,
    data: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService(db).log_habit(current_user.id, habit_id, data)


@router.get("/summary", response_model=DailyHabitSummary)
async def daily_summary(
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService(db).get_daily_summary(current_user.id, date)
