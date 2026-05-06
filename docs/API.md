# API

Backend base URL for local development:

```text
http://localhost:8000
```

## Current Endpoints

### GET /api/health

Returns backend status and app version.

Response:

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

## Planned MVP Endpoints

### POST /api/sync/warrior-data

Fetches Warrior medal source data, saves raw JSON, parses maps, and upserts `warrior_maps`.

Planned response:

```json
{
  "job_id": 1,
  "status": "success",
  "items_total": 4213,
  "items_success": 4213,
  "items_failed": 0,
  "inserted": 4213,
  "updated": 0,
  "skipped": 0
}
```

### GET /api/maps

Returns paginated maps for the table UI.

Planned query params:

```text
status=all|earned|missing|close|not_played
category=...
difficulty=...
search=...
sort=warrior_time_ms
order=asc|desc
limit=100
offset=0
```

Planned response:

```json
{
  "items": [],
  "total": 0,
  "limit": 100,
  "offset": 0
}
```

### POST /api/sync/warrior-positions

Uses Nadeo Live API to fetch required world position for Warrior times.

### POST /api/sync/player-pbs

Uses Nadeo Core API to fetch current player PBs.

### GET /api/stats/summary

Returns dashboard summary and top map lists.

### GET /api/settings

Returns local config visibility, token presence, and data freshness. It must not expose token values.

## API Rules

- Frontend calls only local backend endpoints.
- External tokens never leave the backend.
- Sync endpoints should return useful partial failure details.
- Response shapes should be stable before frontend pages depend on them.
