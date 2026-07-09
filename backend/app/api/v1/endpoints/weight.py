"""Body weight tracking endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.weight import WeightLogCreate, WeightLogResponse, WeightProgressResponse
from app.services.weight_service import WeightService

router = APIRouter(prefix="/weight", tags=["Weight"])


@router.post("/", response_model=WeightLogResponse, status_code=status.HTTP_201_CREATED)
async def log_weight(
    data: WeightLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WeightService(db).log_weight(current_user.id, data)


@router.put("/{log_id}", response_model=WeightLogResponse)
async def update_weight_log(
    log_id: str,
    data: WeightLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WeightService(db).update_log(current_user.id, log_id, data)


@router.get("/progress", response_model=WeightProgressResponse)
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WeightService(db).get_progress(
        current_user.id,
        target_weight=current_user.target_weight_kg,
        height_cm=current_user.height_cm,
    )
