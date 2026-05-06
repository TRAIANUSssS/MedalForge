# Decisions

Short records of project decisions. Add new entries when a decision changes implementation direction or prevents repeated discussion.

## 2026-05-06: Use SQLite for MVP

Decision:

- Use SQLite as the local database for MVP.

Why:

- The tool is local and single-user.
- It avoids running a separate database service.
- Backup and inspection are simple.
- SQLAlchemy keeps a future PostgreSQL path open.

Consequences:

- Use portable SQLAlchemy patterns where practical.
- Add Alembic later if schema migration becomes important.

## 2026-05-06: Manual Sync First

Decision:

- Sync actions are manual in MVP.

Why:

- External Warrior/Nadeo APIs should not be called unnecessarily.
- Manual sync is easier to debug.
- It keeps early backend behavior predictable.

Consequences:

- Settings page should expose sync buttons and latest sync status.
- Scheduled sync can be added after MVP.

## 2026-05-06: Backend Owns External API Calls

Decision:

- Frontend never calls Warrior or Nadeo APIs directly.

Why:

- Tokens must stay backend-local.
- Raw response caching and defensive parsing belong on the backend.
- Frontend should consume stable local API contracts.

Consequences:

- Add backend endpoints before adding frontend features that need new data.
- Store raw external responses for debugging.

## 2026-05-06: No Full Nadeo Auth in MVP

Decision:

- MVP reads Nadeo tokens from `backend/.env`.

Why:

- Full Ubisoft/Nadeo login and refresh flow is a separate product feature.
- The first useful version only needs a local authenticated user.

Consequences:

- Token expiration should produce clear Settings/sync errors.
- Real token values must never be committed.

## 2026-05-06: Support Warrior Raw Cache Parsing

Decision:

- `POST /api/sync/warrior-data?use_cache=true` parses `backend/data/raw/warrior_all.json` without calling the external endpoint.

Why:

- The Warrior source endpoint currently rejects normal backend requests with `401`.
- Keeping the parser and upsert testable without network access makes Sprint 2 progress possible.
- Raw cache parsing is useful for debugging even after direct sync works.

Consequences:

- The UI exposes both direct sync and local cache parse actions.
- Sprint 2 is not fully complete until real Warrior data is parsed successfully.

## 2026-05-06: Use GitHub Raw Warrior JSON Source

Decision:

- Use `https://raw.githubusercontent.com/ezio416/tm-json/main/warrior.json` as the default `WARRIOR_API_URL`.

Why:

- It exposes the same Warrior data as public JSON without the plugin-only restriction.
- It is expected to update when new maps are added.
- The existing parser supports its category-based structure.

Consequences:

- Direct `POST /api/sync/warrior-data` is now the normal sync path.
- The old `e416.dev` endpoint is no longer the default.
- Local cache parsing remains useful for offline/debug sync.

## 2026-05-06: Warrior Sync Is Cache-First

Decision:

- Warrior data import always parses `backend/data/raw/warrior_all.json`.
- Normal sync first refreshes that file from the configured source URL, then parses it.

Why:

- The local raw file is the inspectable source of truth for backend parsing.
- It makes debugging parser changes easier.
- It keeps `use_cache=true` and normal sync behavior aligned.

Consequences:

- `POST /api/sync/warrior-data` means refresh cache and import.
- `POST /api/sync/warrior-data?use_cache=true` means import existing cache only.

## 2026-05-06: Warrior Positions Are Batched

Decision:

- Fetch Warrior required positions from Nadeo Live in batches of 50 maps.

Why:

- The Nadeo Live endpoint supports up to 50 maps per request.
- Batch failures should not discard already successful batches.
- `sync_jobs` can report partial sync state.

Consequences:

- `POST /api/sync/warrior-positions?limit=5` is available for smoke testing.
- Full sync may take many API calls and should remain a manual action in MVP.

## 2026-05-06: Add Top Leaderboard Fallback For Positions

Decision:

- Add `fallback_top=true` to `POST /api/sync/warrior-positions`.

Why:

- The documented batch position endpoint currently returns `[]` for the user token.
- The `top` leaderboard endpoint works with the same token.
- The fallback can populate positions when Warrior time is within the first 10,000 leaderboard rows.

Consequences:

- `fallback_top=true` is useful for smoke tests and hard maps.
- It is not a perfect replacement for the batch position endpoint because easy maps may require positions beyond the visible top 10,000.
- Full fallback sync can be slow and should be run deliberately.
