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
