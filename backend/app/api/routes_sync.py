from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.models.sync_job import SyncJob
from app.repositories.sync_repository import get_latest_sync_job
from app.schemas.sync import PlayerPbSyncResponse, PositionSyncResponse, SyncJobResponse, WarriorSyncResponse
from app.services.nadeo_live_service import NadeoLiveConfigError, sync_warrior_positions
from app.services.trackmania_oauth_service import TrackmaniaOAuthError
from app.services.trackmania_records_service import TrackmaniaRecordsParseError, sync_player_pbs_from_trackmania
from app.services.warrior_sync_service import sync_warrior_data


router = APIRouter(prefix="/api/sync", tags=["sync"])


def sync_job_to_response(job: SyncJob) -> dict:
    return {
        "id": job.id,
        "job_type": job.job_type,
        "status": job.status,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "duration_ms": job.duration_ms,
        "items_total": job.items_total,
        "items_success": job.items_success,
        "items_failed": job.items_failed,
        "error_message": job.error_message,
        "details_json": job.details_json,
    }


@router.get("/jobs/latest", response_model=SyncJobResponse | None)
def get_latest_sync_job_route(
    job_type: str | None = None,
    db: Session = Depends(get_db),
) -> dict | None:
    job = get_latest_sync_job(db, job_type=job_type)
    return sync_job_to_response(job) if job else None


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


@router.post("/player-pbs", response_model=PlayerPbSyncResponse)
def sync_player_pbs_route(
    limit: int | None = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        return sync_player_pbs_from_trackmania(db, settings, limit=limit)
    except TrackmaniaOAuthError as exc:
        raise HTTPException(status_code=400, detail={"error": exc.error_code, "message": str(exc)}) from exc
    except TrackmaniaRecordsParseError as exc:
        raise HTTPException(
            status_code=502,
            detail={"error": "trackmania_records_parse_error", "message": str(exc)},
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Player PB sync failed: {exc}") from exc
