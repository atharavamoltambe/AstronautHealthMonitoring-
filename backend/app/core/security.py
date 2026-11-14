from datetime import datetime, timedelta, timezone
from typing import Any
import jwt
from fastapi import HTTPException, status
from app.core.config import settings


def decode_access_token(token: str) -> dict[str, Any]:
    """Cryptographically decode and verify a Supabase JWT access token.

    Validates:
    - Signature integrity against SUPABASE_JWT_SECRET
    - Token expiration (exp)
    - Allowed cryptographic algorithms
    - Presence of the user subject claim (sub)
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is empty",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Sanitize common user input artifacts (quotes, whitespace, duplicate Bearer prefixes)
    cleaned_token = token.strip().strip('"').strip("'")
    if cleaned_token.lower().startswith("bearer "):
        cleaned_token = cleaned_token[7:].strip().strip('"').strip("'")

    try:
        payload = jwt.decode(
            cleaned_token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
            },
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing subject identifier ('sub')",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials: invalid token signature",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_access_token(
    subject: str,
    email: str | None = None,
    expires_delta: timedelta | None = None,
    additional_claims: dict[str, Any] | None = None,
) -> str:
    """Helper utility to generate standard signed JWT tokens (used for local testing and dev)."""
    now = datetime.now(timezone.utc)
    # Tokens valid for 7 days in development to avoid frequent expiration during testing
    expire = now + (expires_delta or timedelta(days=7))

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "role": "authenticated",
    }
    if email:
        payload["email"] = email
    if additional_claims:
        payload.update(additional_claims)

    return jwt.encode(
        payload,
        settings.SUPABASE_JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
