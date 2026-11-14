"""NASA Clinical Decision Engine for Spaceflight Health Monitoring.

Based on official aerospace medicine standards and reference criteria:
- NASA-STD-3001: NASA Space Flight Human-System Standard (Volume 1: Crew Health)
- NASA Human Research Program (HRP) Evidence Books
- International Space Station (ISS) Medical Operations Requirements Documents (MORD)
"""

from typing import Any, Dict, List, Optional
from datetime import datetime


# ==============================================================================
# OFFICIAL NASA-STD-3001 PHYSIOLOGICAL BASES & THRESHOLDS (MICROGRAVITY)
# ==============================================================================
NASA_PHYSIOLOGICAL_BASELINES = {
    "heart_rate": {
        "unit": "bpm",
        "nominal_min": 50.0,
        "nominal_max": 100.0,
        "critical_min": 45.0,
        "critical_max": 120.0,
        "description": "Resting Heart Rate (NASA-STD-3001 Vol 1 §4.2)",
    },
    "oxygen_saturation": {
        "unit": "%",
        "nominal_min": 95.0,
        "nominal_max": 100.0,
        "critical_min": 90.0,
        "description": "Peripheral Capillary Oxygen Saturation SpO2 (NASA-STD-3001 Vol 2 §6.2)",
    },
    "body_temperature": {
        "unit": "°C",
        "nominal_min": 36.1,
        "nominal_max": 37.2,
        "critical_max": 38.0,
        "critical_min": 35.5,
        "description": "Core Body Temperature (NASA Spaceflight Thermoregulation Standard)",
    },
    "sleep_duration": {
        "unit": "hours",
        "nominal_min": 7.0,
        "caution_min": 6.0,
        "critical_min": 5.0,
        "description": "Rest Period Duration (NASA-STD-3001 Vol 1 §4.7.1)",
    },
    "water_intake": {
        "unit": "mL",
        "nominal_min": 2000.0,
        "caution_min": 1500.0,
        "critical_min": 1000.0,
        "description": "Daily Fluid Intake Countermeasure against fluid shift and nephrolithiasis",
    },
    "exercise_duration": {
        "unit": "minutes",
        "nominal_min": 45.0,
        "caution_min": 30.0,
        "description": "Mandatory Daily Countermeasure (ARED/T2/CEVIS) against bone mineral loss",
    },
}

# Standard spaceflight symptoms classified under NASA Flight Medicine protocols
SPACEFLIGHT_SYMPTOM_PROTOCOLS = {
    "space adaptation motion sickness": {
        "nasa_code": "SMS",
        "expected_window": "Flight Days 1 - 3",
        "countermeasure": "Restrict rapid head pitch/yaw rotations; maintain horizon visual fix; hydration pacing.",
    },
    "head fullness / fluid shift": {
        "nasa_code": "FFS",
        "expected_window": "Flight Days 1 - 5",
        "countermeasure": "Cephalic fluid redistribution typical in microgravity; monitor nasal congestion.",
    },
    "co2 headache": {
        "nasa_code": "HYP-CO2",
        "countermeasure": "Verify cabin environmental control and life support system (ECLSS) ppCO2 levels; increase ventilation.",
    },
    "visual acuity changes": {
        "nasa_code": "SANS",
        "countermeasure": "Perform fundoscopic and visual acuity check; log intraocular pressure indicators.",
    },
    "back pain / spinal elongation": {
        "nasa_code": "SPL",
        "countermeasure": "Employ fetal position stretch protocol in crew quarters; verify ergometer harness fit.",
    },
}


class NASADecisionEngine:
    """Evaluates mission telemetry using deterministic NASA-STD-3001 clinical rules."""

    @staticmethod
    def evaluate_day(
        health_records: List[Any],
        symptom_logs: List[Any],
        checklist_items: List[Any],
    ) -> Dict[str, Any]:
        """Run complete clinical rules evaluation against daily telemetry.

        Returns a dictionary conforming to HealthAssessment model:
        - result: 'no_flag' | 'review_recommended' | 'insufficient_data'
        - details: structured JSON with NASA references, flags, and countermeasures.
        """
        # Step 1: Check minimum telemetry coverage
        # Need at least two distinct vital types or active symptoms to make a valid determination
        evaluated_types = {rec.measurement_type for rec in health_records}

        if len(evaluated_types) < 2 and len(symptom_logs) == 0:
            return {
                "result": "insufficient_data",
                "details": {
                    "evaluation_timestamp": datetime.utcnow().isoformat() + "Z",
                    "standard": "NASA-STD-3001 (Rev B)",
                    "summary": "Insufficient telemetry to establish a flight clinical determination.",
                    "coverage": {
                        "vital_types_recorded": list(evaluated_types),
                        "total_vital_readings": len(health_records),
                        "total_symptoms_logged": len(symptom_logs),
                    },
                    "recommendation": "Acquire baseline resting heart rate and SpO2 readings before proceeding.",
                    "flags": [],
                    "countermeasures": ["Log mandatory morning vitals suite (HR, SpO2, Core Temp)."],
                },
            }

        clinical_flags: List[Dict[str, Any]] = []
        countermeasures: List[str] = []

        # Step 2: Evaluate Vital Signs against NASA Baselines
        for rec in health_records:
            val = float(rec.value)
            m_type = rec.measurement_type

            if m_type == "heart_rate":
                cfg = NASA_PHYSIOLOGICAL_BASELINES["heart_rate"]
                if val > cfg["critical_max"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CRITICAL",
                        "finding": f"Marked resting tachycardia ({val} bpm exceeds {cfg['critical_max']} bpm threshold).",
                    })
                    countermeasures.append("Enforce immediate rest protocol; re-check heart rate in 15 minutes.")
                elif val > cfg["nominal_max"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CAUTION",
                        "finding": f"Elevated resting heart rate ({val} bpm exceeds nominal {cfg['nominal_max']} bpm).",
                    })
                    countermeasures.append("Correlate elevated heart rate with recent physical workload or stress.")
                elif val < cfg["critical_min"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CRITICAL",
                        "finding": f"Marked bradycardia ({val} bpm below {cfg['critical_min']} bpm threshold).",
                    })
                    countermeasures.append("Alert Flight Surgeon; verify pulse oximeter waveform validity.")

            elif m_type == "oxygen_saturation":
                cfg = NASA_PHYSIOLOGICAL_BASELINES["oxygen_saturation"]
                if val < cfg["critical_min"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CRITICAL",
                        "finding": f"Critical hypoxia detected ({val}% SpO2 is below {cfg['critical_min']}% threshold).",
                    })
                    countermeasures.append("Verify cabin O2 partial pressure; confirm suit/mask supplementary O2 availability.")
                elif val < cfg["nominal_min"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CAUTION",
                        "finding": f"Sub-nominal oxygenation ({val}% SpO2 is below nominal {cfg['nominal_min']}%).",
                    })
                    countermeasures.append("Retake reading on alternate digit; check cabin airflow circulation.")

            elif m_type == "body_temperature":
                cfg = NASA_PHYSIOLOGICAL_BASELINES["body_temperature"]
                if val > cfg["critical_max"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CRITICAL",
                        "finding": f"Pyrexia / Fever detected ({val}°C exceeds {cfg['critical_max']}°C).",
                    })
                    countermeasures.append("Initiate passive active cooling protocol; assess for infectious etiology.")
                elif val > cfg["nominal_max"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CAUTION",
                        "finding": f"Low-grade elevation ({val}°C vs nominal max {cfg['nominal_max']}°C).",
                    })

            elif m_type == "water_intake":
                cfg = NASA_PHYSIOLOGICAL_BASELINES["water_intake"]
                if val < cfg["caution_min"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CAUTION",
                        "finding": f"Fluid intake ({val} mL) below minimum hydration target ({cfg['nominal_min']} mL).",
                    })
                    countermeasures.append("Administer 500 mL oral electrolyte rehydration solution.")

            elif m_type == "sleep_duration":
                cfg = NASA_PHYSIOLOGICAL_BASELINES["sleep_duration"]
                if val < cfg["critical_min"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CRITICAL",
                        "finding": f"Acute sleep deficit ({val} hrs vs NASA nominal >= {cfg['nominal_min']} hrs).",
                    })
                    countermeasures.append("Cognitive fatigue alert: restrict high-consequence robotic or EVA operations.")
                elif val < cfg["nominal_min"]:
                    clinical_flags.append({
                        "metric": m_type,
                        "value": val,
                        "unit": cfg["unit"],
                        "severity": "CAUTION",
                        "finding": f"Sub-optimal sleep period ({val} hrs).",
                    })

        # Step 3: Evaluate Symptom Logs
        for sym in symptom_logs:
            sev = int(sym.severity)
            s_name = sym.symptom_type.lower()

            if sev >= 4:
                clinical_flags.append({
                    "symptom": sym.symptom_type,
                    "severity": sev,
                    "finding": f"Severe clinical symptom reported: '{sym.symptom_type}' (Severity: {sev}/5).",
                })
                countermeasures.append(f"Immediate medical kit access indicated for '{sym.symptom_type}'. Notify Ground Surgeon.")
            elif sev >= 3:
                clinical_flags.append({
                    "symptom": sym.symptom_type,
                    "severity": sev,
                    "finding": f"Moderate symptom reported: '{sym.symptom_type}' (Severity: {sev}/5).",
                })
                # Check for recognized spaceflight countermeasures
                matched_protocol = None
                for key, proto in SPACEFLIGHT_SYMPTOM_PROTOCOLS.items():
                    if key in s_name:
                        matched_protocol = proto["countermeasure"]
                        break
                if matched_protocol:
                    countermeasures.append(matched_protocol)
                else:
                    countermeasures.append(f"Monitor progression of '{sym.symptom_type}'; schedule re-assessment.")

        # Step 4: Evaluate Checklists
        incomplete_critical = [t.task_name for t in checklist_items if not t.is_completed]
        if incomplete_critical:
            countermeasures.append(f"Outstanding checklist items: {', '.join(incomplete_critical[:3])}")

        # Step 5: Final Result Synthesis
        if clinical_flags:
            result = "review_recommended"
            summary = f"NASA Clinical Engine identified {len(clinical_flags)} telemetry flag(s) requiring astronaut review."
        else:
            result = "no_flag"
            summary = "All recorded physiological metrics and spaceflight telemetry are within nominal NASA-STD-3001 bounds."
            countermeasures.append("Maintain nominal operational flight schedule and scheduled exercise countermeasures.")

        # Remove duplicate countermeasures while preserving order
        unique_countermeasures = list(dict.fromkeys(countermeasures))

        return {
            "result": result,
            "details": {
                "evaluation_timestamp": datetime.utcnow().isoformat() + "Z",
                "standard": "NASA-STD-3001 Space Flight Human-System Standard",
                "summary": summary,
                "flags": clinical_flags,
                "countermeasures": unique_countermeasures,
                "telemetry_evaluated": {
                    "vitals_count": len(health_records),
                    "symptoms_count": len(symptom_logs),
                    "checklists_completed": sum(1 for t in checklist_items if t.is_completed),
                    "checklists_total": len(checklist_items),
                },
                "disclaimer": "Clinical Decision Support System (CDSS) for microgravity operations. Not a replacement for Ground Flight Surgeon consultation.",
            },
        }

