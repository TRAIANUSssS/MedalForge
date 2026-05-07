from collections.abc import Generator
from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import BACKEND_DIR, get_settings


class Base(DeclarativeBase):
    pass


def resolve_database_url(database_url: str) -> str:
    if not database_url.startswith("sqlite:///"):
        return database_url

    raw_path = database_url.removeprefix("sqlite:///")
    if raw_path in {":memory:", ""}:
        return database_url

    path = Path(raw_path)
    if not path.is_absolute():
        path = BACKEND_DIR / path
    return f"sqlite:///{path.as_posix()}"


def _ensure_sqlite_parent_dir(database_url: str) -> None:
    if not database_url.startswith("sqlite:///"):
        return

    raw_path = database_url.removeprefix("sqlite:///")
    if raw_path in {":memory:", ""}:
        return

    Path(raw_path).parent.mkdir(parents=True, exist_ok=True)


settings = get_settings()
database_url = resolve_database_url(settings.database_url)
_ensure_sqlite_parent_dir(database_url)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    apply_lightweight_migrations()


def apply_lightweight_migrations() -> None:
    inspector = inspect(engine)
    if "map_positions" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("map_positions")}
    with engine.begin() as connection:
        if "position_status" not in columns:
            connection.execute(text("ALTER TABLE map_positions ADD COLUMN position_status VARCHAR(32) NOT NULL DEFAULT 'exact'"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
