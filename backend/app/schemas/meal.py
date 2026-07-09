"""Meal and nutrition schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field


class MealCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    brand: Optional[str] = None
    serving_size_g: float = Field(100.0, ge=0)
    calories: float = Field(0.0, ge=0)
    protein_g: float = Field(0.0, ge=0)
    carbs_g: float = Field(0.0, ge=0)
    fat_g: float = Field(0.0, ge=0)
    fiber_g: Optional[float] = Field(None, ge=0)
    sugar_g: Optional[float] = Field(None, ge=0)
    sodium_mg: Optional[float] = Field(None, ge=0)


class MealResponse(MealCreate):
    id: str
    is_custom: bool

    model_config = {"from_attributes": True}


class MealLogCreate(BaseModel):
    meal_id: str
    meal_type: str  # breakfast | lunch | dinner | snack
    log_date: str   # YYYY-MM-DD
    quantity: float = Field(1.0, ge=0.1)
    notes: Optional[str] = None


class MealLogResponse(BaseModel):
    id: str
    meal_id: str
    meal_type: str
    log_date: str
    quantity: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    notes: Optional[str]
    meal: Optional[MealResponse] = None

    model_config = {"from_attributes": True}


class FoodTextLogRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Free-text food description, e.g. '100g apple, 2 chapatti'")
    meal_type: str = Field(..., description="breakfast | lunch | dinner | snack")
    log_date: str = Field(..., description="YYYY-MM-DD")


class DailyNutritionSummary(BaseModel):
    log_date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    meal_count: int


# ── Image-based meal logging ──────────────────────────────────────────────────

class FoodItem(BaseModel):
    name: str
    quantity: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class ImageAnalysisResult(BaseModel):
    items: List[FoodItem]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    description: str
    confidence: str = "medium"


class ImageAnalyzeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image data (no data URI prefix)")
    mime_type: str = Field("image/jpeg", description="MIME type, e.g. image/jpeg")
    meal_type: str = Field(..., description="breakfast | lunch | dinner | snack")
    log_date: str = Field(..., description="YYYY-MM-DD")


class ImageLogRequest(BaseModel):
    description: str = Field(..., max_length=500)
    total_calories: float = Field(..., ge=0)
    total_protein_g: float = Field(0.0, ge=0)
    total_carbs_g: float = Field(0.0, ge=0)
    total_fat_g: float = Field(0.0, ge=0)
    meal_type: str
    log_date: str
