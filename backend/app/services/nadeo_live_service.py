from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.map_position import MapPosition
from app.models.warrior_map import WarriorMap
from app.repositories.sync_repository import create_sync_job, finish_sync_job


LEADERBOARD_TOP_URL_TEMPLATE = (
    "https://live-services.trackmania.nadeo.live/api/token/leaderboard/group/Personal_Best/map/{map_uid}/top"
)
TOP_PAGE_SIZE = 100
TOP_MAX_OFFSET = 9_900
TOP_LIMIT_POSITION = 10_000

POSITION_EXACT = "exact"
POSITION_OVER_10000 = "over_10000"
POSITION_NOT_FOUND = "not_found"
POSITION_FAILED = "failed"


class NadeoLiveConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class PositionRequestItem:
    map_uid: str
    score_ms: int


@dataclass(frozen=True)
class PositionLookupResult:
    world_position: int | None
    position_status: str


def sync_warrior_positions(
    db: Session,
    settings: Settings,
    *,
    limit: int | None = None,
    force: bool = False,
) -> dict[str, Any]:
    job = create_sync_job(db, "warrior_positions")

    try:
        if not settings.nadeo_live_token:
            raise NadeoLiveConfigError("NADEO_LIVE_TOKEN is not configured")

        maps = get_warrior_position_targets(db, limit=limit, force=force)
        inserted = 0
        updated = 0
        skipped = 0
        failed = 0
        exact = 0
        over_10000 = 0
        errors: list[str] = []

        with httpx.Client(timeout=20.0, follow_redirects=True) as client:
            for item in maps:
                try:
                    result = lookup_position_from_top(client, settings, item)
                    if result.position_status == POSITION_FAILED:
                        failed += 1
                        continue

                    changed = upsert_map_position(db, item, result)
                    if changed == "inserted":
                        inserted += 1
                    else:
                        updated += 1

                    if result.position_status == POSITION_EXACT:
                        exact += 1
                    elif result.position_status == POSITION_OVER_10000:
                        over_10000 += 1
                    else:
                        skipped += 1
                except Exception as exc:
                    db.rollback()
                    failed += 1
                    errors.append(f"{item.map_uid}: {exc}")

        status = "success" if failed == 0 else ("partial" if inserted + updated > 0 else "failed")
        details = {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "exact": exact,
            "over_10000": over_10000,
            "errors": errors[:10],
        }
        finish_sync_job(
            db,
            job,
            status=status,
            items_total=len(maps),
            items_success=inserted + updated,
            items_failed=failed,
            error_message="; ".join(errors[:3]) if errors else None,
            details_json=json.dumps(details, ensure_ascii=False),
        )
        return {
            "job_id": job.id,
            "status": status,
            "items_total": len(maps),
            "items_success": inserted + updated,
            "items_failed": failed,
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "exact": exact,
            "over_10000": over_10000,
        }
    except Exception as exc:
        finish_sync_job(
            db,
            job,
            status="failed",
            items_total=0,
            items_success=0,
            items_failed=1,
            error_message=str(exc),
        )
        raise


def get_warrior_position_targets(db: Session, *, limit: int | None = None, force: bool = False) -> list[PositionRequestItem]:
    existing_position = (
        select(
            MapPosition.map_uid.label("map_uid"),
            MapPosition.score_ms.label("score_ms"),
            MapPosition.position_status.label("position_status"),
        )
        .where(MapPosition.position_type == "warrior")
        .subquery()
    )
    statement = (
        select(WarriorMap.map_uid, WarriorMap.warrior_time_ms)
        .outerjoin(
            existing_position,
            (existing_position.c.map_uid == WarriorMap.map_uid)
            & (existing_position.c.score_ms == WarriorMap.warrior_time_ms),
        )
        .where(WarriorMap.map_uid.is_not(None), WarriorMap.warrior_time_ms.is_not(None))
        .order_by(WarriorMap.id.asc())
    )

    if not force:
        statement = statement.where(
            (existing_position.c.position_status.is_(None))
            | (existing_position.c.position_status.not_in([POSITION_EXACT, POSITION_OVER_10000]))
        )

    if limit is not None:
        statement = statement.limit(limit)

    return [PositionRequestItem(map_uid=map_uid, score_ms=score_ms) for map_uid, score_ms in db.execute(statement)]


def lookup_position_from_top(
    client: httpx.Client,
    settings: Settings,
    item: PositionRequestItem,
) -> PositionLookupResult:
    headers = {"Authorization": format_nadeo_authorization(settings.nadeo_live_token or "")}
    url = LEADERBOARD_TOP_URL_TEMPLATE.format(map_uid=item.map_uid)

    edge_page = fetch_top_page(client, url, headers, TOP_MAX_OFFSET)
    if edge_page:
        edge_record = edge_page[-1]
        edge_score = edge_record.get("score")
        if isinstance(edge_score, int) and item.score_ms > edge_score:
            return PositionLookupResult(world_position=None, position_status=POSITION_OVER_10000)

    position = binary_search_position(client, url, headers, item.score_ms)
    if position is None:
        return PositionLookupResult(world_position=None, position_status=POSITION_NOT_FOUND)
    return PositionLookupResult(world_position=position, position_status=POSITION_EXACT)


def binary_search_position(
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    score_ms: int,
) -> int | None:
    low_page = 0
    high_page = TOP_MAX_OFFSET // TOP_PAGE_SIZE
    candidate_page: list[dict[str, Any]] | None = None

    while low_page <= high_page:
        mid_page = (low_page + high_page) // 2
        offset = mid_page * TOP_PAGE_SIZE
        page = fetch_top_page(client, url, headers, offset)
        if not page:
            high_page = mid_page - 1
            continue

        first_score = page[0].get("score")
        last_score = page[-1].get("score")
        if not isinstance(first_score, int) or not isinstance(last_score, int):
            return None

        if score_ms < first_score:
            high_page = mid_page - 1
        elif score_ms >= last_score:
            low_page = mid_page + 1
            candidate_page = page
        else:
            candidate_page = page
            break

    if candidate_page is None:
        return None

    last_position_at_or_below_score: int | None = None
    for record in candidate_page:
        score = record.get("score")
        position = record.get("position")
        if not isinstance(score, int) or not isinstance(position, int):
            continue
        if score <= score_ms:
            last_position_at_or_below_score = position
        else:
            break

    return last_position_at_or_below_score


def fetch_top_page(
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    offset: int,
) -> list[dict[str, Any]]:
    response = client.get(url, params={"onlyWorld": "true", "length": TOP_PAGE_SIZE, "offset": offset}, headers=headers)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        return []
    tops = payload.get("tops")
    if not isinstance(tops, list) or not tops or not isinstance(tops[0], dict):
        return []
    world_top = tops[0].get("top")
    return [item for item in world_top if isinstance(item, dict)] if isinstance(world_top, list) else []


def upsert_map_position(db: Session, item: PositionRequestItem, result: PositionLookupResult) -> str:
    existing = db.scalar(
        select(MapPosition).where(
            MapPosition.map_uid == item.map_uid,
            MapPosition.position_type == "warrior",
            MapPosition.score_ms == item.score_ms,
        )
    )
    now = datetime.now(timezone.utc)
    if existing is None:
        db.add(
            MapPosition(
                map_uid=item.map_uid,
                position_type="warrior",
                score_ms=item.score_ms,
                world_position=result.world_position,
                position_status=result.position_status,
                fetched_at=now,
            )
        )
        db.commit()
        return "inserted"

    existing.world_position = result.world_position
    existing.position_status = result.position_status
    existing.fetched_at = now
    db.add(existing)
    db.commit()
    return "updated"


def format_nadeo_authorization(token: str) -> str:
    token = token.strip()
    if token.startswith("nadeo_v1"):
        return token
    return f"nadeo_v1 t={token}"
