import os
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))


class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaGuard API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database connection URL (PostgreSQL / Supabase)
    DATABASE_URL: str = "postgresql+psycopg://postgres.nccizslfjvggpvjnnkiw:0xNTOxrSOPRchqBK@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def clean_db_url(cls, v: str) -> str:
        return v.strip().strip("'\"")

    # Supabase JWT Secret for cryptographic token verification
    SUPABASE_JWT_SECRET: str = "novaguard-dev-insecure-secret-key-replace-with-supabase-secret"
    JWT_ALGORITHM: str = "HS256"

    # Trusted Frontend Origins for CORS (Vite / React / Next)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Local Edge AI Engine Settings (Ollama - Meta Llama / Google Gemma)
    LOCAL_LLM_URL: str = "http://localhost:11434"
    LOCAL_LLM_MODEL: str = "llama3.2:latest"
    LOCAL_LLM_FALLBACK_MODEL: str = "llama3.2"
    LOCAL_LLM_ENABLED: bool = True
    LOCAL_LLM_TIMEOUT: int = 45  # seconds

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", _backend_env),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
