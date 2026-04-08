"""Authentication service — signup, login, token management."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.core.logging import get_logger
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def signup(self, data: SignupRequest) -> UserResponse:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ValueError("Email already registered")

        existing_username = await self.repo.get_by_username(data.username)
        if existing_username:
            raise ValueError("Username already taken")

        user = User(
            email=data.email,
            username=data.username,
            hashed_password=hash_password(data.password),
        )
        user = await self.repo.create(user)
        logger.info(f"User signed up: {user.email}")
        return UserResponse.model_validate(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid email or password")
        if not user.is_active:
            raise ValueError("Account is deactivated")

        token = create_access_token(subject=str(user.id))
        logger.info(f"User logged in: {user.email}")
        return TokenResponse(access_token=token)

    async def get_current_user(self, user_id: uuid.UUID) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return UserResponse.model_validate(user)
