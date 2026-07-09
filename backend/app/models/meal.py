"""Meal and nutrition tracking models."""
from enum import Enum
from typing import List, Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BaseModel


class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class Meal(Base, BaseModel):
    """Food item in the nutrition database."""
    __tablename__ = "meals"

    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    serving_size_g: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)

    # Macros per serving
    calories: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fiber_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sugar_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sodium_mg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    is_custom: Mapped[bool] = mapped_column(Integer, default=False, nullable=False)

    meal_logs: Mapped[List["MealLog"]] = relationship(back_populates="meal")


class MealLog(Base, BaseModel):
    """A food item consumed by a user at a specific meal slot."""
    __tablename__ = "meal_logs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    meal_id: Mapped[str] = mapped_column(ForeignKey("meals.id"), nullable=False)
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    log_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Snapshot of macros at log time (meal data can change)
    calories: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    user: Mapped["User"] = relationship(back_populates="meal_logs")
    meal: Mapped["Meal"] = relationship(back_populates="meal_logs")
