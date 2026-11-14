import uuid
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.models import UserProfile
from app.db.session import get_db

# HTTP Bearer scheme extracts: "Authorization: Bearer <token>"
oauth2_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Dependency that verifies the JWT access token and returns the authenticated UserProfile.

    Prevents IDOR (Insecure Direct Object Reference) by deriving the user's
    identity directly from the cryptographically verified token.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    try:
        user_uuid = uuid.UUID(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject ('sub') is not a valid UUID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch astronaut profile from database
    user = db.query(UserProfile).filter(UserProfile.id == user_uuid).first()

    # If the user authenticated via Supabase but has not created a profile row yet,
    # provision an initial profile row so subsequent relationship queries succeed.
    if user is None:
        email = payload.get("email")
        display_name = (
            payload.get("user_metadata", {}).get("full_name")
            or payload.get("user_metadata", {}).get("name")
            or (email.split("@")[0] if email else "Astronaut")
        )
        user = UserProfile(
            id=user_uuid,
            email=email,
            display_name=display_name[:100],
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

