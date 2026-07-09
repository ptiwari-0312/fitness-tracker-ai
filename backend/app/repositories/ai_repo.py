"""AI conversation history repository."""
from typing import List

from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_conversation import AIConversation
from app.repositories.base import BaseRepository


class AIConversationRepository(BaseRepository[AIConversation]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AIConversation, db)

    async def get_session_history(self, session_id: str, user_id: str) -> List[AIConversation]:
        result = await self.db.execute(
            select(AIConversation)
            .where(
                and_(
                    AIConversation.session_id == session_id,
                    AIConversation.user_id == user_id,
                )
            )
            .order_by(AIConversation.created_at)
        )
        return list(result.scalars().all())

    async def get_recent_sessions(self, user_id: str, limit: int = 10) -> List[str]:
        """Return unique session IDs ordered by most recent activity."""
        result = await self.db.execute(
            select(AIConversation.session_id)
            .where(AIConversation.user_id == user_id)
            .order_by(desc(AIConversation.created_at))
            .distinct()
            .limit(limit)
        )
        return [row[0] for row in result.all()]
