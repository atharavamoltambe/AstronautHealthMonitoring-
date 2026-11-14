import uuid
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import HealthRecord, Mission, MissionDay
from app.schemas.health_record import (
    HealthRecordCreate,
    HealthSummaryResponse,
    MetricLatestItem,
)


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
            detail="You are not authorized to log health data for another astronaut's mission",
        )
    return mission_day


def create_health_record(
    db: Session,
    user_id: uuid.UUID,
    record_in: HealthRecordCreate,
) -> HealthRecord:
    """Record an astronaut vital sign or health metric."""
    # Verify astronaut ownership of parent mission day
    verify_mission_day_ownership(db=db, mission_day_id=record_in.mission_day_id, user_id=user_id)

    record = HealthRecord(
        mission_day_id=record_in.mission_day_id,
        measurement_type=record_in.measurement_type,
        value=record_in.value,
        unit=record_in.unit,
        recorded_at=record_in.recorded_at,
        source=record_in.source,
        notes=record_in.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_health_records(
    db: Session,
    user_id: uuid.UUID,
    mission_id: Optional[uuid.UUID] = None,
    mission_day_id: Optional[uuid.UUID] = None,
    measurement_type: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[HealthRecord]:
    """Retrieve historical health records for the authenticated astronaut."""
    query = (
        db.query(HealthRecord)
        .join(MissionDay, HealthRecord.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(Mission.user_id == user_id)
    )

    if mission_id:
        query = query.filter(Mission.id == mission_id)
    if mission_day_id:
        query = query.filter(HealthRecord.mission_day_id == mission_day_id)
    if measurement_type:
        query = query.filter(HealthRecord.measurement_type == measurement_type)
    if start_time:
        query = query.filter(HealthRecord.recorded_at >= start_time)
    if end_time:
        query = query.filter(HealthRecord.recorded_at <= end_time)

    # Enforce safe pagination bounds
    safe_limit = min(max(1, limit), 200)
    return query.order_by(HealthRecord.recorded_at.desc()).offset(offset).limit(safe_limit).all()


def get_health_record_by_id(
    db: Session,
    record_id: uuid.UUID,
    user_id: uuid.UUID,
) -> HealthRecord:
    """Retrieve a single health record with ownership verification."""
    record = (
        db.query(HealthRecord)
        .join(MissionDay, HealthRecord.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(HealthRecord.id == record_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health record '{record_id}' not found",
        )
    if record.mission_day.mission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this health record",
        )
    return record


def get_health_summary(
    db: Session,
    user_id: uuid.UUID,
    mission_id: Optional[uuid.UUID] = None,
    mission_day_id: Optional[uuid.UUID] = None,
) -> HealthSummaryResponse:
    """Generate high-level summary cards, latest vitals, and averages."""
    query = (
        db.query(HealthRecord)
        .join(MissionDay, HealthRecord.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(Mission.user_id == user_id)
    )

    if mission_id:
        query = query.filter(Mission.id == mission_id)
    if mission_day_id:
        query = query.filter(HealthRecord.mission_day_id == mission_day_id)

    records = query.order_by(HealthRecord.recorded_at.desc()).all()

    latest_metrics: Dict[str, MetricLatestItem] = {}
    metric_sums: Dict[str, float] = {}
    metric_counts: Dict[str, int] = {}

    for rec in records:
        m_type = rec.measurement_type
        # First encounter is the latest because of desc order
        if m_type not in latest_metrics:
            latest_metrics[m_type] = MetricLatestItem(
                measurement_type=rec.measurement_type,
                value=float(rec.value),
                unit=rec.unit,
                recorded_at=rec.recorded_at,
                source=rec.source,
            )

        metric_sums[m_type] = metric_sums.get(m_type, 0.0) + float(rec.value)
        metric_counts[m_type] = metric_counts.get(m_type, 0) + 1

    daily_averages: Dict[str, float] = {}
    for m_type, total in metric_sums.items():
        daily_averages[m_type] = round(total / metric_counts[m_type], 2)

    return HealthSummaryResponse(
        total_records=len(records),
        latest_metrics=latest_metrics,
        daily_averages=daily_averages,
    )

