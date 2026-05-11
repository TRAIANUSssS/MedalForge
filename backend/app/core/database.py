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
    table_names = set(inspector.get_table_names())
    with engine.begin() as connection:
        if "map_positions" in table_names:
            columns = {column["name"] for column in inspector.get_columns("map_positions")}
        else:
            columns = set()

        if "map_positions" in table_names and "position_status" not in columns:
            connection.execute(text("ALTER TABLE map_positions ADD COLUMN position_status VARCHAR(32) NOT NULL DEFAULT 'exact'"))

        if "warrior_maps" in table_names:
            warrior_map_columns = {column["name"] for column in inspector.get_columns("warrior_maps")}
            _add_nullable_column(connection, warrior_map_columns, "tmx_track_id", "INTEGER")
            _add_nullable_column(connection, warrior_map_columns, "tmx_url", "TEXT")
            _add_nullable_column(connection, warrior_map_columns, "tmx_thumbnail_url", "TEXT")
            _add_nullable_column(connection, warrior_map_columns, "tmx_tags_json", "TEXT")
            _add_nullable_column(connection, warrior_map_columns, "tmx_tag_names_json", "TEXT")
            _add_nullable_column(connection, warrior_map_columns, "tmx_difficulty_name", "VARCHAR(128)")
            _add_nullable_column(connection, warrior_map_columns, "tmx_route_name", "VARCHAR(128)")
            _add_nullable_column(connection, warrior_map_columns, "tmx_length_name", "VARCHAR(128)")
            _add_nullable_column(connection, warrior_map_columns, "tmx_style_name", "VARCHAR(128)")
            _add_nullable_column(connection, warrior_map_columns, "tmx_type_name", "VARCHAR(128)")
            _add_nullable_column(connection, warrior_map_columns, "tmx_synced_at", "DATETIME")


def _add_nullable_column(connection, existing_columns: set[str], name: str, sql_type: str) -> None:
    if name in existing_columns:
        return
    connection.execute(text(f"ALTER TABLE warrior_maps ADD COLUMN {name} {sql_type}"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
