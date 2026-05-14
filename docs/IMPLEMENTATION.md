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

- Sprint 6.5 follow-up: dashboard documentation alignment after TMX/category chip polish.

## Stage Checklist

| Step | Status | Result | Verification |
| --- | --- | --- | --- |
| Sprint 1: Project scaffold | Done | FastAPI backend, SQLite init, React/Vite shell, health check | `GET /api/health`, `npm run build` |
| Sprint 2: Warrior data sync | Done | Sync endpoint, raw JSON cache, defensive parser, upsert to `warrior_maps`, `GET /api/maps` | Sync refreshes local cache, then imports 4559 unique maps |
| Sprint 3: Maps table UI | Done | Category/status filters, search submit/reset, sorting, pagination, skeleton/error/empty states, cleaned TM text | Frontend can browse and filter 4559 local maps |
| Sprint 4: Warrior positions | Superseded | Batch position endpoint returned `[]`; moved to `/top`-only strategy | See Sprint 4.1 |
| Sprint 4.1: Top-only position sync | Done | Use `/top` only, store exact/10k+ status, avoid re-syncing stable over_10000 rows, show progress | Full position sync completed successfully |
| Sprint 5: Player PB sync | Done | Trackmania OAuth, official map-records PB sync, PB records, history, progress snapshots, PB sync UI action | Maps table can show real player PB status after OAuth sync |
| Sprint 6: Dashboard MVP | Done | Summary API, progress hero, dashboard blocks, empty/error/loading states | Dashboard shows real PB progress and overview recommendations |
| Sprint 6.1: Frontend visual foundation | Done | Design playground, manual frontend routing, progress entry page, reusable hero Warrior progress bar | Frontend opens on `/`, dashboard remains on `/dashboard`, `npm run build` |
| Sprint 6.2: Workspace split and dashboard polish | Done | Separate `Maps` and `Settings` workspaces, fixed shared sidebar, compact sticky progress, dashboard visual polish | `/dashboard`, `/maps`, `/settings` open correctly and `npm run build` passes |
| Sprint 6.3: Challenge target cards | Done | Dashboard `CHALLENGE YOURSELF` block, sidebar reroll actions, localStorage persistence, completion placeholders/celebration state | `/dashboard` shows 3 daily rows + 1 weekly card, reroll works, build passes |
| Sprint 6.4: TMX map enrichment | Done | Backend TMX sync, stored TMX metadata, dashboard TMX links/thumbs for challenge and recommendation cards, Settings TMX sync action | `POST /api/sync/tmx-map-info`, `/dashboard`, and `npm run build` all pass |
| Sprint 6.5: Footer polish | Done | Shared quiet control strip on non-landing frontend pages, landing-page exclusion, subtle hierarchy/hover polish | `/dashboard`, `/maps`, `/settings`, `/design-playground`, and `npm run build` |

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
3. Sprint 5 moved to official Trackmania OAuth and is complete. Continue with Sprint 6: Dashboard MVP.

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

Status: Superseded by Sprint 4.1

Implemented:

- `nadeo_live_service.py` for Nadeo Live leaderboard calls.
- `POST /api/sync/warrior-positions`.
- Uses `/top` only.
- Reads `NADEO_LIVE_TOKEN` from backend `.env`.
- Saves rows into `map_positions`:
  - `position_type = "warrior"`;
  - `score_ms = warrior_time_ms`;
  - `world_position = required position`.
- Maps API already exposes:
  - `required_position`;
  - `difficulty_tier`.
- Frontend has `Sync positions`, `Test top sync`, and result/error messages.

Verified with real token:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/sync/warrior-positions?limit=5&force=true"
```

Result:

- positions were inserted into `map_positions`;
- maps table started showing required position;
- difficulty tier is computed from required position.

Outcome:

- batch position endpoint returns `[]` with the current user token, even though the `top` endpoint works.
- project moved to `/top`-only strategy in Sprint 4.1.

### Sprint 4.1: Top-Only Warrior Positions

Status: Done

Implemented:

- Stopped relying on the documented batch position endpoint for MVP.
- Uses only:
   ```text
   GET /api/token/leaderboard/group/Personal_Best/map/{mapUid}/top?onlyWorld=true&length=100&offset=...
   ```
- For each map:
   - request `offset=9900&length=100`;
   - if Warrior time is worse than the last available top-10000 score, store `position_status = over_10000`;
   - otherwise binary-search the top pages and store the exact required position.
- Added `position_status` to `map_positions`:
   - `exact`;
   - `over_10000`;
   - `not_found`;
   - `failed`.
- Frontend display:
   - `exact` -> `#6533`;
   - `over_10000` -> `10k+`;
   - no row -> `Not synced`.
- Normal sync skips existing `exact` and `over_10000` rows.
- `force=true` can refresh already-synced rows.
- Frontend shows live progress while a long sync is running.
- Full position sync completed successfully.

Reason for `over_10000` sync rule:

- Warrior medals generally become easier over time as more players set records.
- If the required position is currently outside top 10000, the useful display is already `10k+`.
- Rechecking those rows frequently is wasteful; they should only be refreshed manually or if the Warrior time changes in source data.

Progress:

- `GET /api/sync/jobs/latest?job_type=warrior_positions` returns the latest job.
- During sync, `details_json` includes `processed`, `exact`, `over_10000`, `skipped`, and `errors`.
- Frontend polls this endpoint and displays `processed / total`.

Cancellation note:

- There is no cancellation endpoint yet.
- Stopping the backend process interrupts the sync.
- Already committed map positions remain saved.
- The interrupted `sync_jobs` row may stay `running`.
- The next normal sync skips saved `exact` and `over_10000` positions, so it can continue from unsynced maps.

### Sprint 5: Player PB Sync

Status: Done

Implemented:

- `routes_auth_trackmania.py` for official Trackmania OAuth connection flow.
- `trackmania_oauth_service.py` for authorization code exchange, local token storage, and refresh flow.
- `trackmania_records_service.py` for official Trackmania `/api/user/map-records` calls.
- `auth_tokens` SQLite table for local OAuth tokens.
- `POST /api/sync/player-pbs`.
- Reads `TRACKMANIA_CLIENT_ID` and `TRACKMANIA_CLIENT_SECRET` from backend `.env`.
- Batches map IDs in groups of 25 through `mapId[]` query params.
- Stores current records in `player_records`.
- Computes:
  - `has_warrior`;
  - `diff_to_warrior_ms`.
- Writes `player_record_history` only for first-seen PBs and changed PB times.
- Creates one `progress_snapshots` row per PB sync.
- Frontend has Trackmania connection status, connect/disconnect/check actions, `Sync My PBs`, and `Test PB sync`.
- Maps metadata and table refresh after PB sync, so earned/missing/close/not played filters update.
- API verification notes are in `docs/TRACKMANIA_API_CHECK.md`.

Verification:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

```powershell
cd frontend
npm run build
```

Config smoke test without OAuth credentials returns a clear `400`.

```json
{
  "detail": "Trackmania OAuth client id/secret are not configured."
}
```

Real sync requires registering an app at `https://api.trackmania.com`, setting:

```env
TRACKMANIA_CLIENT_ID=...
TRACKMANIA_CLIENT_SECRET=...
TRACKMANIA_REDIRECT_URI=http://localhost:8000/api/auth/trackmania/callback
```

Then connect through `GET /api/auth/trackmania/start` or the frontend Trackmania Account panel.

### Sprint 6: Dashboard MVP

Status: Done

Implemented:

- `GET /api/stats/summary`.
- `stats_repository.py` and `stats_service.py` for dashboard aggregation.
- Dashboard summary metrics:
  - `total_maps`;
  - `earned_count`;
  - `missing_count`;
  - `not_played_count`;
  - `completion_percent`;
  - `close_025_count`;
  - `close_050_count`;
  - `close_100_count`;
  - `close_200_count`;
  - `avg_diff_missing_ms`;
  - `avg_margin_earned_ms`.
- Dashboard top lists:
  - `closest_missing_maps`;
  - `quick_wins`;
  - `best_margin_maps`.
- Latest local visibility blocks:
  - `latest_progress_snapshot`;
  - `latest_sync_jobs` for `warrior_data`, `warrior_positions`, `player_pbs`, and `tmx_map_info`.
- Frontend dashboard-first layout with:
  - overall progress bar;
  - summary cards;
  - close medals block;
  - quick wins block;
  - best margins block;
  - loading skeleton;
  - error state;
  - empty state when PBs are not synced yet.
- Existing maps table, filters, sync controls, and Trackmania account actions remain available through dedicated workspaces.

Verification:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

```powershell
cd backend
.\.venv\Scripts\python.exe -c "from fastapi.testclient import TestClient; from app.main import app; client=TestClient(app); print(client.get('/api/stats/summary').status_code)"
```

```powershell
cd frontend
npm run build
```

Next practical step:

- Sprint 7: Stats page and broader breakdowns, using the new summary/service foundation without duplicating dashboard logic.

### Sprint 6.2: Workspace Split and Dashboard Polish

Status: Done

Implemented:

- `frontend/src/app/App.tsx` now exposes the current production workspace routes:
  - `/` -> `ProgressEntryPage`;
  - `/dashboard` -> `DashboardPage`;
  - `/maps` -> `MapsPage`;
  - `/settings` -> `SettingsPage`;
  - `/design-playground` -> `DesignPlaygroundPage`;
  - `/playground` -> alias to the same design sandbox.
- `DashboardPage` was reduced back to an overview-first surface:
  - keeps overall progress, compact metrics, freshness, close medals, quick wins, and best margins;
  - removes the full maps table from the dashboard;
  - removes sync/account controls from the dashboard.
- `MapsPage` now owns:
  - the full maps database table;
  - filters, search, sorting, and pagination;
  - table-specific semantic row polish.
- `SettingsPage` now owns:
  - sync controls;
  - Trackmania OAuth account actions;
  - latest sync status and job visibility.
- `AppSidebar` is now shared across production workspaces with:
  - fixed desktop sidebar layout;
  - compact sticky-progress card;
  - shared sidebar `DEBUG` block for screenshot/debug actions;
  - navigation to Dashboard, Maps, Settings, and Design Playground.

Verification:

```powershell
cd frontend
npm run build
```

Manual route checks:

```text
/
/dashboard
/maps
/settings
/design-playground
/playground
```

### Sprint 6.3: Challenge Target Cards

Status: Done

Implemented:

- `DashboardPage` now includes a production `CHALLENGE YOURSELF` block directly under the summary stat grid.
- The block uses the existing `GET /api/maps` data and does not require a new backend endpoint.
- Standard dashboard layout:
  - 3 compact daily target rows;
  - 1 weekly challenge card.
- Sidebar actions:
  - `Reroll targets` for the normal next-day / next-week scenario;
  - `Reroll 0-3 targets` for late-progress edge-case testing.
- Production screenshot capture moved out of page hero controls and into the shared sidebar `DEBUG` block.
- The sidebar capture button remains page-aware and captures the current production workspace root.
- The old top-right screenshot button/label pair was removed from dashboard, maps, and settings hero areas.
- `Backend {version}` hero badge is now shown only on `SettingsPage`.
- Global frontend styling now includes a subtle thin glass scrollbar treatment instead of the browser-default scrollbar.
- Browser-event wiring instead of global state:
  - `medalforge:reroll-challenge-targets`;
  - `medalforge:reroll-edge-challenge-targets`.
- Browser persistence:
  - `localStorage` key `medalforge.dashboard.challengeTargets.v1`.
- Edge-case completion flow:
  - placeholder daily cards when there are fewer than 3 real daily targets;
  - celebration / completion card when the edge reroll returns 0 real targets.
- Shared `BEAT NOW` CTA shimmer styling moved into reusable frontend styling and used in production.
- Daily and weekly challenge cards now resolve external links through backend-supplied map metadata:
  - prefer `tmx_url`;
  - fallback to `trackmania_io_url`;
  - fallback to Trackmania.io leaderboard URL built from `map_id` + `map_uid`.
- Weekly Challenge now prefers backend-synced `tmx_thumbnail_url`, with fallback to the stored map thumbnail and then the existing glass placeholder.
- Daily target rows and Weekly Challenge now keep compact chip rows that can show:
  - semantic status;
  - map category;
  - one informational TMX chip when TMX metadata exists.
- The dashboard TMX chip currently prefers the last saved `tmx_tag_names` entry and falls back to `tmx_style_name`.
- Recommendation cards in `Close medals`, `Quick wins`, and `Best margins` now open TMX directly when `tmx_url` exists.
- Recommendation cards currently use a neutral glass row style without the earlier local color highlight tint.
- Clickable recommendation cards expose a small `Open on TMX` affordance instead of adding a larger CTA.
- `Close medals` rows now keep difficulty, category, and one muted TMX chip on a single compact chip line when possible.
- Daily and weekly challenge descriptions are now drawn from stable frontend description pools keyed by card semantic state and `map_uid`, so text does not jump on rerender.
- Dashboard layering was lightly refined with subtle grouped wrappers for:
  - summary stats;
  - recommendation columns;
  - sync telemetry row.
- Sync telemetry wording is now compact `sync ... ago`, and the telemetry row lives below the recommendation area instead of higher in the dashboard flow.
- The desktop split between `Close medals` and `Activity Feed` now uses a `2/5` to `3/5` proportion.

Behavior:

- normal reroll selects not-earned Warrior targets from the standard missing pool;
- weekly challenge prefers `Hard`, `Insane`, and `Demon` maps, with random fallback if those are unavailable;
- edge-case reroll intentionally returns 0 to 3 real maps, then:
  - sends the hardest real card to Weekly Challenge;
  - fills the remaining daily slots with placeholders in fixed order.

Verification:

```powershell
cd frontend
npm run build
```

Manual checks:

```text
/dashboard
- verify CHALLENGE YOURSELF appears below the summary stat grid
- reload and confirm target persistence
- use sidebar reroll buttons and confirm the block updates
- use edge reroll and confirm placeholders / completion state

### Sprint 6.4: TMX Map Enrichment

Status: Done

Implemented:

- `backend/app/services/tmx_sync_service.py` for backend-only Trackmania Exchange enrichment.
- `POST /api/sync/tmx-map-info`.
- lightweight SQLite schema extension on `warrior_maps` with nullable TMX fields:
  - `tmx_track_id`
  - `tmx_url`
  - `tmx_thumbnail_url`
  - `tmx_tags_json`
  - `tmx_tag_names_json`
  - `tmx_difficulty_name`
  - `tmx_route_name`
  - `tmx_length_name`
  - `tmx_style_name`
  - `tmx_type_name`
  - `tmx_synced_at`
- TMX tags dictionary sync through `GET https://trackmania.exchange/api/tags/gettags`.
- TMX map lookup through `GET https://trackmania.exchange/api/maps/get_map_info/uid/{mapUid}` with:
  - `User-Agent: MedalForge/0.1`
  - `Accept: application/json`
  - timeout and lightweight retry behavior.
- `GET /api/maps` and dashboard summary map DTOs now expose TMX-enriched fields for frontend use.
- `SettingsPage` now includes a manual `Sync TMX data` button that runs TMX enrichment with `force=true`.
- Dashboard challenge cards now:
  - open TMX links when available;
  - prefer TMX thumbnails for Weekly Challenge.

Behavior:

- `force=false` skips maps that already have TMX enrichment markers.
- maps not found on TMX do not fail the whole sync;
- sync jobs record `tmx_map_info` history in `sync_jobs`;
- frontend never calls TMX directly.

Verification:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

```powershell
cd backend
.\.venv\Scripts\python.exe - <<'PY'
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
print(client.post("/api/sync/tmx-map-info?limit=5&force=true").json())
print(client.get("/api/maps?limit=2").json()["items"][0])
PY
```

```powershell
cd frontend
npm run build
```

### Sprint 6.5: Shared Footer Polish

Status: Done

Implemented:

- `frontend/src/components/layout/SiteFooter.tsx` as a shared quiet control strip.
- Footer is rendered on:
  - `/dashboard`
  - `/maps`
  - `/settings`
  - `/design-playground`
- Footer is intentionally not rendered on `/` so the progress-entry hero remains centered and composition-first.
- Left side behavior:
  - `MedalForge` routes back to `/`;
  - `TRAIANUSssS` links to the GitHub profile;
  - `GitHub` links to the MedalForge repository.
- Right side behavior:
  - `GitHub` links to the TM Warrior Medals repository;
  - `ezio416` links to the GitHub profile;
  - `TM WARRIOR MEDALS` links to the Openplanet plugin page.
- Visual polish:
  - softer separators;
  - subtle cyan/blue hover states;
  - reduced capsule feel;
  - light inner highlight instead of stronger glow.

Verification:

```powershell
cd frontend
npm run build
```

Manual route checks:

```text
/                    no footer, centered progress-entry hero
/dashboard           footer visible
/maps                footer visible
/settings            footer visible
/design-playground   footer visible
```

### Sprint 6.1: Frontend Visual Foundation

Status: Done

Implemented:

- `frontend/src/app/App.tsx` now resolves the current MVP frontend route structure:
  - `/` -> `ProgressEntryPage`;
  - `/dashboard` -> `DashboardPage`;
  - `/design-playground` -> `DesignPlaygroundPage`;
  - `/playground` -> alias to the same design sandbox.
- `frontend/src/pages/ProgressEntryPage.tsx` as the first production-facing entry screen.
- `frontend/src/components/progress/WarriorProgressBar.tsx` as a reusable global Warrior completion component.
- `frontend/src/pages/DesignPlaygroundPage.tsx` refined into a dedicated mock-only design sandbox for visual-language iteration.
- `frontend/src/styles.css` expanded with:
  - atmospheric playground utilities;
  - progress-entry hero styling;
  - `warrior-progress-*` classes for the signature global completion bar.

Behavior:

- the frontend now opens on a cinematic Warrior progress entry page before the dashboard;
- `Open Dashboard` routes into the real dashboard;
- the design playground remains intentionally isolated from backend/API calls;
- the warm energy-edge progress treatment is reserved for global Warrior completion and should not be reused as a generic bar style.

Verification:

```powershell
cd frontend
npm run build
```

Manual route checks:

```text
/
/dashboard
/design-playground
/playground
```

Notes:

- no backend contracts changed in this pass;
- frontend navigation remains intentionally lightweight and local-history based for the MVP stage;
- the design sandbox is the source of visual experiments before they are promoted into production pages.
