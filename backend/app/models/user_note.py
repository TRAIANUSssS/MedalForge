from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import TimestampMixin


class UserNote(TimestampMixin, Base):
    __tablename__ = "user_notes"
    __table_args__ = (UniqueConstraint("map_uid", name="uq_user_notes_map_uid"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    map_uid: Mapped[str] = mapped_column(String(128), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="none", nullable=False)
    is_favorite: Mapped[bool] = mapped_column(default=False, nullable=False)
