from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.schemas.auth import TrackmaniaAuthStartResponse, TrackmaniaAuthStatusResponse
from app.services.trackmania_oauth_service import (
    TrackmaniaOAuthError,
    build_authorize_url,
    disconnect,
    exchange_code_for_token,
    get_auth_status,
)


router = APIRouter(prefix="/api/auth/trackmania", tags=["trackmania-auth"])


@router.get("/start", response_model=TrackmaniaAuthStartResponse)
def start_trackmania_auth(settings: Settings = Depends(get_settings)) -> dict:
    try:
        return {"authorize_url": build_authorize_url(settings)}
    except TrackmaniaOAuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/callback", response_class=HTMLResponse)
def trackmania_auth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> str:
    try:
        token = exchange_code_for_token(db, settings, code=code, state=state)
    except TrackmaniaOAuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    display_name = token.provider_display_name or "Trackmania"
    return f"""
    <!doctype html>
    <html>
      <head><title>Trackmania connected</title></head>
      <body>
        <h1>Trackmania account connected</h1>
        <p>{display_name} is connected. You can close this tab and return to MedalForge.</p>
      </body>
    </html>
    """


@router.get("/status", response_model=TrackmaniaAuthStatusResponse)
def trackmania_auth_status(db: Session = Depends(get_db)) -> dict:
    return get_auth_status(db)


@router.post("/disconnect")
def disconnect_trackmania_auth(db: Session = Depends(get_db)) -> dict:
    disconnect(db)
    return {"status": "ok"}
