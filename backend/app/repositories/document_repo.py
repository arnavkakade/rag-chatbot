"""Document & chunk data access."""

import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.document_chunk import DocumentChunk


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, doc: Document) -> Document:
        self.db.add(doc)
        await self.db.flush()
        await self.db.refresh(doc)
        return doc

    async def get_by_id(self, doc_id: uuid.UUID, owner_id: uuid.UUID) -> Optional[Document]:
        result = await self.db.execute(
            select(Document).where(Document.id == doc_id, Document.owner_id == owner_id)
        )
        return result.scalar_one_or_none()

    async def list_by_owner(self, owner_id: uuid.UUID) -> tuple[list[Document], int]:
        count_q = await self.db.execute(
            select(func.count()).where(Document.owner_id == owner_id)
        )
        total = count_q.scalar() or 0
        result = await self.db.execute(
            select(Document).where(Document.owner_id == owner_id).order_by(Document.created_at.desc())
        )
        return list(result.scalars().all()), total

    async def update_status(
        self, doc_id: uuid.UUID, status: str, error_message: str | None = None, page_count: int = 0
    ) -> None:
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if doc:
            doc.status = status
            doc.error_message = error_message
            doc.page_count = page_count
            await self.db.flush()

    async def delete(self, doc_id: uuid.UUID, owner_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(Document).where(Document.id == doc_id, Document.owner_id == owner_id)
        )
        doc = result.scalar_one_or_none()
        if doc:
            await self.db.delete(doc)
            await self.db.flush()
            return True
        return False


class ChunkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def bulk_create(self, chunks: list[DocumentChunk]) -> None:
        self.db.add_all(chunks)
        await self.db.flush()

    async def get_by_document(self, document_id: uuid.UUID) -> list[DocumentChunk]:
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
        )
        return list(result.scalars().all())
