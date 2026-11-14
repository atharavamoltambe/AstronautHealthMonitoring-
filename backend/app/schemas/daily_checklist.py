
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DailyChecklistCreate(BaseModel):
    mission_day_id: UUID
    task_name: str = Field(min_length=1, max_length=150)


class DailyChecklistUpdate(BaseModel):
    is_completed: bool


class DailyChecklistResponse(BaseModel):
    id: UUID
    mission_day_id: UUID
    task_name: str
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
