from __future__ import annotations

from app.models.progress_snapshot import ProgressSnapshot
from app.models.sync_job import SyncJob
from app.repositories.stats_repository import (
    get_latest_progress_snapshot,
    get_latest_sync_job_for_type,
    get_summary_counts,
    list_best_margin_maps,
    list_closest_missing_maps,
    list_quick_wins,
    resolve_primary_account_id,
)


def get_dashboard_summary(db) -> dict:
    account_id = resolve_primary_account_id(db)
    counts = get_summary_counts(db, account_id=account_id)

    return {
        **counts,
        "closest_missing_maps": list_closest_missing_maps(db, account_id=account_id),
        "quick_wins": list_quick_wins(db, account_id=account_id),
        "best_margin_maps": list_best_margin_maps(db, account_id=account_id),
        "latest_progress_snapshot": _snapshot_to_dict(get_latest_progress_snapshot(db, account_id=account_id)),
        "latest_sync_jobs": {
            "warrior_data": _sync_job_to_dict(get_latest_sync_job_for_type(db, job_type="warrior_data")),
            "warrior_positions": _sync_job_to_dict(get_latest_sync_job_for_type(db, job_type="warrior_positions")),
            "player_pbs": _sync_job_to_dict(get_latest_sync_job_for_type(db, job_type="player_pbs")),
        },
    }


def _snapshot_to_dict(snapshot: ProgressSnapshot | None) -> dict | None:
    if snapshot is None:
        return None

    return {
        "account_id": snapshot.account_id,
        "total_maps": snapshot.total_maps,
        "earned_warrior_count": snapshot.earned_warrior_count,
        "missing_warrior_count": snapshot.missing_warrior_count,
        "completion_percent": snapshot.completion_percent,
        "close_025_count": snapshot.close_025_count,
        "close_050_count": snapshot.close_050_count,
        "close_100_count": snapshot.close_100_count,
        "close_200_count": snapshot.close_200_count,
        "not_played_count": snapshot.not_played_count,
        "avg_diff_missing_ms": snapshot.avg_diff_missing_ms,
        "avg_margin_earned_ms": snapshot.avg_margin_earned_ms,
        "snapshot_at": snapshot.snapshot_at,
    }


def _sync_job_to_dict(job: SyncJob | None) -> dict | None:
    if job is None:
        return None

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
    }
