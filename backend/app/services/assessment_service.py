import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import (
    DailyChecklist,
    HealthAssessment,
    HealthRecord,
    Mission,
    MissionDay,
    SymptomLog,
)
from app.schemas.health_assessment import HealthAssessmentCreate
from app.services.ai_engine import synthesize_with_local_llm
from app.services.rules_engine import NASADecisionEngine


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
            detail="You are not authorized to access health assessments for another astronaut's mission",
        )
    return mission_day


def generate_day_assessment(
    db: Session,
    mission_day_id: uuid.UUID,
    user_id: uuid.UUID,
    assessment_type: str = "nasa_flight_rules_evaluation",
) -> HealthAssessment:
    """Evaluate telemetry for a flight day using the official NASA decision engine and save the record."""
    verify_mission_day_ownership(db=db, mission_day_id=mission_day_id, user_id=user_id)

    # Fetch daily telemetry
    records = db.query(HealthRecord).filter(HealthRecord.mission_day_id == mission_day_id).all()
    symptoms = db.query(SymptomLog).filter(SymptomLog.mission_day_id == mission_day_id).all()
    tasks = db.query(DailyChecklist).filter(DailyChecklist.mission_day_id == mission_day_id).all()

    # Run deterministic NASA-STD-3001 evaluation
    evaluation = NASADecisionEngine.evaluate_day(
        health_records=records,
        symptom_logs=symptoms,
        checklist_items=tasks,
    )

    # Enhance evaluation with Local Edge LLM synthesis (Gemma / Llama via Ollama)
    ai_result = synthesize_with_local_llm(
        result=evaluation["result"],
        flags=evaluation["details"].get("flags", []),
        telemetry_evaluated=evaluation["details"].get("telemetry_evaluated", {}),
        rule_countermeasures=evaluation["details"].get("countermeasures", []),
    )
    if ai_result:
        evaluation["details"]["ai_summary"] = ai_result.get("ai_summary")
        evaluation["details"]["ai_model"] = ai_result.get("ai_model")
        evaluation["details"]["ai_provider"] = ai_result.get("ai_provider")

    assessment = HealthAssessment(
        mission_day_id=mission_day_id,
        assessment_type=assessment_type,
        result=evaluation["result"],
        details=evaluation["details"],
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def create_health_assessment(
    db: Session,
    user_id: uuid.UUID,
    assessment_in: HealthAssessmentCreate,
) -> HealthAssessment:
    """Explicitly save a health assessment record."""
    verify_mission_day_ownership(db=db, mission_day_id=assessment_in.mission_day_id, user_id=user_id)

    assessment = HealthAssessment(
        mission_day_id=assessment_in.mission_day_id,
        assessment_type=assessment_in.assessment_type,
        result=assessment_in.result,
        details=assessment_in.details,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def get_health_assessments(
    db: Session,
    user_id: uuid.UUID,
    mission_id: Optional[uuid.UUID] = None,
    mission_day_id: Optional[uuid.UUID] = None,
    result_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[HealthAssessment]:
    """Retrieve historical health assessments for the authenticated astronaut."""
    query = (
        db.query(HealthAssessment)
        .join(MissionDay, HealthAssessment.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(Mission.user_id == user_id)
    )

    if mission_id:
        query = query.filter(Mission.id == mission_id)
    if mission_day_id:
        query = query.filter(HealthAssessment.mission_day_id == mission_day_id)
    if result_filter:
        query = query.filter(HealthAssessment.result == result_filter)

    safe_limit = min(max(1, limit), 200)
    return query.order_by(HealthAssessment.created_at.desc()).offset(offset).limit(safe_limit).all()


def get_health_assessment_by_id(
    db: Session,
    assessment_id: uuid.UUID,
    user_id: uuid.UUID,
) -> HealthAssessment:
    """Retrieve a single assessment record by UUID."""
    assessment = (
        db.query(HealthAssessment)
        .join(MissionDay, HealthAssessment.mission_day_id == MissionDay.id)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(HealthAssessment.id == assessment_id)
        .first()
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health assessment '{assessment_id}' not found",
        )
    if assessment.mission_day.mission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this health assessment",
        )
    return assessment

