"""User registration, login, and profile management business logic."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token
from app.auth.password import hash_password, verify_password
from app.core.exceptions import ConflictException, UnauthorizedException
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import TokenResponse, UserLogin, UserProfileUpdate, UserRegister


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = UserRepository(db)

    async def register(self, data: UserRegister) -> TokenResponse:
        if await self._repo.email_exists(data.email):
            raise ConflictException(f"Email '{data.email}' is already registered")

        user = User(
            name=data.name,
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
        )
        user = await self._repo.create(user)
        return self._issue_tokens(user)

    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self._repo.get_by_email(data.email.lower())
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedException("Account is disabled")
        return self._issue_tokens(user)

    async def update_profile(self, user: User, data: UserProfileUpdate) -> User:
        update_dict = data.model_dump(exclude_none=True)
        return await self._repo.update(user, update_dict)

    def _issue_tokens(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(subject=user.id),
            refresh_token=create_refresh_token(subject=user.id),
        )
