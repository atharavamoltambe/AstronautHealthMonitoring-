# NovaGuard: Autonomous Spaceflight Clinical Decision Support System 🚀

NovaGuard (developed for the NASA Space Apps Challenge) is an edge-native, AI-assisted health monitoring and clinical decision support system designed for astronauts during long-duration exploration missions (e.g., Artemis Lunar Base, Mars transit).

---

## 🌟 Key Features

1. **Deterministic Aerospace Clinical Engine**:
   - Implements **NASA-STD-3001** (Space Flight Human-System Standard, Vol 1 & 2) baseline thresholds for microgravity vitals:
     - Resting Heart Rate (50–100 bpm)
     - Peripheral Oxygen Saturation SpO2 (≥95%)
     - Core Body Temperature (36.1–37.2 °C)
     - Sleep Duration & Hydration Tracking
     - Space Adaptation Syndrome / Motion Sickness protocols.

2. **Local Edge AI Medical Briefings**:
   - Queries an offline, onboard edge LLM (**Google Gemma / Meta Llama** via Ollama) running locally at `localhost:11434`.
   - Synthesizes complex physiological telemetry into calm, prioritized operational briefings and countermeasures.
   - Built with **Graceful Spaceflight Degradation**: Automatically falls back to deterministic rule cards if the AI engine is unreachable or offline.

3. **Enterprise Defense-in-Depth Security**:
   - Cryptographic JWT authentication ensuring astronaut identity verification (`sub` claim extraction).
   - Database **Row Level Security (RLS)** active across all 7 PostgreSQL tables in Supabase.
   - Strict Pydantic v2 telemetry validation preventing schema violations.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── alembic/              # Database migration history
│   ├── app/
│   │   ├── api/v1/           # Modular REST API endpoints
│   │   ├── core/             # Security, JWT, settings & configuration
│   │   ├── db/               # SQLAlchemy models & database session
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Business logic (rules engine & local AI engine)
│   ├── requirements.txt      # Python dependencies
│   └── alembic.ini           # Alembic configuration
├── frontend/                 # Mission Control UI (React + Tailwind CSS)
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # On Windows
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and provide your Supabase PostgreSQL URL and JWT Secret:

```bash
cp .env.example .env
```

### 3. Run Migrations & Start Server

```bash
alembic upgrade head
python -m uvicorn app.main:app --reload
```

Open interactive Swagger documentation at: **`http://127.0.0.1:8000/docs`**

### 4. Edge AI Server (Ollama)

Ensure Ollama is installed and running:
```bash
ollama run llama3.2:latest
# or
ollama run gemma2:2b
```

---

## 📜 Standards & References
- **NASA-STD-3001 Vol 1**: Crew Health
- **NASA-STD-3001 Vol 2**: Human Factors, Habitability, and Environmental Health
- **NASA Human Research Program (HRP)**: Evidence Books for Spaceflight Human Risks
