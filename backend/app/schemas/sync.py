from pydantic import BaseModel
from datetime import datetime


class WarriorSyncResponse(BaseModel):
    job_id: int
    status: str
    items_total: int
    items_success: int
    items_failed: int
    inserted: int
    updated: int
    skipped: int


class PositionSyncResponse(BaseModel):
    job_id: int
    status: str
    items_total: int
    items_success: int
    items_failed: int
    inserted: int
    updated: int
    skipped: int
    exact: int = 0
    over_10000: int = 0


class SyncJobResponse(BaseModel):
    id: int
    job_type: str
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    duration_ms: int | None = None
    items_total: int | None = None
    items_success: int | None = None
    items_failed: int | None = None
    error_message: str | None = None
    details_json: str | None = None
