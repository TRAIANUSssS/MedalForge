# Trackmania API Check

Date: 2026-05-07

## Sources Checked

- Official OAuth docs: https://doc.trackmania.com/web/web-services/auth/
- Official API docs / OpenAPI spec: https://api.trackmania.com/doc and https://api.trackmania.com/doc.json
- Openplanet Nadeo Core account records reference: https://webservices.openplanet.dev/core/records/account-records-v2

## OAuth

Trackmania web API uses OAuth2 through `https://api.trackmania.com`.

Application registration is done at `https://api.trackmania.com`; the app provides an Identifier
(`client_id`) and Secret (`client_secret`). The local redirect URI used by MedalForge is:

```text
http://localhost:8000/api/auth/trackmania/callback
```

Authorization endpoint:

```text
https://api.trackmania.com/oauth/authorize
```

Token endpoint:

```text
https://api.trackmania.com/api/access_token
```

Refresh uses the same token endpoint with `grant_type=refresh_token`.

## Required Scope

The OpenAPI summary for `GET /api/user/map-records` says:

```text
[SCOPE: read_favorite] Get map records of the OAuth user
```

MedalForge therefore requests:

```text
read_favorite
```

## Map Records Endpoint

Endpoint:

```http
GET https://api.trackmania.com/api/user/map-records
Authorization: Bearer <oauth_access_token>
```

Required query parameter:

```text
mapId[]
```

The endpoint does not return all records unfiltered according to the OpenAPI spec; it expects a list
of map IDs. MedalForge can use the existing `warrior_maps.map_id` values and batch them.

Expected response shape from OpenAPI:

```json
[
  {
    "accountId": "string",
    "gameMode": "string",
    "gameModeCustomData": "string",
    "mapId": "string",
    "mapRecordId": "string",
    "medal": 0,
    "removed": false,
    "respawnCount": 0,
    "scopeId": "string",
    "scopeType": "string",
    "score": 0,
    "time": 0,
    "timestamp": "2026-05-07T00:00:00+00:00",
    "url": "string"
  }
]
```

Fields used by MedalForge:

- `accountId` -> `player_records.account_id`
- `mapId` -> match against `warrior_maps.map_id`
- `time` -> `player_records.pb_time_ms`
- `timestamp` -> useful for future history details, not required for MVP

## Curl Examples

Token exchange:

```bash
curl -X POST "https://api.trackmania.com/api/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=$TRACKMANIA_CLIENT_ID" \
  -d "client_secret=$TRACKMANIA_CLIENT_SECRET" \
  -d "code=$CODE" \
  -d "redirect_uri=http://localhost:8000/api/auth/trackmania/callback"
```

Map records:

```bash
curl "https://api.trackmania.com/api/user/map-records?mapId[]=MAP_ID_1&mapId[]=MAP_ID_2" \
  -H "Authorization: Bearer $TRACKMANIA_ACCESS_TOKEN"
```

Refresh:

```bash
curl -X POST "https://api.trackmania.com/api/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=$TRACKMANIA_CLIENT_ID" \
  -d "client_secret=$TRACKMANIA_CLIENT_SECRET" \
  -d "refresh_token=$TRACKMANIA_REFRESH_TOKEN"
```

## Limits and Unknowns

- The OpenAPI spec does not document rate limits.
- The OpenAPI spec does not document a max number of `mapId[]` values per request.
- Manual testing showed the API returns `Too many map ids (25 max)` when requesting 50 or more IDs.
- MedalForge batches 25 map IDs per request.
- Records for maps without a PB are expected to be omitted from the response.
- `pb_position_world` is not provided by this endpoint and remains `null`.

## Decision

`GET /api/user/map-records` is suitable for the PB sync MVP.

Implementation approach:

1. Connect Trackmania account through OAuth authorization code flow.
2. Store bearer access and refresh tokens in local SQLite.
3. Query `/api/user/map-records` with known Warrior `map_id` values in batches.
4. Upsert matching PBs into `player_records`.
5. Compute `has_warrior` and `diff_to_warrior_ms`.
6. Write `player_record_history` only for first-seen or changed PBs.
7. Create `progress_snapshots` after a successful sync.
