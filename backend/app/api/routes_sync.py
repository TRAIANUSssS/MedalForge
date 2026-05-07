from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.schemas.sync import PositionSyncResponse, WarriorSyncResponse
from app.services.nadeo_live_service import NadeoLiveConfigError, sync_warrior_positions
from app.services.warrior_sync_service import sync_warrior_data


router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("/warrior-data", response_model=WarriorSyncResponse)
def sync_warrior_data_route(
    use_cache: bool = False,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        return sync_warrior_data(db, settings, use_cache=use_cache)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Warrior data sync failed: {exc}") from exc


@router.post("/warrior-positions", response_model=PositionSyncResponse)
def sync_warrior_positions_route(
    limit: int | None = None,
    force: bool = False,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        return sync_warrior_positions(db, settings, limit=limit, force=force)
    except NadeoLiveConfigError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Warrior position sync failed: {exc}") from exc
