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


LEADERBOARD_POSITION_URL = "https://live-services.trackmania.nadeo.live/api/token/leaderboard/group/map"
LEADERBOARD_TOP_URL_TEMPLATE = (
    "https://live-services.trackmania.nadeo.live/api/token/leaderboard/group/Personal_Best/map/{map_uid}/top"
)
WARRIOR_POSITION_BATCH_SIZE = 50
TOP_FALLBACK_PAGE_SIZE = 100
TOP_FALLBACK_MAX_OFFSET = 9_900


class NadeoLiveConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class PositionRequestItem:
    map_uid: str
    score_ms: int


def sync_warrior_positions(
    db: Session,
    settings: Settings,
    *,
    limit: int | None = None,
    fallback_top: bool = False,
) -> dict[str, Any]:
    job = create_sync_job(db, "warrior_positions")

    try:
        if not settings.nadeo_live_token:
            raise NadeoLiveConfigError("NADEO_LIVE_TOKEN is not configured")

        maps = get_warrior_position_targets(db, limit=limit)
        inserted = 0
        updated = 0
        skipped = 0
        failed = 0
        errors: list[str] = []

        for batch in chunked(maps, WARRIOR_POSITION_BATCH_SIZE):
            try:
                payload = fetch_positions_batch(settings, batch)
                positions = extract_positions(payload)
                if fallback_top:
                    positions.update(fetch_missing_positions_from_top(settings, batch, positions))
                now = datetime.now(timezone.utc)

                for item in batch:
                    position = positions.get(item.map_uid)
                    if position is None:
                        skipped += 1
                        continue

                    existing = db.scalar(
                        select(MapPosition).where(
                            MapPosition.map_uid == item.map_uid,
                            MapPosition.position_type == "warrior",
                            MapPosition.score_ms == item.score_ms,
                        )
                    )
                    if existing is None:
                        db.add(
                            MapPosition(
                                map_uid=item.map_uid,
                                position_type="warrior",
                                score_ms=item.score_ms,
                                world_position=position,
                                fetched_at=now,
                            )
                        )
                        inserted += 1
                    else:
                        existing.world_position = position
                        existing.fetched_at = now
                        db.add(existing)
                        updated += 1

                db.commit()
            except Exception as exc:
                db.rollback()
                failed += len(batch)
                errors.append(str(exc))

        status = "success" if failed == 0 else ("partial" if inserted + updated > 0 else "failed")
        details = {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
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


def get_warrior_position_targets(db: Session, *, limit: int | None = None) -> list[PositionRequestItem]:
    statement = (
        select(WarriorMap.map_uid, WarriorMap.warrior_time_ms)
        .where(WarriorMap.map_uid.is_not(None), WarriorMap.warrior_time_ms.is_not(None))
        .order_by(WarriorMap.id.asc())
    )
    if limit is not None:
        statement = statement.limit(limit)

    return [PositionRequestItem(map_uid=map_uid, score_ms=score_ms) for map_uid, score_ms in db.execute(statement)]


def fetch_positions_batch(settings: Settings, batch: list[PositionRequestItem]) -> Any:
    params = [(f"scores[{item.map_uid}]", str(item.score_ms)) for item in batch]
    body = {"maps": [{"mapUid": item.map_uid, "groupUid": "Personal_Best"} for item in batch]}
    headers = {"Authorization": format_nadeo_authorization(settings.nadeo_live_token)}

    with httpx.Client(timeout=45.0, follow_redirects=True) as client:
        response = client.post(LEADERBOARD_POSITION_URL, params=params, json=body, headers=headers)
        response.raise_for_status()
        return response.json()


def fetch_missing_positions_from_top(
    settings: Settings,
    batch: list[PositionRequestItem],
    positions: dict[str, int],
) -> dict[str, int]:
    found: dict[str, int] = {}
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for item in batch:
            if item.map_uid in positions:
                continue
            position = fetch_position_from_top(client, settings, item)
            if position is not None:
                found[item.map_uid] = position
    return found


def fetch_position_from_top(
    client: httpx.Client,
    settings: Settings,
    item: PositionRequestItem,
) -> int | None:
    headers = {"Authorization": format_nadeo_authorization(settings.nadeo_live_token or "")}
    url = LEADERBOARD_TOP_URL_TEMPLATE.format(map_uid=item.map_uid)

    low_page = 0
    high_page = TOP_FALLBACK_MAX_OFFSET // TOP_FALLBACK_PAGE_SIZE
    candidate_page: list[dict[str, Any]] | None = None

    while low_page <= high_page:
        mid_page = (low_page + high_page) // 2
        offset = mid_page * TOP_FALLBACK_PAGE_SIZE
        page = fetch_top_page(client, url, headers, offset)
        if not page:
            high_page = mid_page - 1
            continue

        first_score = page[0].get("score")
        last_score = page[-1].get("score")
        if not isinstance(first_score, int) or not isinstance(last_score, int):
            return None

        if item.score_ms < first_score:
            high_page = mid_page - 1
        elif item.score_ms >= last_score:
            low_page = mid_page + 1
            candidate_page = page
        else:
            candidate_page = page
            break

    if candidate_page is None:
        return None

    last_record = candidate_page[-1]
    if (
        last_record.get("position") == TOP_FALLBACK_MAX_OFFSET + TOP_FALLBACK_PAGE_SIZE
        and isinstance(last_record.get("score"), int)
        and item.score_ms > last_record["score"]
    ):
        return None

    last_position_at_or_below_score: int | None = None
    for record in candidate_page:
        score = record.get("score")
        position = record.get("position")
        if not isinstance(score, int) or not isinstance(position, int):
            continue
        if score <= item.score_ms:
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
    response = client.get(url, params={"onlyWorld": "true", "length": TOP_FALLBACK_PAGE_SIZE, "offset": offset}, headers=headers)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        return []
    tops = payload.get("tops")
    if not isinstance(tops, list) or not tops:
        return []
    if not isinstance(tops[0], dict):
        return []
    world_top = tops[0].get("top")
    return [item for item in world_top if isinstance(item, dict)] if isinstance(world_top, list) else []


def format_nadeo_authorization(token: str) -> str:
    token = token.strip()
    if token.startswith("nadeo_v1"):
        return token
    return f"nadeo_v1 t={token}"


def extract_positions(payload: Any) -> dict[str, int]:
    found: dict[str, int] = {}
    _walk_position_payload(payload, found)
    return found


def _walk_position_payload(value: Any, found: dict[str, int]) -> None:
    if isinstance(value, dict):
        map_uid = _first_str(value, "mapUid", "map_uid", "uid")
        position = _first_int(value, "position", "rank", "worldPosition", "world_position")
        zone_position = _position_from_zones(value.get("zones"))

        if map_uid and position is not None:
            found[map_uid] = position
        elif map_uid and zone_position is not None:
            found[map_uid] = zone_position

        for key, nested in value.items():
            if isinstance(nested, dict):
                nested_position = _first_int(nested, "position", "rank", "worldPosition", "world_position")
                if nested_position is not None and looks_like_map_uid(key):
                    found[key] = nested_position
            _walk_position_payload(nested, found)
    elif isinstance(value, list):
        for item in value:
            _walk_position_payload(item, found)


def _position_from_zones(zones: Any) -> int | None:
    if not isinstance(zones, list):
        return None

    first_position: int | None = None
    for zone in zones:
        if not isinstance(zone, dict):
            continue
        ranking = zone.get("ranking")
        if not isinstance(ranking, dict):
            continue
        position = _first_int(ranking, "position", "rank", "worldPosition", "world_position")
        if position is None:
            continue
        if first_position is None:
            first_position = position
        if zone.get("zoneName") == "World":
            return position
    return first_position


def looks_like_map_uid(value: str) -> bool:
    return len(value) >= 20 and " " not in value and "/" not in value


def chunked(items: list[PositionRequestItem], size: int) -> list[list[PositionRequestItem]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def _first_str(data: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _first_int(data: dict[str, Any], *keys: str) -> int | None:
    for key in keys:
        value = data.get(key)
        if isinstance(value, bool) or value is None:
            continue
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value)
        if isinstance(value, str) and value.strip().isdigit():
            return int(value.strip())
    return None
