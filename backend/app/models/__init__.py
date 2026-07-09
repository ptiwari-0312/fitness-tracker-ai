"""
Import all models here so SQLAlchemy's metadata knows about every table.
Alembic's env.py and init_db.py both do `from app.models import *`.
"""
from app.models.user import User, Gender, FitnessGoal
from app.models.workout import Exercise, WorkoutPlan, WorkoutLog, WorkoutSet, MuscleGroup, ExerciseCategory, DifficultyLevel
from app.models.meal import Meal, MealLog, MealType
from app.models.water import WaterLog
from app.models.weight import WeightLog
from app.models.habit import Habit, HabitLog, HabitType
from app.models.ai_conversation import AIConversation, MessageRole

__all__ = [
    "User", "Gender", "FitnessGoal",
    "Exercise", "WorkoutPlan", "WorkoutLog", "WorkoutSet",
    "MuscleGroup", "ExerciseCategory", "DifficultyLevel",
    "Meal", "MealLog", "MealType",
    "WaterLog",
    "WeightLog",
    "Habit", "HabitLog", "HabitType",
    "AIConversation", "MessageRole",
]
