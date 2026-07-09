"""User repository — email lookup, profile updates."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def email_exists(self, email: str) -> bool:
        return await self.get_by_email(email) is not None

    async def increment_streak(self, user: User) -> User:
        user.streak_days += 1
        await self.db.flush()
        return user

    async def add_points(self, user: User, points: int) -> User:
        user.total_points += points
        await self.db.flush()
        return user
