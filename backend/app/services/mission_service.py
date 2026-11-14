import uuid
from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.models import Mission, MissionDay
from app.schemas.mission import MissionCreate, MissionUpdate
from app.schemas.mission_day import MissionDayCreate


def create_mission(
    db: Session,
    user_id: uuid.UUID,
    mission_in: MissionCreate,
) -> Mission:
    """Create a new mission for the authenticated astronaut.

    The user_id is always taken from the verified token, preventing IDOR.
    """
    mission = Mission(
        user_id=user_id,
        name=mission_in.name,
        description=mission_in.description,
        start_date=mission_in.start_date,
        end_date=mission_in.end_date,
        status=mission_in.status,
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission


def get_user_missions(
    db: Session,
    user_id: uuid.UUID,
    status_filter: Optional[str] = None,
) -> List[Mission]:
    """Retrieve all missions belonging to the authenticated astronaut."""
    query = db.query(Mission).filter(Mission.user_id == user_id)
    if status_filter:
        query = query.filter(Mission.status == status_filter)
    return query.order_by(Mission.start_date.desc()).all()


def get_mission_by_id(
    db: Session,
    mission_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Mission:
    """Retrieve a mission by UUID, ensuring astronaut ownership."""
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission with ID '{mission_id}' not found",
        )
    if mission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this mission",
        )
    return mission


def update_mission(
    db: Session,
    mission_id: uuid.UUID,
    user_id: uuid.UUID,
    mission_in: MissionUpdate,
) -> Mission:
    """Update mission fields, enforcing ownership and date validity."""
    mission = get_mission_by_id(db=db, mission_id=mission_id, user_id=user_id)

    # Determine prospective dates to ensure end_date >= start_date
    prospective_start = (
        mission_in.start_date if mission_in.start_date is not None else mission.start_date
    )
    prospective_end = (
        mission_in.end_date if mission_in.end_date is not None else mission.end_date
    )
    if prospective_end is not None and prospective_end < prospective_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date cannot be earlier than start_date",
        )

    if mission_in.name is not None:
        mission.name = mission_in.name
    if mission_in.description is not None:
        mission.description = mission_in.description
    if mission_in.start_date is not None:
        mission.start_date = mission_in.start_date
    if mission_in.end_date is not None:
        mission.end_date = mission_in.end_date
    if mission_in.status is not None:
        mission.status = mission_in.status

    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission


def create_mission_day(
    db: Session,
    mission_id: uuid.UUID,
    user_id: uuid.UUID,
    day_in: MissionDayCreate,
) -> MissionDay:
    """Add a flight day to a mission after confirming astronaut ownership."""
    # Verify parent mission exists and belongs to this astronaut
    get_mission_by_id(db=db, mission_id=mission_id, user_id=user_id)

    # Check for duplicate day_number or mission_date
    duplicate_check = (
        db.query(MissionDay)
        .filter(
            MissionDay.mission_id == mission_id,
            (MissionDay.day_number == day_in.day_number)
            | (MissionDay.mission_date == day_in.mission_date),
        )
        .first()
    )
    if duplicate_check:
        if duplicate_check.day_number == day_in.day_number:
            detail = f"Day number {day_in.day_number} already exists for this mission"
        else:
            detail = f"Date {day_in.mission_date} already exists for this mission"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )

    mission_day = MissionDay(
        mission_id=mission_id,
        day_number=day_in.day_number,
        mission_date=day_in.mission_date,
    )
    db.add(mission_day)
    db.commit()
    db.refresh(mission_day)
    return mission_day


def get_mission_days(
    db: Session,
    mission_id: uuid.UUID,
    user_id: uuid.UUID,
) -> List[MissionDay]:
    """List all mission days for a mission belonging to the astronaut."""
    get_mission_by_id(db=db, mission_id=mission_id, user_id=user_id)
    return (
        db.query(MissionDay)
        .filter(MissionDay.mission_id == mission_id)
        .order_by(MissionDay.day_number.asc())
        .all()
    )


def get_mission_day_by_id(
    db: Session,
    mission_day_id: uuid.UUID,
    user_id: uuid.UUID,
) -> MissionDay:
    """Retrieve a single mission day by ID, verifying parent mission ownership."""
    mission_day = (
        db.query(MissionDay)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(MissionDay.id == mission_day_id)
        .first()
    )
    if not mission_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission day with ID '{mission_day_id}' not found",
        )
    if mission_day.mission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this mission day",
        )
    return mission_day

