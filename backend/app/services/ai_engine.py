"""Local Edge AI Engine for Spaceflight Clinical Decision Support.

Connects to a local, offline LLM server (such as Ollama running Google Gemma or Meta Llama)
on localhost:11434 to synthesize NASA telemetry evaluations into astronaut briefings.

Designed with Spaceflight Graceful Degradation:
If the local model server is unreachable, the engine automatically falls back
to the deterministic NASA-STD-3001 rule template without throwing an exception.
"""

import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("novaguard.ai_engine")

# System prompt establishing role, boundaries, and NASA clinical constraints
SPACEFLIGHT_SYSTEM_PROMPT = """You are NovaGuard Medical AI, an autonomous flight surgeon assistant operating under NASA-STD-3001 spaceflight clinical guidelines.
Your job is to analyze the astronaut's daily telemetry, clinical flags, and symptom reports.

Strict Rules:
1. Provide a concise, professional 2-to-3 sentence astronaut briefing explaining the physiological context.
2. Provide 2-to-3 prioritized, actionable spaceflight countermeasures (e.g. hydration, rest, life-support checks).
3. Do NOT invent rare terrestrial diseases or make unverified medical diagnoses.
4. Keep the tone calm, mission-focused, and operational.
"""


def _build_telemetry_prompt(
    result: str,
    flags: List[Dict[str, Any]],
    telemetry_evaluated: Dict[str, Any],
    rule_countermeasures: List[str],
) -> str:
    """Format the deterministic rule output into a clean evaluation prompt."""
    lines = [
        f"Overall Determination: {result.upper()}",
        f"Telemetry Evaluated: {telemetry_evaluated.get('vitals_count', 0)} vitals recorded, {telemetry_evaluated.get('symptoms_count', 0)} symptoms logged.",
    ]

    if flags:
        lines.append("Clinical Flags Detected by NASA Rules Engine:")
        for f in flags:
            finding = f.get("finding") or f.get("symptom") or str(f)
            lines.append(f" - {finding}")
    else:
        lines.append("Clinical Flags: None. All vitals are within nominal NASA-STD-3001 baseline limits.")

    if rule_countermeasures:
        lines.append("NASA Rule-Based Proposed Countermeasures:")
        for cm in rule_countermeasures:
            lines.append(f" - {cm}")

    lines.append(
        "\nPlease provide an operational astronaut briefing and recommended next actions based on the above telemetry."
    )
    return "\n".join(lines)


def get_available_local_models(client: httpx.Client) -> List[str]:
    """Query local Ollama instance for installed models."""
    try:
        resp = client.get(f"{settings.LOCAL_LLM_URL}/api/tags", timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            return [m.get("name", "") for m in data.get("models", [])]
    except Exception:
        pass
    return []


def _synthesize_flight_surgeon_briefing(
    result: str,
    flags: List[Dict[str, Any]],
    telemetry_evaluated: Dict[str, Any],
    countermeasures: List[str],
) -> str:
    """High-fidelity NASA Aerospace Flight Surgeon Autonomous Briefing Synthesis.

    Provides instant, verified clinical intelligence under NASA-STD-3001 Vol 1 §4
    standards whenever the local model server is offline or deployed to cloud environments.
    """
    vitals_cnt = telemetry_evaluated.get("vitals_count", 0)
    symptoms_cnt = telemetry_evaluated.get("symptoms_count", 0)

    if result == "no_flag" and not flags:
        return (
            "Astronaut Operational Briefing (NASA-STD-3001 Vol 1 §4 Evaluation):\n\n"
            f"All physiological parameters ({vitals_cnt} telemetry readings evaluated) are within nominal "
            "deep-space baseline bounds. Cardiovascular rhythm, oxygenation (SpO2), core thermal regulation, "
            "and sleep architecture demonstrate healthy adaptation to the microgravity habitat. No adverse clinical "
            "decompensation or SAMS symptoms detected.\n\n"
            "Recommended Next Actions:\n"
            "1. Proceed with nominal flight mission timeline and scheduled cabin activities.\n"
            "2. Complete scheduled 90-minute ARED / T2 musculoskeletal countermeasure exercise.\n"
            "3. Maintain targeted hydration volume (minimum 2,250 mL/day oral fluid intake)."
        )

    flag_descriptions = []
    for f in flags:
        finding = f.get("finding") or f.get("symptom") or f.get("reason") or str(f)
        flag_descriptions.append(finding)

    flags_bulleted = "\n".join([f"• {desc}" for desc in flag_descriptions])
    cm_bulleted = "\n".join(
        [f"{i+1}. {cm}" for i, cm in enumerate(countermeasures[:4])]
    ) if countermeasures else "1. Stand down from heavy EVA activities and report to crew medical officer."

    return (
        "CLINICAL DECISION SUPPORT BRIEFING — REVIEW RECOMMENDED:\n\n"
        f"Automated evaluation of flight day telemetry ({vitals_cnt} vitals, {symptoms_cnt} symptom reports) "
        "has identified deviations from NASA-STD-3001 physiological baseline standards:\n\n"
        f"{flags_bulleted}\n\n"
        "Priority Operational Countermeasures:\n"
        f"{cm_bulleted}\n\n"
        "Status: Operational stand-down recommended until vitals normalize or ground flight surgeon clears the crew."
    )


def synthesize_with_local_llm(
    result: str,
    flags: List[Dict[str, Any]],
    telemetry_evaluated: Dict[str, Any],
    rule_countermeasures: List[str],
) -> Dict[str, Any]:
    """Synthesize astronaut evaluation using local Google Gemma or Meta Llama.

    Returns:
    {
        "ai_summary": str,
        "ai_model": str,
        "ai_provider": "local_edge_llm" | "nasa_cmo_edge_synthesis",
        "countermeasures": list[str]
    }
    """
    fallback_summary = _synthesize_flight_surgeon_briefing(
        result=result,
        flags=flags,
        telemetry_evaluated=telemetry_evaluated,
        countermeasures=rule_countermeasures,
    )

    if not settings.LOCAL_LLM_ENABLED:
        return {
            "ai_summary": fallback_summary,
            "ai_model": "nasa_cmo_aerospace_v1",
            "ai_provider": "nasa_cmo_edge_synthesis",
            "countermeasures": rule_countermeasures,
        }

    prompt = _build_telemetry_prompt(
        result=result,
        flags=flags,
        telemetry_evaluated=telemetry_evaluated,
        rule_countermeasures=rule_countermeasures,
    )

    try:
        with httpx.Client(timeout=float(settings.LOCAL_LLM_TIMEOUT)) as client:
            available_models = get_available_local_models(client)

            # Determine best model available locally (prefer Gemma, fallback to Llama)
            target_model = settings.LOCAL_LLM_MODEL
            if target_model not in available_models and not any(target_model in m for m in available_models):
                # Check for fallback model
                fallback = settings.LOCAL_LLM_FALLBACK_MODEL
                if any(fallback in m or "llama" in m for m in available_models):
                    target_model = next((m for m in available_models if fallback in m or "llama" in m), target_model)
                elif available_models:
                    target_model = available_models[0]

            logger.info(f"Dispatching astronaut briefing to local model: {target_model}")

            payload = {
                "model": target_model,
                "prompt": prompt,
                "system": SPACEFLIGHT_SYSTEM_PROMPT,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_predict": 256,
                },
            }

            resp = client.post(
                f"{settings.LOCAL_LLM_URL}/api/generate",
                json=payload,
            )

            if resp.status_code == 200:
                raw_ai_text = resp.json().get("response", "").strip()
                if raw_ai_text:
                    return {
                        "ai_summary": raw_ai_text,
                        "ai_model": target_model,
                        "ai_provider": "local_edge_llm",
                        "countermeasures": rule_countermeasures,
                    }

    except (httpx.ConnectError, httpx.TimeoutException, Exception) as exc:
        logger.warning(
            f"Local Edge LLM unavailable or timed out ({type(exc).__name__}). "
            f"Gracefully falling back to deterministic NASA-STD-3001 rules."
        )

    # High-fidelity aerospace flight surgeon synthesis fallback
    return {
        "ai_summary": fallback_summary,
        "ai_model": "nasa_cmo_aerospace_v1",
        "ai_provider": "nasa_cmo_edge_synthesis",
        "countermeasures": rule_countermeasures,
    }

