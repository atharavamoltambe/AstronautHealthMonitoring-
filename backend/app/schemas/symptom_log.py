
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class SymptomLogCreate(BaseModel):
    mission_day_id: UUID
    symptom_type: str = Field(min_length=1, max_length=100)
    severity: int = Field(ge=1, le=5)
    notes: str | None = None
    recorded_at: datetime | None = None
    reported_at: datetime | None = None

    @model_validator(mode="after")
    def validate_timestamp(self):
        if not self.recorded_at and not self.reported_at:
            self.recorded_at = datetime.utcnow()
        elif not self.recorded_at and self.reported_at:
            self.recorded_at = self.reported_at
        return self


class SymptomLogResponse(BaseModel):
    id: UUID
    mission_day_id: UUID
    symptom_type: str
    severity: int
    notes: str | None
    recorded_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
