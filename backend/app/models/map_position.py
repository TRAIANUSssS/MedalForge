from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import TimestampMixin


class MapPosition(TimestampMixin, Base):
    __tablename__ = "map_positions"
    __table_args__ = (
        UniqueConstraint("map_uid", "position_type", "score_ms", name="uq_map_positions_map_type_score"),
        Index("ix_map_positions_world_position", "world_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    map_uid: Mapped[str] = mapped_column(String(128), nullable=False)
    position_type: Mapped[str] = mapped_column(String(32), nullable=False)
    score_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    world_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    position_status: Mapped[str] = mapped_column(String(32), default="exact", nullable=False)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
