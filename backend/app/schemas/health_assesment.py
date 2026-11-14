"""Backwards compatibility alias for health_assessment.py."""
from app.schemas.health_assessment import (
    AssessmentResult,
    HealthAssessmentCreate,
    HealthAssessmentResponse,
)

__all__ = [
    "AssessmentResult",
    "HealthAssessmentCreate",
    "HealthAssessmentResponse",
]
