import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import Mission, MissionDay, UserProfile
from app.db.session import get_db
from app.schemas.mission import MissionCreate, MissionResponse, MissionUpdate
from app.schemas.mission_day import MissionDayCreate, MissionDayResponse
from app.services import mission_service

# Router for /missions
router = APIRouter(tags=["Missions & Flight Days"])


@router.post(
    "/missions",
    response_model=MissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new space mission",
)
def create_mission(
    mission_in: MissionCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Mission:
    """Create a space mission attached to the authenticated astronaut.

    The astronaut identity is securely derived from the verified token.
    """
    return mission_service.create_mission(
        db=db,
        user_id=current_user.id,
        mission_in=mission_in,
    )


@router.get(
    "/missions",
    response_model=List[MissionResponse],
    summary="List all missions for current astronaut",
)
def list_missions(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter missions by status: planned, active, completed, cancelled",
    ),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Mission]:
    """Retrieve all missions created by the authenticated astronaut."""
    return mission_service.get_user_missions(
        db=db,
        user_id=current_user.id,
        status_filter=status_filter,
    )


@router.get(
    "/missions/{mission_id}",
    response_model=MissionResponse,
    summary="Get mission details by UUID",
)
def get_mission(
    mission_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Mission:
    """Get mission by ID, verifying astronaut ownership."""
    return mission_service.get_mission_by_id(
        db=db,
        mission_id=mission_id,
        user_id=current_user.id,
    )


@router.patch(
    "/missions/{mission_id}",
    response_model=MissionResponse,
    summary="Update mission details or status",
)
def update_mission(
    mission_id: uuid.UUID,
    mission_in: MissionUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Mission:
    """Update mission info (name, description, dates, or status)."""
    return mission_service.update_mission(
        db=db,
        mission_id=mission_id,
        user_id=current_user.id,
        mission_in=mission_in,
    )


@router.post(
    "/missions/{mission_id}/days",
    response_model=MissionDayResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a flight day to a mission",
)
def create_mission_day(
    mission_id: uuid.UUID,
    day_in: MissionDayCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MissionDay:
    """Add a mission day (e.g., Day 1, Day 2) to a mission owned by this astronaut."""
    return mission_service.create_mission_day(
        db=db,
        mission_id=mission_id,
        user_id=current_user.id,
        day_in=day_in,
    )


@router.get(
    "/missions/{mission_id}/days",
    response_model=List[MissionDayResponse],
    summary="List all days for a mission",
)
def list_mission_days(
    mission_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[MissionDay]:
    """Retrieve all chronological mission days for a specific mission."""
    return mission_service.get_mission_days(
        db=db,
        mission_id=mission_id,
        user_id=current_user.id,
    )


@router.get(
    "/mission-days/{mission_day_id}",
    response_model=MissionDayResponse,
    summary="Get a specific mission day by UUID",
)
def get_mission_day(
    mission_day_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MissionDay:
    """Retrieve a single mission day by ID."""
    return mission_service.get_mission_day_by_id(
        db=db,
        mission_day_id=mission_day_id,
        user_id=current_user.id,
    )

