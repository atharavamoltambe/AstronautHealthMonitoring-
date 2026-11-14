
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SymptomLogCreate(BaseModel):
    mission_day_id: UUID
    symptom_type: str = Field(min_length=1, max_length=100)
    severity: int = Field(ge=1, le=5)
    notes: str | None = None
    recorded_at: datetime


class SymptomLogResponse(BaseModel):
    id: UUID
    mission_day_id: UUID
    symptom_type: str
    severity: int
    notes: str | None
    recorded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
