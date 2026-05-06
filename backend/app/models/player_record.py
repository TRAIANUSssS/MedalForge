from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import TimestampMixin


class PlayerRecord(TimestampMixin, Base):
    __tablename__ = "player_records"
    __table_args__ = (
        UniqueConstraint("account_id", "map_uid", name="uq_player_records_account_map"),
        Index("ix_player_records_account_id", "account_id"),
        Index("ix_player_records_map_id", "map_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[str] = mapped_column(String(128), nullable=False)
    map_uid: Mapped[str] = mapped_column(String(128), nullable=False)
    map_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    pb_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pb_position_world: Mapped[int | None] = mapped_column(Integer, nullable=True)
    has_warrior: Mapped[bool] = mapped_column(default=False, nullable=False)
    diff_to_warrior_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
