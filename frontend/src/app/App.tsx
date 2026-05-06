import { useEffect, useState } from "react";

import {
  getHealth,
  getMaps,
  syncWarriorData,
  type HealthResponse,
  type MapListItem,
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

type SyncState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; result: WarriorSyncResponse }
  | { status: "error"; message: string };

const navItems = ["Dashboard", "Maps", "Stats", "Charts", "Settings"];

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [maps, setMaps] = useState<MapsState>({ status: "loading" });
  const [sync, setSync] = useState<SyncState>({ status: "idle" });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

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
  }, [sort, order]);

  function loadMaps(searchOverride = search) {
    setMaps({ status: "loading" });
    return getMaps({ search: searchOverride, sort, order, limit: 50 })
      .then((data) => {
        setMaps({ status: "ok", items: data.items, total: data.total });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown maps error";
        setMaps({ status: "error", message });
      });
  }

  function handleSync(useCache = false) {
    setSync({ status: "running" });
    syncWarriorData(useCache)
      .then((result) => {
        setSync({ status: "ok", result });
        void loadMaps();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown sync error";
        setSync({ status: "error", message });
      });
  }

  const totalMaps = maps.status === "ok" ? maps.total : 0;

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
            <h2>Warrior data sync</h2>
            <p>
              Sync Warrior medal data into local SQLite, cache raw JSON, and browse the first maps
              API from the frontend.
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
          </div>
        </section>

        <section className="maps-panel">
          <div className="table-toolbar">
            <div>
              <h3>Maps</h3>
              <p>{maps.status === "ok" ? `${maps.total} maps found` : "Local map database"}</p>
            </div>
            <form
              className="search-form"
              onSubmit={(event) => {
                event.preventDefault();
                void loadMaps();
              }}
            >
              <input
                aria-label="Search maps"
                placeholder="Search maps, authors, campaigns"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                aria-label="Sort maps"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
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
                onClick={() => setOrder((current) => (current === "asc" ? "desc" : "asc"))}
              >
                {order === "asc" ? "Asc" : "Desc"}
              </button>
              <button className="secondary-action" type="submit">
                Search
              </button>
            </form>
          </div>
          <MapsTable maps={maps} />
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

function MapsTable({ maps }: { maps: MapsState }) {
  if (maps.status === "loading") {
    return <div className="table-state">Loading maps...</div>;
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
            <th>Campaign</th>
            <th>Warrior</th>
            <th>Required pos.</th>
            <th>PB</th>
          </tr>
        </thead>
        <tbody>
          {maps.items.map((map) => (
            <tr key={map.map_uid}>
              <td>
                <strong>{map.name ?? "Unnamed map"}</strong>
                <span>{map.author_name ?? map.map_uid}</span>
              </td>
              <td>
                <strong>{map.category ?? "Unknown"}</strong>
                <span>{map.campaign_name ?? "No campaign"}</span>
              </td>
              <td>{formatTime(map.warrior_time_ms)}</td>
              <td>
                {map.required_position ? `#${map.required_position}` : "Not synced"}
                {map.difficulty_tier ? <span>{map.difficulty_tier}</span> : null}
              </td>
              <td>{map.pb_time_ms ? formatTime(map.pb_time_ms) : "No PB"}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
