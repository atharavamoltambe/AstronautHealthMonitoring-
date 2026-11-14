import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import UserProfile
from app.schemas.profile import ProfileCreate, ProfileUpdate


def get_profile_by_id(db: Session, profile_id: uuid.UUID) -> UserProfile:
    """Retrieve an astronaut profile by its UUID."""
    profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut profile with ID '{profile_id}' not found",
        )
    return profile


def create_profile(
    db: Session,
    user_id: uuid.UUID,
    profile_in: ProfileCreate,
) -> UserProfile:
    """Create a profile for the authenticated astronaut."""
    existing = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A profile already exists for this authenticated user",
        )

    # Check if optional email is already taken by another account
    if profile_in.email:
        email_check = (
            db.query(UserProfile)
            .filter(UserProfile.email == profile_in.email)
            .first()
        )
        if email_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already associated with another profile",
            )

    profile = UserProfile(
        id=user_id,
        display_name=profile_in.display_name,
        email=profile_in.email,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(
    db: Session,
    profile_id: uuid.UUID,
    current_user: UserProfile,
    profile_in: ProfileUpdate,
) -> UserProfile:
    """Update an astronaut profile, enforcing ownership."""
    # Authorization check: prevent IDOR (editing someone else's profile)
    if profile_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify another astronaut's profile",
        )

    if profile_in.display_name is not None:
        current_user.display_name = profile_in.display_name

    if profile_in.email is not None:
        if profile_in.email != current_user.email:
            email_check = (
                db.query(UserProfile)
                .filter(UserProfile.email == profile_in.email)
                .first()
            )
            if email_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already associated with another profile",
                )
            current_user.email = profile_in.email

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

