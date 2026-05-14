import json
from collections.abc import Sequence

from sqlalchemy import Float, Select, String, and_, asc, case, cast, desc, func, literal, or_, select
from sqlalchemy.orm import Session

from app.models.map_position import MapPosition
from app.models.player_record import PlayerRecord
from app.models.user_note import UserNote
from app.models.warrior_map import WarriorMap
from app.services.difficulty import difficulty_tier_from_position


MAP_SORT_COLUMNS = {"name", "category", "campaign_name", "warrior_time_ms", "author_time_ms", "world_record_time_ms", "required_position", "pb_time_ms"}
DIFFICULTY_TIER_ORDER = ["Demon", "Insane", "Hard", "Normal", "Easy", "Free"]


def list_maps(
    db: Session,
    *,
    status: str = "all",
    search: str | None = None,
    category: str | None = None,
    campaign_name: str | None = None,
    difficulty_tier: str | None = None,
    tmx_style_name: str | None = None,
    pb_state: str = "any",
    position_min: int | None = None,
    position_max: int | None = None,
    sort: str = "name",
    order: str = "asc",
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    query_parts = _build_maps_query_parts()
    statement = query_parts["statement"]
    statement = _apply_filters(
        statement,
        query_parts=query_parts,
        status=status,
        search=search,
        category=category,
        campaign_name=campaign_name,
        difficulty_tier=difficulty_tier,
        tmx_style_name=tmx_style_name,
        pb_state=pb_state,
        position_min=position_min,
        position_max=position_max,
    )

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    sort_column = _get_sort_column(sort, query_parts)
    direction = desc if order == "desc" else asc
    rows = db.execute(statement.order_by(direction(sort_column).nullslast(), WarriorMap.id.asc()).limit(limit).offset(offset)).all()
    return [_map_row_to_dict(row) for row in rows], total


def get_maps_meta(
    db: Session,
    *,
    search: str | None = None,
    category: str | None = None,
    campaign_name: str | None = None,
    difficulty_tier: str | None = None,
    tmx_style_name: str | None = None,
    pb_state: str = "any",
    position_min: int | None = None,
    position_max: int | None = None,
) -> dict:
    query_parts = _build_maps_query_parts()
    filtered = _apply_filters(
        query_parts["statement"],
        query_parts=query_parts,
        status="all",
        search=search,
        category=category,
        campaign_name=campaign_name,
        difficulty_tier=difficulty_tier,
        tmx_style_name=tmx_style_name,
        pb_state=pb_state,
        position_min=position_min,
        position_max=position_max,
    ).subquery()

    categories = db.execute(
        select(filtered.c.category, func.count())
        .where(filtered.c.category.is_not(None))
        .group_by(filtered.c.category)
        .order_by(filtered.c.category.asc())
    ).all()

    styles = db.execute(
        select(filtered.c.tmx_style_name)
        .where(filtered.c.tmx_style_name.is_not(None), func.trim(filtered.c.tmx_style_name) != "")
        .group_by(filtered.c.tmx_style_name)
        .order_by(func.count().desc(), filtered.c.tmx_style_name.asc())
    ).scalars().all()

    difficulty_rows = db.execute(
        select(filtered.c.difficulty_tier)
        .where(filtered.c.difficulty_tier.is_not(None))
        .group_by(filtered.c.difficulty_tier)
    ).scalars().all()
    difficulty_tiers = [tier for tier in DIFFICULTY_TIER_ORDER if tier in set(difficulty_rows)]

    total = db.scalar(select(func.count()).select_from(filtered)) or 0
    earned = db.scalar(select(func.count()).select_from(filtered).where(filtered.c.has_warrior.is_(True))) or 0
    missing = db.scalar(
        select(func.count()).select_from(filtered).where(filtered.c.has_warrior.is_(False), filtered.c.pb_time_ms.is_not(None))
    ) or 0
    close = db.scalar(
        select(func.count()).select_from(filtered).where(filtered.c.diff_to_warrior_ms > 0, filtered.c.diff_to_warrior_ms <= 1000)
    ) or 0
    not_played = db.scalar(select(func.count()).select_from(filtered).where(filtered.c.player_record_id.is_(None))) or 0

    return {
        "categories": [{"name": name, "count": count} for name, count in categories],
        "status_counts": {"all": total, "earned": earned, "missing": missing, "close": close, "not_played": not_played},
        "difficulty_tiers": difficulty_tiers,
        "tmx_styles": styles,
        "position_bounds": {"min": 1, "max": 10000},
    }


def get_map_collections(db: Session) -> list[dict]:
    campaign_name_expression = _campaign_name_expression()
    earned_count = func.sum(case((PlayerRecord.has_warrior.is_(True), 1), else_=0))
    missing_count = func.sum(case((and_(PlayerRecord.has_warrior.is_(False), PlayerRecord.pb_time_ms.is_not(None)), 1), else_=0))
    close_count = func.sum(case((and_(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 1000), 1), else_=0))
    not_played_count = func.sum(case((PlayerRecord.id.is_(None), 1), else_=0))
    total_count = func.count(WarriorMap.id)

    rows = db.execute(
        select(
            WarriorMap.category.label("category"),
            campaign_name_expression.label("campaign_name"),
            total_count.label("total"),
            earned_count.label("earned"),
            missing_count.label("missing"),
            close_count.label("close"),
            not_played_count.label("not_played"),
            case((total_count > 0, cast(earned_count, Float) * 100.0 / cast(total_count, Float)), else_=0.0).label("completion_percent"),
        )
        .outerjoin(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
        .where(WarriorMap.category.is_not(None))
        .group_by(WarriorMap.category, campaign_name_expression)
        .order_by(WarriorMap.category.asc(), campaign_name_expression.asc())
    ).all()

    return [
        {
            "category": row.category,
            "campaign_name": row.campaign_name,
            "total": row.total,
            "earned": row.earned,
            "missing": row.missing,
            "close": row.close,
            "not_played": row.not_played,
            "completion_percent": round(float(row.completion_percent or 0.0), 1),
        }
        for row in rows
        if row.category and row.campaign_name
    ]


def _build_maps_query_parts() -> dict:
    warrior_position = (
        select(
            MapPosition.map_uid.label("map_uid"),
            func.max(case((MapPosition.position_status == "over_10000", 10_000), else_=MapPosition.world_position)).label("required_position"),
            func.max(MapPosition.position_status).label("position_status"),
        )
        .where(MapPosition.position_type == "warrior")
        .group_by(MapPosition.map_uid)
        .subquery()
    )
    campaign_name_expression = _campaign_name_expression()
    required_position_expression = warrior_position.c.required_position
    difficulty_tier_expression = _difficulty_tier_expression(required_position_expression)

    statement = (
        select(
            WarriorMap,
            campaign_name_expression.label("effective_campaign_name"),
            required_position_expression.label("required_position"),
            warrior_position.c.position_status,
            difficulty_tier_expression.label("difficulty_tier"),
            PlayerRecord.id.label("player_record_id"),
            PlayerRecord,
            UserNote,
        )
        .outerjoin(warrior_position, warrior_position.c.map_uid == WarriorMap.map_uid)
        .outerjoin(PlayerRecord, PlayerRecord.map_uid == WarriorMap.map_uid)
        .outerjoin(UserNote, UserNote.map_uid == WarriorMap.map_uid)
    )

    return {
        "statement": statement,
        "campaign_name_expression": campaign_name_expression,
        "required_position_expression": required_position_expression,
        "difficulty_tier_expression": difficulty_tier_expression,
    }


def _apply_filters(
    statement: Select,
    *,
    query_parts: dict,
    status: str,
    search: str | None,
    category: str | None,
    campaign_name: str | None,
    difficulty_tier: str | None,
    tmx_style_name: str | None,
    pb_state: str,
    position_min: int | None,
    position_max: int | None,
) -> Select:
    campaign_name_expression = query_parts["campaign_name_expression"]
    required_position_expression = query_parts["required_position_expression"]
    difficulty_tier_expression = query_parts["difficulty_tier_expression"]

    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                WarriorMap.name.ilike(pattern),
                WarriorMap.author_name.ilike(pattern),
                campaign_name_expression.ilike(pattern),
                WarriorMap.category.ilike(pattern),
            )
        )

    if category:
        statement = statement.where(WarriorMap.category == category)
    if campaign_name:
        statement = statement.where(campaign_name_expression == campaign_name)
    if difficulty_tier:
        statement = statement.where(difficulty_tier_expression == difficulty_tier)
    if tmx_style_name:
        statement = statement.where(WarriorMap.tmx_style_name == tmx_style_name)
    if pb_state == "has_pb":
        statement = statement.where(PlayerRecord.pb_time_ms.is_not(None))
    elif pb_state == "no_pb":
        statement = statement.where(PlayerRecord.id.is_(None))
    if position_min is not None:
        statement = statement.where(required_position_expression >= position_min)
    if position_max is not None:
        statement = statement.where(required_position_expression <= position_max)

    if status == "earned":
        statement = statement.where(PlayerRecord.has_warrior.is_(True))
    elif status == "missing":
        statement = statement.where(PlayerRecord.has_warrior.is_(False), PlayerRecord.pb_time_ms.is_not(None))
    elif status == "close":
        statement = statement.where(PlayerRecord.diff_to_warrior_ms > 0, PlayerRecord.diff_to_warrior_ms <= 1000)
    elif status == "not_played":
        statement = statement.where(PlayerRecord.id.is_(None))

    return statement


def _get_sort_column(sort: str, query_parts: dict):
    if sort not in MAP_SORT_COLUMNS:
        return WarriorMap.name
    if sort == "category":
        return WarriorMap.category
    if sort == "campaign_name":
        return query_parts["campaign_name_expression"]
    if sort == "required_position":
        return query_parts["required_position_expression"]
    if sort == "pb_time_ms":
        return PlayerRecord.pb_time_ms
    if sort == "world_record_time_ms":
        return WarriorMap.world_record_time_ms
    if sort == "warrior_time_ms":
        return WarriorMap.warrior_time_ms
    if sort == "author_time_ms":
        return WarriorMap.author_time_ms
    return WarriorMap.name


def _map_row_to_dict(row: Sequence[object]) -> dict:
    warrior_map = row[0]
    campaign_name = row[1]
    required_position = row[2]
    position_status = row[3]
    difficulty_tier = row[4]
    player_record = row[6]
    user_note = row[7]

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
        "campaign_name": campaign_name,
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
        "difficulty_tier": difficulty_tier,
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


def _campaign_name_expression():
    stored_campaign_name = func.nullif(func.trim(WarriorMap.campaign_name), "")
    raw_campaign_name = func.nullif(func.trim(cast(func.json_extract(WarriorMap.raw_json, "$.campaignName"), String)), "")
    raw_week = func.json_extract(WarriorMap.raw_json, "$.week")
    raw_date = cast(func.json_extract(WarriorMap.raw_json, "$.date"), String)

    week_label = case((raw_week.is_not(None), literal("Week ") + cast(raw_week, String)), else_=None)
    month_label = case(
        (func.substr(raw_date, 6, 2) == "01", literal("January")),
        (func.substr(raw_date, 6, 2) == "02", literal("February")),
        (func.substr(raw_date, 6, 2) == "03", literal("March")),
        (func.substr(raw_date, 6, 2) == "04", literal("April")),
        (func.substr(raw_date, 6, 2) == "05", literal("May")),
        (func.substr(raw_date, 6, 2) == "06", literal("June")),
        (func.substr(raw_date, 6, 2) == "07", literal("July")),
        (func.substr(raw_date, 6, 2) == "08", literal("August")),
        (func.substr(raw_date, 6, 2) == "09", literal("September")),
        (func.substr(raw_date, 6, 2) == "10", literal("October")),
        (func.substr(raw_date, 6, 2) == "11", literal("November")),
        (func.substr(raw_date, 6, 2) == "12", literal("December")),
        else_=None,
    )
    totd_label = case((raw_date.is_not(None), month_label + literal(" ") + func.substr(raw_date, 1, 4)), else_=None)
    fallback_campaign_name = case(
        (WarriorMap.category == "Totd", totd_label),
        (WarriorMap.category.in_(("Weekly", "Grand")), week_label),
        else_=raw_campaign_name,
    )
    return func.coalesce(stored_campaign_name, fallback_campaign_name, literal("Other"))


def _difficulty_tier_expression(required_position_expression):
    return case(
        (required_position_expression.is_(None), None),
        (required_position_expression >= 50000, literal("Free")),
        (required_position_expression >= 20000, literal("Easy")),
        (required_position_expression >= 5000, literal("Normal")),
        (required_position_expression >= 1000, literal("Hard")),
        (required_position_expression >= 250, literal("Insane")),
        else_=literal("Demon"),
    )
