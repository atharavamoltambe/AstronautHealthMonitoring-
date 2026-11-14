from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ProfileCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=255)


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    email: str | None = Field(
        default=None,
        max_length=255,
    )


class ProfileResponse(BaseModel):
    id: UUID
    display_name: str
    email: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
