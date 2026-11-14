from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

AssessmentResult = Literal[
    "no_flag",
    "review_recommended",
    "insufficient_data",
]


class HealthAssessmentCreate(BaseModel):
    mission_day_id: UUID
    assessment_type: str = Field(min_length=1, max_length=50)
    result: AssessmentResult
    details: dict[str, Any] = Field(default_factory=dict)


class HealthAssessmentResponse(BaseModel):
    id: UUID
    mission_day_id: UUID
    assessment_type: str
    result: AssessmentResult
    details: dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

