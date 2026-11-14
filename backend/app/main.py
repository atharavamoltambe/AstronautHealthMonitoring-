import uuid
from typing import Optional
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text 
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1 import api_v1_router
from app.api.v1.assessments import router as assessments_router
from app.api.v1.checklists import router as checklists_router
from app.api.v1.health_records import router as health_records_router
from app.api.v1.missions import router as missions_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.symptoms import router as symptoms_router
from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.db.models import UserProfile
from app.db.session import engine
from app.schemas.profile import ProfileResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API foundation for astronaut health monitoring and mission tracking.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Transport & Browser Security: Enable CORS with explicit trusted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers (Available at both /... and /api/v1/...)
app.include_router(profiles_router)
app.include_router(missions_router)
app.include_router(health_records_router)
app.include_router(symptoms_router)
app.include_router(checklists_router)
app.include_router(assessments_router)
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["General"])
def read_root() -> dict[str, str]:
    """Welcome endpoint returning service status."""
    return {
        "message": "Welcome to NovaGuard API",
        "status": "online",
        "version": settings.VERSION,
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
    }


@app.get("/db-check", tags=["Health"])
def database_check() -> dict[str, str]:
    """Check database connectivity."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"database": "connected"}
    except Exception as exc:
        return {"database": "connection_failed", "detail": str(exc)}


@app.get(
    "/auth/me",
    tags=["Authentication"],
    response_model=ProfileResponse,
    summary="Get currently authenticated astronaut profile",
)
def get_me(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Protected endpoint: Returns the profile of the astronaut making the request.

    Verifies the Bearer JWT token, ensures expiration has not passed, and extracts
    the verified user identity directly from cryptographic claims.
    """
    return current_user


@app.post(
    "/auth/dev-token",
    tags=["Authentication"],
    summary="Generate a test token for local development",
)
def create_dev_token(
    user_id: Optional[str] = None,
    display_name: str = "Commander Shepard",
    email: str = "shepard@novaguard.nasa.gov",
) -> dict[str, str]:
    """Development utility to generate a valid signed JWT for testing Swagger docs."""
    dev_user_id = user_id if user_id else str(uuid.uuid5(uuid.NAMESPACE_DNS, email))
    token = create_access_token(
        subject=dev_user_id,
        email=email,
        additional_claims={"user_metadata": {"full_name": display_name, "name": display_name}},
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": dev_user_id,
        "hint": "Copy this access_token into Swagger UI 'Authorize' button (top right of /docs)",
    }
