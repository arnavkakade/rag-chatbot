"""Document service — handles PDF upload, parsing, chunking, and orchestrating embeddings."""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.repositories.document_repo import DocumentRepository, ChunkRepository
from app.services.storage_service import get_storage_service
from app.services.embedding_service import EmbeddingService
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.utils.pdf_parser import extract_text_from_pdf, chunk_text

logger = get_logger(__name__)
settings = get_settings()


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.chunk_repo = ChunkRepository(db)
        self.storage = get_storage_service()
        self.embedding_service = EmbeddingService()

    async def upload_document(
        self, file_bytes: bytes, filename: str, owner_id: uuid.UUID
    ) -> DocumentResponse:
        storage_path = await self.storage.upload(file_bytes, filename, str(owner_id))

        doc = Document(
            owner_id=owner_id, filename=filename,
            storage_path=storage_path, file_size=len(file_bytes), status="processing",
        )
        doc = await self.doc_repo.create(doc)
        logger.info(f"Document created: {doc.id} — {filename}")

        try:
            pages = extract_text_from_pdf(file_bytes)
            full_text = "\n\n".join(pages)
            chunks = chunk_text(full_text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)

            texts = [c["text"] for c in chunks]
            embeddings = await self.embedding_service.embed_texts(texts)

            chunk_models = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_models.append(
                    DocumentChunk(
                        document_id=doc.id, chunk_index=i, content=chunk["text"],
                        page_number=chunk.get("page"), token_count=chunk.get("token_count", 0),
                        embedding=embedding,
                    )
                )
            await self.chunk_repo.bulk_create(chunk_models)
            await self.doc_repo.update_status(doc.id, "ready", page_count=len(pages))
            logger.info(f"Document processed: {doc.id} — {len(chunks)} chunks")
        except Exception as e:
            logger.error(f"Document processing failed: {doc.id} — {e}")
            await self.doc_repo.update_status(doc.id, "failed", error_message=str(e))

        doc = await self.doc_repo.get_by_id(doc.id, owner_id)
        return DocumentResponse.model_validate(doc)

    async def list_documents(self, owner_id: uuid.UUID) -> DocumentListResponse:
        docs, total = await self.doc_repo.list_by_owner(owner_id)
        return DocumentListResponse(
            documents=[DocumentResponse.model_validate(d) for d in docs], total=total,
        )

    async def get_document(self, doc_id: uuid.UUID, owner_id: uuid.UUID) -> Optional[DocumentResponse]:
        doc = await self.doc_repo.get_by_id(doc_id, owner_id)
        if not doc:
            return None
        return DocumentResponse.model_validate(doc)

    async def delete_document(self, doc_id: uuid.UUID, owner_id: uuid.UUID) -> bool:
        doc = await self.doc_repo.get_by_id(doc_id, owner_id)
        if not doc:
            return False
        await self.storage.delete(doc.storage_path)
        return await self.doc_repo.delete(doc_id, owner_id)
