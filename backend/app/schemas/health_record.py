from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

MeasurementType = Literal[
    "heart_rate",
    "oxygen_saturation",
    "body_temperature",
    "sleep_duration",
    "water_intake",
    "exercise_duration",
]

MeasurementSource = Literal["manual", "device", "imported"]

# Mapping of valid units to measurement types
VALID_UNITS = {
    "heart_rate": "bpm",
    "oxygen_saturation": "%",
    "body_temperature": "°C",
    "sleep_duration": "hours",
    "water_intake": "mL",
    "exercise_duration": "minutes",
}


class HealthRecordCreate(BaseModel):
    mission_day_id: UUID
    measurement_type: MeasurementType
    value: float = Field(ge=0, description="Measured numerical value")
    unit: Literal["bpm", "%", "°C", "hours", "mL", "minutes"]
    recorded_at: datetime
    source: MeasurementSource = "manual"
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_unit_and_bounds(self):
        expected_unit = VALID_UNITS.get(self.measurement_type)
        if self.unit != expected_unit:
            raise ValueError(
                f"Unit '{self.unit}' is invalid for measurement_type '{self.measurement_type}'. Expected '{expected_unit}'."
            )
        if self.measurement_type == "oxygen_saturation" and self.value > 100:
            raise ValueError("Oxygen saturation (%) cannot exceed 100%.")
        return self


class HealthRecordResponse(BaseModel):
    id: UUID
    mission_day_id: UUID
    measurement_type: MeasurementType
    value: float
    unit: str
    recorded_at: datetime
    source: MeasurementSource
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MetricLatestItem(BaseModel):
    measurement_type: MeasurementType
    value: float
    unit: str
    recorded_at: datetime
    source: str


class HealthSummaryResponse(BaseModel):
    total_records: int
    latest_metrics: Dict[str, MetricLatestItem]
    daily_averages: Dict[str, float]
