import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import UserProfile
from app.db.session import get_db
from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate
from app.services import profile_service

router = APIRouter(prefix="/profiles", tags=["Astronaut Profiles"])


@router.post(
    "",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or initialize an astronaut profile",
)
def create_profile(
    profile_in: ProfileCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Create a profile explicitly for the authenticated astronaut.

    The user identity is derived from the JWT token, preventing impersonation.
    """
    return profile_service.create_profile(
        db=db,
        user_id=current_user.id,
        profile_in=profile_in,
    )


@router.get(
    "/{profile_id}",
    response_model=ProfileResponse,
    summary="Get an astronaut profile by UUID",
)
def get_profile(
    profile_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Retrieve an astronaut's profile by ID.

    Requires valid authentication.
    """
    return profile_service.get_profile_by_id(db=db, profile_id=profile_id)


@router.patch(
    "/{profile_id}",
    response_model=ProfileResponse,
    summary="Update astronaut profile",
)
def update_profile(
    profile_id: uuid.UUID,
    profile_in: ProfileUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Update profile fields (e.g. display name or email).

    Enforces authorization: an astronaut can only update their own profile.
    """
    return profile_service.update_profile(
        db=db,
        profile_id=profile_id,
        current_user=current_user,
        profile_in=profile_in,
    )

