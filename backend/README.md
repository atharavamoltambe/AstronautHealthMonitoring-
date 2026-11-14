# NovaGuard Backend

NovaGuard is a NASA Space Apps Challenge project focused on astronaut health monitoring and mission tracking. This directory contains the initial backend foundation built using FastAPI.

---

## Current Contents

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application entry point with / and /health endpoints
│   ├── api/             # API routing modules (package placeholder)
│   ├── core/            # Application configuration and settings (package placeholder)
│   ├── schemas/         # Pydantic schemas (package placeholder)
│   └── services/        # Business logic and services (package placeholder)
├── .env.example         # Template for environment configuration
├── .gitignore           # Git ignore rules for Python, virtual environments, and local artifacts
├── requirements.txt     # Python dependencies for the backend
└── README.md            # Backend documentation and setup guide
```

---

## Prerequisites

- **Python 3.10+** (verified with Python 3.14)
- **Windows PowerShell**

---

## Setup Instructions (Windows PowerShell)

### 1. Navigate to the Backend Directory

Open PowerShell and navigate to the `backend` directory:

```powershell
cd "d:\Astronaut Health Monitoring\backend"
```

### 2. Create the Virtual Environment

Create a virtual environment named `venv`:

```powershell
python -m venv venv
```

### 3. Activate the Virtual Environment

Activate the virtual environment in PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

> **Note:** If script execution is restricted on your system, enable execution for the current session:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> .\venv\Scripts\Activate.ps1
> ```

### 4. Install Dependencies

Install the initial backend dependencies from `requirements.txt`:

```powershell
python -m pip install -r requirements.txt
```

---

## Running the Development Server

From the `backend` directory with the virtual environment activated, run:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The application will start at `http://127.0.0.1:8000`.

---

## API Endpoints and Documentation

Once the server is running, you can access the following endpoints:

| Endpoint | Method | Description | URL |
| :--- | :--- | :--- | :--- |
| **Welcome** | `GET` | Returns welcome message and online status | [http://127.0.0.1:8000/](http://127.0.0.1:8000/) |
| **Health Check** | `GET` | Returns service health status | [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) |
| **Interactive API Docs (Swagger)** | `GET` | Interactive Swagger UI documentation | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |
| **Alternative Docs (ReDoc)** | `GET` | ReDoc API documentation | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) |

---

## Manual Verification

You can verify the endpoints through your browser or directly in PowerShell.

### Using a Web Browser

1. Open `http://127.0.0.1:8000/` – Should display:
   ```json
   {"message":"Welcome to NovaGuard API","status":"online","version":"0.1.0"}
   ```
2. Open `http://127.0.0.1:8000/health` – Should display:
   ```json
   {"status":"healthy","service":"NovaGuard API"}
   ```
3. Open `http://127.0.0.1:8000/docs` – Should load the interactive Swagger UI.

### Using PowerShell

Run these commands in a separate PowerShell window:

```powershell
# Verify root endpoint
Invoke-RestMethod -Uri "http://127.0.0.1:8000/"

# Verify health endpoint
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```
