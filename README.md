# MedalForge

Local Trackmania Warrior Medals dashboard.

## Documentation

- [Implementation status](docs/IMPLEMENTATION.md)
- [Project plan](docs/PROJECT_PLAN.md)
- [Docs index](docs/README.md)

## Current State

Sprint 1 scaffold:

- FastAPI backend with `GET /api/health`
- SQLite initialization on backend startup
- SQLAlchemy models for the planned MVP tables
- React/Vite frontend shell
- Frontend health check against the backend
- Sprint 2 endpoints started: `POST /api/sync/warrior-data` and `GET /api/maps`

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

Health endpoint:

```text
http://localhost:8000/api/health
```

SQLite is created at:

```text
backend/data/app.db
```

## Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Next Step

Sprint 2 should be completed by resolving Warrior source access or providing raw cache:

- direct endpoint currently returns `401` to normal backend requests;
- raw cache fallback is available with `POST /api/sync/warrior-data?use_cache=true`;
- after real data is parsed, inspect map fields and refine aliases if needed.
