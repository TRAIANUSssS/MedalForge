from pydantic import BaseModel, Field


class MapListItem(BaseModel):
    map_uid: str
    map_id: str | None = None
    name: str | None = None
    author_name: str | None = None
    category: str | None = None
    campaign_name: str | None = None
    campaign_type: str | None = None
    club_name: str | None = None
    thumbnail_url: str | None = None
    trackmania_io_url: str | None = None
    author_time_ms: int | None = None
    gold_time_ms: int | None = None
    silver_time_ms: int | None = None
    bronze_time_ms: int | None = None
    warrior_time_ms: int | None = None
    world_record_time_ms: int | None = None
    required_position: int | None = None
    difficulty_tier: str | None = None
    pb_time_ms: int | None = None
    pb_position_world: int | None = None
    has_warrior: bool = False
    diff_to_warrior_ms: int | None = None
    user_note: str | None = None
    user_tags: str | None = None
    grind_status: str = "none"


class MapsResponse(BaseModel):
    items: list[MapListItem]
    total: int
    limit: int = Field(ge=1, le=500)
    offset: int = Field(ge=0)
