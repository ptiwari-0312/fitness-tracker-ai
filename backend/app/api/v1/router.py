"""Aggregate all v1 routers into a single APIRouter."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai_coach,
    auth,
    habits,
    meals,
    users,
    water,
    weight,
    workouts,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(workouts.router)
api_router.include_router(meals.router)
api_router.include_router(water.router)
api_router.include_router(weight.router)
api_router.include_router(habits.router)
api_router.include_router(ai_coach.router)
