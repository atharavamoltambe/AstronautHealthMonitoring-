import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import UserProfile
from app.db.session import get_db
from app.schemas.radiation import (
    RadiationStatusResponse,
    SPESimulateRequest,
    SPESimulateResponse,
)
from app.services.radiation_service import RadiationService

router = APIRouter(prefix="/radiation", tags=["Radiation Dosimetry & Solar Particle Events"])


@router.get(
    "/status",
    response_model=RadiationStatusResponse,
    summary="Get live radiation dosimeter metrics and NASA-STD-3001 limits",
)
@router.get(
    "/status/",
    response_model=RadiationStatusResponse,
    include_in_schema=False,
)
def get_radiation_status(
    mission_day_id: uuid.UUID = Query(..., description="Active flight day ID"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RadiationStatusResponse:
    """Retrieve real-time ambient flux, projected 24h intake, cumulative 30-day/1-year doses,
    and NASA-STD-3001 compliance percentages.
    """
    return RadiationService.get_radiation_status(db=db, mission_day_id=mission_day_id)


@router.post(
    "/simulate-spe",
    response_model=SPESimulateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Simulate Coronal Mass Ejection / SPE, query LLM, and inject countermeasures",
)
@router.post(
    "/simulate-spe/",
    response_model=SPESimulateResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def simulate_solar_particle_event(
    request: SPESimulateRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SPESimulateResponse:
    """Simulates an acute spaceflight radiation emergency:
    
    1. Spikes ionizing radiation flux to severe levels (>25 mSv/hr).
    2. Dispatches an urgent prompt to the Local Edge LLM (Google Gemma / Meta Llama).
    3. Records a CRITICAL HealthAssessment in the database with the LLM analysis.
    4. Immediately injects high-priority radiation shelter tasks into the astronaut's Daily Flight Checklist.
    """
    return RadiationService.simulate_spe(db=db, request=request)


@router.post(
    "/reset",
    summary="Reset simulated solar storm back to nominal background GCR flux",
)
@router.post(
    "/reset/",
    include_in_schema=False,
)
def reset_solar_particle_event(
    mission_day_id: uuid.UUID = Query(..., description="Active flight day ID"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Clears any active simulated Solar Particle Event and restores nominal background GCR levels."""
    return RadiationService.reset_spe(db=db, mission_day_id=mission_day_id)
