"""Shared API dependencies."""
from fastapi import Query


def pagination(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> dict:
    return {"skip": (page - 1) * size, "limit": size}
