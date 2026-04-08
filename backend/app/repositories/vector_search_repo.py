"""Vector similarity search repository using pgVector."""

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class VectorSearchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_similar(
        self,
        query_embedding: list[float],
        owner_id: uuid.UUID,
        top_k: int = 5,
        similarity_threshold: float = 0.3,
    ) -> list[dict]:
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        query = text("""
            SELECT
                dc.id,
                dc.document_id,
                dc.content,
                dc.page_number,
                dc.chunk_index,
                d.filename,
                1 - (dc.embedding <=> :embedding::vector) AS similarity
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE d.owner_id = :owner_id
              AND dc.embedding IS NOT NULL
              AND 1 - (dc.embedding <=> :embedding::vector) > :threshold
            ORDER BY dc.embedding <=> :embedding::vector
            LIMIT :top_k
        """)

        result = await self.db.execute(
            query,
            {
                "embedding": embedding_str,
                "owner_id": str(owner_id),
                "threshold": similarity_threshold,
                "top_k": top_k,
            },
        )

        rows = result.fetchall()
        return [
            {
                "chunk_id": str(row.id),
                "document_id": str(row.document_id),
                "content": row.content,
                "page_number": row.page_number,
                "chunk_index": row.chunk_index,
                "filename": row.filename,
                "similarity": float(row.similarity),
            }
            for row in rows
        ]
