"""
Chat service — orchestrates RAG pipeline:
  1. Retrieve relevant chunks via vector search
  2. Build augmented prompt
  3. Stream response via OpenAI-compatible API (SSE)
  4. Persist conversation history
"""

import json
import uuid
from typing import AsyncGenerator

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.conversation import Conversation, Message
from app.repositories.conversation_repo import ConversationRepository, MessageRepository
from app.services.vector_search_service import VectorSearchService
from app.schemas.chat import (
    ConversationResponse, ConversationDetailResponse,
    ConversationListResponse, MessageResponse,
)

logger = get_logger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are a helpful AI assistant with access to the user's uploaded documents.
Use the provided context to answer the user's question accurately.
If the context doesn't contain relevant information, say so clearly.
Always cite which document and page the information comes from when possible.
Format your responses using Markdown for readability."""


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.vector_search = VectorSearchService(db)

    # ── Conversation CRUD ────────────────────────────────

    async def list_conversations(self, owner_id: uuid.UUID) -> ConversationListResponse:
        convs, total = await self.conv_repo.list_by_owner(owner_id)
        return ConversationListResponse(
            conversations=[ConversationResponse.model_validate(c) for c in convs], total=total,
        )

    async def get_conversation(
        self, conv_id: uuid.UUID, owner_id: uuid.UUID
    ) -> ConversationDetailResponse | None:
        conv = await self.conv_repo.get_by_id(conv_id, owner_id, load_messages=True)
        if not conv:
            return None
        return ConversationDetailResponse(
            id=conv.id, title=conv.title, created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=[MessageResponse.model_validate(m) for m in conv.messages],
        )

    async def update_conversation_title(
        self, conv_id: uuid.UUID, owner_id: uuid.UUID, title: str
    ) -> ConversationResponse | None:
        conv = await self.conv_repo.update_title(conv_id, owner_id, title)
        if not conv:
            return None
        return ConversationResponse.model_validate(conv)

    async def delete_conversation(self, conv_id: uuid.UUID, owner_id: uuid.UUID) -> bool:
        return await self.conv_repo.delete(conv_id, owner_id)

    # ── RAG Chat (SSE Streaming) ─────────────────────────

    async def chat_stream(
        self, user_message: str, owner_id: uuid.UUID, conversation_id: uuid.UUID | None = None,
        document_ids: list[uuid.UUID] | None = None,
    ) -> AsyncGenerator[str, None]:
        # 1. Get or create conversation
        if conversation_id:
            conv = await self.conv_repo.get_by_id(conversation_id, owner_id)
            if not conv:
                yield self._sse_event("error", {"message": "Conversation not found"})
                return
        else:
            conv = Conversation(owner_id=owner_id, title=user_message[:100])
            conv = await self.conv_repo.create(conv)

        yield self._sse_event("conversation", {"id": str(conv.id), "title": conv.title})

        # 2. Save user message
        user_msg = Message(conversation_id=conv.id, role="user", content=user_message)
        await self.msg_repo.create(user_msg)

        # 3. Vector search for context
        try:
            search_results = await self.vector_search.search(user_message, owner_id, document_ids=document_ids)
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            yield self._sse_event("error", {"message": "Failed to search documents"})
            return

        context_parts = []
        sources = []
        for r in search_results:
            context_parts.append(f"[Source: {r.filename}, Page {r.page_number}]\n{r.content}")
            sources.append({"filename": r.filename, "page": r.page_number, "distance": r.distance})

        context_text = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant documents found."
        yield self._sse_event("sources", sources)

        # 4. Build conversation history for the LLM
        history_messages = await self.msg_repo.get_conversation_messages(conv.id, limit=20)
        llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        llm_messages.append({
            "role": "system",
            "content": f"## Relevant Document Context\n\n{context_text}",
        })
        for msg in history_messages:
            llm_messages.append({"role": msg.role, "content": msg.content})

        # 5. Stream from LLM
        full_response = ""
        try:
            async for chunk in self._stream_llm(llm_messages):
                full_response += chunk
                yield self._sse_event("token", {"content": chunk})
        except Exception as e:
            logger.error(f"LLM streaming failed: {e}")
            yield self._sse_event("error", {"message": f"LLM error: {str(e)[:200]}"})
            return

        # 6. Save assistant message
        assistant_msg = Message(conversation_id=conv.id, role="assistant", content=full_response)
        await self.msg_repo.create(assistant_msg)

        yield self._sse_event("done", {"message_id": str(assistant_msg.id)})

    async def _stream_llm(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        base_url, headers, model = self._get_llm_config()

        if settings.AI_PROVIDER == "azure":
            url = f"{base_url}/chat/completions?api-version={settings.AZURE_OPENAI_API_VERSION}"
        else:
            url = f"{base_url}/chat/completions"

        payload = {
            "model": model, "messages": messages, "stream": True,
            "temperature": 0.7, "max_tokens": 2048,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            break
                        try:
                            parsed = json.loads(data)
                            delta = parsed["choices"][0].get("delta", {})
                            content = delta.get("content")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

    def _get_llm_config(self) -> tuple[str, dict[str, str], str]:
        if settings.AI_PROVIDER == "azure":
            base_url = (
                f"{settings.AZURE_OPENAI_ENDPOINT}/openai/deployments/"
                f"{settings.AZURE_OPENAI_CHAT_DEPLOYMENT}"
            )
            headers = {"api-key": settings.AZURE_OPENAI_API_KEY, "Content-Type": "application/json"}
            return base_url, headers, settings.AZURE_OPENAI_CHAT_DEPLOYMENT
        else:
            headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
            return settings.OPENAI_BASE_URL, headers, settings.OPENAI_CHAT_MODEL

    @staticmethod
    def _sse_event(event: str, data) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"
