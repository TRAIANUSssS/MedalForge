import json
from collections.abc import Sequence

from sqlalchemy import Select, asc, case, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.map_position import MapPosition
from app.models.player_record import PlayerRecord
from app.models.user_note import UserNote
from app.models.warrior_map import WarriorMap
from app.services.difficulty import difficulty_tier_from_position


MAP_SORT_COLUMNS = {
    "name": WarriorMap.name,
    "warrior_time_ms": WarriorMap.warrior_time_ms,
    "author_time_ms": WarriorMap.author_time_ms,
    "category": WarriorMap.category,
    "campaign_name": WarriorMap.campaign_name,
    "created_at": WarriorMap.created_at,
    "updated_at": WarriorMap.updated_at,
}


def list_maps(
    db: Session,
    *,
    status: str = "all",
    search: str | None = None,
    category: str | None = None,
    sort: str = "name",
    order: str = "asc",
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
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
        )
        .where(MapPosition.position_type == "warrior")
        .group_by(MapPosition.map_uid)
        .subquery()
    )

    statement = (
        select(WarriorMap, warrior_position.c.required_position, warrior_position.c.position_status, PlayerRecord, UserNote)
        .outerjoin(warrior_position, warrior_position.c.map_uid == WarriorMap.map_uid)
        .outerjoin(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
        .outerjoin(UserNote, UserNote.map_uid == WarriorMap.map_uid)
    )

    statement = _apply_filters(statement, status=status, search=search, category=category)

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0

    sort_column = MAP_SORT_COLUMNS.get(sort, WarriorMap.name)
    direction = desc if order == "desc" else asc
    rows = db.execute(
        statement.order_by(direction(sort_column).nullslast(), WarriorMap.id.asc()).limit(limit).offset(offset)
    ).all()

    return [_map_row_to_dict(row) for row in rows], total


def get_maps_meta(db: Session) -> dict:
    categories = db.execute(
        select(WarriorMap.category, func.count(WarriorMap.id))
        .where(WarriorMap.category.is_not(None))
        .group_by(WarriorMap.category)
        .order_by(WarriorMap.category.asc())
    ).all()

    total = db.scalar(select(func.count(WarriorMap.id))) or 0
    earned = (
        db.scalar(
            select(func.count(WarriorMap.id))
            .join(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
            .where(PlayerRecord.has_warrior.is_(True))
        )
        or 0
    )
    missing = (
        db.scalar(
            select(func.count(WarriorMap.id))
            .join(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
            .where(PlayerRecord.has_warrior.is_(False), PlayerRecord.pb_time_ms.is_not(None))
        )
        or 0
    )
    close = (
        db.scalar(
            select(func.count(WarriorMap.id))
            .join(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
            .where(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 1000)
        )
        or 0
    )
    not_played = db.scalar(
        select(func.count(WarriorMap.id))
        .outerjoin(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
        .where(PlayerRecord.id.is_(None))
    ) or 0

    return {
        "categories": [{"name": name, "count": count} for name, count in categories],
        "status_counts": {
            "all": total,
            "earned": earned,
            "missing": missing,
            "close": close,
            "not_played": not_played,
        },
    }


def _apply_filters(
    statement: Select,
    *,
    status: str,
    search: str | None,
    category: str | None,
) -> Select:
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                WarriorMap.name.ilike(pattern),
                WarriorMap.author_name.ilike(pattern),
                WarriorMap.campaign_name.ilike(pattern),
                WarriorMap.category.ilike(pattern),
            )
        )

    if category:
        statement = statement.where(WarriorMap.category == category)

    if status == "earned":
        statement = statement.where(PlayerRecord.has_warrior.is_(True))
    elif status == "missing":
        statement = statement.where(PlayerRecord.has_warrior.is_(False), PlayerRecord.pb_time_ms.is_not(None))
    elif status == "close":
        statement = statement.where(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 1000)
    elif status == "not_played":
        statement = statement.where(PlayerRecord.id.is_(None))

    return statement


def _map_row_to_dict(row: Sequence[object]) -> dict:
    warrior_map = row[0]
    required_position = row[1]
    position_status = row[2]
    player_record = row[3]
    user_note = row[4]

    return {
        "map_uid": warrior_map.map_uid,
        "map_id": warrior_map.map_id,
        "tmx_track_id": warrior_map.tmx_track_id,
        "tmx_url": warrior_map.tmx_url,
        "tmx_thumbnail_url": warrior_map.tmx_thumbnail_url,
        "tmx_tag_names": _parse_json_array(warrior_map.tmx_tag_names_json),
        "tmx_difficulty_name": warrior_map.tmx_difficulty_name,
        "tmx_route_name": warrior_map.tmx_route_name,
        "tmx_length_name": warrior_map.tmx_length_name,
        "tmx_style_name": warrior_map.tmx_style_name,
        "tmx_type_name": warrior_map.tmx_type_name,
        "name": warrior_map.name,
        "author_name": warrior_map.author_name,
        "category": warrior_map.category,
        "campaign_name": warrior_map.campaign_name,
        "campaign_type": warrior_map.campaign_type,
        "club_name": warrior_map.club_name,
        "thumbnail_url": warrior_map.thumbnail_url,
        "trackmania_io_url": warrior_map.trackmania_io_url,
        "author_time_ms": warrior_map.author_time_ms,
        "gold_time_ms": warrior_map.gold_time_ms,
        "silver_time_ms": warrior_map.silver_time_ms,
        "bronze_time_ms": warrior_map.bronze_time_ms,
        "warrior_time_ms": warrior_map.warrior_time_ms,
        "world_record_time_ms": warrior_map.world_record_time_ms,
        "required_position": required_position,
        "position_status": position_status,
        "difficulty_tier": difficulty_tier_from_position(required_position),
        "pb_time_ms": player_record.pb_time_ms if player_record else None,
        "pb_position_world": player_record.pb_position_world if player_record else None,
        "has_warrior": player_record.has_warrior if player_record else False,
        "diff_to_warrior_ms": player_record.diff_to_warrior_ms if player_record else None,
        "user_note": user_note.note if user_note else None,
        "user_tags": user_note.tags_json if user_note else None,
        "grind_status": user_note.status if user_note else "none",
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
