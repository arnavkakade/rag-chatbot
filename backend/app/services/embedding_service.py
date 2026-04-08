"""Embedding service — generates vector embeddings via OpenAI-compatible API."""

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class EmbeddingService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER

    def _get_client_config(self) -> tuple[str, dict[str, str], str]:
        if self.provider == "azure":
            base_url = (
                f"{settings.AZURE_OPENAI_ENDPOINT}/openai/deployments/"
                f"{settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}"
            )
            headers = {
                "api-key": settings.AZURE_OPENAI_API_KEY,
                "Content-Type": "application/json",
            }
            return base_url, headers, settings.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
        else:
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            }
            return settings.OPENAI_BASE_URL, headers, settings.OPENAI_EMBEDDING_MODEL

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        base_url, headers, model = self._get_client_config()

        if self.provider == "azure":
            url = f"{base_url}/embeddings?api-version={settings.AZURE_OPENAI_API_VERSION}"
        else:
            url = f"{base_url}/embeddings"

        all_embeddings = []
        batch_size = 100

        async with httpx.AsyncClient(timeout=60.0) as client:
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                payload = {"input": batch, "model": model}
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                batch_embeddings = [item["embedding"] for item in data["data"]]
                all_embeddings.extend(batch_embeddings)
                logger.debug(f"Embedded batch {i // batch_size + 1}, {len(batch)} texts")

        return all_embeddings

    async def embed_query(self, text: str) -> list[float]:
        results = await self.embed_texts([text])
        return results[0]
