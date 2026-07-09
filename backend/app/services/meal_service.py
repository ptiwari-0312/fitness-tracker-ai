"""Meal logging and nutrition aggregation business logic."""
import json
import re
from typing import List

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import ChatMessage
from app.ai.factory import get_ai_provider
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.meal import Meal, MealLog
from app.repositories.meal_repo import MealLogRepository, MealRepository
from app.schemas.meal import DailyNutritionSummary, ImageAnalysisResult, ImageLogRequest, MealCreate, MealLogCreate

_NUTRITION_PROMPT = """\
You are a nutrition database. Estimate nutrition facts for the food described.
Reply with ONLY a JSON object — no explanation, no markdown, no extra text.
Format exactly: {{"name":"Food name","calories":200,"protein_g":5.0,"carbs_g":30.0,"fat_g":3.0}}

Food: {text}"""


class MealService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._meal_repo = MealRepository(db)
        self._log_repo = MealLogRepository(db)

    async def search_meals(self, query: str) -> List[Meal]:
        return await self._meal_repo.search(query)

    async def create_custom_meal(self, data: MealCreate) -> Meal:
        meal = Meal(**data.model_dump(), is_custom=True)
        return await self._meal_repo.create(meal)

    async def log_meal(self, user_id: str, data: MealLogCreate) -> MealLog:
        meal = await self._meal_repo.get_by_id(data.meal_id)
        if not meal:
            raise NotFoundException("Meal", data.meal_id)

        scale = data.quantity
        log = MealLog(
            user_id=user_id,
            meal_id=data.meal_id,
            meal_type=data.meal_type,
            log_date=data.log_date,
            quantity=data.quantity,
            notes=data.notes,
            calories=meal.calories * scale,
            protein_g=meal.protein_g * scale,
            carbs_g=meal.carbs_g * scale,
            fat_g=meal.fat_g * scale,
        )
        self._db.add(log)
        await self._db.flush()

        # Reload with meal relationship eagerly to avoid lazy-load outside session
        result = await self._db.execute(
            select(MealLog)
            .options(selectinload(MealLog.meal))
            .where(MealLog.id == log.id)
        )
        return result.scalars().one()

    async def get_daily_logs(self, user_id: str, log_date: str) -> List[MealLog]:
        return await self._log_repo.get_by_date(user_id, log_date)

    async def get_daily_summary(self, user_id: str, log_date: str) -> DailyNutritionSummary:
        totals = await self._log_repo.get_daily_totals(user_id, log_date)
        return DailyNutritionSummary(
            log_date=log_date,
            total_calories=totals["calories"],
            total_protein_g=totals["protein_g"],
            total_carbs_g=totals["carbs_g"],
            total_fat_g=totals["fat_g"],
            meal_count=totals["count"],
        )

    async def log_from_text(self, user_id: str, text: str, meal_type: str, log_date: str) -> MealLog:
        """Parse a free-text food description with AI, then create and log the meal."""
        ai = get_ai_provider()
        prompt = _NUTRITION_PROMPT.format(text=text)
        response = await ai.chat(
            [ChatMessage(role="user", content=prompt)],
            temperature=0.1,
            max_tokens=120,
        )

        # Extract the first JSON object from the response
        raw = response.content.strip()
        match = re.search(r'\{[^{}]+\}', raw, re.DOTALL)
        if not match:
            raise ValueError(f"AI returned no JSON: {raw[:200]}")

        data = json.loads(match.group())
        meal_data = MealCreate(
            name=str(data.get("name", text))[:200],
            serving_size_g=100.0,
            calories=float(data.get("calories", 0)),
            protein_g=float(data.get("protein_g", 0)),
            carbs_g=float(data.get("carbs_g", 0)),
            fat_g=float(data.get("fat_g", 0)),
        )
        meal = await self.create_custom_meal(meal_data)
        log_data = MealLogCreate(
            meal_id=meal.id,
            meal_type=meal_type,
            log_date=log_date,
            quantity=1.0,
            notes=text,
        )
        return await self.log_meal(user_id, log_data)

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> ImageAnalysisResult:
        """Call Claude vision model to identify food items and estimate nutrition from an image."""
        from app.ai.claude_vision_provider import ClaudeVisionProvider

        provider = ClaudeVisionProvider()
        if not provider.is_configured():
            raise ValueError(
                "ANTHROPIC_API_KEY is not set. Add it to .env to enable meal photo analysis."
            )

        raw = await provider.analyze_meal_image(image_bytes, mime_type)

        items = []
        for item in raw.get("items", []):
            items.append(
                {
                    "name": str(item.get("name", "Unknown")),
                    "quantity": str(item.get("quantity", "")),
                    "calories": float(item.get("calories", 0)),
                    "protein_g": float(item.get("protein_g", 0)),
                    "carbs_g": float(item.get("carbs_g", 0)),
                    "fat_g": float(item.get("fat_g", 0)),
                }
            )

        # Recompute totals from items in case the model's sum is wrong
        total_cal = sum(i["calories"] for i in items) or float(raw.get("total_calories", 0))
        total_p = sum(i["protein_g"] for i in items)
        total_c = sum(i["carbs_g"] for i in items)
        total_f = sum(i["fat_g"] for i in items)
        description = str(raw.get("description", ", ".join(i["name"] for i in items)))

        return ImageAnalysisResult(
            items=items,
            total_calories=round(total_cal, 1),
            total_protein_g=round(total_p, 1),
            total_carbs_g=round(total_c, 1),
            total_fat_g=round(total_f, 1),
            description=description[:500],
            confidence=str(raw.get("confidence", "medium")),
        )

    async def log_from_analysis(self, user_id: str, data: ImageLogRequest) -> MealLog:
        """Persist a pre-analysed meal (from photo) to the database."""
        meal_data = MealCreate(
            name=data.description[:200],
            serving_size_g=100.0,
            calories=data.total_calories,
            protein_g=data.total_protein_g,
            carbs_g=data.total_carbs_g,
            fat_g=data.total_fat_g,
        )
        meal = await self.create_custom_meal(meal_data)
        log_data = MealLogCreate(
            meal_id=meal.id,
            meal_type=data.meal_type,
            log_date=data.log_date,
            quantity=1.0,
            notes="Logged from photo",
        )
        return await self.log_meal(user_id, log_data)

    async def delete_log(self, user_id: str, log_id: str) -> None:
        log = await self._log_repo.get_by_id(log_id)
        if not log:
            raise NotFoundException("MealLog", log_id)
        if log.user_id != user_id:
            raise ForbiddenException()
        await self._log_repo.delete(log)
