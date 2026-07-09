"""
Domain-specific exceptions mapped to HTTP status codes.
Handlers are registered in main.py so the API always returns consistent JSON errors.
"""
from fastapi import HTTPException, status


class AppException(Exception):
    """Base exception for all application errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, resource: str, resource_id: str | int = ""):
        detail = f"{resource} not found" if not resource_id else f"{resource} '{resource_id}' not found"
        super().__init__(detail, status.HTTP_404_NOT_FOUND)


class ConflictException(AppException):
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_409_CONFLICT)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ValidationException(AppException):
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class AIProviderException(AppException):
    def __init__(self, message: str = "AI provider error"):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE)
