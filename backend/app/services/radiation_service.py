import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import httpx

from app.core.config import settings
from app.db.models import DailyChecklist, HealthAssessment, Mission, MissionDay
from app.schemas.radiation import (
    RadiationCompliance,
    RadiationMetrics,
    RadiationStatusResponse,
    SPESimulateRequest,
    SPESimulateResponse,
)

logger = logging.getLogger("novaguard.radiation")

# In-memory store for active simulated solar storm events keyed by mission_day_id
ACTIVE_SPE_STORMS: Dict[uuid.UUID, Dict[str, Any]] = {}

# Baseline spaceflight cosmic radiation constants (NASA-STD-3001)
NOMINAL_GCR_HOURLY_MSV = 0.075       # ~1.8 mSv/day (standard deep-space GCR flux)
NOMINAL_GCR_DAILY_MSV = 1.80
NASA_LIMIT_30D_MSV = 250.0
NASA_LIMIT_1YR_MSV = 500.0
NASA_LIMIT_CAREER_MSV = 600.0

SPE_CRITICAL_TASKS = [
    "[CRITICAL SPE] Immediate crew retreat to Central Water-Shielded Storm Shelter.",
    "[CRITICAL SPE] Abort active EVAs; depressurize and seal airlock bulkheads.",
    "[CRITICAL SPE] Mount Personal Dosimeters (BPD & CPD) to shelter sensor brackets.",
    "[CRITICAL SPE] Administer oral radioprotective countermeasure (Amifostine/Antioxidant pack).",
]


class RadiationService:
    """Aerospace Radiation Dosimetry & Solar Particle Event Decision Support Engine."""

    @staticmethod
    def get_radiation_status(
        db: Session,
        mission_day_id: uuid.UUID,
    ) -> RadiationStatusResponse:
        """Calculate live and cumulative radiation dosimetry against NASA-STD-3001 limits."""
        day = db.query(MissionDay).filter(MissionDay.id == mission_day_id).first()
        if not day:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mission day '{mission_day_id}' not found",
            )

        day_num = max(1, day.day_number)
        active_spe = ACTIVE_SPE_STORMS.get(mission_day_id)

        if active_spe:
            hourly_rate = active_spe["flux_rate_msv_hr"]
            daily_projected = hourly_rate * 24.0
            status_level = "CRITICAL_SPE"
            operational_advisory = (
                f"CRITICAL WARNING: Active {active_spe['storm_class']} underway. "
                f"Ambient flux exceeds nominal baseline by {round(hourly_rate / NOMINAL_GCR_HOURLY_MSV, 1)}x. "
                "Crew MUST remain in central water-shielded storm shelter."
            )
        else:
            hourly_rate = NOMINAL_GCR_HOURLY_MSV
            daily_projected = NOMINAL_GCR_DAILY_MSV
            status_level = "NOMINAL"
            operational_advisory = (
                "Nominal Galactic Cosmic Ray (GCR) exposure levels detected. "
                "Passive spacecraft water-wall and polyethylene shielding active. "
                "All parameters within NASA-STD-3001 safe thresholds."
            )

        # Realistic spaceflight accumulation based on flight day and prior mission legs
        cum_30d = round(12.4 + (day_num * NOMINAL_GCR_DAILY_MSV), 2)
        cum_1yr = round(84.2 + (day_num * NOMINAL_GCR_DAILY_MSV), 2)
        cum_career = round(214.5 + (day_num * NOMINAL_GCR_DAILY_MSV), 2)

        # If a storm was simulated, add the acute dose increment
        if active_spe:
            acute_dose = round(hourly_rate * 1.5, 2)
            cum_30d += acute_dose
            cum_1yr += acute_dose
            cum_career += acute_dose

        pct_30d = round((cum_30d / NASA_LIMIT_30D_MSV) * 100.0, 1)
        pct_1yr = round((cum_1yr / NASA_LIMIT_1YR_MSV) * 100.0, 1)
        pct_career = round((cum_career / NASA_LIMIT_CAREER_MSV) * 100.0, 1)

        safe_days_rem = max(0, int((NASA_LIMIT_30D_MSV - cum_30d) / max(daily_projected, 0.01)))

        return RadiationStatusResponse(
            mission_day_id=day.id,
            mission_id=day.mission_id,
            day_number=day.day_number,
            storm_active=bool(active_spe),
            active_storm_class=active_spe["storm_class"] if active_spe else None,
            shielding_status="Polyethylene Bulkheads + Water-Wall Storm Shielding Active (-45% GCR flux)",
            metrics=RadiationMetrics(
                hourly_rate_msv=round(hourly_rate, 3),
                daily_projected_msv=round(daily_projected, 2),
                cumulative_30d_msv=cum_30d,
                cumulative_1yr_msv=cum_1yr,
                cumulative_career_msv=cum_career,
                background_gcr_rate_msv_day=NOMINAL_GCR_DAILY_MSV,
            ),
            compliance=RadiationCompliance(
                limit_30d_msv=NASA_LIMIT_30D_MSV,
                limit_1yr_msv=NASA_LIMIT_1YR_MSV,
                limit_career_msv=NASA_LIMIT_CAREER_MSV,
                pct_30d_used=pct_30d,
                pct_1yr_used=pct_1yr,
                pct_career_used=pct_career,
                status_level=status_level,
                safe_days_remaining=safe_days_rem,
            ),
            operational_advisory=operational_advisory,
            timestamp=datetime.now(timezone.utc),
        )

    @staticmethod
    def simulate_spe(
        db: Session,
        request: SPESimulateRequest,
    ) -> SPESimulateResponse:
        """Trigger an SPE event: Spikes flux, queries Local LLM, logs Assessment, and injects tasks into Checklist."""
        day = db.query(MissionDay).filter(MissionDay.id == request.mission_day_id).first()
        if not day:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mission day '{request.mission_day_id}' not found",
            )

        # 1. Register active storm state
        ACTIVE_SPE_STORMS[request.mission_day_id] = {
            "storm_class": request.storm_class,
            "flux_rate_msv_hr": request.flux_rate_msv_hr,
            "started_at": datetime.now(timezone.utc),
            "notes": request.notes,
        }

        multiplier = round(request.flux_rate_msv_hr / NOMINAL_GCR_HOURLY_MSV, 1)

        # 2. Local Edge LLM Synthesis (Ollama or Spaceflight Graceful Fallback)
        ai_briefing, ai_provider = RadiationService._synthesize_spe_briefing(
            storm_class=request.storm_class,
            flux_rate=request.flux_rate_msv_hr,
            multiplier=multiplier,
            notes=request.notes,
        )

        # 3. Create a HealthAssessment in the database
        assessment = HealthAssessment(
            mission_day_id=request.mission_day_id,
            assessment_type="radiation_spe_emergency",
            result="review_recommended",
            details={
                "event": "Solar Particle Event (Coronal Mass Ejection)",
                "storm_class": request.storm_class,
                "peak_flux_msv_hr": request.flux_rate_msv_hr,
                "baseline_multiplier": f"{multiplier}x nominal",
                "severity_level": "CRITICAL",
                "ai_summary": ai_briefing,
                "ai_provider": ai_provider,
                "countermeasures": SPE_CRITICAL_TASKS,
                "triggered_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # 4. Immediate Checklist Injection with Duplicate Prevention
        deployed_tasks: List[str] = []
        for task_text in SPE_CRITICAL_TASKS:
            task_clean = task_text[:145]
            existing = (
                db.query(DailyChecklist)
                .filter(
                    DailyChecklist.mission_day_id == request.mission_day_id,
                    DailyChecklist.task_name == task_clean,
                )
                .first()
            )
            if not existing:
                new_task = DailyChecklist(
                    mission_day_id=request.mission_day_id,
                    task_name=task_clean,
                    is_completed=False,
                    completed_at=None,
                )
                db.add(new_task)
                deployed_tasks.append(task_clean)

        db.commit()

        return SPESimulateResponse(
            event_id=f"SPE-{uuid.uuid4().hex[:8].upper()}",
            storm_class=request.storm_class,
            peak_flux_msv_hr=request.flux_rate_msv_hr,
            flux_multiplier_over_baseline=multiplier,
            status="CRITICAL_RADIATION_ALARM",
            ai_emergency_briefing=ai_briefing,
            ai_provider=ai_provider,
            countermeasures_deployed=SPE_CRITICAL_TASKS,
            deployed_checklist_items_count=len(deployed_tasks),
            assessment_id=assessment.id,
            triggered_at=datetime.now(timezone.utc),
        )

    @staticmethod
    def reset_spe(
        db: Session,
        mission_day_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """Clear active simulated solar storm and return dosimeter to nominal baseline."""
        if mission_day_id in ACTIVE_SPE_STORMS:
            del ACTIVE_SPE_STORMS[mission_day_id]

        return {
            "status": "RESET_SUCCESSFUL",
            "message": "Solar storm simulation cleared. Dosimeter returned to nominal GCR background flux (0.075 mSv/hr).",
            "mission_day_id": str(mission_day_id),
        }

    @staticmethod
    def _synthesize_spe_briefing(
        storm_class: str,
        flux_rate: float,
        multiplier: float,
        notes: Optional[str],
    ) -> tuple[str, str]:
        """Query Local Edge LLM or return NASA Aerospace Medicine Clinical Briefing."""
        prompt = (
            f"URGENT SPACE SURGEON ALERT: A {storm_class} has struck the spacecraft. "
            f"Ambient radiation dosimeters read {flux_rate} mSv/hr, which is {multiplier} times nominal background. "
            f"Operational notes: {notes or 'No external warning from ground control'}.\n"
            "Provide a calm, 2-3 sentence emergency operational briefing to the crew explaining the acute biological risk "
            "(Acute Radiation Syndrome, DNA double-strand breaks) and mandating immediate storm shelter retreat."
        )

        if settings.LOCAL_LLM_ENABLED:
            try:
                with httpx.Client(timeout=float(settings.LOCAL_LLM_TIMEOUT)) as client:
                    target_model = settings.LOCAL_LLM_MODEL
                    try:
                        resp_tags = client.get(f"{settings.LOCAL_LLM_URL}/api/tags", timeout=2.0)
                        if resp_tags.status_code == 200:
                            avail = [m.get("name", "") for m in resp_tags.json().get("models", [])]
                            if target_model not in avail:
                                if any("llama" in m for m in avail):
                                    target_model = next((m for m in avail if "llama" in m), target_model)
                                elif avail:
                                    target_model = avail[0]
                    except Exception:
                        pass

                    resp = client.post(
                        f"{settings.LOCAL_LLM_URL}/api/generate",
                        json={
                            "model": target_model,
                            "prompt": prompt,
                            "system": (
                                "You are NovaGuard Medical AI, an autonomous flight surgeon under NASA-STD-3001. "
                                "Synthesize a calm, authoritative, emergency aerospace briefing."
                            ),
                            "stream": False,
                            "options": {"temperature": 0.2, "num_predict": 180},
                        },
                    )
                    if resp.status_code == 200:
                        text = resp.json().get("response", "").strip()
                        if text:
                            return text, "local_edge_llm"
            except Exception as e:
                logger.info(f"Ollama local LLM unavailable ({type(e).__name__}). Using NASA CMO Flight Surgeon synthesis.")

        # High-fidelity NASA CMO aerospace medicine synthesis fallback
        fallback_briefing = (
            f"CRITICAL RADIATION ALERT: Ambient ionizing flux has spiked to {flux_rate} mSv/hr ({multiplier}x baseline) "
            f"due to a severe {storm_class}. Immediate biological risk of Acute Radiation Syndrome (ARS) and hematopoietic "
            "tissue injury. All crew must abort active operations, secure airlocks, and retreat to the central "
            "water-shielded storm shelter immediately."
        )
        return fallback_briefing, "nasa_cmo_aerospace_synthesis"
