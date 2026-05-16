from __future__ import annotations

from app.models.progress_snapshot import ProgressSnapshot
from app.models.sync_job import SyncJob
from app.repositories.stats_repository import (
    CATEGORY_ORDER,
    DIFFICULTY_ORDER,
    get_latest_progress_snapshot,
    get_latest_sync_job_for_type,
    list_all_maps_with_stats,
    get_summary_counts,
    list_best_margin_maps,
    list_closest_missing_maps,
    list_quick_wins,
    resolve_primary_account_id,
)


def get_dashboard_summary(db) -> dict:
    account_id = resolve_primary_account_id(db)
    counts = get_summary_counts(db, account_id=account_id)
    all_maps = list_all_maps_with_stats(db, account_id=account_id)
    earned_maps = [item for item in all_maps if item["has_warrior"]]
    missing_maps = [item for item in all_maps if not item["has_warrior"]]

    return {
        **counts,
        "earned_by_difficulty": _build_difficulty_breakdown(all_maps),
        "earned_by_category": _build_category_breakdown(all_maps),
        "closest_missing_maps": list_closest_missing_maps(db, account_id=account_id),
        "easiest_missing_maps": _sort_easiest_missing_maps(missing_maps)[:5],
        "quick_wins": list_quick_wins(db, account_id=account_id),
        "best_earned_maps": list_best_margin_maps(db, account_id=account_id, limit=5),
        "best_margin_maps": list_best_margin_maps(db, account_id=account_id),
        "hardest_earned_maps": _sort_hardest_earned_maps(earned_maps)[:5],
        "latest_progress_snapshot": _snapshot_to_dict(get_latest_progress_snapshot(db, account_id=account_id)),
        "latest_sync_jobs": {
            "warrior_data": _sync_job_to_dict(get_latest_sync_job_for_type(db, job_type="warrior_data")),
            "warrior_positions": _sync_job_to_dict(get_latest_sync_job_for_type(db, job_type="warrior_positions")),
            "player_pbs": _sync_job_to_dict(get_latest_sync_job_for_type(db, job_type="player_pbs")),
            "tmx_map_info": _sync_job_to_dict(get_latest_sync_job_for_type(db, job_type="tmx_map_info")),
        },
    }


def _build_difficulty_breakdown(items: list[dict]) -> list[dict]:
    buckets: dict[str, dict] = {
        tier: {"tier": tier, "total": 0, "earned": 0, "missing": 0, "not_played": 0, "completion_percent": 0.0}
        for tier in DIFFICULTY_ORDER
    }
    for item in items:
        tier = item.get("difficulty_tier")
        if not tier or tier not in buckets:
            continue
        bucket = buckets[tier]
        bucket["total"] += 1
        if item["has_warrior"]:
            bucket["earned"] += 1
        else:
            bucket["missing"] += 1
            if not item["is_played"]:
                bucket["not_played"] += 1

    for bucket in buckets.values():
        bucket["completion_percent"] = (bucket["earned"] / bucket["total"] * 100) if bucket["total"] else 0.0

    return [buckets[tier] for tier in DIFFICULTY_ORDER if tier in buckets]


def _build_category_breakdown(items: list[dict]) -> list[dict]:
    buckets: dict[str, dict] = {}
    for item in items:
        category = item.get("category") or "Other"
        if category not in buckets:
            buckets[category] = {
                "category": category,
                "total": 0,
                "earned": 0,
                "missing": 0,
                "not_played": 0,
                "close_count": 0,
                "completion_percent": 0.0,
            }
        bucket = buckets[category]
        bucket["total"] += 1
        if item["has_warrior"]:
            bucket["earned"] += 1
        else:
            bucket["missing"] += 1
            if not item["is_played"]:
                bucket["not_played"] += 1
            if item["close_counted"]:
                bucket["close_count"] += 1

    for bucket in buckets.values():
        bucket["completion_percent"] = (bucket["earned"] / bucket["total"] * 100) if bucket["total"] else 0.0

    ordered_categories = [category for category in CATEGORY_ORDER if category in buckets]
    ordered_categories.extend(sorted(category for category in buckets if category not in CATEGORY_ORDER))
    return [buckets[category] for category in ordered_categories]


def _sort_easiest_missing_maps(items: list[dict]) -> list[dict]:
    return sorted(
        [item for item in items if not item["has_warrior"]],
        key=lambda item: (
            0 if item.get("required_position") is not None else 1,
            -int(item.get("required_position") or 0),
            0 if item.get("diff_to_warrior_ms") is not None else 1,
            int(item.get("diff_to_warrior_ms") or 0),
            (item.get("name") or "").lower(),
        ),
    )


def _sort_hardest_earned_maps(items: list[dict]) -> list[dict]:
    return sorted(
        [item for item in items if item["has_warrior"]],
        key=lambda item: (
            0 if item.get("required_position") is not None else 1,
            int(item.get("required_position") or 10**9),
            -int(item.get("margin_vs_warrior_ms") or 0),
            (item.get("name") or "").lower(),
        ),
    )


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
