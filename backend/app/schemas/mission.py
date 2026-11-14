from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

MissionStatus = Literal[
    "planned",
    "active",
    "completed",
    "cancelled",
]


class MissionCreate(BaseModel):
    user_id: UUID | None = None
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    start_date: date
    end_date: date | None = None
    status: MissionStatus = "planned"

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class MissionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: MissionStatus | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError("end_date cannot be before start_date")
        return self


class MissionResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    start_date: date
    end_date: date | None
    status: MissionStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

