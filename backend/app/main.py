import os
import uuid
from typing import Optional
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text 
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1 import api_v1_router
from app.api.v1.assessments import router as assessments_router
from app.api.v1.checklists import router as checklists_router, alias_router as checklists_alias_router
from app.api.v1.health_records import router as health_records_router
from app.api.v1.missions import router as missions_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.symptoms import router as symptoms_router, alias_router as symptoms_alias_router
from app.api.v1.playbooks import router as playbooks_router
from app.api.v1.radiation import router as radiation_router
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

# Transport & Browser Security: Enable CORS with explicit trusted origins & Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers (Available at both /... and /api/v1/...)
app.include_router(profiles_router)
app.include_router(missions_router)
app.include_router(health_records_router)
app.include_router(symptoms_router)
app.include_router(symptoms_alias_router)
app.include_router(checklists_router)
app.include_router(checklists_alias_router)
app.include_router(assessments_router)
app.include_router(playbooks_router)
app.include_router(radiation_router)
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/api", tags=["General"])
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


# Mount compiled frontend static assets (Vite dist) and SPA catch-all
app_static = os.path.join(os.path.dirname(__file__), "static")
parent_static = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
static_dir = app_static if os.path.exists(app_static) else parent_static
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str = ""):
        # Avoid catching known backend API prefixes
        api_prefixes = ("api", "docs", "openapi.json", "playbooks", "radiation", "auth", "health", "db-check")
        if full_path and full_path.split("/")[0] in api_prefixes:
            raise HTTPException(status_code=404, detail="Not Found")

        target_file = os.path.join(static_dir, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)

        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")

