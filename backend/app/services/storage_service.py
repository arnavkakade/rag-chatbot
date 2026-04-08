"""
Storage service abstraction.
- LocalStorageService  → saves files to disk (default)
- AzureBlobStorageService → placeholder for Azure Blob swap
"""

import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class BaseStorageService(ABC):
    @abstractmethod
    async def upload(self, file_bytes: bytes, filename: str, owner_id: str) -> str:
        ...

    @abstractmethod
    async def download(self, storage_path: str) -> bytes:
        ...

    @abstractmethod
    async def delete(self, storage_path: str) -> None:
        ...


class LocalStorageService(BaseStorageService):
    def __init__(self):
        self.base_path = Path(settings.LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def upload(self, file_bytes: bytes, filename: str, owner_id: str) -> str:
        user_dir = self.base_path / owner_id
        user_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid.uuid4().hex}_{filename}"
        file_path = user_dir / safe_name
        file_path.write_bytes(file_bytes)
        storage_path = f"{owner_id}/{safe_name}"
        logger.info(f"File stored locally: {storage_path}")
        return storage_path

    async def download(self, storage_path: str) -> bytes:
        file_path = self.base_path / storage_path
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {storage_path}")
        return file_path.read_bytes()

    async def delete(self, storage_path: str) -> None:
        file_path = self.base_path / storage_path
        if file_path.exists():
            file_path.unlink()
            logger.info(f"File deleted: {storage_path}")


class AzureBlobStorageService(BaseStorageService):
    """Placeholder — swap in azure-storage-blob SDK calls here.
    Set STORAGE_BACKEND=azure_blob and provide AZURE_BLOB_CONNECTION_STRING."""

    async def upload(self, file_bytes: bytes, filename: str, owner_id: str) -> str:
        raise NotImplementedError("Azure Blob storage not yet implemented")

    async def download(self, storage_path: str) -> bytes:
        raise NotImplementedError("Azure Blob storage not yet implemented")

    async def delete(self, storage_path: str) -> None:
        raise NotImplementedError("Azure Blob storage not yet implemented")


def get_storage_service() -> BaseStorageService:
    if settings.STORAGE_BACKEND == "azure_blob":
        return AzureBlobStorageService()
    return LocalStorageService()
