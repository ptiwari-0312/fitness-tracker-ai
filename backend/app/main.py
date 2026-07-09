"""
FitnessTracker API — application entry point.
Registers middleware, mounts the v1 router, sets up lifecycle hooks,
and wires global exception handlers for consistent error JSON.
"""
import sys

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.database.init_db import init_db
from app.middleware.logging import LoggingMiddleware

# ── Logging setup ─────────────────────────────────────────────────────────────
logger.remove()
logger.add(sys.stderr, level=settings.LOG_LEVEL, colorize=True, format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}")
logger.add(settings.LOG_FILE, rotation="10 MB", retention="30 days", level="DEBUG", catch=True)


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Fitness Tracking API — Clean Architecture demo",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router)


# ── Exception handlers ────────────────────────────────────────────────────────
@app.exception_handler(AppException)
async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "type": type(exc).__name__},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    await init_db()
    logger.info("Database ready")


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health() -> dict:
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
