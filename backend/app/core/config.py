from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "MedalForge"
    app_version: str = "0.1.0"
    database_url: str = "sqlite:///./data/app.db"
    warrior_api_url: str = "https://raw.githubusercontent.com/ezio416/tm-json/main/warrior.json"
    warrior_api_user_agent: str | None = None
    nadeo_account_id: str | None = None
    nadeo_core_token: str | None = None
    nadeo_live_token: str | None = None
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
