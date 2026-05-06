import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.warrior_map import WarriorMap
from app.repositories.sync_repository import create_sync_job, finish_sync_job


RAW_CACHE_PATH = Path("data/raw/warrior_all.json")


@dataclass(frozen=True)
class ParsedWarriorMap:
    map_uid: str
    map_id: str | None
    name: str | None
    author_name: str | None
    category: str | None
    campaign_name: str | None
    campaign_type: str | None
    club_name: str | None
    thumbnail_url: str | None
    trackmania_io_url: str | None
    author_time_ms: int | None
    gold_time_ms: int | None
    silver_time_ms: int | None
    bronze_time_ms: int | None
    warrior_time_ms: int | None
    world_record_time_ms: int | None
    raw_json: str


def sync_warrior_data(db: Session, settings: Settings, *, use_cache: bool = False) -> dict[str, Any]:
    job = create_sync_job(db, "warrior_data")

    try:
        if use_cache:
            payload = load_cached_warrior_payload()
        else:
            payload = fetch_warrior_payload(settings)
            RAW_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            RAW_CACHE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

        result = upsert_warrior_maps(db, payload)
        status = "success" if result["items_failed"] == 0 else "partial"
        finish_sync_job(
            db,
            job,
            status=status,
            items_total=result["items_total"],
            items_success=result["items_success"],
            items_failed=result["items_failed"],
            details_json=json.dumps(result, ensure_ascii=False),
        )
        return {"job_id": job.id, "status": status, **result}
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


def fetch_warrior_payload(settings: Settings) -> Any:
    headers = {}
    if settings.warrior_api_user_agent:
        headers["User-Agent"] = settings.warrior_api_user_agent

    with httpx.Client(timeout=30.0, follow_redirects=True, headers=headers) as client:
        response = client.get(settings.warrior_api_url)
        response.raise_for_status()
        return response.json()


def load_cached_warrior_payload() -> Any:
    if not RAW_CACHE_PATH.exists():
        raise FileNotFoundError(f"Warrior cache not found: {RAW_CACHE_PATH}")
    return json.loads(RAW_CACHE_PATH.read_text(encoding="utf-8"))


def upsert_warrior_maps(db: Session, payload: Any) -> dict[str, int]:
    raw_maps = extract_map_objects(payload)
    parsed_by_uid: dict[str, ParsedWarriorMap] = {}
    inserted = 0
    updated = 0
    skipped = 0
    failed = 0

    for raw_map in raw_maps:
        try:
            parsed = parse_warrior_map(raw_map)
            if parsed is None:
                skipped += 1
                continue
            if parsed.map_uid in parsed_by_uid:
                skipped += 1
                continue
            parsed_by_uid[parsed.map_uid] = parsed
        except Exception:
            failed += 1

    for parsed in parsed_by_uid.values():
        try:
            existing = db.scalar(select(WarriorMap).where(WarriorMap.map_uid == parsed.map_uid))
            if existing is None:
                db.add(_new_warrior_map(parsed))
                inserted += 1
            else:
                _update_warrior_map(existing, parsed)
                updated += 1
        except Exception:
            db.rollback()
            failed += 1

    db.commit()
    return {
        "items_total": len(raw_maps),
        "items_success": inserted + updated,
        "items_failed": failed,
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
    }


def extract_map_objects(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    if not isinstance(payload, dict):
        return []

    for key in ("maps", "items", "data", "records", "medals", "tracks"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]

    category_maps: list[dict[str, Any]] = []
    for key, value in payload.items():
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    category_maps.append({"category": key, **item})
    return category_maps


def parse_warrior_map(raw_map: dict[str, Any]) -> ParsedWarriorMap | None:
    nested_map = _nested_dict(raw_map, "map") or _nested_dict(raw_map, "track") or {}
    merged = {**raw_map, **nested_map}

    map_uid = _first_str(merged, "mapUid", "map_uid", "uid", "trackUid", "track_uid")
    if not map_uid:
        return None

    return ParsedWarriorMap(
        map_uid=map_uid,
        map_id=_first_str(merged, "mapId", "map_id", "id", "trackId", "track_id"),
        name=_first_str(merged, "name", "mapName", "map_name", "trackName", "track_name"),
        author_name=_first_str(merged, "authorName", "author_name", "author", "creatorName", "creator_name"),
        category=_first_str(merged, "category", "type", "collection"),
        campaign_name=_first_str(merged, "campaignName", "campaign_name", "campaign", "seasonName", "season_name"),
        campaign_type=_first_str(merged, "campaignType", "campaign_type"),
        club_name=_first_str(merged, "clubName", "club_name", "club"),
        thumbnail_url=_first_str(merged, "thumbnailUrl", "thumbnail_url", "thumbnail", "imageUrl", "image_url"),
        trackmania_io_url=_first_str(merged, "trackmaniaIoUrl", "trackmania_io_url", "tmioUrl", "tmio_url"),
        author_time_ms=_first_int(merged, "authorTime", "author_time", "authorTimeMs", "author_time_ms"),
        gold_time_ms=_first_int(merged, "goldTime", "gold_time", "goldTimeMs", "gold_time_ms"),
        silver_time_ms=_first_int(merged, "silverTime", "silver_time", "silverTimeMs", "silver_time_ms"),
        bronze_time_ms=_first_int(merged, "bronzeTime", "bronze_time", "bronzeTimeMs", "bronze_time_ms"),
        warrior_time_ms=_first_int(
            merged,
            "warriorTime",
            "warrior_time",
            "warriorTimeMs",
            "warrior_time_ms",
            "medalTime",
            "medal_time",
        ),
        world_record_time_ms=_first_int(merged, "worldRecord", "world_record", "worldRecordTime", "world_record_time"),
        raw_json=json.dumps(raw_map, ensure_ascii=False),
    )


def _new_warrior_map(parsed: ParsedWarriorMap) -> WarriorMap:
    warrior_map = WarriorMap(map_uid=parsed.map_uid)
    _update_warrior_map(warrior_map, parsed)
    return warrior_map


def _update_warrior_map(warrior_map: WarriorMap, parsed: ParsedWarriorMap) -> None:
    for field in (
        "map_id",
        "name",
        "author_name",
        "category",
        "campaign_name",
        "campaign_type",
        "club_name",
        "thumbnail_url",
        "trackmania_io_url",
        "author_time_ms",
        "gold_time_ms",
        "silver_time_ms",
        "bronze_time_ms",
        "warrior_time_ms",
        "world_record_time_ms",
        "raw_json",
    ):
        setattr(warrior_map, field, getattr(parsed, field))

    warrior_map.source = "warrior_api"
    warrior_map.source_updated_at = datetime.now(timezone.utc)


def _nested_dict(data: dict[str, Any], key: str) -> dict[str, Any] | None:
    value = data.get(key)
    return value if isinstance(value, dict) else None


def _first_str(data: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = data.get(key)
        if value is None:
            continue
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, int):
            return str(value)
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
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.isdigit():
                return int(stripped)
    return None
