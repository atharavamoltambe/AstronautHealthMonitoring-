from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class MissionDayCreate(BaseModel):
    mission_id: UUID
    day_number: int = Field(gt=0)
    mission_date: date


class MissionDayResponse(BaseModel):
    id: UUID
    mission_id: UUID
    day_number: int
    mission_date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Backwards compatibility aliases
MissonDayCreate = MissionDayCreate
MissonDayResponse = MissionDayResponse

