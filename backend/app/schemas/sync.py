from pydantic import BaseModel


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
