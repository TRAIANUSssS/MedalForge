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
- Sprint 3 maps table: category/status filters, search, sorting, pagination
- Sprint 4 started: `POST /api/sync/warrior-positions` for Nadeo Live required positions
- Sprint 4.1 positions: `/top`-only sync, exact positions, `10k+` placeholder, progress display
- Sprint 5 player PB sync: Trackmania OAuth, `POST /api/sync/player-pbs`, PB history, progress snapshots
- Sprint 6 dashboard MVP: summary API, dashboard blocks, loading/error/empty states
- Frontend visual foundation: design playground, progress entry page, reusable hero `WarriorProgressBar`

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

From the repository root without activating the venv:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --app-dir backend
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

Frontend routes:

```text
/                   Progress entry / landing page
/dashboard          Real dashboard page
/design-playground  UI playground / design sandbox
/playground         Alias route for the design sandbox
```

## Next Step

Current sync sources:

- `https://raw.githubusercontent.com/ezio416/tm-json/main/warrior.json`
- normal sync: `POST /api/sync/warrior-data` downloads into `backend/data/raw/warrior_all.json`, then parses that local file
- raw cache fallback: `POST /api/sync/warrior-data?use_cache=true` parses the existing local file without downloading
- position sync: `POST /api/sync/warrior-positions` uses `NADEO_LIVE_TOKEN`
- player PB sync: connect through Trackmania OAuth, then `POST /api/sync/player-pbs`

Trackmania OAuth requires a registered app at `https://api.trackmania.com`:

```env
TRACKMANIA_CLIENT_ID=...
TRACKMANIA_CLIENT_SECRET=...
TRACKMANIA_REDIRECT_URI=http://localhost:8000/api/auth/trackmania/callback
```
