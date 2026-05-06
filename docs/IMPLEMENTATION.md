# Implementation Status

This file tracks the current delivery stage. Keep it short and operational: what is being built now, what is already done, how it was implemented, how to verify it, and what comes next.

Source of truth for the full product direction: [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Current Stage

Part 1: Core Data & MVP

Goal:

- get a working local backend and frontend;
- sync Warrior medal data into SQLite;
- show maps and basic progress;
- prepare for Nadeo position and PB sync.

Current focus:

- Sprint 4: Nadeo Live Warrior positions.

## Stage Checklist

| Step | Status | Result | Verification |
| --- | --- | --- | --- |
| Sprint 1: Project scaffold | Done | FastAPI backend, SQLite init, React/Vite shell, health check | `GET /api/health`, `npm run build` |
| Sprint 2: Warrior data sync | Done | Sync endpoint, raw JSON cache, defensive parser, upsert to `warrior_maps`, `GET /api/maps` | Sync refreshes local cache, then imports 4559 unique maps |
| Sprint 3: Maps table UI | Done | Category/status filters, search submit/reset, sorting, pagination, skeleton/error/empty states, cleaned TM text | Frontend can browse and filter 4559 local maps |
| Sprint 4: Warrior positions | In progress | Nadeo Live service, batched sync endpoint, map position upsert, frontend sync action | Code ready; needs real `NADEO_LIVE_TOKEN` smoke test |
| Sprint 5: Player PB sync | Pending | Nadeo Core service, PB records, history, progress snapshots | Dashboard can show real player progress |
| Sprint 6: Dashboard MVP | Pending | Progress bar, summary cards, close medals, quick wins | Main page answers basic progress questions |

## Completed Notes

### Sprint 1: Project Scaffold

Status: Done

Implemented:

- `backend/app/main.py` creates the FastAPI application and initializes SQLite on startup.
- `backend/app/api/routes_health.py` exposes `GET /api/health`.
- `backend/app/core/config.py` reads local config from `.env`.
- `backend/app/core/database.py` configures SQLAlchemy and creates the SQLite parent directory.
- SQLAlchemy models were added for planned MVP tables:
  - `warrior_maps`
  - `map_positions`
  - `player_records`
  - `player_record_history`
  - `progress_snapshots`
  - `sync_jobs`
  - `user_notes`
- `frontend/` contains a React/Vite shell with a backend health check.
- Root and frontend `.env.example` files document local config.

How:

- Kept backend structure close to the project plan.
- Used SQLAlchemy 2 typed models so later repositories/services can build on stable table definitions.
- Frontend starts as an application shell, not a throwaway admin page.

Verification:

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

```powershell
cd frontend
npm run build
```

## Next Step

Sprint 2 backend/frontend implementation is present:

- `POST /api/sync/warrior-data`
- `POST /api/sync/warrior-data?use_cache=true`
- raw JSON cache path: `backend/data/raw/warrior_all.json`
- defensive parser in `warrior_sync_service.py`
- SQLite upsert into `warrior_maps`
- `GET /api/maps`
- frontend sync action, cache parse action, search, sorting, and maps table

Warrior source:

- `https://raw.githubusercontent.com/ezio416/tm-json/main/warrior.json`
- The old `https://e416.dev/api3/tm/warrior/all` endpoint returns `401` for a normal backend request.

Data flow:

- Normal sync downloads the GitHub raw JSON into `backend/data/raw/warrior_all.json`.
- Import/parsing reads from `backend/data/raw/warrior_all.json`.
- `use_cache=true` skips the download and only parses the existing local file.

Local cache result:

- `docs/warrior.json` contains 4561 medal objects.
- It imports as 4559 unique `mapUid` rows.
- 2 duplicate `mapUid` entries are skipped during import.
- Categories detected: `Grand`, `Seasonal`, `Weekly`, `Totd`, `Other`.

Next practical step:

1. Use `POST /api/sync/warrior-data` as the normal refresh-cache-and-import path.
2. Keep `POST /api/sync/warrior-data?use_cache=true` as a local-cache-only fallback/debug path.
3. Continue with Sprint 4: Nadeo Live service for Warrior required positions.

### Sprint 3: Maps Table UI

Status: Done

Implemented:

- `GET /api/maps/meta` for category options and status counts.
- Category filter based on real local data.
- Status filter segments:
  - all;
  - earned;
  - missing;
  - close;
  - not played.
- Search submit and reset behavior.
- Sort controls for name, Warrior time, Author time, category, and campaign.
- Pagination with fixed page size.
- Skeleton loading state, error state, and empty state.
- Trackmania formatting code cleanup for displayed map names.
- Category badges and PB/status display placeholders.

Verification:

```powershell
cd backend
.\.venv\Scripts\python - <<'PY'
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
print(client.get("/api/maps/meta").json())
print(client.get("/api/maps?limit=2&category=Totd&sort=warrior_time_ms&order=asc").json())
PY
```

```powershell
cd frontend
npm run build
```

Definition of done remains:

- sync endpoint creates or updates map rows;
- raw JSON cache is written;
- sync result records counts for total, inserted, updated, skipped, failed;
- maps endpoint returns stable response shape for frontend work.

### Sprint 4: Warrior Positions

Status: In progress

Implemented:

- `nadeo_live_service.py` for Nadeo Live leaderboard position calls.
- `POST /api/sync/warrior-positions`.
- Batch size: 50 maps per Nadeo Live request.
- Reads `NADEO_LIVE_TOKEN` from backend `.env`.
- Saves rows into `map_positions`:
  - `position_type = "warrior"`;
  - `score_ms = warrior_time_ms`;
  - `world_position = required position`.
- Maps API already exposes:
  - `required_position`;
  - `difficulty_tier`.
- Frontend has a `Sync positions` action and result/error message.

Needs verification with real token:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/sync/warrior-positions?limit=5"
```

Expected result:

- positions are inserted into `map_positions`;
- maps table starts showing required position;
- difficulty tier is computed from required position.
