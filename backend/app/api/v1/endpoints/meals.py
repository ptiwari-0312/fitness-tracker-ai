"""Meal tracking endpoints."""
import base64
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.meal import (
    DailyNutritionSummary,
    FoodTextLogRequest,
    ImageAnalysisResult,
    ImageAnalyzeRequest,
    ImageLogRequest,
    MealCreate,
    MealLogCreate,
    MealLogResponse,
    MealResponse,
)
from app.services.meal_service import MealService

router = APIRouter(prefix="/meals", tags=["Meals"])


@router.get("/search", response_model=List[MealResponse])
async def search_meals(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await MealService(db).search_meals(q)


@router.post("/", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
async def create_meal(
    data: MealCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await MealService(db).create_custom_meal(data)


@router.post("/logs", response_model=MealLogResponse, status_code=status.HTTP_201_CREATED)
async def log_meal(
    data: MealLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MealService(db).log_meal(current_user.id, data)


@router.get("/logs", response_model=List[MealLogResponse])
async def get_daily_logs(
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MealService(db).get_daily_logs(current_user.id, date)


@router.get("/summary", response_model=DailyNutritionSummary)
async def daily_summary(
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MealService(db).get_daily_summary(current_user.id, date)


@router.post("/log-from-text", response_model=MealLogResponse, status_code=status.HTTP_201_CREATED)
async def log_from_text(
    data: FoodTextLogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Parse a free-text food description with AI and log the meal automatically."""
    return await MealService(db).log_from_text(
        current_user.id, data.text, data.meal_type, data.log_date
    )


@router.post("/analyze-image", response_model=ImageAnalysisResult)
async def analyze_meal_image(
    data: ImageAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyse a meal photo with Groq vision AI and return identified foods with nutrition estimates."""
    image_bytes = base64.b64decode(data.image_base64)
    return await MealService(db).analyze_image(image_bytes, data.mime_type)


@router.post("/log-from-analysis", response_model=MealLogResponse, status_code=status.HTTP_201_CREATED)
async def log_from_analysis(
    data: ImageLogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a meal from pre-analysed photo data (no second AI call needed)."""
    return await MealService(db).log_from_analysis(current_user.id, data)


@router.delete("/logs/{log_id:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await MealService(db).delete_log(current_user.id, log_id)
