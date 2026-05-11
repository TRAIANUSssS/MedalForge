from __future__ import annotations

import json
from collections.abc import Sequence

from sqlalchemy import Select, case, desc, func, select
from sqlalchemy.orm import Session

from app.models.auth_token import AuthToken
from app.models.map_position import MapPosition
from app.models.player_record import PlayerRecord
from app.models.progress_snapshot import ProgressSnapshot
from app.models.sync_job import SyncJob
from app.models.warrior_map import WarriorMap
from app.services.difficulty import difficulty_tier_from_position


def resolve_primary_account_id(db: Session) -> str | None:
    token_account_id = db.scalar(
        select(AuthToken.provider_account_id)
        .where(AuthToken.provider == "trackmania", AuthToken.provider_account_id.is_not(None))
        .limit(1)
    )
    if token_account_id:
        return token_account_id

    snapshot_account_id = db.scalar(
        select(ProgressSnapshot.account_id)
        .order_by(ProgressSnapshot.snapshot_at.desc(), ProgressSnapshot.id.desc())
        .limit(1)
    )
    if snapshot_account_id:
        return snapshot_account_id

    return db.scalar(select(PlayerRecord.account_id).order_by(PlayerRecord.updated_at.desc(), PlayerRecord.id.desc()).limit(1))


def get_summary_counts(db: Session, *, account_id: str | None) -> dict[str, float | int | bool | None]:
    total_maps = db.scalar(select(func.count(WarriorMap.id))) or 0
    earned_count = _count_player_records(db, account_id=account_id, predicate=PlayerRecord.has_warrior.is_(True))
    missing_count = _count_player_records(
        db,
        account_id=account_id,
        predicate=(PlayerRecord.has_warrior.is_(False), PlayerRecord.pb_time_ms.is_not(None)),
    )
    played_count = earned_count + missing_count
    not_played_count = max(total_maps - played_count, 0)
    avg_diff_missing_ms = _avg_player_records(
        db,
        account_id=account_id,
        expression=PlayerRecord.diff_to_warrior_ms,
        predicate=(PlayerRecord.diff_to_warrior_ms > 0,),
    )
    avg_margin_earned_ms = _avg_player_records(
        db,
        account_id=account_id,
        expression=0 - PlayerRecord.diff_to_warrior_ms,
        predicate=(PlayerRecord.has_warrior.is_(True), PlayerRecord.diff_to_warrior_ms.is_not(None)),
    )

    return {
        "total_maps": total_maps,
        "earned_count": earned_count,
        "missing_count": missing_count,
        "not_played_count": not_played_count,
        "played_count": played_count,
        "has_player_pbs": played_count > 0,
        "completion_percent": (earned_count / total_maps * 100) if total_maps else 0.0,
        "close_025_count": _count_player_records(
            db,
            account_id=account_id,
            predicate=(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 250),
        ),
        "close_050_count": _count_player_records(
            db,
            account_id=account_id,
            predicate=(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 500),
        ),
        "close_100_count": _count_player_records(
            db,
            account_id=account_id,
            predicate=(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 1000),
        ),
        "close_200_count": _count_player_records(
            db,
            account_id=account_id,
            predicate=(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 2000),
        ),
        "avg_diff_missing_ms": avg_diff_missing_ms,
        "avg_margin_earned_ms": avg_margin_earned_ms,
    }


def list_closest_missing_maps(db: Session, *, account_id: str | None, limit: int = 6) -> list[dict]:
    statement = (
        _summary_maps_statement(account_id=account_id)
        .where(PlayerRecord.diff_to_warrior_ms > 0)
        .order_by(PlayerRecord.diff_to_warrior_ms.asc(), desc("quick_win_rank"), WarriorMap.name.asc())
        .limit(limit)
    )
    return [_summary_row_to_dict(row) for row in db.execute(statement).all()]


def list_quick_wins(db: Session, *, account_id: str | None, limit: int = 6) -> list[dict]:
    base_statement = (
        _summary_maps_statement(account_id=account_id)
        .where(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 2000)
        .order_by(desc("quick_win_rank"), PlayerRecord.diff_to_warrior_ms.asc(), WarriorMap.name.asc())
        .limit(limit)
    )
    quick_wins = [_summary_row_to_dict(row) for row in db.execute(base_statement).all()]
    if quick_wins:
        return quick_wins

    fallback_statement = (
        _summary_maps_statement(account_id=account_id)
        .where(PlayerRecord.diff_to_warrior_ms > 0)
        .order_by(desc("quick_win_rank"), PlayerRecord.diff_to_warrior_ms.asc(), WarriorMap.name.asc())
        .limit(limit)
    )
    return [_summary_row_to_dict(row) for row in db.execute(fallback_statement).all()]


def list_best_margin_maps(db: Session, *, account_id: str | None, limit: int = 6) -> list[dict]:
    margin_expression = 0 - PlayerRecord.diff_to_warrior_ms
    statement = (
        _summary_maps_statement(account_id=account_id)
        .where(PlayerRecord.has_warrior.is_(True), PlayerRecord.diff_to_warrior_ms.is_not(None))
        .order_by(margin_expression.desc(), WarriorMap.name.asc())
        .limit(limit)
    )
    return [_summary_row_to_dict(row) for row in db.execute(statement).all()]


def get_latest_progress_snapshot(db: Session, *, account_id: str | None) -> ProgressSnapshot | None:
    statement = select(ProgressSnapshot)
    if account_id:
        statement = statement.where(ProgressSnapshot.account_id == account_id)
    return db.scalar(statement.order_by(ProgressSnapshot.snapshot_at.desc(), ProgressSnapshot.id.desc()).limit(1))


def get_latest_sync_job_for_type(db: Session, *, job_type: str) -> SyncJob | None:
    return db.scalar(select(SyncJob).where(SyncJob.job_type == job_type).order_by(SyncJob.id.desc()).limit(1))


def _summary_maps_statement(*, account_id: str | None) -> Select:
    warrior_position = (
        select(
            MapPosition.map_uid.label("map_uid"),
            func.max(
                case(
                    (MapPosition.position_status == "over_10000", 10_000),
                    else_=MapPosition.world_position,
                )
            ).label("required_position"),
            func.max(MapPosition.position_status).label("position_status"),
            func.max(
                case(
                    (MapPosition.position_status == "over_10000", 10001),
                    else_=func.coalesce(MapPosition.world_position, 0),
                )
            ).label("quick_win_rank"),
        )
        .where(MapPosition.position_type == "warrior")
        .group_by(MapPosition.map_uid)
        .subquery()
    )

    statement = (
        select(
            WarriorMap.map_uid,
            WarriorMap.map_id,
            WarriorMap.tmx_track_id,
            WarriorMap.tmx_url,
            WarriorMap.tmx_thumbnail_url,
            WarriorMap.tmx_tag_names_json,
            WarriorMap.tmx_difficulty_name,
            WarriorMap.tmx_route_name,
            WarriorMap.tmx_length_name,
            WarriorMap.tmx_style_name,
            WarriorMap.tmx_type_name,
            WarriorMap.name,
            WarriorMap.author_name,
            WarriorMap.category,
            WarriorMap.campaign_name,
            WarriorMap.warrior_time_ms,
            PlayerRecord.pb_time_ms,
            PlayerRecord.diff_to_warrior_ms,
            warrior_position.c.required_position,
            warrior_position.c.position_status,
            warrior_position.c.quick_win_rank,
        )
        .join(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
        .outerjoin(warrior_position, warrior_position.c.map_uid == WarriorMap.map_uid)
    )
    if account_id:
        statement = statement.where(PlayerRecord.account_id == account_id)
    return statement


def _summary_row_to_dict(row: Sequence[object]) -> dict:
    map_uid = row[0]
    map_id = row[1]
    tmx_track_id = row[2]
    tmx_url = row[3]
    tmx_thumbnail_url = row[4]
    tmx_tag_names_json = row[5]
    tmx_difficulty_name = row[6]
    tmx_route_name = row[7]
    tmx_length_name = row[8]
    tmx_style_name = row[9]
    tmx_type_name = row[10]
    name = row[11]
    author_name = row[12]
    category = row[13]
    campaign_name = row[14]
    warrior_time_ms = row[15]
    pb_time_ms = row[16]
    diff_to_warrior_ms = row[17]
    required_position = row[18]
    position_status = row[19]

    margin_vs_warrior_ms = None
    if diff_to_warrior_ms is not None:
        margin_vs_warrior_ms = max(0, 0 - diff_to_warrior_ms)

    return {
        "map_uid": map_uid,
        "map_id": map_id,
        "tmx_track_id": tmx_track_id,
        "tmx_url": tmx_url,
        "tmx_thumbnail_url": tmx_thumbnail_url,
        "tmx_tag_names": _parse_json_array(tmx_tag_names_json),
        "tmx_difficulty_name": tmx_difficulty_name,
        "tmx_route_name": tmx_route_name,
        "tmx_length_name": tmx_length_name,
        "tmx_style_name": tmx_style_name,
        "tmx_type_name": tmx_type_name,
        "name": name,
        "author_name": author_name,
        "category": category,
        "campaign_name": campaign_name,
        "warrior_time_ms": warrior_time_ms,
        "pb_time_ms": pb_time_ms,
        "diff_to_warrior_ms": diff_to_warrior_ms,
        "margin_vs_warrior_ms": margin_vs_warrior_ms,
        "required_position": required_position,
        "position_status": position_status,
        "difficulty_tier": difficulty_tier_from_position(required_position),
    }


def _parse_json_array(value: str | None) -> list[str] | None:
    if not value:
        return None
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, list):
        return None
    return [item for item in parsed if isinstance(item, str)]


def _count_player_records(db: Session, *, account_id: str | None, predicate) -> int:
    statement = select(func.count(PlayerRecord.id))
    statement = _apply_account_filter(statement, account_id=account_id)
    if isinstance(predicate, tuple):
        statement = statement.where(*predicate)
    else:
        statement = statement.where(predicate)
    return db.scalar(statement) or 0


def _avg_player_records(db: Session, *, account_id: str | None, expression, predicate: tuple) -> float | None:
    statement = select(func.avg(expression))
    statement = _apply_account_filter(statement, account_id=account_id).where(*predicate)
    value = db.scalar(statement)
    return float(value) if value is not None else None


def _apply_account_filter(statement: Select, *, account_id: str | None) -> Select:
    if account_id:
        return statement.where(PlayerRecord.account_id == account_id)
    return statement
