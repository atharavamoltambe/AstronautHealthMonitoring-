import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import DailyChecklist, Mission, MissionDay
from app.schemas.daily_checklist import DailyChecklistCreate, DailyChecklistUpdate


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
            detail="You are not authorized to access checklists for another astronaut's mission",
        )
    return mission_day


def create_checklist_item(
    db: Session,
    user_id: uuid.UUID,
    item_in: DailyChecklistCreate,
) -> DailyChecklist:
    """Add a new checklist task to a flight day."""
    verify_mission_day_ownership(db=db, mission_day_id=item_in.mission_day_id, user_id=user_id)

    # Check for duplicate task on the same mission day
    duplicate_check = (
        db.query(DailyChecklist)
        .filter(
            DailyChecklist.mission_day_id == item_in.mission_day_id,
            DailyChecklist.task_name == item_in.task_name,
        )
        .first()
    )
    if duplicate_check:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task '{item_in.task_name}' already exists for this mission day",
        )

    checklist_item = DailyChecklist(
        mission_day_id=item_in.mission_day_id,
        task_name=item_in.task_name,
        is_completed=False,
        completed_at=None,
    )
    db.add(checklist_item)
    db.commit()
    db.refresh(checklist_item)
    return checklist_item


def get_checklist_items(
    db: Session,
    user_id: uuid.UUID,
    mission_id: Optional[uuid.UUID] = None,
    mission_day_id: Optional[uuid.UUID] = None,
    is_completed: Optional[bool] = None,
) -> List[DailyChecklist]:
    """Retrieve checklist tasks for the authenticated astronaut."""
    query = (
        db.query(DailyChecklist)
        .join(MissionDay, DailyChecklist.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(Mission.user_id == user_id)
    )

    if mission_id:
        query = query.filter(Mission.id == mission_id)
    if mission_day_id:
        query = query.filter(DailyChecklist.mission_day_id == mission_day_id)
    if is_completed is not None:
        query = query.filter(DailyChecklist.is_completed == is_completed)

    return query.order_by(DailyChecklist.created_at.asc()).all()


def update_checklist_item(
    db: Session,
    checklist_id: uuid.UUID,
    user_id: uuid.UUID,
    item_in: DailyChecklistUpdate,
) -> DailyChecklist:
    """Mark a checklist task as completed or incomplete, updating timestamps."""
    item = (
        db.query(DailyChecklist)
        .join(MissionDay, DailyChecklist.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(DailyChecklist.id == checklist_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist task '{checklist_id}' not found",
        )
    if item.mission_day.mission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this checklist task",
        )

    item.is_completed = item_in.is_completed
    # Satisfies the ck_checklists_completion_consistency constraint
    if item_in.is_completed:
        item.completed_at = datetime.now(timezone.utc)
    else:
        item.completed_at = None

    db.add(item)
    db.commit()
    db.refresh(item)
    return item
