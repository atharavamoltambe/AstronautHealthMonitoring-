from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NovaGuard API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database connection URL (PostgreSQL / Supabase)
    DATABASE_URL: str = ""

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

    # Local Edge AI Engine Settings (Ollama - Google Gemma / Meta Llama)
    LOCAL_LLM_URL: str = "http://localhost:11434"
    LOCAL_LLM_MODEL: str = "gemma2:2b"
    LOCAL_LLM_FALLBACK_MODEL: str = "llama3.2:latest"
    LOCAL_LLM_ENABLED: bool = True
    LOCAL_LLM_TIMEOUT: int = 60  # seconds

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
