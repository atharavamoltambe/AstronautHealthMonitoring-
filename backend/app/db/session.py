import os
import sys
from typing import Generator

# Ensure Windows finds the trusted PostgreSQL libpq library
if sys.platform == "win32":
    pg_bin = r"C:\Program Files\PostgreSQL\18\bin"
    if os.path.exists(pg_bin) and pg_bin not in os.environ.get("PATH", ""):
        os.environ["PATH"] = pg_bin + ";" + os.environ.get("PATH", "")
        if hasattr(os, "add_dll_directory"):
            try:
                os.add_dll_directory(pg_bin)
            except Exception:
                pass

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL.strip().strip("'\""),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Provide a transactional database session scope for FastAPI dependencies."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
