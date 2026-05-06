from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PlayerRecordHistory(Base):
    __tablename__ = "player_record_history"
    __table_args__ = (
        Index("ix_player_record_history_account_id", "account_id"),
        Index("ix_player_record_history_map_uid", "map_uid"),
        Index("ix_player_record_history_recorded_at", "recorded_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[str] = mapped_column(String(128), nullable=False)
    map_uid: Mapped[str] = mapped_column(String(128), nullable=False)
    map_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    pb_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diff_to_warrior_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    has_warrior: Mapped[bool] = mapped_column(default=False, nullable=False)
    source: Mapped[str | None] = mapped_column(String(128), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
