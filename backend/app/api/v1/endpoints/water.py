"""Water intake endpoints."""
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.water import DailyWaterSummary, WaterLogCreate, WaterLogResponse
from app.services.water_service import WaterService

router = APIRouter(prefix="/water", tags=["Water"])


@router.post("/", response_model=WaterLogResponse, status_code=status.HTTP_201_CREATED)
async def add_water(
    data: WaterLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WaterService(db).add_water(current_user.id, data)


@router.get("/", response_model=List[WaterLogResponse])
async def get_entries(
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WaterService(db).get_daily_entries(current_user.id, date)


@router.get("/summary", response_model=DailyWaterSummary)
async def daily_summary(
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WaterService(db).get_daily_summary(current_user.id, date)
