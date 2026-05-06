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

### POST /api/sync/warrior-data

Refreshes the local Warrior raw cache from the configured source, then parses the local cache and upserts `warrior_maps`.

Query params:

```text
use_cache=false
```

If `use_cache=true`, backend skips the remote refresh and only parses `backend/data/raw/warrior_all.json`.

Source:

```text
https://raw.githubusercontent.com/ezio416/tm-json/main/warrior.json
```

Cache path:

```text
backend/data/raw/warrior_all.json
```

### GET /api/maps

Returns paginated local maps.

Query params:

```text
status=all|earned|missing|close|not_played
category=...
search=...
sort=name|warrior_time_ms|author_time_ms|category|campaign_name|created_at|updated_at
order=asc|desc
limit=100
offset=0
```

Response:

```json
{
  "items": [],
  "total": 0,
  "limit": 100,
  "offset": 0
}
```

### GET /api/maps/meta

Returns metadata for maps table filters.

Response:

```json
{
  "categories": [
    {
      "name": "Totd",
      "count": 2131
    }
  ],
  "status_counts": {
    "all": 4559,
    "earned": 0,
    "missing": 0,
    "close": 0,
    "not_played": 4559
  }
}
```

### POST /api/sync/warrior-positions

Uses Nadeo Live API to fetch the world position required for each Warrior medal time.

Query params:

```text
limit=optional integer
fallback_top=false
```

`limit` is useful for token/API smoke tests before running all maps.
`fallback_top=true` tries to derive missing positions from the first 10,000 rows of the `top` leaderboard. This is useful for debugging and hard maps, but it may require many API calls for large syncs.

Requires backend `.env`:

```text
NADEO_LIVE_TOKEN=...
```

Response:

```json
{
  "job_id": 1,
  "status": "success",
  "items_total": 4559,
  "items_success": 4559,
  "items_failed": 0,
  "inserted": 4559,
  "updated": 0,
  "skipped": 0
}
```

Notes:

- maps are batched by 50 per Nadeo Live request;
- position rows are stored in `map_positions` with `position_type = "warrior"`;
- missing `NADEO_LIVE_TOKEN` returns `400`;
- the batch position endpoint may return an empty list for the current user token; `fallback_top=true` is available as a slower fallback.

## Planned MVP Endpoints

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
