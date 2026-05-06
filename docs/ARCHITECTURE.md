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
    app/            application shell
```

## Backend

Framework: FastAPI

The backend owns all external API access. The frontend should not call Warrior or Nadeo APIs directly.

Current routes:

- `GET /api/health`
- `POST /api/sync/warrior-data`
- `GET /api/maps`

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

## Sync Model

Sync is manual in MVP.

Preferred order:

1. Warrior data
2. Warrior positions
3. Player PBs
4. Progress snapshot

Principles:

- cache raw external responses;
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

- sidebar navigation placeholders;
- summary placeholders;
- backend health badge.

## MVP Boundaries

Do not implement in MVP:

- full Ubisoft/Nadeo login flow;
- PostgreSQL;
- multi-user mode;
- scheduled sync;
- Openplanet plugin;
- import/export;
- complex map details page.
