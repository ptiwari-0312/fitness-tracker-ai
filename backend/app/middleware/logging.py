"""Request/response logging middleware using loguru."""
import time
import uuid

from fastapi import Request, Response
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        logger.info(f"[{request_id}] → {request.method} {request.url.path}")

        response = await call_next(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        log_fn = logger.warning if response.status_code >= 400 else logger.info
        log_fn(f"[{request_id}] ← {response.status_code} ({elapsed_ms}ms)")

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
        return response
