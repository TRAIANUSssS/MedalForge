from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import TimestampMixin


class WarriorMap(TimestampMixin, Base):
    __tablename__ = "warrior_maps"
    __table_args__ = (
        UniqueConstraint("map_uid", name="uq_warrior_maps_map_uid"),
        Index("ix_warrior_maps_map_id", "map_id"),
        Index("ix_warrior_maps_category", "category"),
        Index("ix_warrior_maps_campaign_name", "campaign_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    map_uid: Mapped[str] = mapped_column(String(128), nullable=False)
    map_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    campaign_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    campaign_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    club_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    trackmania_io_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    tmx_track_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tmx_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    tmx_thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    tmx_tags_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    tmx_tag_names_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    tmx_difficulty_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tmx_route_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tmx_length_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tmx_style_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tmx_type_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tmx_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    author_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gold_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    silver_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bronze_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    warrior_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    world_record_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_json: Mapped[str | None] = mapped_column(Text, nullable=True)
