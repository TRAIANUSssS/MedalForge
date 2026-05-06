from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.sync_job import SyncJob


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_sync_job(db: Session, job_type: str) -> SyncJob:
    job = SyncJob(job_type=job_type, status="running", started_at=utc_now())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def finish_sync_job(
    db: Session,
    job: SyncJob,
    *,
    status: str,
    items_total: int,
    items_success: int,
    items_failed: int,
    error_message: str | None = None,
    details_json: str | None = None,
) -> SyncJob:
    finished_at = utc_now()
    duration_ms = None
    if job.started_at is not None:
        started_at = job.started_at
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)
        duration_ms = int((finished_at - started_at).total_seconds() * 1000)

    job.status = status
    job.finished_at = finished_at
    job.duration_ms = duration_ms
    job.items_total = items_total
    job.items_success = items_success
    job.items_failed = items_failed
    job.error_message = error_message
    job.details_json = details_json

    db.add(job)
    db.commit()
    db.refresh(job)
    return job
