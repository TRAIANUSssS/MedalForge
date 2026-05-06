import { useEffect, useState } from "react";

import {
  getHealth,
  getMaps,
  getMapsMeta,
  syncWarriorData,
  syncWarriorPositions,
  type HealthResponse,
  type MapListItem,
  type MapsMetaResponse,
  type PositionSyncResponse,
  type WarriorSyncResponse,
} from "../api/client";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; data: HealthResponse }
  | { status: "error"; message: string };

type MapsState =
  | { status: "loading" }
  | { status: "ok"; items: MapListItem[]; total: number }
  | { status: "error"; message: string };

type MapsMetaState =
  | { status: "loading" }
  | { status: "ok"; data: MapsMetaResponse }
  | { status: "error"; message: string };

type SyncState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; result: WarriorSyncResponse }
  | { status: "error"; message: string };

type PositionSyncState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; result: PositionSyncResponse }
  | { status: "error"; message: string };

const navItems = ["Dashboard", "Maps", "Stats", "Charts", "Settings"];

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [maps, setMaps] = useState<MapsState>({ status: "loading" });
  const [mapsMeta, setMapsMeta] = useState<MapsMetaState>({ status: "loading" });
  const [sync, setSync] = useState<SyncState>({ status: "idle" });
  const [positionSync, setPositionSync] = useState<PositionSyncState>({ status: "idle" });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth({ status: "ok", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unknown backend error";
          setHealth({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadMaps();
  }, [query, statusFilter, category, sort, order, offset]);

  useEffect(() => {
    void loadMapsMeta();
  }, []);

  function loadMaps(searchOverride = query) {
    setMaps({ status: "loading" });
    return getMaps({
      status: statusFilter,
      category,
      search: searchOverride,
      sort,
      order,
      limit,
      offset,
    })
      .then((data) => {
        setMaps({ status: "ok", items: data.items, total: data.total });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown maps error";
        setMaps({ status: "error", message });
      });
  }

  function loadMapsMeta() {
    return getMapsMeta()
      .then((data) => {
        setMapsMeta({ status: "ok", data });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown maps metadata error";
        setMapsMeta({ status: "error", message });
      });
  }

  function handleSync(useCache = false) {
    setSync({ status: "running" });
    syncWarriorData(useCache)
      .then((result) => {
        setSync({ status: "ok", result });
        setOffset(0);
        void loadMapsMeta();
        void loadMaps();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        setSync({ status: "error", message });
      });
  }

  function handlePositionSync() {
    setPositionSync({ status: "running" });
    syncWarriorPositions()
      .then((result) => {
        setPositionSync({ status: "ok", result });
        void loadMaps();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown position sync error";
        setPositionSync({ status: "error", message });
      });
  }

  const totalMaps = maps.status === "ok" ? maps.total : 0;
  const pageStart = maps.status === "ok" && maps.total > 0 ? offset + 1 : 0;
  const pageEnd = maps.status === "ok" ? Math.min(offset + limit, maps.total) : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">MF</span>
          <div>
            <h1>MedalForge</h1>
            <p>Warrior medals dashboard</p>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button className={item === "Dashboard" ? "active" : ""} key={item} type="button">
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <section className="page-header">
          <div>
            <p className="eyebrow">Sprint 2</p>
            <h2>Maps workspace</h2>
            <p>
              Browse local Warrior medal data, filter by source category, search maps, and refresh
              the raw cache when the upstream JSON changes.
            </p>
          </div>
          <HealthBadge health={health} />
        </section>

        <section className="summary-grid" aria-label="MVP progress placeholders">
          <MetricCard label="Warrior maps" value={String(totalMaps)} detail="Stored locally" />
          <MetricCard label="Earned medals" value="0" detail="PB sync not configured yet" />
          <MetricCard label="Close medals" value="0" detail="Needs player records" />
          <MetricCard label="Snapshots" value="0" detail="Created after PB sync" />
        </section>

        <section className="content-panel sync-panel">
          <div>
            <h3>Warrior source sync</h3>
            <p>
              Runs `POST /api/sync/warrior-data`, writes `backend/data/raw/warrior_all.json`, and
              upserts parsed map rows into SQLite.
            </p>
            <SyncMessage sync={sync} />
            <PositionSyncMessage sync={positionSync} />
          </div>
          <div className="sync-actions">
            <button
              className="primary-action"
              disabled={sync.status === "running"}
              type="button"
              onClick={() => handleSync(false)}
            >
              {sync.status === "running" ? "Syncing..." : "Sync Warrior data"}
            </button>
            <button
              className="secondary-action"
              disabled={sync.status === "running"}
              type="button"
              onClick={() => handleSync(true)}
            >
              Parse local cache
            </button>
            <button
              className="secondary-action"
              disabled={positionSync.status === "running"}
              type="button"
              onClick={handlePositionSync}
            >
              {positionSync.status === "running" ? "Syncing positions..." : "Sync positions"}
            </button>
          </div>
        </section>

        <section className="maps-panel">
          <div className="table-toolbar">
            <div>
              <h3>Maps</h3>
              <p>
                {maps.status === "ok"
                  ? `${pageStart}-${pageEnd} of ${maps.total} maps`
                  : "Local map database"}
              </p>
            </div>
            <form
              className="search-form"
              onSubmit={(event) => {
                event.preventDefault();
                setOffset(0);
                setQuery(search.trim());
              }}
            >
              <input
                aria-label="Search maps"
                placeholder="Search maps, authors, campaigns"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(event) => {
                  setOffset(0);
                  setCategory(event.target.value);
                }}
              >
                <option value="">All categories</option>
                {mapsMeta.status === "ok"
                  ? mapsMeta.data.categories.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name} ({item.count})
                      </option>
                    ))
                  : null}
              </select>
              <select
                aria-label="Sort maps"
                value={sort}
                onChange={(event) => {
                  setOffset(0);
                  setSort(event.target.value);
                }}
              >
                <option value="name">Name</option>
                <option value="warrior_time_ms">Warrior time</option>
                <option value="author_time_ms">Author time</option>
                <option value="category">Category</option>
                <option value="campaign_name">Campaign</option>
              </select>
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  setOffset(0);
                  setOrder((current) => (current === "asc" ? "desc" : "asc"));
                }}
              >
                {order === "asc" ? "Asc" : "Desc"}
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                  setCategory("");
                  setStatusFilter("all");
                  setOffset(0);
                }}
              >
                Reset
              </button>
              <button className="secondary-action" type="submit">
                Search
              </button>
            </form>
          </div>
          <StatusFilters
            active={statusFilter}
            meta={mapsMeta}
            onChange={(next) => {
              setOffset(0);
              setStatusFilter(next);
            }}
          />
          <MapsTable maps={maps} />
          <Pagination
            disabled={maps.status !== "ok"}
            limit={limit}
            offset={offset}
            total={maps.status === "ok" ? maps.total : 0}
            onPage={(nextOffset) => setOffset(nextOffset)}
          />
        </section>
      </main>
    </div>
  );
}

function HealthBadge({ health }: { health: HealthState }) {
  if (health.status === "loading") {
    return <div className="health-badge loading">Checking backend</div>;
  }

  if (health.status === "error") {
    return <div className="health-badge error">Backend offline</div>;
  }

  return <div className="health-badge ok">Backend {health.data.version}</div>;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function SyncMessage({ sync }: { sync: SyncState }) {
  if (sync.status === "idle") {
    return null;
  }

  if (sync.status === "running") {
    return <p className="sync-message">Sync is running...</p>;
  }

  if (sync.status === "error") {
    return <p className="sync-message error">{sync.message}</p>;
  }

  return (
    <p className="sync-message ok">
      {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated,{" "}
      {sync.result.skipped} skipped.
    </p>
  );
}

function PositionSyncMessage({ sync }: { sync: PositionSyncState }) {
  if (sync.status === "idle") {
    return null;
  }

  if (sync.status === "running") {
    return <p className="sync-message">Warrior position sync is running...</p>;
  }

  if (sync.status === "error") {
    return <p className="sync-message error">Position sync failed: {sync.message}</p>;
  }

  return (
    <p className="sync-message ok">
      Positions {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated,{" "}
      {sync.result.skipped} skipped.
    </p>
  );
}

function MapsTable({ maps }: { maps: MapsState }) {
  if (maps.status === "loading") {
    return (
      <div className="table-state skeleton-list">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
    );
  }

  if (maps.status === "error") {
    return <div className="table-state error">Maps failed to load: {maps.message}</div>;
  }

  if (maps.items.length === 0) {
    return <div className="table-state">No maps in the local database yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Map</th>
            <th>Category</th>
            <th>Warrior</th>
            <th>AT</th>
            <th>WR</th>
            <th>Required pos.</th>
            <th>PB</th>
          </tr>
        </thead>
        <tbody>
          {maps.items.map((map) => (
            <tr key={map.map_uid}>
              <td>
                <strong>{cleanTrackmaniaText(map.name) ?? "Unnamed map"}</strong>
                <span>{map.author_name ?? map.map_uid}</span>
              </td>
              <td>
                <strong>
                  <span className={`category-pill category-${(map.category ?? "unknown").toLowerCase()}`}>
                    {map.category ?? "Unknown"}
                  </span>
                </strong>
                <span>{map.campaign_name ?? "No campaign"}</span>
              </td>
              <td>{formatTime(map.warrior_time_ms)}</td>
              <td>{formatTime(map.author_time_ms)}</td>
              <td>{formatTime(map.world_record_time_ms)}</td>
              <td>
                {map.required_position ? `#${map.required_position}` : "Not synced"}
                {map.difficulty_tier ? <span className="difficulty-pill">{map.difficulty_tier}</span> : null}
              </td>
              <td>
                <span className={map.has_warrior ? "status-earned" : "status-muted"}>
                  {map.pb_time_ms ? formatTime(map.pb_time_ms) : "No PB"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusFilters({
  active,
  meta,
  onChange,
}: {
  active: string;
  meta: MapsMetaState;
  onChange: (status: string) => void;
}) {
  const filters = [
    ["all", "All"],
    ["earned", "Earned"],
    ["missing", "Missing"],
    ["close", "Close"],
    ["not_played", "Not played"],
  ];

  const counts = meta.status === "ok" ? meta.data.status_counts : {};

  return (
    <div className="status-filters" aria-label="Map status filters">
      {filters.map(([value, label]) => (
        <button
          className={active === value ? "active" : ""}
          key={value}
          type="button"
          onClick={() => onChange(value)}
        >
          {label}
          <span>{counts[value] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

function Pagination({
  disabled,
  limit,
  offset,
  total,
  onPage,
}: {
  disabled: boolean;
  limit: number;
  offset: number;
  total: number;
  onPage: (offset: number) => void;
}) {
  const canGoBack = offset > 0;
  const canGoNext = offset + limit < total;

  return (
    <div className="pagination">
      <span>
        Page {total === 0 ? 0 : Math.floor(offset / limit) + 1} of {Math.max(1, Math.ceil(total / limit))}
      </span>
      <div>
        <button
          className="secondary-action"
          disabled={disabled || !canGoBack}
          type="button"
          onClick={() => onPage(Math.max(0, offset - limit))}
        >
          Previous
        </button>
        <button
          className="secondary-action"
          disabled={disabled || !canGoNext}
          type="button"
          onClick={() => onPage(offset + limit)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function formatTime(ms: number | null) {
  if (ms === null) {
    return "N/A";
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function cleanTrackmaniaText(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/\$[0-9a-fA-F]{3}/g, "")
    .replace(/\$[a-zA-Z]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
