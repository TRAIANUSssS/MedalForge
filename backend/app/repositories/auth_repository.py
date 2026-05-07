from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auth_token import AuthToken


TRACKMANIA_PROVIDER = "trackmania"


def get_trackmania_token(db: Session) -> AuthToken | None:
    return db.scalar(select(AuthToken).where(AuthToken.provider == TRACKMANIA_PROVIDER))


def upsert_trackmania_token(
    db: Session,
    *,
    access_token: str,
    refresh_token: str | None,
    token_type: str | None,
    scope: str | None,
    expires_at,
    provider_account_id: str | None = None,
    provider_display_name: str | None = None,
    last_error: str | None = None,
) -> AuthToken:
    token = get_trackmania_token(db)
    if token is None:
        token = AuthToken(provider=TRACKMANIA_PROVIDER)

    token.access_token = access_token
    token.refresh_token = refresh_token
    token.token_type = token_type
    token.scope = scope
    token.expires_at = expires_at
    token.provider_account_id = provider_account_id or token.provider_account_id
    token.provider_display_name = provider_display_name or token.provider_display_name
    token.last_error = last_error
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


def update_trackmania_token_error(db: Session, message: str) -> None:
    token = get_trackmania_token(db)
    if token is None:
        token = AuthToken(provider=TRACKMANIA_PROVIDER)
    token.last_error = message
    db.add(token)
    db.commit()


def delete_trackmania_token(db: Session) -> None:
    token = get_trackmania_token(db)
    if token is not None:
        db.delete(token)
        db.commit()
