import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import HealthRecord, UserProfile
from app.db.session import get_db
from app.schemas.health_record import (
    HealthRecordCreate,
    HealthRecordResponse,
    HealthSummaryResponse,
    MeasurementType,
)
from app.services import health_record_service

router = APIRouter(prefix="/health-records", tags=["Astronaut Health Records"])


@router.post(
    "",
    response_model=HealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a vital measurement or physiological metric",
)
@router.post(
    "/",
    response_model=HealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_health_record(
    record_in: HealthRecordCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthRecord:
    """Record astronaut vitals (heart rate, SpO2, body temperature, sleep, water, exercise).

    Verifies parent mission day ownership to prevent IDOR attacks.
    """
    return health_record_service.create_health_record(
        db=db,
        user_id=current_user.id,
        record_in=record_in,
    )


@router.get(
    "",
    response_model=List[HealthRecordResponse],
    summary="Query historical health records with filters",
)
@router.get(
    "/",
    response_model=List[HealthRecordResponse],
    include_in_schema=False,
)
def list_health_records(
    mission_id: Optional[uuid.UUID] = Query(None, description="Filter by mission UUID"),
    mission_day_id: Optional[uuid.UUID] = Query(None, description="Filter by flight day UUID"),
    measurement_type: Optional[MeasurementType] = Query(None, description="Filter by metric type"),
    start_time: Optional[datetime] = Query(None, description="Records on or after this timestamp"),
    end_time: Optional[datetime] = Query(None, description="Records on or before this timestamp"),
    limit: int = Query(100, ge=1, le=200, description="Pagination size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[HealthRecord]:
    """Retrieve historical health records for the logged-in astronaut."""
    return health_record_service.get_health_records(
        db=db,
        user_id=current_user.id,
        mission_id=mission_id,
        mission_day_id=mission_day_id,
        measurement_type=measurement_type,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    response_model=HealthSummaryResponse,
    summary="Get aggregated health summary and latest vitals",
)
@router.get(
    "/summary/",
    response_model=HealthSummaryResponse,
    include_in_schema=False,
)
def get_health_summary(
    mission_id: Optional[uuid.UUID] = Query(None, description="Filter summary by mission"),
    mission_day_id: Optional[uuid.UUID] = Query(None, description="Filter summary by flight day"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthSummaryResponse:
    """Calculate daily metric averages and latest readings for dashboard charts."""
    return health_record_service.get_health_summary(
        db=db,
        user_id=current_user.id,
        mission_id=mission_id,
        mission_day_id=mission_day_id,
    )


@router.get(
    "/{record_id}",
    response_model=HealthRecordResponse,
    summary="Get a single health record by UUID",
)
def get_health_record(
    record_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthRecord:
    """Retrieve a specific vital measurement by ID."""
    return health_record_service.get_health_record_by_id(
        db=db,
        record_id=record_id,
        user_id=current_user.id,
    )

