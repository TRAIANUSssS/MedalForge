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

Sprint 2 should add Warrior data sync:

- `POST /api/sync/warrior-data`
- raw JSON cache at `backend/data/raw/warrior_all.json`
- defensive parsing and upsert into `warrior_maps`
- `GET /api/maps`
