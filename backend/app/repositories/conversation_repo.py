"""Conversation & message data access."""

import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation, Message


class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, conv: Conversation) -> Conversation:
        self.db.add(conv)
        await self.db.flush()
        await self.db.refresh(conv)
        return conv

    async def get_by_id(
        self, conv_id: uuid.UUID, owner_id: uuid.UUID, load_messages: bool = False
    ) -> Optional[Conversation]:
        stmt = select(Conversation).where(
            Conversation.id == conv_id, Conversation.owner_id == owner_id
        )
        if load_messages:
            stmt = stmt.options(selectinload(Conversation.messages))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_owner(self, owner_id: uuid.UUID) -> tuple[list[Conversation], int]:
        count_q = await self.db.execute(
            select(func.count()).where(Conversation.owner_id == owner_id)
        )
        total = count_q.scalar() or 0
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.owner_id == owner_id)
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().all()), total

    async def update_title(
        self, conv_id: uuid.UUID, owner_id: uuid.UUID, title: str
    ) -> Optional[Conversation]:
        conv = await self.get_by_id(conv_id, owner_id)
        if conv:
            conv.title = title
            await self.db.flush()
            await self.db.refresh(conv)
        return conv

    async def delete(self, conv_id: uuid.UUID, owner_id: uuid.UUID) -> bool:
        conv = await self.get_by_id(conv_id, owner_id)
        if conv:
            await self.db.delete(conv)
            await self.db.flush()
            return True
        return False


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, message: Message) -> Message:
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_conversation_messages(
        self, conversation_id: uuid.UUID, limit: int = 50
    ) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())
