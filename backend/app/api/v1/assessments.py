import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import HealthAssessment, UserProfile
from app.db.session import get_db
from app.schemas.health_assessment import (
    AssessmentResult,
    HealthAssessmentCreate,
    HealthAssessmentResponse,
)
from app.services import assessment_service

router = APIRouter(prefix="/health-assessments", tags=["Health Assessments & Decision Engine"])


@router.post(
    "",
    response_model=HealthAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a health assessment record",
)
@router.post(
    "/",
    response_model=HealthAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_assessment(
    assessment_in: HealthAssessmentCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthAssessment:
    """Manually or externally record an astronaut health evaluation."""
    return assessment_service.create_health_assessment(
        db=db,
        user_id=current_user.id,
        assessment_in=assessment_in,
    )


@router.post(
    "/evaluate/{mission_day_id}",
    response_model=HealthAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute NASA Decision Engine on flight day telemetry",
)
@router.post(
    "/evaluate/{mission_day_id}/",
    response_model=HealthAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def evaluate_flight_day(
    mission_day_id: uuid.UUID,
    assessment_type: str = Query("nasa_flight_rules_evaluation", description="Assessment category name"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthAssessment:
    """Analyze all vitals, symptoms, and checklist items for a flight day.

    Applies official NASA-STD-3001 spaceflight physiological baselines,
    generates structured clinical countermeasure cards, and records the result.
    """
    return assessment_service.generate_day_assessment(
        db=db,
        mission_day_id=mission_day_id,
        user_id=current_user.id,
        assessment_type=assessment_type,
    )


@router.get(
    "",
    response_model=List[HealthAssessmentResponse],
    summary="Query historical health assessments",
)
def list_assessments(
    mission_id: Optional[uuid.UUID] = Query(None, description="Filter by mission UUID"),
    mission_day_id: Optional[uuid.UUID] = Query(None, description="Filter by flight day UUID"),
    result: Optional[AssessmentResult] = Query(None, description="Filter by assessment result: no_flag, review_recommended, insufficient_data"),
    limit: int = Query(100, ge=1, le=200, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[HealthAssessment]:
    """Retrieve historical health assessments for the authenticated astronaut."""
    return assessment_service.get_health_assessments(
        db=db,
        user_id=current_user.id,
        mission_id=mission_id,
        mission_day_id=mission_day_id,
        result_filter=result,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{assessment_id}",
    response_model=HealthAssessmentResponse,
    summary="Get single assessment by UUID",
)
def get_assessment(
    assessment_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthAssessment:
    """Retrieve details and clinical countermeasures for a specific assessment."""
    return assessment_service.get_health_assessment_by_id(
        db=db,
        assessment_id=assessment_id,
        user_id=current_user.id,
    )

