"""
JWT token creation and verification.
Access tokens are short-lived (30 min); refresh tokens last 7 days.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import UnauthorizedException


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def create_access_token(subject: str, extra_claims: Optional[dict] = None) -> str:
    expire = _utc_now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": _utc_now(),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str) -> str:
    expire = _utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": _utc_now(),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")


def get_token_subject(token: str) -> str:
    payload = decode_token(token)
    subject: Optional[str] = payload.get("sub")
    if not subject:
        raise UnauthorizedException("Token missing subject")
    return subject
