"""
Generic async repository.
Concrete repos extend this to get CRUD for free and add domain-specific queries.
"""
from typing import Any, Generic, List, Optional, Type, TypeVar

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: Type[ModelT], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    async def get_by_id(self, record_id: str) -> Optional[ModelT]:
        result = await self.db.execute(select(self.model).where(self.model.id == record_id))
        return result.scalars().first()

    async def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        filters: Optional[List[Any]] = None,
        order_by: Optional[Any] = None,
    ) -> List[ModelT]:
        stmt = select(self.model)
        if filters:
            stmt = stmt.where(*filters)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count(self, filters: Optional[List[Any]] = None) -> int:
        stmt = select(func.count()).select_from(self.model)
        if filters:
            stmt = stmt.where(*filters)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: ModelT, data: dict) -> ModelT:
        for key, value in data.items():
            if hasattr(obj, key) and value is not None:
                setattr(obj, key, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.db.delete(obj)
        await self.db.flush()
