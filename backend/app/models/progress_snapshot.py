from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ProgressSnapshot(Base):
    __tablename__ = "progress_snapshots"
    __table_args__ = (
        Index("ix_progress_snapshots_account_id", "account_id"),
        Index("ix_progress_snapshots_snapshot_at", "snapshot_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[str] = mapped_column(String(128), nullable=False)
    total_maps: Mapped[int] = mapped_column(Integer, nullable=False)
    earned_warrior_count: Mapped[int] = mapped_column(Integer, nullable=False)
    missing_warrior_count: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_percent: Mapped[float] = mapped_column(Float, nullable=False)
    close_025_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    close_050_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    close_100_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    close_200_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    not_played_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_diff_missing_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_margin_earned_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
