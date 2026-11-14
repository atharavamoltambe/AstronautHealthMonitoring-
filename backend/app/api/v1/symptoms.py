import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import SymptomLog, UserProfile
from app.db.session import get_db
from app.schemas.symptom_log import SymptomLogCreate, SymptomLogResponse
from app.services import symptom_service

router = APIRouter(prefix="/symptom-logs", tags=["Symptom Logs"])


@router.post(
    "",
    response_model=SymptomLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a symptom experienced by the astronaut",
)
def create_symptom(
    symptom_in: SymptomLogCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SymptomLog:
    """Log an astronaut medical symptom (severity 1 to 5, notes, recorded timestamp)."""
    return symptom_service.create_symptom_log(
        db=db,
        user_id=current_user.id,
        symptom_in=symptom_in,
    )


@router.get(
    "",
    response_model=List[SymptomLogResponse],
    summary="List symptom logs with optional filters",
)
def list_symptoms(
    mission_id: Optional[uuid.UUID] = Query(None, description="Filter by mission UUID"),
    mission_day_id: Optional[uuid.UUID] = Query(None, description="Filter by flight day UUID"),
    symptom_type: Optional[str] = Query(None, description="Filter by symptom name / keyword"),
    min_severity: Optional[int] = Query(None, ge=1, le=5, description="Filter by minimum severity"),
    limit: int = Query(100, ge=1, le=200, description="Pagination size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[SymptomLog]:
    """Retrieve historical symptom logs for the authenticated astronaut."""
    return symptom_service.get_symptom_logs(
        db=db,
        user_id=current_user.id,
        mission_id=mission_id,
        mission_day_id=mission_day_id,
        symptom_type=symptom_type,
        min_severity=min_severity,
        limit=limit,
        offset=offset,
    )


# Backwards compatibility alias router for /symptoms
alias_router = APIRouter(prefix="/symptoms", tags=["Symptom Logs"], include_in_schema=False)
alias_router.add_api_route("", create_symptom, methods=["POST"], response_model=SymptomLogResponse, status_code=status.HTTP_201_CREATED)
alias_router.add_api_route("", list_symptoms, methods=["GET"], response_model=List[SymptomLogResponse])
