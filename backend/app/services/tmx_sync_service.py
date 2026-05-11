from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.warrior_map import WarriorMap
from app.repositories.sync_repository import create_sync_job, finish_sync_job, update_sync_job_progress


TMX_MAP_INFO_URL_TEMPLATE = "https://trackmania.exchange/api/maps/get_map_info/uid/{map_uid}"
TMX_TAGS_URL = "https://trackmania.exchange/api/tags/gettags"
TMX_HEADERS = {
    "User-Agent": "MedalForge/0.1",
    "Accept": "application/json",
}
TMX_TIMEOUT = 15.0


@dataclass(frozen=True)
class TmxSyncTarget:
    id: int
    map_uid: str


@dataclass(frozen=True)
class ParsedTmxMapInfo:
    track_id: int | None
    tmx_url: str | None
    tmx_thumbnail_url: str | None
    tag_ids: list[int]
    tag_names: list[str]
    difficulty_name: str | None
    route_name: str | None
    length_name: str | None
    style_name: str | None
    type_name: str | None


def sync_tmx_map_info(
    db: Session,
    *,
    limit: int | None = None,
    force: bool = False,
) -> dict[str, Any]:
    job = create_sync_job(db, "tmx_map_info")

    try:
        targets = get_tmx_sync_targets(db, limit=limit, force=force)
        inserted = 0
        updated = 0
        skipped = 0
        failed = 0
        errors: list[str] = []
        warnings: list[str] = []

        with httpx.Client(timeout=TMX_TIMEOUT, follow_redirects=True, headers=TMX_HEADERS) as client:
            tag_lookup = fetch_tmx_tag_lookup(client)

            for index, target in enumerate(targets, start=1):
                try:
                    payload = fetch_tmx_map_info(client, target.map_uid)
                    if payload is None:
                        mark_tmx_sync_attempt(db, target.id)
                        skipped += 1
                        warnings.append(f"{target.map_uid}: TMX map not found")
                    else:
                        parsed = parse_tmx_map_info(payload, tag_lookup)
                        sync_result = upsert_tmx_map_info(db, target.id, parsed)
                        if sync_result == "inserted":
                            inserted += 1
                        else:
                            updated += 1
                except Exception as exc:
                    db.rollback()
                    failed += 1
                    errors.append(f"{target.map_uid}: {format_tmx_sync_error(exc)}")
                finally:
                    details = {
                        "processed": index,
                        "inserted": inserted,
                        "updated": updated,
                        "skipped": skipped,
                        "warnings": warnings[:10],
                        "errors": errors[:10],
                    }
                    update_sync_job_progress(
                        db,
                        job,
                        items_total=len(targets),
                        items_success=inserted + updated,
                        items_failed=failed,
                        details_json=json.dumps(details, ensure_ascii=False),
                    )

        status = "success" if failed == 0 else ("partial" if inserted + updated > 0 or skipped > 0 else "failed")
        details = {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "warnings": warnings[:10],
            "errors": errors[:10],
        }
        finish_sync_job(
            db,
            job,
            status=status,
            items_total=len(targets),
            items_success=inserted + updated,
            items_failed=failed,
            error_message="; ".join(errors[:3]) if errors else None,
            details_json=json.dumps(details, ensure_ascii=False),
        )
        return {
            "job_id": job.id,
            "status": status,
            "items_total": len(targets),
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


def get_tmx_sync_targets(db: Session, *, limit: int | None = None, force: bool = False) -> list[TmxSyncTarget]:
    statement = (
        select(WarriorMap.id, WarriorMap.map_uid)
        .where(WarriorMap.map_uid.is_not(None))
        .order_by(WarriorMap.id.asc())
    )

    if not force:
        statement = statement.where(WarriorMap.tmx_track_id.is_(None), WarriorMap.tmx_synced_at.is_(None))

    if limit is not None:
        statement = statement.limit(limit)

    return [TmxSyncTarget(id=map_id, map_uid=map_uid) for map_id, map_uid in db.execute(statement)]


def fetch_tmx_tag_lookup(client: httpx.Client) -> dict[int, str]:
    response = client.get(TMX_TAGS_URL)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list):
        return {}

    lookup: dict[int, str] = {}
    for item in payload:
        if not isinstance(item, dict):
            continue
        tag_id = _first_int(item, "ID", "Id", "id")
        name = _first_str(item, "Name", "name")
        if tag_id is None or not name:
            continue
        lookup[tag_id] = name
    return lookup


def fetch_tmx_map_info(client: httpx.Client, map_uid: str) -> dict[str, Any] | None:
    url = TMX_MAP_INFO_URL_TEMPLATE.format(map_uid=map_uid)
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            response = client.get(url)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                if _first_int(payload, "TrackID", "TrackId", "trackId", "track_id") is None:
                    return None
                return payload
            return None
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            if attempt == 0 and exc.response.status_code >= 500:
                last_error = exc
                continue
            raise
        except httpx.RequestError as exc:
            if attempt == 0:
                last_error = exc
                continue
            raise

    if last_error:
        raise last_error
    return None


def parse_tmx_map_info(payload: dict[str, Any], tag_lookup: dict[int, str]) -> ParsedTmxMapInfo:
    track_id = _first_int(payload, "TrackID", "TrackId", "trackId", "track_id")
    has_thumbnail = _first_bool(payload, "HasThumbnail", "hasThumbnail", "has_thumbnail")
    tag_ids = parse_tmx_tags(payload.get("Tags"))
    tag_names = [tag_lookup[tag_id] for tag_id in tag_ids if tag_id in tag_lookup]

    return ParsedTmxMapInfo(
        track_id=track_id,
        tmx_url=f"https://trackmania.exchange/mapshow/{track_id}" if track_id is not None else None,
        tmx_thumbnail_url=f"https://trackmania.exchange/maps/thumbnail/{track_id}" if track_id is not None and has_thumbnail else None,
        tag_ids=tag_ids,
        tag_names=tag_names,
        difficulty_name=_first_str(payload, "DifficultyName", "difficultyName", "difficulty_name"),
        route_name=_first_str(payload, "RouteName", "routeName", "route_name"),
        length_name=_first_str(payload, "LengthName", "lengthName", "length_name"),
        style_name=_first_str(payload, "StyleName", "styleName", "style_name"),
        type_name=_first_str(payload, "TypeName", "typeName", "type_name"),
    )


def upsert_tmx_map_info(db: Session, warrior_map_id: int, parsed: ParsedTmxMapInfo) -> str:
    warrior_map = db.get(WarriorMap, warrior_map_id)
    if warrior_map is None:
        raise RuntimeError(f"Warrior map {warrior_map_id} not found during TMX sync.")

    existed_before = warrior_map.tmx_synced_at is not None
    warrior_map.tmx_track_id = parsed.track_id
    warrior_map.tmx_url = parsed.tmx_url
    warrior_map.tmx_thumbnail_url = parsed.tmx_thumbnail_url
    warrior_map.tmx_tags_json = json.dumps(parsed.tag_ids, ensure_ascii=False)
    warrior_map.tmx_tag_names_json = json.dumps(parsed.tag_names, ensure_ascii=False)
    warrior_map.tmx_difficulty_name = parsed.difficulty_name
    warrior_map.tmx_route_name = parsed.route_name
    warrior_map.tmx_length_name = parsed.length_name
    warrior_map.tmx_style_name = parsed.style_name
    warrior_map.tmx_type_name = parsed.type_name
    warrior_map.tmx_synced_at = datetime.now(timezone.utc)
    db.add(warrior_map)
    db.commit()
    return "updated" if existed_before else "inserted"


def mark_tmx_sync_attempt(db: Session, warrior_map_id: int) -> None:
    warrior_map = db.get(WarriorMap, warrior_map_id)
    if warrior_map is None:
        return
    warrior_map.tmx_track_id = None
    warrior_map.tmx_url = None
    warrior_map.tmx_thumbnail_url = None
    warrior_map.tmx_tags_json = None
    warrior_map.tmx_tag_names_json = None
    warrior_map.tmx_difficulty_name = None
    warrior_map.tmx_route_name = None
    warrior_map.tmx_length_name = None
    warrior_map.tmx_style_name = None
    warrior_map.tmx_type_name = None
    warrior_map.tmx_synced_at = datetime.now(timezone.utc)
    db.add(warrior_map)
    db.commit()


def parse_tmx_tags(value: Any) -> list[int]:
    if value is None:
        return []
    if isinstance(value, int):
        return [value]
    if isinstance(value, list):
        result: list[int] = []
        for item in value:
            parsed = _coerce_int(item)
            if parsed is not None:
                result.append(parsed)
        return result
    if isinstance(value, str):
        parts = [part.strip() for part in value.split(",")]
        result: list[int] = []
        for part in parts:
            if not part:
                continue
            parsed = _coerce_int(part)
            if parsed is not None:
                result.append(parsed)
        return result
    return []


def format_tmx_sync_error(exc: Exception) -> str:
    if isinstance(exc, httpx.HTTPStatusError):
        response = exc.response
        return f"HTTP {response.status_code} {response.reason_phrase} from {response.request.url.path}"
    return str(exc)


def _first_str(data: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = data.get(key)
        if value is None:
            continue
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _first_int(data: dict[str, Any], *keys: str) -> int | None:
    for key in keys:
        parsed = _coerce_int(data.get(key))
        if parsed is not None:
            return parsed
    return None


def _first_bool(data: dict[str, Any], *keys: str) -> bool:
    for key in keys:
        value = data.get(key)
        if isinstance(value, bool):
            return value
        if isinstance(value, int):
            return value != 0
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "1", "yes"}:
                return True
            if lowered in {"false", "0", "no"}:
                return False
    return False


def _coerce_int(value: Any) -> int | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.isdigit():
            return int(stripped)
    return None
