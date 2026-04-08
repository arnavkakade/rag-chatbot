"""Database initialization script. Run: python -m scripts.init_db"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.core.database import engine, Base
from app.core.logging import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)


async def init_database():
    logger.info("Initializing database...")
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully!")
    await engine.dispose()


if __name__ == "__main__":
    import app.models  # noqa: F401
    asyncio.run(init_database())
