from datetime import datetime

from pydantic import BaseModel


class TrackmaniaAuthStartResponse(BaseModel):
    authorize_url: str


class TrackmaniaAuthStatusResponse(BaseModel):
    connected: bool
    expires_at: datetime | None = None
    has_refresh_token: bool = False
    scopes: list[str] = []
    account_id: str | None = None
    display_name: str | None = None
    last_error: str | None = None
