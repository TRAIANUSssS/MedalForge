from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.player_record import PlayerRecord
from app.models.player_record_history import PlayerRecordHistory
from app.models.progress_snapshot import ProgressSnapshot
from app.models.warrior_map import WarriorMap
from app.repositories.auth_repository import get_trackmania_token
from app.repositories.sync_repository import create_sync_job, finish_sync_job, update_sync_job_progress
from app.services.trackmania_oauth_service import TrackmaniaOAuthError, get_valid_access_token


TRACKMANIA_MAP_RECORDS_PATH = "/api/user/map-records"
MAP_RECORD_BATCH_SIZE = 25


class TrackmaniaRecordsParseError(RuntimeError):
    pass


@dataclass(frozen=True)
class PlayerPbTarget:
    map_uid: str
    map_id: str
    warrior_time_ms: int


@dataclass(frozen=True)
class TrackmaniaMapRecord:
    account_id: str
    map_id: str
    pb_time_ms: int
    timestamp: str | None = None


def sync_player_pbs_from_trackmania(
    db: Session,
    settings: Settings,
    *,
    limit: int | None = None,
) -> dict[str, Any]:
    job = create_sync_job(db, "player_pbs")

    try:
        access_token = get_valid_access_token(db, settings)
        token_record = get_trackmania_token(db)
        targets = get_player_pb_targets(db, limit=limit)
        target_by_map_id = {target.map_id: target for target in targets}
        account_id = token_record.provider_account_id if token_record else None

        inserted = 0
        updated = 0
        skipped = 0
        failed_batches = 0
        history_inserted = 0
        processed = 0
        errors: list[str] = []

        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            for batch in chunked(targets, MAP_RECORD_BATCH_SIZE):
                processed += len(batch)
                try:
                    records = fetch_current_user_map_records(client, settings, access_token, [item.map_id for item in batch])
                    for record in records:
                        target = target_by_map_id.get(record.map_id)
                        if target is None:
                            skipped += 1
                            continue
                        account_id = account_id or record.account_id
                        result = upsert_player_record(db, record.account_id, target, record)
                        if result == "inserted":
                            inserted += 1
                            history_inserted += 1
                        elif result == "updated":
                            updated += 1
                            history_inserted += 1
                        else:
                            skipped += 1
                except Exception as exc:
                    db.rollback()
                    failed_batches += 1
                    errors.append(f"batch {processed - len(batch) + 1}-{processed}: {format_sync_error(exc)}")
                finally:
                    details = {
                        "processed": processed,
                        "inserted": inserted,
                        "updated": updated,
                        "skipped": skipped,
                        "history_inserted": history_inserted,
                        "errors": errors[:10],
                    }
                    update_sync_job_progress(
                        db,
                        job,
                        items_total=len(targets),
                        items_success=inserted + updated,
                        items_failed=failed_batches,
                        details_json=json.dumps(details, ensure_ascii=False),
                    )

        snapshot_account_id = account_id or (token_record.provider_account_id if token_record else "trackmania")
        snapshots_inserted = create_progress_snapshot(db, snapshot_account_id) if failed_batches == 0 else 0
        status = "success" if failed_batches == 0 else ("partial" if inserted + updated > 0 else "failed")
        details = {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "history_inserted": history_inserted,
            "snapshots_inserted": snapshots_inserted,
            "errors": errors[:10],
        }
        finish_sync_job(
            db,
            job,
            status=status,
            items_total=len(targets),
            items_success=inserted + updated,
            items_failed=failed_batches,
            error_message="; ".join(errors[:3]) if errors else None,
            details_json=json.dumps(details, ensure_ascii=False),
        )
        return {
            "job_id": job.id,
            "status": status,
            "items_total": len(targets),
            "items_success": inserted + updated,
            "items_failed": failed_batches,
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "history_inserted": history_inserted,
            "snapshots_inserted": snapshots_inserted,
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


def fetch_current_user_map_records(
    client: httpx.Client,
    settings: Settings,
    access_token: str,
    map_ids: list[str],
) -> list[TrackmaniaMapRecord]:
    if not map_ids:
        return []

    response = client.get(
        f"{settings.trackmania_api_base_url.rstrip('/')}{TRACKMANIA_MAP_RECORDS_PATH}",
        params=[("mapId[]", map_id) for map_id in map_ids],
        headers={"Authorization": f"Bearer {access_token}"},
    )
    response.raise_for_status()
    return parse_map_records_response(response.json())


def parse_map_records_response(payload: Any) -> list[TrackmaniaMapRecord]:
    if not isinstance(payload, list):
        raise TrackmaniaRecordsParseError("Trackmania map-records response was not a list.")

    parsed: list[TrackmaniaMapRecord] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        account_id = item.get("accountId")
        map_id = item.get("mapId")
        time_ms = item.get("time")
        timestamp = item.get("timestamp")
        if not isinstance(account_id, str) or not isinstance(map_id, str) or not isinstance(time_ms, int):
            continue
        parsed.append(
            TrackmaniaMapRecord(
                account_id=account_id,
                map_id=map_id,
                pb_time_ms=time_ms,
                timestamp=timestamp if isinstance(timestamp, str) else None,
            )
        )
    return parsed


def get_player_pb_targets(db: Session, *, limit: int | None = None) -> list[PlayerPbTarget]:
    statement = (
        select(WarriorMap.map_uid, WarriorMap.map_id, WarriorMap.warrior_time_ms)
        .where(WarriorMap.map_id.is_not(None), WarriorMap.warrior_time_ms.is_not(None))
        .order_by(WarriorMap.id.asc())
    )
    if limit is not None:
        statement = statement.limit(limit)

    return [
        PlayerPbTarget(map_uid=map_uid, map_id=map_id, warrior_time_ms=warrior_time_ms)
        for map_uid, map_id, warrior_time_ms in db.execute(statement)
        if map_id is not None and warrior_time_ms is not None
    ]


def upsert_player_record(
    db: Session,
    account_id: str,
    target: PlayerPbTarget,
    record: TrackmaniaMapRecord,
) -> str:
    now = datetime.now(timezone.utc)
    has_warrior = record.pb_time_ms <= target.warrior_time_ms
    diff_to_warrior_ms = record.pb_time_ms - target.warrior_time_ms

    existing = db.scalar(
        select(PlayerRecord).where(
            PlayerRecord.account_id == account_id,
            PlayerRecord.map_uid == target.map_uid,
        )
    )

    if existing is None:
        db.add(
            PlayerRecord(
                account_id=account_id,
                map_uid=target.map_uid,
                map_id=target.map_id,
                pb_time_ms=record.pb_time_ms,
                pb_position_world=None,
                has_warrior=has_warrior,
                diff_to_warrior_ms=diff_to_warrior_ms,
                fetched_at=now,
            )
        )
        add_record_history(db, account_id, target, record.pb_time_ms, diff_to_warrior_ms, has_warrior, now)
        db.commit()
        return "inserted"

    changed = existing.pb_time_ms != record.pb_time_ms
    existing.map_id = target.map_id
    existing.pb_time_ms = record.pb_time_ms
    existing.pb_position_world = None
    existing.has_warrior = has_warrior
    existing.diff_to_warrior_ms = diff_to_warrior_ms
    existing.fetched_at = now
    db.add(existing)
    if changed:
        add_record_history(db, account_id, target, record.pb_time_ms, diff_to_warrior_ms, has_warrior, now)
        db.commit()
        return "updated"

    db.commit()
    return "unchanged"


def add_record_history(
    db: Session,
    account_id: str,
    target: PlayerPbTarget,
    pb_time_ms: int,
    diff_to_warrior_ms: int,
    has_warrior: bool,
    recorded_at: datetime,
) -> None:
    db.add(
        PlayerRecordHistory(
            account_id=account_id,
            map_uid=target.map_uid,
            map_id=target.map_id,
            pb_time_ms=pb_time_ms,
            diff_to_warrior_ms=diff_to_warrior_ms,
            has_warrior=has_warrior,
            source="trackmania_oauth",
            recorded_at=recorded_at,
        )
    )


def create_progress_snapshot(db: Session, account_id: str) -> int:
    total_maps = db.scalar(select(func.count(WarriorMap.id))) or 0
    earned = (
        db.scalar(
            select(func.count(PlayerRecord.id)).where(
                PlayerRecord.account_id == account_id,
                PlayerRecord.has_warrior.is_(True),
            )
        )
        or 0
    )
    missing = (
        db.scalar(
            select(func.count(PlayerRecord.id)).where(
                PlayerRecord.account_id == account_id,
                PlayerRecord.has_warrior.is_(False),
                PlayerRecord.pb_time_ms.is_not(None),
            )
        )
        or 0
    )
    played = earned + missing
    not_played = max(total_maps - played, 0)
    avg_diff_missing = db.scalar(
        select(func.avg(PlayerRecord.diff_to_warrior_ms)).where(
            PlayerRecord.account_id == account_id,
            PlayerRecord.diff_to_warrior_ms > 0,
        )
    )
    avg_margin_earned = db.scalar(
        select(func.avg(0 - PlayerRecord.diff_to_warrior_ms)).where(
            PlayerRecord.account_id == account_id,
            PlayerRecord.has_warrior.is_(True),
            PlayerRecord.diff_to_warrior_ms.is_not(None),
        )
    )

    db.add(
        ProgressSnapshot(
            account_id=account_id,
            total_maps=total_maps,
            earned_warrior_count=earned,
            missing_warrior_count=missing,
            completion_percent=(earned / total_maps * 100) if total_maps else 0.0,
            close_025_count=count_missing_within(db, account_id, 250),
            close_050_count=count_missing_within(db, account_id, 500),
            close_100_count=count_missing_within(db, account_id, 1000),
            close_200_count=count_missing_within(db, account_id, 2000),
            not_played_count=not_played,
            avg_diff_missing_ms=float(avg_diff_missing) if avg_diff_missing is not None else None,
            avg_margin_earned_ms=float(avg_margin_earned) if avg_margin_earned is not None else None,
            snapshot_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    return 1


def count_missing_within(db: Session, account_id: str, threshold_ms: int) -> int:
    return (
        db.scalar(
            select(func.count(PlayerRecord.id)).where(
                PlayerRecord.account_id == account_id,
                PlayerRecord.diff_to_warrior_ms > 0,
                PlayerRecord.diff_to_warrior_ms <= threshold_ms,
            )
        )
        or 0
    )


def chunked(items: list[PlayerPbTarget], size: int) -> list[list[PlayerPbTarget]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def format_sync_error(exc: Exception) -> str:
    if isinstance(exc, httpx.HTTPStatusError):
        response = exc.response
        return f"HTTP {response.status_code} {response.reason_phrase} from {response.request.url.path}"
    if isinstance(exc, TrackmaniaOAuthError):
        return str(exc)
    return str(exc)
