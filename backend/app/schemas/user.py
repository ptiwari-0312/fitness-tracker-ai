"""User request/response schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    gender: Optional[str] = None
    age: Optional[int] = Field(None, ge=10, le=120)
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    weight_kg: Optional[float] = Field(None, ge=20, le=500)
    target_weight_kg: Optional[float] = Field(None, ge=20, le=500)
    goal: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    gender: Optional[str]
    age: Optional[int]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    target_weight_kg: Optional[float]
    goal: Optional[str]
    bio: Optional[str]
    streak_days: int
    total_points: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
