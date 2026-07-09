"""
Database initializer — creates all tables and seeds default exercises.
Called once on application startup in development; Alembic handles migrations in production.
"""
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base
from app.database.session import engine
from app.models import *  # noqa: F401, F403 — import all models so Base knows about them
from app.utils.constants import DEFAULT_EXERCISES


async def init_db() -> None:
    """Create schema and seed reference data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")
    await _seed_exercises()


async def _seed_exercises() -> None:
    """Insert default exercise library if empty."""
    from app.database.session import AsyncSessionLocal
    from app.models.workout import Exercise
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Exercise).limit(1))
        if result.scalars().first():
            return  # already seeded

        exercises = [Exercise(**ex) for ex in DEFAULT_EXERCISES]
        session.add_all(exercises)
        await session.commit()
        logger.info(f"Seeded {len(exercises)} default exercises")
