# Runbook

Operational notes for local development.

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

## Frontend Setup

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Verification

Backend import, DB creation, and health endpoint:

```powershell
cd backend
.\.venv\Scripts\python - <<'PY'
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from app.core.database import engine, init_db
from app.main import app

init_db()
print(TestClient(app).get("/api/health").json())
print(Path("data/app.db").exists())
print(sorted(inspect(engine).get_table_names()))
PY
```

Frontend build:

```powershell
cd frontend
npm run build
```

## Local Files

Ignored local files:

- `.env`
- `backend/.venv/`
- `frontend/node_modules/`
- `frontend/dist/`
- `backend/data/app.db`
- `backend/data/raw/*.json`

## Common Issues

### Frontend shows Backend offline

Check that backend is running on `http://localhost:8000`.

If backend runs on another port, update:

```text
frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

### SQLite file is missing

Start the backend or run `init_db()`. The app creates `backend/data/app.db` on startup.

### Nadeo sync fails

For MVP, tokens are read from `backend/.env`. Check:

```text
NADEO_ACCOUNT_ID=
NADEO_CORE_TOKEN=
NADEO_LIVE_TOKEN=
```

Do not commit real token values.
