from datetime import datetime

from pydantic import BaseModel


class SummaryMapItem(BaseModel):
    map_uid: str
    map_id: str | None = None
    tmx_track_id: int | None = None
    tmx_url: str | None = None
    tmx_thumbnail_url: str | None = None
    tmx_tag_names: list[str] | None = None
    tmx_difficulty_name: str | None = None
    tmx_route_name: str | None = None
    tmx_length_name: str | None = None
    tmx_style_name: str | None = None
    tmx_type_name: str | None = None
    name: str | None = None
    author_name: str | None = None
    category: str | None = None
    campaign_name: str | None = None
    warrior_time_ms: int | None = None
    pb_time_ms: int | None = None
    diff_to_warrior_ms: int | None = None
    margin_vs_warrior_ms: int | None = None
    required_position: int | None = None
    position_status: str | None = None
    difficulty_tier: str | None = None


class ProgressSnapshotSummary(BaseModel):
    account_id: str
    total_maps: int
    earned_warrior_count: int
    missing_warrior_count: int
    completion_percent: float
    close_025_count: int
    close_050_count: int
    close_100_count: int
    close_200_count: int
    not_played_count: int
    avg_diff_missing_ms: float | None = None
    avg_margin_earned_ms: float | None = None
    snapshot_at: datetime


class LatestSyncJobSummary(BaseModel):
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


class LatestSyncJobsSummary(BaseModel):
    warrior_data: LatestSyncJobSummary | None = None
    warrior_positions: LatestSyncJobSummary | None = None
    player_pbs: LatestSyncJobSummary | None = None
    tmx_map_info: LatestSyncJobSummary | None = None


class StatsSummaryResponse(BaseModel):
    total_maps: int
    earned_count: int
    missing_count: int
    not_played_count: int
    played_count: int
    has_player_pbs: bool
    completion_percent: float
    close_025_count: int
    close_050_count: int
    close_100_count: int
    close_200_count: int
    avg_diff_missing_ms: float | None = None
    avg_margin_earned_ms: float | None = None
    closest_missing_maps: list[SummaryMapItem]
    quick_wins: list[SummaryMapItem]
    best_margin_maps: list[SummaryMapItem]
    latest_progress_snapshot: ProgressSnapshotSummary | None = None
    latest_sync_jobs: LatestSyncJobsSummary
