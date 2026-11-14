import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import DailyChecklist, UserProfile
from app.db.session import get_db
from app.schemas.daily_checklist import (
    DailyChecklistCreate,
    DailyChecklistResponse,
    DailyChecklistUpdate,
)
from app.services import checklist_service

router = APIRouter(prefix="/daily-checklists", tags=["Daily Checklists"])


@router.post(
    "",
    response_model=DailyChecklistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a checklist task to a flight day",
)
def create_checklist_item(
    item_in: DailyChecklistCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyChecklist:
    """Add a daily checklist item (e.g. 'Radiation Monitor Calibration')."""
    return checklist_service.create_checklist_item(
        db=db,
        user_id=current_user.id,
        item_in=item_in,
    )


@router.get(
    "",
    response_model=List[DailyChecklistResponse],
    summary="List daily checklist tasks",
)
def list_checklist_items(
    mission_id: Optional[uuid.UUID] = Query(None, description="Filter by mission UUID"),
    mission_day_id: Optional[uuid.UUID] = Query(None, description="Filter by flight day UUID"),
    is_completed: Optional[bool] = Query(None, description="Filter by completion status"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[DailyChecklist]:
    """Retrieve checklist tasks for the authenticated astronaut."""
    return checklist_service.get_checklist_items(
        db=db,
        user_id=current_user.id,
        mission_id=mission_id,
        mission_day_id=mission_day_id,
        is_completed=is_completed,
    )


@router.patch(
    "/{checklist_id}",
    response_model=DailyChecklistResponse,
    summary="Update checklist task completion status",
)
def update_checklist_item(
    checklist_id: uuid.UUID,
    item_in: DailyChecklistUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyChecklist:
    """Mark a task complete or incomplete.

    Automatically sets completed_at timestamp when marked complete.
    """
    return checklist_service.update_checklist_item(
        db=db,
        checklist_id=checklist_id,
        user_id=current_user.id,
        item_in=item_in,
    )
