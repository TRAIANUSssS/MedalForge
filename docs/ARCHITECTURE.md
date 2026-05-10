# Architecture

MedalForge is a local single-user fullstack application for Trackmania Warrior Medals analysis.

## Shape

```text
backend/
  app/
    api/            FastAPI route modules
    core/           config, database, app-level wiring
    models/         SQLAlchemy tables
    repositories/   database access helpers
    schemas/        Pydantic request/response contracts
    services/       sync, stats, recommendation logic
  data/
    raw/            cached external API responses
    app.db          local SQLite database

frontend/
  src/
    api/            HTTP client functions
    app/            application shell and small history router
    components/
      playground/   mock-only UI lab building blocks
      progress/     reusable production progress components
    pages/          route-level pages
```

## Backend

Framework: FastAPI

The backend owns all external API access. The frontend should not call Warrior, Nadeo, or Trackmania
OAuth APIs directly.

Current routes:

- `GET /api/health`
- `POST /api/sync/warrior-data`
- `POST /api/sync/warrior-positions`
- `POST /api/sync/player-pbs`
- `GET /api/auth/trackmania/start`
- `GET /api/auth/trackmania/callback`
- `GET /api/auth/trackmania/status`
- `POST /api/auth/trackmania/disconnect`
- `GET /api/maps`
- `GET /api/maps/meta`
- `GET /api/stats/summary`

Planned route groups:

- `routes_sync.py` for manual sync actions
- `routes_maps.py` for maps table data
- `routes_stats.py` for dashboard and analytics data
- `routes_settings.py` for local config/status visibility

## Database

Database: SQLite for MVP.

The current schema is created with SQLAlchemy metadata on application startup. This is acceptable for the early local MVP. If schema changes become frequent or data migration matters, add Alembic before the database becomes valuable.

Tables:

- `warrior_maps` - source map metadata and Warrior medal times
- `map_positions` - world positions for Warrior/author/PB times
- `player_records` - current player PB per map
- `player_record_history` - PB history snapshots
- `progress_snapshots` - aggregate progress over time
- `sync_jobs` - sync history and failure details
- `user_notes` - local notes, tags, and grind status
- `auth_tokens` - local Trackmania OAuth tokens for the single-user app

## Sync Model

Sync is manual in MVP.

Preferred order:

1. Warrior data
2. Warrior positions
3. Connect Trackmania account through OAuth
4. Player PBs
5. Progress snapshot

Principles:

- cache raw external responses;
- store Trackmania OAuth tokens locally and never expose them to frontend responses;
- parse Warrior data from the local raw cache after refresh;
- parse defensively;
- support parsing from local cache when the external source is unavailable;
- store partial results when possible;
- record sync jobs for visibility;
- do not fail a whole sync because one map is malformed.

## Frontend

Framework: React + Vite.

The frontend should consume backend contracts only. It should treat backend responses as the application source of truth and avoid duplicating derived business logic when the backend can compute it.

Current frontend is a shell with:

- history-based route resolution in `frontend/src/app/App.tsx`;
- production entry screen at `/`;
- dashboard page at `/dashboard`;
- maps workspace at `/maps`;
- settings workspace at `/settings`;
- design sandbox at `/design-playground` and `/playground`;
- reusable `WarriorProgressBar` hero component for global completion presentation.

Current frontend route model:

- `/` -> `ProgressEntryPage`
- `/dashboard` -> `DashboardPage`
- `/maps` -> `MapsPage`
- `/settings` -> `SettingsPage`
- `/design-playground` -> `DesignPlaygroundPage`
- `/playground` -> `DesignPlaygroundPage`

Current frontend UI split:

- `ProgressEntryPage` is intentionally minimal and atmospheric, with one central progress artifact.
- `DashboardPage` is the main backend-driven overview surface and now includes a frontend-generated
  `CHALLENGE YOURSELF` block backed by existing `/api/maps` data.
- `MapsPage` owns the full maps table, filters, sorting, and pagination.
- `SettingsPage` owns sync controls, Trackmania OAuth state, and latest sync-job visibility.
- `DesignPlaygroundPage` stays mock-only and is used to refine the visual language before promoting ideas into production pages.

Current production workspace layout:

- desktop uses a fixed left sidebar shell with shared navigation and sticky-progress visibility;
- main workspace content is offset from the fixed sidebar instead of using a sticky split grid;
- mobile/tablet keeps the sidebar as a normal top block.

Current dashboard target-card flow:

- the dashboard fetches maps through the existing `GET /api/maps` endpoint;
- target-card selection is frontend-only and does not have a dedicated backend endpoint yet;
- standard reroll selects normal missing/not-earned targets;
- edge-case reroll can intentionally generate `0-3` real targets to test late-progress states;
- selection is persisted in browser `localStorage`;
- sidebar actions communicate with the dashboard through browser `CustomEvent`s instead of a global state library.

## MVP Boundaries

Do not implement in MVP:

- full Ubisoft/Nadeo login flow;
- PostgreSQL;
- multi-user mode;
- scheduled sync;
- Openplanet plugin;
- import/export;
- complex map details page.
