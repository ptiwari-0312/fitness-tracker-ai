"""
FastAPI auth dependencies injected into protected routes via Depends().
Separating them here keeps router files focused on business logic.
"""
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import get_token_subject
from app.core.exceptions import UnauthorizedException
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    user_id = get_token_subject(token)
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("Account is disabled")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Alias kept for explicitness in route signatures."""
    return current_user
