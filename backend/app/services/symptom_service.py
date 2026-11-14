import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Mission, MissionDay, SymptomLog
from app.schemas.symptom_log import SymptomLogCreate


def verify_mission_day_ownership(
    db: Session,
    mission_day_id: uuid.UUID,
    user_id: uuid.UUID,
) -> MissionDay:
    """Ensure the mission day exists and belongs to the authenticated astronaut."""
    mission_day = (
        db.query(MissionDay)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(MissionDay.id == mission_day_id)
        .first()
    )
    if not mission_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mission day '{mission_day_id}' not found",
        )
    if mission_day.mission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to log symptoms for another astronaut's mission",
        )
    return mission_day


def create_symptom_log(
    db: Session,
    user_id: uuid.UUID,
    symptom_in: SymptomLogCreate,
) -> SymptomLog:
    """Record a medical symptom experienced by the astronaut."""
    verify_mission_day_ownership(db=db, mission_day_id=symptom_in.mission_day_id, user_id=user_id)

    symptom = SymptomLog(
        mission_day_id=symptom_in.mission_day_id,
        symptom_type=symptom_in.symptom_type,
        severity=symptom_in.severity,
        notes=symptom_in.notes,
        recorded_at=symptom_in.recorded_at,
    )
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return symptom


def get_symptom_logs(
    db: Session,
    user_id: uuid.UUID,
    mission_id: Optional[uuid.UUID] = None,
    mission_day_id: Optional[uuid.UUID] = None,
    symptom_type: Optional[str] = None,
    min_severity: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[SymptomLog]:
    """Retrieve historical symptom logs for the authenticated astronaut."""
    query = (
        db.query(SymptomLog)
        .join(MissionDay, SymptomLog.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(Mission.user_id == user_id)
    )

    if mission_id:
        query = query.filter(Mission.id == mission_id)
    if mission_day_id:
        query = query.filter(SymptomLog.mission_day_id == mission_day_id)
    if symptom_type:
        query = query.filter(SymptomLog.symptom_type.ilike(f"%{symptom_type}%"))
    if min_severity is not None:
        query = query.filter(SymptomLog.severity >= min_severity)

    safe_limit = min(max(1, limit), 200)
    return query.order_by(SymptomLog.recorded_at.desc()).offset(offset).limit(safe_limit).all()
