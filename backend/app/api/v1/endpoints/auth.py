"""Authentication endpoints — register, login, refresh, logout."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.jwt import decode_token, get_token_subject, create_access_token
from app.core.exceptions import UnauthorizedException
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import RefreshRequest, TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Create a new user account and return JWT tokens."""
    return await UserService(db).register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authenticate and return JWT tokens."""
    return await UserService(db).login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Exchange a refresh token for a new access token."""
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise UnauthorizedException("Not a refresh token")
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token")
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or disabled")
    from app.auth.jwt import create_refresh_token
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user's profile."""
    return current_user
