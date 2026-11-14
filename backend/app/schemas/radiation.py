import uuid
from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class RadiationMetrics(BaseModel):
    """Real-time and cumulative radiation dosimetry metrics."""
    hourly_rate_msv: float = Field(
        ...,
        description="Current ambient ionizing radiation dose rate in millisieverts per hour (mSv/hr)."
    )
    daily_projected_msv: float = Field(
        ...,
        description="Projected 24-hour ionizing radiation intake at current rate (mSv/day)."
    )
    cumulative_30d_msv: float = Field(
        ...,
        description="Cumulative 30-day biological dose equivalent in millisieverts."
    )
    cumulative_1yr_msv: float = Field(
        ...,
        description="Cumulative 1-year (annual) dose equivalent in millisieverts."
    )
    cumulative_career_msv: float = Field(
        ...,
        description="Cumulative lifetime career dose equivalent in millisieverts."
    )
    background_gcr_rate_msv_day: float = Field(
        1.80,
        description="Nominal Galactic Cosmic Ray (GCR) background flux rate (mSv/day)."
    )


class RadiationCompliance(BaseModel):
    """NASA-STD-3001 biological exposure limits and percentage thresholds."""
    limit_30d_msv: float = Field(
        250.0,
        description="Official NASA-STD-3001 30-day cumulative career limit (250 mSv)."
    )
    limit_1yr_msv: float = Field(
        500.0,
        description="Official NASA-STD-3001 1-year annual limit (500 mSv)."
    )
    limit_career_msv: float = Field(
        600.0,
        description="Official NASA Artemis baseline career safe exposure ceiling (600 mSv)."
    )
    pct_30d_used: float = Field(..., description="Percentage of 30-day limit consumed (0-100%).")
    pct_1yr_used: float = Field(..., description="Percentage of 1-year limit consumed (0-100%).")
    pct_career_used: float = Field(..., description="Percentage of career ceiling consumed (0-100%).")
    status_level: str = Field(
        ...,
        description="Current operational status: NOMINAL, ELEVATED, or CRITICAL_SPE."
    )
    safe_days_remaining: int = Field(
        ...,
        description="Estimated operational days remaining before reaching 30-day NASA ceiling at current flux."
    )


class RadiationStatusResponse(BaseModel):
    """Complete radiation dosimeter state and spacecraft shielding telemetry."""
    mission_day_id: uuid.UUID
    mission_id: uuid.UUID
    day_number: int
    storm_active: bool = Field(False, description="Whether an active Solar Particle Event is underway.")
    active_storm_class: Optional[str] = Field(None, description="Active flare classification, e.g. Class X4.2.")
    shielding_status: str = Field(
        "Polyethylene Bulkheads + Water-Wall Storm Shielding Active (-45% GCR flux)",
        description="Spacecraft environmental passive radiation mitigation status."
    )
    metrics: RadiationMetrics
    compliance: RadiationCompliance
    operational_advisory: str = Field(
        ...,
        description="Aerospace medicine operational advisory under NASA-STD-3001."
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SPESimulateRequest(BaseModel):
    """Payload to trigger an onboard Solar Particle Event / Coronal Mass Ejection emergency."""
    mission_day_id: uuid.UUID
    storm_class: str = Field("Class X4.2 Solar Flare", description="Solar storm classification.")
    flux_rate_msv_hr: float = Field(
        28.5,
        ge=5.0,
        le=150.0,
        description="Peak instantaneous radiation flux in mSv/hr (normal is ~0.075 mSv/hr)."
    )
    notes: Optional[str] = Field(
        None,
        description="Optional astronaut or mission control operational notes."
    )


class SPESimulateResponse(BaseModel):
    """Response returned when an SPE emergency simulation is executed."""
    event_id: str
    storm_class: str
    peak_flux_msv_hr: float
    flux_multiplier_over_baseline: float
    status: str = "CRITICAL_RADIATION_ALARM"
    ai_emergency_briefing: str = Field(
        ...,
        description="Autonomous LLM synthesized operational clinical briefing."
    )
    ai_provider: str = Field("local_edge_llm", description="LLM provider or rule fallback.")
    countermeasures_deployed: List[str] = Field(
        ...,
        description="List of life-saving radiation countermeasure tasks injected into daily checklist."
    )
    deployed_checklist_items_count: int
    assessment_id: Optional[uuid.UUID] = None
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
