from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.auth_token import AuthToken
from app.repositories.auth_repository import (
    delete_trackmania_token,
    get_trackmania_token,
    update_trackmania_token_error,
    upsert_trackmania_token,
)


TRACKMANIA_SCOPE = "read_favorite"
STATE_TTL_SECONDS = 600
REFRESH_SKEW_SECONDS = 120

_oauth_states: dict[str, datetime] = {}


class TrackmaniaOAuthError(RuntimeError):
    error_code = "trackmania_auth_error"


class TrackmaniaNotConnectedError(TrackmaniaOAuthError):
    error_code = "trackmania_not_connected"


class TrackmaniaAuthExpiredError(TrackmaniaOAuthError):
    error_code = "trackmania_auth_expired"


class TrackmaniaOAuthConfigError(TrackmaniaOAuthError):
    error_code = "trackmania_oauth_not_configured"


@dataclass(frozen=True)
class TrackmaniaUser:
    account_id: str | None
    display_name: str | None


def build_authorize_url(settings: Settings) -> str:
    ensure_oauth_config(settings)
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = datetime.now(timezone.utc) + timedelta(seconds=STATE_TTL_SECONDS)
    cleanup_expired_states()

    query = urlencode(
        {
            "response_type": "code",
            "client_id": settings.trackmania_client_id,
            "redirect_uri": settings.trackmania_redirect_uri,
            "scope": TRACKMANIA_SCOPE,
            "state": state,
        }
    )
    return f"{settings.trackmania_oauth_authorize_url}?{query}"


def exchange_code_for_token(db: Session, settings: Settings, *, code: str, state: str) -> AuthToken:
    ensure_oauth_config(settings)
    verify_state(state)

    payload = request_token(
        settings,
        {
            "grant_type": "authorization_code",
            "client_id": settings.trackmania_client_id or "",
            "client_secret": settings.trackmania_client_secret or "",
            "code": code,
            "redirect_uri": settings.trackmania_redirect_uri,
        },
    )
    user = fetch_trackmania_user(settings, payload["access_token"])
    return save_token_payload(db, payload, user=user)


def get_valid_access_token(db: Session, settings: Settings) -> str:
    ensure_oauth_config(settings)
    token = get_trackmania_token(db)
    if token is None or not token.access_token:
        raise TrackmaniaNotConnectedError("Trackmania account is not connected. Open Settings and connect your account first.")

    if token.expires_at is not None:
        expires_at = token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at > datetime.now(timezone.utc) + timedelta(seconds=REFRESH_SKEW_SECONDS):
            return token.access_token

    if not token.refresh_token:
        update_trackmania_token_error(db, "Trackmania authorization expired. Please reconnect your account.")
        raise TrackmaniaAuthExpiredError("Trackmania authorization expired. Please reconnect your account.")

    try:
        payload = request_token(
            settings,
            {
                "grant_type": "refresh_token",
                "client_id": settings.trackmania_client_id or "",
                "client_secret": settings.trackmania_client_secret or "",
                "refresh_token": token.refresh_token,
            },
        )
        user = TrackmaniaUser(account_id=token.provider_account_id, display_name=token.provider_display_name)
        saved = save_token_payload(db, payload, user=user)
        if not saved.access_token:
            raise TrackmaniaAuthExpiredError("Trackmania authorization refresh did not return an access token.")
        return saved.access_token
    except TrackmaniaOAuthError:
        raise
    except Exception as exc:
        update_trackmania_token_error(db, "Trackmania authorization expired. Please reconnect your account.")
        raise TrackmaniaAuthExpiredError("Trackmania authorization expired. Please reconnect your account.") from exc


def get_auth_status(db: Session) -> dict[str, Any]:
    token = get_trackmania_token(db)
    if token is None or not token.access_token:
        return {
            "connected": False,
            "expires_at": None,
            "has_refresh_token": False,
            "scopes": [],
            "account_id": None,
            "display_name": None,
            "last_error": token.last_error if token else None,
        }

    expires_at = token.expires_at
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return {
        "connected": token.last_error is None,
        "expires_at": expires_at,
        "has_refresh_token": bool(token.refresh_token),
        "scopes": token.scope.split() if token.scope else [],
        "account_id": token.provider_account_id,
        "display_name": token.provider_display_name,
        "last_error": token.last_error,
    }


def disconnect(db: Session) -> None:
    delete_trackmania_token(db)


def ensure_oauth_config(settings: Settings) -> None:
    if not settings.trackmania_client_id or not settings.trackmania_client_secret:
        raise TrackmaniaOAuthConfigError("Trackmania OAuth client id/secret are not configured.")


def verify_state(state: str) -> None:
    cleanup_expired_states()
    expires_at = _oauth_states.pop(state, None)
    if expires_at is None or expires_at <= datetime.now(timezone.utc):
        raise TrackmaniaOAuthError("Trackmania OAuth state is invalid or expired.")


def cleanup_expired_states() -> None:
    now = datetime.now(timezone.utc)
    expired = [state for state, expires_at in _oauth_states.items() if expires_at <= now]
    for state in expired:
        _oauth_states.pop(state, None)


def request_token(settings: Settings, data: dict[str, str]) -> dict[str, Any]:
    response = httpx.post(
        settings.trackmania_oauth_token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=20.0,
    )
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise TrackmaniaOAuthError(f"Trackmania token request failed: HTTP {exc.response.status_code}") from exc

    payload = response.json()
    if not isinstance(payload, dict) or not payload.get("access_token"):
        raise TrackmaniaOAuthError("Trackmania token response did not include an access token.")
    return payload


def fetch_trackmania_user(settings: Settings, access_token: str) -> TrackmaniaUser:
    response = httpx.get(
        f"{settings.trackmania_api_base_url.rstrip('/')}/api/user",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=20.0,
    )
    if response.status_code >= 400:
        return TrackmaniaUser(account_id=None, display_name=None)
    payload = response.json()
    if not isinstance(payload, dict):
        return TrackmaniaUser(account_id=None, display_name=None)
    account_id = payload.get("accountId")
    display_name = payload.get("displayName")
    return TrackmaniaUser(
        account_id=account_id if isinstance(account_id, str) else None,
        display_name=display_name if isinstance(display_name, str) else None,
    )


def save_token_payload(db: Session, payload: dict[str, Any], *, user: TrackmaniaUser) -> AuthToken:
    expires_in = payload.get("expires_in")
    expires_at = None
    if isinstance(expires_in, int):
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    return upsert_trackmania_token(
        db,
        access_token=str(payload["access_token"]),
        refresh_token=payload.get("refresh_token") if isinstance(payload.get("refresh_token"), str) else None,
        token_type=payload.get("token_type") if isinstance(payload.get("token_type"), str) else None,
        scope=payload.get("scope") if isinstance(payload.get("scope"), str) else TRACKMANIA_SCOPE,
        expires_at=expires_at,
        provider_account_id=user.account_id,
        provider_display_name=user.display_name,
        last_error=None,
    )
