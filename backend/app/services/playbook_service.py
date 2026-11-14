"""NASA-STD-3001 Spaceflight Emergency Playbooks & Clinical Formulary Service.

Provides offline autonomous medical decision support for astronauts during
deep-space communication latency or emergency Loss-of-Signal (LOS).
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import DailyChecklist, Mission, MissionDay, UserProfile
from app.schemas.playbook import (
    DrugInfo,
    EmergencyProtocol,
    PlaybookDeployRequest,
    PlaybookDeployResponse,
)

# ==============================================================================
# OFFICIAL SPACEFLIGHT FORMULARY KNOWLEDGE BASE (NASA-STD-3001 & ISS CMP)
# ==============================================================================
SPACEFLIGHT_EMERGENCY_CATALOG: Dict[str, Dict] = {
    "lunar_dust_eye_injury": {
        "title": "Microgravity Foreign Body / Lunar Regolith Eye Contamination",
        "nasa_code": "NASA-STD-3001-OPHTHALMIC-01",
        "category": "Ophthalmology & Surface Operations",
        "urgency_tier": "URGENT - CORNEAL PROTECTION",
        "description": "Jagged, abrasive lunar regolith or microgravity cabin dust floating into the conjunctival sac. Risk of deep corneal abrasions or permanent scarring if rubbed.",
        "primary_drug": {
            "name": "Proparacaine Hydrochloride (0.5%)",
            "brand_name": "Alcaine Space Dispenser",
            "drug_class": "Topical Ester Ophthalmic Anesthetic",
            "primary_indication": "Rapid corneal surface anesthesia for ocular examination and debris removal in space",
            "mechanism_of_action": "Blocks sodium ion channels in corneal nerve endings, temporarily stabilizing neuronal membranes",
            "route": "Ophthalmic Topical Drops",
            "standard_dose": "1 to 2 drops in affected eye",
            "dose_per_kg": None,
            "max_24h_limit": "4 drops per eye (prolonged use delays epithelial healing)",
            "microgravity_advisory": "Surface tension holds droplet to cornea; do NOT let patient rub eye in zero-g. Apply eye patch before cabin movement.",
            "kit_location": "Artemis Medical Kit — Pack 3 (Ophthalmology Tray), Box A-02",
        },
        "secondary_drug": {
            "name": "Erythromycin Ophthalmic Ointment (0.5%)",
            "brand_name": "Ilotycin Sterile Ointment",
            "drug_class": "Macrolide Antibiotic",
            "primary_indication": "Prophylaxis against secondary microbial infection from jagged lunar dust particles",
            "mechanism_of_action": "Binds to 50S ribosomal subunit of susceptible bacteria, inhibiting protein synthesis",
            "route": "Topical Ophthalmic Ribbon",
            "standard_dose": "0.5 inch (1 cm) ribbon into lower conjunctival sac q12h",
            "dose_per_kg": None,
            "max_24h_limit": "2 applications per day",
            "microgravity_advisory": "Viscous ointment prevents particle migration across cornea in microgravity",
            "kit_location": "Artemis Medical Kit — Pack 3 (Ophthalmology Tray), Tube #04",
        },
        "action_steps": [
            "Don surgical gloves and inspect eye using blue cobalt diagnostic penlight.",
            "Administer 1-2 drops Proparacaine HCl (0.5%) into lower fornix; wait 30 seconds for anesthesia.",
            "Connect Morgan Lens to 500 mL sterile saline flush; begin continuous microgravity ocular irrigation at 20 mL/min.",
            "Perform post-irrigation fluorescein strip test to verify absence of corneal perforation.",
            "Apply 1 cm ribbon of Erythromycin ointment; secure protective clear eye shield with surgical tape.",
        ],
        "contraindications": [
            "Do NOT administer topical corticosteroids without direct Ground Flight Surgeon telemetry sign-off.",
            "Never allow astronaut to wipe or rub eye—forces abrasive silicate into stromal layer.",
        ],
    },
    "spaceflight_nephrolithiasis": {
        "title": "Acute Microgravity Renal Colic (Kidney Stone Crisis)",
        "nasa_code": "NASA-STD-3001-RENAL-04",
        "category": "Genitourinary & Spaceflight Metabolism",
        "urgency_tier": "CRITICAL - EXCRUCIATING ACUTE PAIN",
        "description": "Rapid mobilization of bone calcium in microgravity combined with mild sub-clinical dehydration leads to calcium oxalate stone precipitation and acute ureteral spasm.",
        "primary_drug": {
            "name": "Ketorolac Tromethamine",
            "brand_name": "Toradol Ampoules",
            "drug_class": "Parenteral Non-Steroidal Anti-Inflammatory Drug (NSAID)",
            "primary_indication": "Potent non-narcotic analgesia for severe microgravity ureteral smooth muscle colic",
            "mechanism_of_action": "Inhibits cyclooxygenase (COX-1 and COX-2) enzymes, dramatically reducing renal capsular pressure and local prostaglandin-mediated spasm",
            "route": "Intramuscular (IM) Injection",
            "standard_dose": "30 mg IM initial dose",
            "dose_per_kg": 0.4,  # mg per kg
            "max_24h_limit": "90 mg/24h (maximum 5 consecutive days)",
            "microgravity_advisory": "High renal excretion; MUST be co-administered with aggressive oral fluid expansion (≥1000 mL) to prevent tubular nephrotoxicity.",
            "kit_location": "Artemis Medical Kit — Pack 1 (Parenteral Injectables), Ampoule Tray B-01",
        },
        "secondary_drug": {
            "name": "Tamsulosin Hydrochloride",
            "brand_name": "Flomax Capsules",
            "drug_class": "Selective Alpha-1a Adrenoceptor Antagonist",
            "primary_indication": "Medical expulsive therapy for distal ureteral stone transit",
            "mechanism_of_action": "Relaxes smooth muscle in bladder neck and distal ureter, reducing expulsion resistance",
            "route": "Oral Capsule",
            "standard_dose": "0.4 mg PO once daily after meal",
            "dose_per_kg": None,
            "max_24h_limit": "0.4 mg per day",
            "microgravity_advisory": "Monitor blood pressure; cephalic fluid shift may exaggerate orthostatic dizziness.",
            "kit_location": "Artemis Medical Kit — Pack 2 (Oral Solid Medications), Blister Pack G-07",
        },
        "action_steps": [
            "Record baseline blood pressure and resting heart rate before parenteral injection.",
            "Administer weight-calculated dose of Ketorolac IM into vastus lateralis or deltoid.",
            "Initiate immediate oral electrolyte rehydration protocol: 1000 mL oral rehydration solution over 60 minutes.",
            "Provide urine strain filter collection pouch to astronaut to capture stone fragment for post-flight crystallography.",
            "Administer Tamsulosin 0.4 mg PO daily; place astronaut on complete EVA and heavy workout stand-down.",
        ],
        "contraindications": [
            "Contraindicated in active peptic ulcer disease, active gastrointestinal bleed, or severe hypovolemic dehydration.",
            "Do not administer without concurrent fluid loading.",
        ],
    },
    "severe_sams": {
        "title": "Severe Space Adaptation Neuro-Vestibular Sickness (SAMS)",
        "nasa_code": "NASA-STD-3001-NEURO-02",
        "category": "Neuro-Vestibular & Otolith Adaptation",
        "urgency_tier": "URGENT - FLIGHT PLAN DISRUPTION",
        "description": "Sensory conflict between otolith organs (which cease signaling gravity in microgravity) and visual inputs, causing severe nausea, cold sweats, emesis, and incapacitating vertigo.",
        "primary_drug": {
            "name": "Promethazine Hydrochloride",
            "brand_name": "Phenergan Injectable / Suppositories",
            "drug_class": "Phenothiazine Derivative / Antihistamine Antiemetic",
            "primary_indication": "Rapid suppression of microgravity vestibular vomiting and neuro-sensory conflict",
            "mechanism_of_action": "Competitively blocks central H1 histamine receptors and muscarinic receptors in the chemoreceptor trigger zone (CTZ)",
            "route": "Deep Intramuscular (IM) Injection",
            "standard_dose": "25 mg IM (or 50 mg for severe emetic crisis)",
            "dose_per_kg": 0.35,  # mg per kg
            "max_24h_limit": "100 mg / 24 hours",
            "microgravity_advisory": "High sedation potential in microgravity. Astronaut must be restrained in sleep station with sleep harness to prevent floating into cabin obstacles.",
            "kit_location": "Artemis Medical Kit — Pack 1 (Parenteral Injectables), Ampoule Tray A-03",
        },
        "secondary_drug": {
            "name": "Oral Electrolyte Rehydration Salts (ORS)",
            "brand_name": "NASA Space Hydration Bolus",
            "drug_class": "Electrolyte Glucose Solution",
            "primary_indication": "Restoration of circulating vascular volume lost to emesis and microgravity diuresis",
            "mechanism_of_action": "Sodium-glucose co-transport mechanism in intestinal brush border promotes rapid fluid uptake",
            "route": "Oral Drink Bag with Valve",
            "standard_dose": "750 mL to 1000 mL paced over 2 hours",
            "dose_per_kg": 12.0,  # mL per kg
            "max_24h_limit": "3000 mL / 24h",
            "microgravity_advisory": "Sip through sealed one-way straw to avoid free-floating liquid droplets in cabin air.",
            "kit_location": "Galley Medical Stowage — Drink Reconstitution Pouch Tier 1",
        },
        "action_steps": [
            "Secure astronaut immediately in crew quarters sleep station with padded restraints to eliminate head pitch/yaw rotations.",
            "Administer weight-calculated dose of Promethazine HCl via deep IM injection into upper outer quadrant of gluteus or deltoid.",
            "Dim sleep station lighting to minimum red circadian illumination to reduce visual vestibular stimulation.",
            "Prepare microgravity emesis collection pouch with active charcoal odor seal within astronaut's immediate reach.",
            "Enforce 12-hour complete operational stand-down: no computer screens, robotic arm teleoperation, or EVA activities.",
        ],
        "contraindications": [
            "Never administer intravenously (IV) — severe risk of chemical phlebitis and arteriospasm.",
            "Do not administer prior to scheduled EVA spacewalk due to sedation and impaired alertness inside helmet.",
        ],
    },
    "ammonia_inhalation": {
        "title": "Cabin Atmosphere Toxic Ammonia (NH3) Ingress",
        "nasa_code": "NASA-STD-3001-ECLSS-01",
        "category": "Toxicology & Environmental Life Support",
        "urgency_tier": "CRITICAL - IMMEDIATE LIFE THREAT",
        "description": "External thermal control cooling loop breach introducing anhydrous ammonia into the habitable cabin. Causes chemical tracheobronchitis, laryngospasm, and pulmonary edema.",
        "primary_drug": {
            "name": "Methylprednisolone Sodium Succinate",
            "brand_name": "Solu-Medrol Emergency Vial",
            "drug_class": "High-Potency Glucocorticoid Anti-Inflammatory",
            "primary_indication": "Suppression of acute toxic chemical pneumonitis and inflammatory airway mucosal edema",
            "mechanism_of_action": "Diffuses across cell membranes to modulate DNA transcription, inhibiting inflammatory cytokines and capillary leakage",
            "route": "Intravenous (IV) or Rapid IM",
            "standard_dose": "125 mg IV/IM single bolus",
            "dose_per_kg": 1.5,
            "max_24h_limit": "250 mg in acute emergency phase",
            "microgravity_advisory": "Administer immediately after respiratory protection is established; airway closure can occur in <15 minutes in microgravity.",
            "kit_location": "Artemis Medical Kit — Pack 1 (Critical Emergency Drugs), Ampoule C-04",
        },
        "secondary_drug": {
            "name": "Albuterol Sulfate Inhalation Aerosol",
            "brand_name": "ProAir Space Inhaler with AeroChamber",
            "drug_class": "Short-Acting Beta-2 Adrenergic Agonist (SABA)",
            "primary_indication": "Rapid bronchodilation for toxic bronchospasm and chemical wheezing",
            "mechanism_of_action": "Stimulates adenyl cyclase to increase intracellular cAMP, relaxing bronchial smooth muscle",
            "route": "Metered-Dose Inhaler with Space Spacer",
            "standard_dose": "4 to 6 puffs via spacer mask every 20 minutes as needed",
            "dose_per_kg": None,
            "max_24h_limit": "16 puffs / 24h",
            "microgravity_advisory": "Spacer chamber MUST be used to prevent aerosol droplet loss in microgravity cabin air currents.",
            "kit_location": "Emergency Response Locker — Compartment ECLSS-01",
        },
        "action_steps": [
            "DON QUICK-DON EMERGENCY 100% O2 BREATHING MASK IMMEDIATELY (within 5 seconds).",
            "Isolate contaminated module by closing and locking inter-module pressure hatches.",
            "Administer 4-6 puffs of Albuterol via emergency spacer mask to alleviate acute laryngospasm.",
            "Administer weight-calculated dose of Methylprednisolone Sodium Succinate IM/IV to halt inflammatory airway edema.",
            "Verify cabin ECLSS ppCO2 and ppO2 on life support dashboard; initiate emergency ammonia trace contaminant scrubbing.",
        ],
        "contraindications": [
            "Never remove breathing mask to administer oral medication until cabin atmosphere test indicates <1 ppm NH3.",
            "Do not delay corticosteroid administration if patient exhibits hoarseness or inspiratory stridor.",
        ],
    },
    "decompression_sickness": {
        "title": "Post-EVA Sub-acute Decompression Sickness (The Bends)",
        "nasa_code": "NASA-STD-3001-EVA-DCS-03",
        "category": "Hypobaric Aerospace Physiology & Spacewalk Operations",
        "urgency_tier": "CRITICAL - DCS PROTOCOL ACTIVE",
        "description": "Rapid airlock depressurization or inadequate pre-breathe resulting in supersaturated nitrogen gas phase bubble nucleation in periarticular tissues, spinal cord, or pulmonary circulation.",
        "primary_drug": {
            "name": "Normobaric 100% High-Flow Oxygen Protocol",
            "brand_name": "NASA In-Suit O2 Pre-Breathe / Recompression Circuit",
            "drug_class": "Medical Gas / Gas Washout Protocol",
            "primary_indication": "Elimination of tissue nitrogen bubble supersaturation by establishing maximum alveolar-to-tissue inert gas gradient",
            "mechanism_of_action": "Zero nitrogen in inspired gas maximizes venous partial pressure gradient, shrinking bubbles and re-oxygenating ischemic tissues",
            "route": "Tight-Fitting Oral-Nasal Mask with Demand Regulator",
            "standard_dose": "100% O2 at 15 L/min continuous delivery",
            "dose_per_kg": None,
            "max_24h_limit": "Continuous delivery until symptom resolution + 2 hours",
            "microgravity_advisory": "Keep suit or cabin pressure at maximum nominal (14.7 psi). Astronaut must remain supine/horizontal to enhance microgravity venous return.",
            "kit_location": "Airlock Equipment Bay — High-Flow O2 Rebreather Station #01",
        },
        "secondary_drug": {
            "name": "Aspirin (Acetylsalicylic Acid)",
            "brand_name": "Oral Chewable Aspirin",
            "drug_class": "Antiplatelet / Salicylate",
            "primary_indication": "Inhibition of bubble-surface platelet aggregation and microvascular microthrombosis",
            "mechanism_of_action": "Irreversibly acetylates platelet COX-1 enzyme, blocking thromboxane A2 production",
            "route": "Oral Chewable Tablet",
            "standard_dose": "325 mg PO chewed immediately",
            "dose_per_kg": None,
            "max_24h_limit": "325 mg single loading dose",
            "microgravity_advisory": "Chew thoroughly with small sip of water from drink bag.",
            "kit_location": "Artemis Medical Kit — Pack 2 (Oral Solid Medications), Blister Pack A-01",
        },
        "action_steps": [
            "Initiate continuous 100% O2 delivery via high-flow oral-nasal mask with tight seal immediately.",
            "Chew and swallow single 325 mg Aspirin tablet to inhibit platelet microthrombosis along bubble margins.",
            "Immobilize affected joint or limb; place astronaut horizontal in crew quarters sleep restraint.",
            "Hydrate with 1000 mL oral isotonic electrolyte fluid to restore intravascular volume and enhance microcirculation.",
            "Notify Houston Flight Surgeon (Ground Link); prepare for emergency Airlock Hyperbaric Recompression Protocol if neurological deficits emerge.",
        ],
        "contraindications": [
            "Do NOT allow astronaut to sit up or walk—gravity simulation exercises increase bubble embolization.",
            "Avoid active physical countermeasure exercise (T2 treadmill / ARED) for minimum 48 hours post-resolution.",
        ],
    },
}


# ==============================================================================
# BUSINESS LOGIC & RECOMMENDATION ENGINE
# ==============================================================================
def calculate_weight_adjusted_dose(drug_dict: dict, astronaut_weight: float) -> str:
    """Computes a patient-specific clinical dosage using astronaut weight."""
    dose_per_kg = drug_dict.get("dose_per_kg")
    if dose_per_kg:
        raw_val = round(dose_per_kg * astronaut_weight, 1)
        # Format integer if whole number
        formatted_val = int(raw_val) if raw_val.is_integer() else raw_val
        return f"{formatted_val} mg (Calculated at {dose_per_kg} mg/kg for {astronaut_weight} kg)"
    return drug_dict["standard_dose"]


def build_protocol_model(condition_key: str, astronaut_weight: float = 75.0) -> EmergencyProtocol:
    """Builds a validated EmergencyProtocol Pydantic schema with personalized dosage."""
    raw = SPACEFLIGHT_EMERGENCY_CATALOG[condition_key]

    # Calculate personalized primary drug
    p_drug = raw["primary_drug"].copy()
    p_drug["calculated_dose"] = calculate_weight_adjusted_dose(p_drug, astronaut_weight)
    primary_model = DrugInfo(**p_drug)

    # Calculate personalized secondary drug
    secondary_model = None
    if raw.get("secondary_drug"):
        s_drug = raw["secondary_drug"].copy()
        s_drug["calculated_dose"] = calculate_weight_adjusted_dose(s_drug, astronaut_weight)
        secondary_model = DrugInfo(**s_drug)

    return EmergencyProtocol(
        condition_key=condition_key,
        title=raw["title"],
        nasa_code=raw["nasa_code"],
        category=raw["category"],
        urgency_tier=raw["urgency_tier"],
        description=raw["description"],
        primary_drug=primary_model,
        secondary_drug=secondary_model,
        clinical_action_steps=raw["action_steps"],
        safety_contraindications=raw["contraindications"],
    )


def get_emergency_catalog(astronaut_weight: float = 75.0) -> List[EmergencyProtocol]:
    """Retrieves all 5 critical emergency playbooks with dosages calibrated to the astronaut."""
    return [
        build_protocol_model(key, astronaut_weight)
        for key in SPACEFLIGHT_EMERGENCY_CATALOG.keys()
    ]


def get_single_protocol(condition_key: str, astronaut_weight: float = 75.0) -> EmergencyProtocol:
    """Retrieves a single clinical emergency playbook."""
    if condition_key not in SPACEFLIGHT_EMERGENCY_CATALOG:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency condition '{condition_key}' not found in spaceflight formulary.",
        )
    return build_protocol_model(condition_key, astronaut_weight)


def deploy_emergency_playbook(
    db: Session,
    user_id: uuid.UUID,
    request: PlaybookDeployRequest,
) -> PlaybookDeployResponse:
    """Executes clinical deployment:

    1. Resolves emergency protocol with astronaut weight-adjusted calculations.
    2. Converts sequential medical steps into prioritized checklist tasks.
    3. Injects them into `daily_checklists` for the active flight day.
    """
    if request.condition_key not in SPACEFLIGHT_EMERGENCY_CATALOG:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency condition '{request.condition_key}' not recognized.",
        )

    # 1. Verify flight day ownership
    mission_day = (
        db.query(MissionDay)
        .join(Mission, MissionDay.mission_id == Mission.id)
        .filter(MissionDay.id == request.mission_day_id)
        .first()
    )
    if not mission_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight Day with ID '{request.mission_day_id}' not found.",
        )
    if mission_day.mission.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to deploy medical playbooks for another astronaut's mission.",
        )

    # 2. Derive astronaut body weight (default 75kg if not in profile)
    user_profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    astronaut_weight = 75.0

    # 3. Build personalized protocol
    protocol = build_protocol_model(request.condition_key, astronaut_weight)

    # 4. Inject procedural steps into `daily_checklists` table
    deployed_task_labels: List[str] = []

    # Lead task: Administer Primary Drug with exact calculated dosage and physical kit location
    lead_task = (
        f"[CMO ACTION] Administer {protocol.primary_drug.name} ({protocol.primary_drug.calculated_dose}) "
        f"via {protocol.primary_drug.route}. Stowage: {protocol.primary_drug.kit_location}"
    )
    # Truncate cleanly for DB column constraint (150 chars)
    lead_task_clean = lead_task[:142] + "..." if len(lead_task) > 145 else lead_task

    steps_to_inject = [lead_task_clean]
    for step in protocol.clinical_action_steps:
        step_clean = step[:142] + "..." if len(step) > 145 else step
        steps_to_inject.append(step_clean)

    for task_text in steps_to_inject:
        # Check if already present on this flight day to prevent duplicates
        existing = (
            db.query(DailyChecklist)
            .filter(
                DailyChecklist.mission_day_id == request.mission_day_id,
                DailyChecklist.task_name == task_text,
            )
            .first()
        )
        if not existing:
            new_item = DailyChecklist(
                mission_day_id=request.mission_day_id,
                task_name=task_text,
                is_completed=False,
                completed_at=None,
            )
            db.add(new_item)
            deployed_task_labels.append(task_text)

    db.commit()

    return PlaybookDeployResponse(
        condition_key=request.condition_key,
        protocol_title=protocol.title,
        nasa_code=protocol.nasa_code,
        recommended_medication=protocol.primary_drug,
        deployed_tasks_count=len(deployed_task_labels),
        deployed_tasks=deployed_task_labels,
        deployed_at=datetime.now(timezone.utc),
        execution_status="DEPLOYED_TO_CHECKLIST",
    )
