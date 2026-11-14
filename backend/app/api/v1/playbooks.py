from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import UserProfile
from app.db.session import get_db
from app.schemas.playbook import (
    EmergencyProtocol,
    PlaybookDeployRequest,
    PlaybookDeployResponse,
)
from app.services import playbook_service

router = APIRouter(prefix="/playbooks", tags=["Spaceflight Emergency CMO Playbooks"])


@router.get(
    "",
    response_model=List[EmergencyProtocol],
    summary="Get NASA emergency clinical playbooks & drug formulary",
)
def list_emergency_playbooks(
    astronaut_weight: float = Query(75.0, ge=30.0, le=200.0, description="Astronaut body weight in kg for dosage scaling"),
    current_user: UserProfile = Depends(get_current_user),
) -> List[EmergencyProtocol]:
    """Retrieves all 5 critical spaceflight emergency protocols.

    Includes full pharmacological formulary, NASA aerospace medical reference codes,
    calculated patient-specific drug dosages, and physical onboard kit locations.
    """
    return playbook_service.get_emergency_catalog(astronaut_weight=astronaut_weight)


@router.get(
    "/{condition_key}",
    response_model=EmergencyProtocol,
    summary="Get detailed emergency clinical playbook by condition key",
)
def get_emergency_playbook(
    condition_key: str,
    astronaut_weight: float = Query(75.0, ge=30.0, le=200.0, description="Astronaut body weight in kg"),
    current_user: UserProfile = Depends(get_current_user),
) -> EmergencyProtocol:
    """Retrieve full clinical protocol and drug formulary for a single emergency condition."""
    return playbook_service.get_single_protocol(condition_key=condition_key, astronaut_weight=astronaut_weight)


@router.post(
    "/deploy",
    response_model=PlaybookDeployResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Deploy emergency clinical protocol directly to active flight checklist",
)
def deploy_playbook(
    deploy_request: PlaybookDeployRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlaybookDeployResponse:
    """Execute autonomous emergency clinical deployment:

    1. Resolves patient-specific drug dosage & kit stowage location.
    2. Converts ordered procedural steps into prioritized actionable tasks.
    3. Injects them directly into the astronaut's active Daily Flight Checklist.
    """
    return playbook_service.deploy_emergency_playbook(
        db=db,
        user_id=current_user.id,
        request=deploy_request,
    )
