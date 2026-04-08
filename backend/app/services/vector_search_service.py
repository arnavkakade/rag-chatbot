"""Vector similarity search using pgVector."""

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.embedding_service import EmbeddingService

logger = get_logger(__name__)
settings = get_settings()


class VectorSearchResult:
    def __init__(self, chunk_id: str, content: str, page_number: int, distance: float, document_id: str, filename: str):
        self.chunk_id = chunk_id
        self.content = content
        self.page_number = page_number
        self.distance = distance
        self.document_id = document_id
        self.filename = filename


class VectorSearchService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_service = EmbeddingService()

    async def search(
        self, query: str, owner_id: uuid.UUID, top_k: int | None = None,
        document_ids: list[uuid.UUID] | None = None,
    ) -> list[VectorSearchResult]:
        k = top_k or settings.TOP_K_RESULTS
        query_embedding = await self.embedding_service.embed_query(query)

        doc_filter = ""
        params: dict = {"embedding": str(query_embedding), "owner_id": str(owner_id), "top_k": k}
        if document_ids:
            ids_literal = ",".join(f"'{did}'" for did in document_ids)
            doc_filter = f"AND d.id IN ({ids_literal})"

        sql = text(f"""
            SELECT
                dc.id AS chunk_id,
                dc.content,
                dc.page_number,
                dc.embedding <=> :embedding AS distance,
                d.id AS document_id,
                d.filename
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE d.owner_id = :owner_id
              AND d.status = 'ready'
              AND dc.embedding IS NOT NULL
              {doc_filter}
            ORDER BY dc.embedding <=> :embedding
            LIMIT :top_k
        """)

        result = await self.db.execute(sql, params)
        rows = result.fetchall()

        results = [
            VectorSearchResult(
                chunk_id=str(row.chunk_id), content=row.content, page_number=row.page_number,
                distance=row.distance, document_id=str(row.document_id), filename=row.filename,
            )
            for row in rows
        ]
        logger.info(f"Vector search returned {len(results)} results for query: {query[:80]}...")
        return results
