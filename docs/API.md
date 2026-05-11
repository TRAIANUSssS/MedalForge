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
limit=100 (current backend validation allows up to 10000)
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

Map items now include TMX enrichment fields when available:

```json
{
  "tmx_track_id": 291398,
  "tmx_url": "https://trackmania.exchange/mapshow/291398",
  "tmx_thumbnail_url": "https://trackmania.exchange/maps/thumbnail/291398",
  "tmx_tag_names": ["Race", "MultiLap", "Clones"],
  "tmx_difficulty_name": "Intermediate",
  "tmx_route_name": "MultiLap",
  "tmx_length_name": "2 min",
  "tmx_style_name": "Dirt",
  "tmx_type_name": "Race"
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

Uses Nadeo Live `/top` leaderboard pages to find the world position required for each Warrior medal time.

Query params:

```text
limit=optional integer
force=false
```

`limit` is useful for token/API smoke tests before running all maps.
`force=true` rechecks rows that already have `position_status = exact` or `over_10000`.

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
  "skipped": 0,
  "exact": 1200,
  "over_10000": 3359
}
```

Notes:

- position rows are stored in `map_positions` with `position_type = "warrior"`;
- missing `NADEO_LIVE_TOKEN` returns `400`;
- each map is queried individually through `/top`;
- if Warrior time is outside the visible top 10,000, `position_status = "over_10000"` and `world_position = null`;
- `over_10000` rows are not rechecked unless `force=true`.

### GET /api/sync/jobs/latest

Returns the latest sync job, optionally filtered by type.

Query params:

```text
job_type=warrior_positions
```

During position sync, `details_json` includes live progress:

```json
{
  "processed": 42,
  "inserted": 10,
  "updated": 20,
  "skipped": 0,
  "exact": 18,
  "over_10000": 12,
  "errors": []
}
```

### GET /api/auth/trackmania/start

Starts Trackmania OAuth authorization and returns an authorize URL.

Response:

```json
{
  "authorize_url": "https://api.trackmania.com/oauth/authorize?..."
}
```

Requires backend `.env`:

```env
TRACKMANIA_CLIENT_ID=...
TRACKMANIA_CLIENT_SECRET=...
TRACKMANIA_REDIRECT_URI=http://localhost:8000/api/auth/trackmania/callback
```

### GET /api/auth/trackmania/callback

OAuth callback for Trackmania authorization.

Query params:

```text
code=...
state=...
```

The backend validates `state`, exchanges the code for tokens, stores tokens locally in SQLite, and
returns a simple HTML success page.

### GET /api/auth/trackmania/status

Returns local Trackmania connection status without exposing tokens.

Response:

```json
{
  "connected": true,
  "expires_at": "2026-05-07T20:00:00Z",
  "has_refresh_token": true,
  "scopes": ["read_favorite"],
  "account_id": "...",
  "display_name": "Player",
  "last_error": null
}
```

### POST /api/auth/trackmania/disconnect

Deletes locally stored Trackmania OAuth tokens. It does not delete synced player records.

### POST /api/sync/player-pbs

Uses the official Trackmania OAuth API to fetch current player PBs for local Warrior maps.

Query params:

```text
limit=optional integer
```

`limit` is useful for token/API smoke tests before syncing all maps.

Requires a connected Trackmania account. The OAuth app is configured through backend `.env`:

```text
TRACKMANIA_CLIENT_ID=...
TRACKMANIA_CLIENT_SECRET=...
```

Response:

```json
{
  "job_id": 2,
  "status": "success",
  "items_total": 4559,
  "items_success": 1200,
  "items_failed": 0,
  "inserted": 1000,
  "updated": 200,
  "skipped": 300,
  "history_inserted": 250,
  "snapshots_inserted": 1
}
```

Notes:

- `https://api.trackmania.com/api/user/map-records` is queried in batches of 25 map IDs;
- current PBs are stored in `player_records`;
- PB history rows are created only when a PB is first seen or changes;
- each sync creates one aggregate `progress_snapshots` row;
- missing/expired Trackmania OAuth connection returns `400`.

### POST /api/sync/tmx-map-info

Uses the Trackmania Exchange backend API to enrich local Warrior maps with TMX identifiers, links,
thumbnail URLs, tags, and selected metadata.

Query params:

```text
limit=optional integer
force=false
```

`force=true` rechecks all eligible local maps instead of skipping previously synced rows.

Response:

```json
{
  "job_id": 3,
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

- backend calls `GET https://trackmania.exchange/api/maps/get_map_info/uid/{mapUid}`;
- backend also refreshes the TMX tags dictionary through `GET https://trackmania.exchange/api/tags/gettags`;
- TMX requests include `User-Agent: MedalForge/0.1`;
- frontend never calls TMX directly;
- maps not found on TMX are skipped without failing the whole sync.

### GET /api/stats/summary

Returns dashboard summary, top map lists, latest progress snapshot, and latest sync jobs.

Response shape:

```json
{
  "total_maps": 4559,
  "earned_count": 94,
  "missing_count": 70,
  "not_played_count": 4395,
  "played_count": 164,
  "has_player_pbs": true,
  "completion_percent": 2.06,
  "close_025_count": 11,
  "close_050_count": 24,
  "close_100_count": 30,
  "close_200_count": 42,
  "avg_diff_missing_ms": 6364.3,
  "avg_margin_earned_ms": 442.16,
  "closest_missing_maps": [],
  "quick_wins": [],
  "best_margin_maps": [],
  "latest_progress_snapshot": null,
  "latest_sync_jobs": {
    "warrior_data": null,
    "warrior_positions": null,
    "player_pbs": null,
    "tmx_map_info": null
  }
}
```

Summary map lists now also expose TMX-enriched fields:

- `tmx_track_id`
- `tmx_url`
- `tmx_thumbnail_url`
- `tmx_tag_names`
- `tmx_difficulty_name`
- `tmx_route_name`
- `tmx_length_name`
- `tmx_style_name`
- `tmx_type_name`

## Planned MVP Endpoints

### GET /api/settings

Returns local config visibility, token presence, and data freshness. It must not expose token values.

## API Rules

- Frontend calls only local backend endpoints.
- External tokens never leave the backend.
- Sync endpoints should return useful partial failure details.
- Response shapes should be stable before frontend pages depend on them.
