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

export type PositionSyncResponse = WarriorSyncResponse;

export type MapListItem = {
  map_uid: string;
  map_id: string | null;
  name: string | null;
  author_name: string | null;
  category: string | null;
  campaign_name: string | null;
  warrior_time_ms: number | null;
  author_time_ms: number | null;
  world_record_time_ms: number | null;
  required_position: number | null;
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
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function syncWarriorData(useCache = false): Promise<WarriorSyncResponse> {
  const query = useCache ? "?use_cache=true" : "";
  return request<WarriorSyncResponse>(`/api/sync/warrior-data${query}`, { method: "POST" });
}

export async function syncWarriorPositions(options: { limit?: number; fallbackTop?: boolean } = {}): Promise<PositionSyncResponse> {
  const query = new URLSearchParams();
  if (options.limit) query.set("limit", String(options.limit));
  if (options.fallbackTop) query.set("fallback_top", "true");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<PositionSyncResponse>(`/api/sync/warrior-positions${suffix}`, { method: "POST" });
}

export async function getMaps(params: {
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): Promise<MapsResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);
  if (params.order) query.set("order", params.order);
  query.set("limit", String(params.limit ?? 50));
  query.set("offset", String(params.offset ?? 0));

  return request<MapsResponse>(`/api/maps?${query.toString()}`);
}

export async function getMapsMeta(): Promise<MapsMetaResponse> {
  return request<MapsMetaResponse>("/api/maps/meta");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        message = body.detail;
      }
    } catch {
      // Keep the HTTP status message when the backend did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
