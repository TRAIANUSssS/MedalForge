export type HealthResponse = {
  status: "ok";
  version: string;
};

export type WarriorSyncResponse = {
  job_id: number;
  status: string;
  items_total: number;
  items_success: number;
  items_failed: number;
  inserted: number;
  updated: number;
  skipped: number;
};

export type PositionSyncResponse = WarriorSyncResponse & {
  exact: number;
  over_10000: number;
};

export type PlayerPbSyncResponse = WarriorSyncResponse & {
  history_inserted: number;
  snapshots_inserted: number;
};

export type TrackmaniaAuthStatusResponse = {
  connected: boolean;
  expires_at: string | null;
  has_refresh_token: boolean;
  scopes: string[];
  account_id: string | null;
  display_name: string | null;
  last_error: string | null;
};

export type MapListItem = {
  map_uid: string;
  map_id: string | null;
  tmx_track_id?: number | null;
  tmx_url?: string | null;
  tmx_thumbnail_url?: string | null;
  tmx_tag_names?: string[] | null;
  tmx_difficulty_name?: string | null;
  tmx_route_name?: string | null;
  tmx_length_name?: string | null;
  tmx_style_name?: string | null;
  tmx_type_name?: string | null;
  trackmania_io_url?: string | null;
  thumbnail_url?: string | null;
  name: string | null;
  author_name: string | null;
  category: string | null;
  campaign_name: string | null;
  warrior_time_ms: number | null;
  author_time_ms: number | null;
  world_record_time_ms: number | null;
  required_position: number | null;
  position_status: string | null;
  difficulty_tier: string | null;
  pb_time_ms: number | null;
  has_warrior: boolean;
  diff_to_warrior_ms: number | null;
  grind_status: string;
};

export type MapsResponse = {
  items: MapListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type MapsMetaResponse = {
  categories: Array<{ name: string; count: number }>;
  status_counts: Record<string, number>;
  difficulty_tiers: string[];
  tmx_styles: string[];
  position_bounds: { min: number; max: number };
};

export type MapCollectionItem = {
  category: string;
  campaign_name: string;
  total: number;
  earned: number;
  missing: number;
  close: number;
  not_played: number;
  completion_percent: number;
};

export type MapCollectionsResponse = {
  items: MapCollectionItem[];
};

export type SyncJobResponse = {
  id: number;
  job_type: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  items_total: number | null;
  items_success: number | null;
  items_failed: number | null;
  error_message: string | null;
  details_json: string | null;
};

export type SummaryMapItem = {
  map_uid: string;
  map_id: string | null;
  trackmania_io_url?: string | null;
  thumbnail_url?: string | null;
  tmx_track_id?: number | null;
  tmx_url?: string | null;
  tmx_thumbnail_url?: string | null;
  tmx_tag_names?: string[] | null;
  tmx_difficulty_name?: string | null;
  tmx_route_name?: string | null;
  tmx_length_name?: string | null;
  tmx_style_name?: string | null;
  tmx_type_name?: string | null;
  name: string | null;
  author_name: string | null;
  category: string | null;
  campaign_name: string | null;
  warrior_time_ms: number | null;
  pb_time_ms: number | null;
  diff_to_warrior_ms: number | null;
  margin_vs_warrior_ms: number | null;
  required_position: number | null;
  position_status: string | null;
  difficulty_tier: string | null;
};

export type DifficultyBreakdownItem = {
  tier: string;
  total: number;
  earned: number;
  missing: number;
  not_played: number;
  completion_percent: number;
};

export type CategoryBreakdownItem = {
  category: string;
  total: number;
  earned: number;
  missing: number;
  not_played: number;
  close_count: number;
  completion_percent: number;
};

export type LatestSyncJobSummary = {
  id: number;
  job_type: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  items_total: number | null;
  items_success: number | null;
  items_failed: number | null;
  error_message: string | null;
};

export type StatsSummaryResponse = {
  total_maps: number;
  earned_count: number;
  missing_count: number;
  not_played_count: number;
  played_count: number;
  has_player_pbs: boolean;
  completion_percent: number;
  close_025_count: number;
  close_050_count: number;
  close_100_count: number;
  close_200_count: number;
  avg_diff_missing_ms: number | null;
  avg_margin_earned_ms: number | null;
  earned_by_difficulty: DifficultyBreakdownItem[];
  earned_by_category: CategoryBreakdownItem[];
  closest_missing_maps: SummaryMapItem[];
  easiest_missing_maps: SummaryMapItem[];
  quick_wins: SummaryMapItem[];
  best_earned_maps: SummaryMapItem[];
  best_margin_maps: SummaryMapItem[];
  hardest_earned_maps: SummaryMapItem[];
  latest_progress_snapshot: {
    account_id: string;
    total_maps: number;
    earned_warrior_count: number;
    missing_warrior_count: number;
    completion_percent: number;
    close_025_count: number;
    close_050_count: number;
    close_100_count: number;
    close_200_count: number;
    not_played_count: number;
    avg_diff_missing_ms: number | null;
    avg_margin_earned_ms: number | null;
    snapshot_at: string;
  } | null;
  latest_sync_jobs: {
    warrior_data: LatestSyncJobSummary | null;
    warrior_positions: LatestSyncJobSummary | null;
    player_pbs: LatestSyncJobSummary | null;
    tmx_map_info?: LatestSyncJobSummary | null;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function syncWarriorData(useCache = false): Promise<WarriorSyncResponse> {
  const query = useCache ? "?use_cache=true" : "";
  return request<WarriorSyncResponse>(`/api/sync/warrior-data${query}`, { method: "POST" });
}

export async function syncWarriorPositions(options: { limit?: number; force?: boolean } = {}): Promise<PositionSyncResponse> {
  const query = new URLSearchParams();
  if (options.limit) query.set("limit", String(options.limit));
  if (options.force) query.set("force", "true");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<PositionSyncResponse>(`/api/sync/warrior-positions${suffix}`, { method: "POST" });
}

export async function syncPlayerPbs(options: { limit?: number } = {}): Promise<PlayerPbSyncResponse> {
  const query = new URLSearchParams();
  if (options.limit) query.set("limit", String(options.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<PlayerPbSyncResponse>(`/api/sync/player-pbs${suffix}`, { method: "POST" });
}

export async function syncTmxMapInfo(options: { limit?: number; force?: boolean } = {}): Promise<WarriorSyncResponse> {
  const query = new URLSearchParams();
  if (options.limit) query.set("limit", String(options.limit));
  if (options.force) query.set("force", "true");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<WarriorSyncResponse>(`/api/sync/tmx-map-info${suffix}`, { method: "POST" });
}

export async function startTrackmaniaAuth(): Promise<{ authorize_url: string }> {
  return request<{ authorize_url: string }>("/api/auth/trackmania/start");
}

export async function getTrackmaniaAuthStatus(): Promise<TrackmaniaAuthStatusResponse> {
  return request<TrackmaniaAuthStatusResponse>("/api/auth/trackmania/status");
}

export async function disconnectTrackmaniaAuth(): Promise<{ status: string }> {
  return request<{ status: string }>("/api/auth/trackmania/disconnect", { method: "POST" });
}

export async function getMaps(params: {
  status?: string;
  category?: string;
  campaign_name?: string;
  search?: string;
  difficulty_tier?: string;
  tmx_style_name?: string;
  pb_state?: "any" | "has_pb" | "no_pb";
  position_min?: number;
  position_max?: number;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): Promise<MapsResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (params.campaign_name) query.set("campaign_name", params.campaign_name);
  if (params.search) query.set("search", params.search);
  if (params.difficulty_tier) query.set("difficulty_tier", params.difficulty_tier);
  if (params.tmx_style_name) query.set("tmx_style_name", params.tmx_style_name);
  if (params.pb_state && params.pb_state !== "any") query.set("pb_state", params.pb_state);
  if (params.position_min !== undefined) query.set("position_min", String(params.position_min));
  if (params.position_max !== undefined) query.set("position_max", String(params.position_max));
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);
  query.set("limit", String(params.limit ?? 50));
  query.set("offset", String(params.offset ?? 0));

  return request<MapsResponse>(`/api/maps?${query.toString()}`);
}

export async function getMapsMeta(params: {
  category?: string;
  campaign_name?: string;
  search?: string;
  difficulty_tier?: string;
  tmx_style_name?: string;
  pb_state?: "any" | "has_pb" | "no_pb";
  position_min?: number;
  position_max?: number;
} = {}): Promise<MapsMetaResponse> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.campaign_name) query.set("campaign_name", params.campaign_name);
  if (params.search) query.set("search", params.search);
  if (params.difficulty_tier) query.set("difficulty_tier", params.difficulty_tier);
  if (params.tmx_style_name) query.set("tmx_style_name", params.tmx_style_name);
  if (params.pb_state && params.pb_state !== "any") query.set("pb_state", params.pb_state);
  if (params.position_min !== undefined) query.set("position_min", String(params.position_min));
  if (params.position_max !== undefined) query.set("position_max", String(params.position_max));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<MapsMetaResponse>(`/api/maps/meta${suffix}`);
}

export async function getMapCollections(): Promise<MapCollectionsResponse> {
  return request<MapCollectionsResponse>("/api/maps/collections");
}

export async function getStatsSummary(): Promise<StatsSummaryResponse> {
  return request<StatsSummaryResponse>("/api/stats/summary");
}

export async function getLatestSyncJob(jobType?: string): Promise<SyncJobResponse | null> {
  const query = jobType ? `?job_type=${encodeURIComponent(jobType)}` : "";
  return request<SyncJobResponse | null>(`/api/sync/jobs/latest${query}`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string | { message?: string } };
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (body.detail?.message) {
        message = body.detail.message;
      }
    } catch {
      // Keep the HTTP status message when the backend did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
