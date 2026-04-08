"""Global exception handler middleware."""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import get_logger

logger = get_logger(__name__)


class ExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except ValueError as e:
            logger.warning(f"Validation error: {e}")
            return JSONResponse(status_code=400, content={"detail": str(e)})
        except PermissionError as e:
            logger.warning(f"Permission denied: {e}")
            return JSONResponse(status_code=403, content={"detail": str(e)})
        except FileNotFoundError as e:
            return JSONResponse(status_code=404, content={"detail": str(e)})
        except Exception as e:
            logger.exception(f"Unhandled exception: {e}")
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})
