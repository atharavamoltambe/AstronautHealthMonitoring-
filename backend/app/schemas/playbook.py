import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DrugInfo(BaseModel):
    name: str = Field(..., description="Generic pharmaceutical name")
    brand_name: Optional[str] = Field(None, description="Common commercial/space brand")
    drug_class: str = Field(..., description="Pharmacological class")
    primary_indication: str = Field(..., description="What this drug treats")
    mechanism_of_action: str = Field(..., description="How the drug acts biochemically")
    route: str = Field(..., description="Route of administration (e.g. Oral, IM, Sublingual, Ophthalmic)")
    standard_dose: str = Field(..., description="Nominal adult dose")
    calculated_dose: str = Field(..., description="Patient weight/vital-adjusted dose")
    max_24h_limit: str = Field(..., description="Maximum allowable dose in 24 hours")
    microgravity_advisory: str = Field(..., description="Special physiological considerations in microgravity")
    kit_location: str = Field(..., description="Physical onboard stowage tray/drawer location")


class EmergencyProtocol(BaseModel):
    condition_key: str = Field(..., description="Unique machine identifier for condition")
    title: str = Field(..., description="Clinical condition title")
    nasa_code: str = Field(..., description="NASA aerospace medical protocol reference code")
    category: str = Field(..., description="Medical subspecialty (e.g. Neuro-vestibular, Toxicology, Trauma)")
    urgency_tier: str = Field(..., description="Urgency level (e.g. CRITICAL - IMMEDIATE ACTION, URGENT)")
    description: str = Field(..., description="Clinical presentation and pathophysiology")
    primary_drug: DrugInfo = Field(..., description="First-line pharmacotherapy recommendation")
    secondary_drug: Optional[DrugInfo] = Field(None, description="Second-line or co-administered medication")
    clinical_action_steps: List[str] = Field(..., description="Sequential clinical procedure steps for CMO")
    safety_contraindications: List[str] = Field(..., description="Critical contraindications and risks")


class PlaybookDeployRequest(BaseModel):
    mission_day_id: uuid.UUID = Field(..., description="Active flight day ID")
    condition_key: str = Field(..., description="Condition key to execute")
    severity: int = Field(default=4, ge=1, le=5, description="Severity score 1-5")
    notes: Optional[str] = Field(None, description="Optional CMO diagnostic observation")


class PlaybookDeployResponse(BaseModel):
    condition_key: str
    protocol_title: str
    nasa_code: str
    recommended_medication: DrugInfo
    deployed_tasks_count: int
    deployed_tasks: List[str]
    deployed_at: datetime
    execution_status: str

