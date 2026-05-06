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
