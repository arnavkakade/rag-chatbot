"""
Application configuration loaded from environment variables.
Supports OpenAI, Azure OpenAI, and any OpenAI-compatible provider.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────
    APP_NAME: str = "AI RAG Chatbot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:5173"

    # ── Auth / JWT ────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Database ──────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://raguser:ragpass@localhost:5432/ragdb"
    DATABASE_SYNC_URL: str = "postgresql://raguser:ragpass@localhost:5432/ragdb"

    # ── AI Provider (OpenAI-compatible abstraction) ───────
    AI_PROVIDER: str = "openai"  # openai | azure | custom
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Azure-specific (used when AI_PROVIDER=azure)
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-01"
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = ""
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = ""

    # ── Embedding ─────────────────────────────────────────
    EMBEDDING_DIMENSION: int = 1536
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    TOP_K_RESULTS: int = 5

    # ── Storage ───────────────────────────────────────────
    STORAGE_BACKEND: str = "local"  # local | azure_blob
    LOCAL_STORAGE_PATH: str = "./storage"
    AZURE_BLOB_CONNECTION_STRING: str = ""
    AZURE_BLOB_CONTAINER: str = "documents"

    # ── Upload limits ─────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
