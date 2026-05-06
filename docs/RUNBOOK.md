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

## Warrior Data Sync

Normal sync:

```powershell
Invoke-RestMethod -Method Post http://localhost:8000/api/sync/warrior-data
```

Normal sync flow:

```text
1. Download https://raw.githubusercontent.com/ezio416/tm-json/main/warrior.json
2. Write backend/data/raw/warrior_all.json
3. Parse backend/data/raw/warrior_all.json
4. Upsert rows into SQLite
```

Parse an existing raw cache instead of calling the external endpoint:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/sync/warrior-data?use_cache=true"
```

Raw cache path:

```text
backend/data/raw/warrior_all.json
```

Current source:

```text
https://raw.githubusercontent.com/ezio416/tm-json/main/warrior.json
```

The old `e416.dev` endpoint rejected normal backend requests with `401`, so the project uses the public raw JSON mirror from `ezio416/tm-json`.

## Warrior Position Sync

Required config:

```text
NADEO_LIVE_TOKEN=...
```

Smoke test a small batch:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/sync/warrior-positions?limit=5"
```

Smoke test with top leaderboard fallback:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/sync/warrior-positions?limit=5&fallback_top=true"
```

Full sync:

```powershell
Invoke-RestMethod -Method Post http://localhost:8000/api/sync/warrior-positions
```

Behavior:

```text
1. Read maps with map_uid and warrior_time_ms from SQLite
2. Batch maps by 50
3. Call Nadeo Live leaderboard position endpoint
4. Optionally derive missing positions from `top` leaderboard when `fallback_top=true`
5. Upsert position_type=warrior into map_positions
6. GET /api/maps shows required_position and difficulty_tier
```

If `NADEO_LIVE_TOKEN` is missing, the backend returns `400`.

Current Nadeo behavior observed with the user token:

- `top` leaderboard endpoint works.
- batch position endpoint returns `[]`.
- `fallback_top=true` successfully populated positions for a 5-map smoke test.

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
