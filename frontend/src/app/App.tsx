import { useEffect, useState } from "react";

import {
  disconnectTrackmaniaAuth,
  getHealth,
  getLatestSyncJob,
  getMaps,
  getMapsMeta,
  getStatsSummary,
  getTrackmaniaAuthStatus,
  startTrackmaniaAuth,
  syncPlayerPbs,
  syncWarriorData,
  syncWarriorPositions,
  type HealthResponse,
  type LatestSyncJobSummary,
  type MapListItem,
  type MapsMetaResponse,
  type PlayerPbSyncResponse,
  type PositionSyncResponse,
  type StatsSummaryResponse,
  type SummaryMapItem,
  type SyncJobResponse,
  type TrackmaniaAuthStatusResponse,
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

type StatsState =
  | { status: "loading" }
  | { status: "ok"; data: StatsSummaryResponse }
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

type PlayerPbSyncState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; result: PlayerPbSyncResponse }
  | { status: "error"; message: string };

type TrackmaniaAuthState =
  | { status: "loading" }
  | { status: "ok"; data: TrackmaniaAuthStatusResponse }
  | { status: "error"; message: string };

type PositionProgress = {
  processed: number;
  total: number;
  exact: number;
  over_10000: number;
  skipped: number;
  failed: number;
  status: string;
};

const navItems = ["Dashboard", "Maps", "Stats", "Charts", "Settings"];

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [maps, setMaps] = useState<MapsState>({ status: "loading" });
  const [mapsMeta, setMapsMeta] = useState<MapsMetaState>({ status: "loading" });
  const [stats, setStats] = useState<StatsState>({ status: "loading" });
  const [sync, setSync] = useState<SyncState>({ status: "idle" });
  const [positionSync, setPositionSync] = useState<PositionSyncState>({ status: "idle" });
  const [playerPbSync, setPlayerPbSync] = useState<PlayerPbSyncState>({ status: "idle" });
  const [trackmaniaAuth, setTrackmaniaAuth] = useState<TrackmaniaAuthState>({ status: "loading" });
  const [positionProgress, setPositionProgress] = useState<PositionProgress | null>(null);
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
          setHealth({ status: "error", message: getErrorMessage(error, "Unknown backend error") });
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
    void loadTrackmaniaAuthStatus();
    void loadStatsSummary();
  }, []);

  useEffect(() => {
    if (positionSync.status !== "running") {
      return;
    }

    let cancelled = false;
    const interval = window.setInterval(() => {
      getLatestSyncJob("warrior_positions")
        .then((job) => {
          if (!cancelled) {
            setPositionProgress(syncJobToProgress(job));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPositionProgress(null);
          }
        });
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [positionSync.status]);

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
        setMaps({ status: "error", message: getErrorMessage(error, "Unknown maps error") });
      });
  }

  function loadMapsMeta() {
    return getMapsMeta()
      .then((data) => {
        setMapsMeta({ status: "ok", data });
      })
      .catch((error: unknown) => {
        setMapsMeta({ status: "error", message: getErrorMessage(error, "Unknown maps metadata error") });
      });
  }

  function loadStatsSummary() {
    setStats({ status: "loading" });
    return getStatsSummary()
      .then((data) => {
        setStats({ status: "ok", data });
      })
      .catch((error: unknown) => {
        setStats({ status: "error", message: getErrorMessage(error, "Unknown dashboard error") });
      });
  }

  function loadTrackmaniaAuthStatus() {
    setTrackmaniaAuth({ status: "loading" });
    return getTrackmaniaAuthStatus()
      .then((data) => {
        setTrackmaniaAuth({ status: "ok", data });
      })
      .catch((error: unknown) => {
        setTrackmaniaAuth({ status: "error", message: getErrorMessage(error, "Unknown Trackmania auth error") });
      });
  }

  function refreshDashboardData() {
    void loadMapsMeta();
    void loadStatsSummary();
    void loadMaps();
  }

  function handleTrackmaniaConnect() {
    startTrackmaniaAuth()
      .then((result) => {
        window.location.href = result.authorize_url;
      })
      .catch((error: unknown) => {
        setTrackmaniaAuth({ status: "error", message: getErrorMessage(error, "Unknown Trackmania auth error") });
      });
  }

  function handleTrackmaniaDisconnect() {
    disconnectTrackmaniaAuth()
      .then(() => loadTrackmaniaAuthStatus())
      .catch((error: unknown) => {
        setTrackmaniaAuth({ status: "error", message: getErrorMessage(error, "Unknown Trackmania auth error") });
      });
  }

  function handleSync(useCache = false) {
    setSync({ status: "running" });
    syncWarriorData(useCache)
      .then((result) => {
        setSync({ status: "ok", result });
        setOffset(0);
        refreshDashboardData();
      })
      .catch((error: unknown) => {
        setSync({ status: "error", message: getErrorMessage(error, "Unknown sync error") });
      });
  }

  function handlePositionSync(options: { limit?: number; force?: boolean } = {}) {
    setPositionSync({ status: "running" });
    setPositionProgress(null);
    syncWarriorPositions(options)
      .then((result) => {
        setPositionSync({ status: "ok", result });
        setPositionProgress({
          processed: result.items_success + result.items_failed + result.skipped,
          total: result.items_total,
          exact: result.exact,
          over_10000: result.over_10000,
          skipped: result.skipped,
          failed: result.items_failed,
          status: result.status,
        });
        refreshDashboardData();
      })
      .catch((error: unknown) => {
        setPositionSync({ status: "error", message: getErrorMessage(error, "Unknown position sync error") });
      });
  }

  function handlePlayerPbSync(options: { limit?: number } = {}) {
    setPlayerPbSync({ status: "running" });
    syncPlayerPbs(options)
      .then((result) => {
        setPlayerPbSync({ status: "ok", result });
        setOffset(0);
        refreshDashboardData();
      })
      .catch((error: unknown) => {
        setPlayerPbSync({ status: "error", message: getErrorMessage(error, "Unknown PB sync error") });
      });
  }

  const pageStart = maps.status === "ok" && maps.total > 0 ? offset + 1 : 0;
  const pageEnd = maps.status === "ok" ? Math.min(offset + limit, maps.total) : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">MF</span>
          <div>
            <h1>MedalForge</h1>
            <p>Trackmania Warrior dashboard</p>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button className={item === "Dashboard" ? "active" : ""} key={item} type="button">
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span>Local-first</span>
          <p>Frontend talks only to the local FastAPI backend. OAuth tokens stay server-side.</p>
        </div>
      </aside>

      <main className="workspace">
        <section className="page-header">
          <div>
            <p className="eyebrow">Sprint 6</p>
            <h2>Dashboard MVP</h2>
            <p>
              Track Warrior medal progress, surface near-misses, and keep sync status visible
              without leaving the main workspace.
            </p>
          </div>
          <HealthBadge health={health} />
        </section>

        <DashboardSection
          stats={stats}
          sync={sync}
          positionSync={positionSync}
          playerPbSync={playerPbSync}
          positionProgress={positionProgress}
          onRetry={() => void loadStatsSummary()}
        />

        <section className="control-grid">
          <section className="content-panel sync-panel">
            <div>
              <h3>Sync Control</h3>
              <p>
                Refresh Warrior source data, update required positions, and sync personal bests from
                the connected Trackmania account.
              </p>
              <SyncMessage sync={sync} />
              <PositionSyncMessage sync={positionSync} progress={positionProgress} />
              <PlayerPbSyncMessage sync={playerPbSync} />
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
                onClick={() => handlePositionSync()}
              >
                {positionSync.status === "running" ? "Syncing positions..." : "Sync positions"}
              </button>
              <button
                className="secondary-action"
                disabled={positionSync.status === "running"}
                type="button"
                onClick={() => handlePositionSync({ limit: 5, force: true })}
              >
                Test top sync
              </button>
              <button
                className="secondary-action"
                disabled={
                  playerPbSync.status === "running" ||
                  trackmaniaAuth.status !== "ok" ||
                  !trackmaniaAuth.data.connected
                }
                type="button"
                onClick={() => handlePlayerPbSync({ limit: 10 })}
              >
                Test PB sync
              </button>
            </div>
          </section>

          <section className="content-panel auth-panel">
            <div>
              <h3>Trackmania Account</h3>
              <TrackmaniaAuthStatus auth={trackmaniaAuth} />
            </div>
            <div className="sync-actions">
              <button className="primary-action" type="button" onClick={handleTrackmaniaConnect}>
                Connect Trackmania account
              </button>
              <button className="secondary-action" type="button" onClick={() => void loadTrackmaniaAuthStatus()}>
                Check connection
              </button>
              <button
                className="secondary-action"
                disabled={trackmaniaAuth.status !== "ok" || !trackmaniaAuth.data.connected}
                type="button"
                onClick={handleTrackmaniaDisconnect}
              >
                Disconnect
              </button>
              <button
                className="secondary-action"
                disabled={
                  playerPbSync.status === "running" ||
                  trackmaniaAuth.status !== "ok" ||
                  !trackmaniaAuth.data.connected
                }
                type="button"
                onClick={() => handlePlayerPbSync()}
              >
                {playerPbSync.status === "running" ? "Syncing PBs..." : "Sync My PBs"}
              </button>
            </div>
          </section>
        </section>

        <section className="maps-panel">
          <div className="table-toolbar">
            <div>
              <h3>Maps Database</h3>
              <p>
                {maps.status === "ok" ? `${pageStart}-${pageEnd} of ${maps.total} maps` : "Local Warrior map database"}
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

function DashboardSection({
  stats,
  sync,
  positionSync,
  playerPbSync,
  positionProgress,
  onRetry,
}: {
  stats: StatsState;
  sync: SyncState;
  positionSync: PositionSyncState;
  playerPbSync: PlayerPbSyncState;
  positionProgress: PositionProgress | null;
  onRetry: () => void;
}) {
  if (stats.status === "loading") {
    return <DashboardSkeleton />;
  }

  if (stats.status === "error") {
    return (
      <section className="dashboard-error">
        <div>
          <p className="eyebrow">Dashboard unavailable</p>
          <h3>Summary failed to load</h3>
          <p>{stats.message}</p>
        </div>
        <button className="primary-action" type="button" onClick={onRetry}>
          Retry summary
        </button>
      </section>
    );
  }

  const summary = stats.data;
  const snapshotTime = summary.latest_progress_snapshot?.snapshot_at ?? null;

  return (
    <section className="dashboard-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Overall progress</p>
          <h3>
            {summary.earned_count} / {summary.total_maps} Warrior medals
          </h3>
          <p>
            {summary.missing_count} missing, {summary.not_played_count} not played,
            {snapshotTime ? ` last snapshot ${formatDateTime(snapshotTime)}.` : " snapshot not created yet."}
          </p>
        </div>
        <div className="hero-side">
          <strong>{formatPercent(summary.completion_percent)}</strong>
          <span>completion</span>
        </div>
        <div className="progress-track" aria-label="Overall Warrior completion progress">
          <div className="progress-fill" style={{ width: `${Math.min(summary.completion_percent, 100)}%` }} />
        </div>
        <div className="hero-chips">
          <span>≤250 ms: {summary.close_025_count}</span>
          <span>≤500 ms: {summary.close_050_count}</span>
          <span>≤1000 ms: {summary.close_100_count}</span>
          <span>≤2000 ms: {summary.close_200_count}</span>
        </div>
      </section>

      <section className="summary-grid">
        <MetricCard
          label="Earned"
          value={String(summary.earned_count)}
          detail="Current PBs already beat Warrior"
        />
        <MetricCard
          label="Missing"
          value={String(summary.missing_count)}
          detail={summary.avg_diff_missing_ms !== null ? `Average gap ${formatGap(summary.avg_diff_missing_ms)}` : "No missing PBs yet"}
        />
        <MetricCard label="Not Played" value={String(summary.not_played_count)} detail="Maps with no local PB record" />
        <MetricCard
          label="Best Margin"
          value={summary.avg_margin_earned_ms !== null ? formatGap(summary.avg_margin_earned_ms) : "N/A"}
          detail="Average lead on earned maps"
        />
      </section>

      {!summary.has_player_pbs ? (
        <section className="dashboard-empty">
          <div>
            <p className="eyebrow">PB sync required</p>
            <h3>No personal bests synced yet</h3>
            <p>
              Connect your Trackmania account and run <strong>Sync My PBs</strong>. The dashboard
              will start showing completion, close medals, and quick wins as soon as local PB data
              exists.
            </p>
          </div>
          <div className="empty-hints">
            <span>1. Sync Warrior data</span>
            <span>2. Connect Trackmania account</span>
            <span>3. Run PB sync</span>
          </div>
        </section>
      ) : (
        <section className="dashboard-grid">
          <SummaryListBlock
            title="Close Medals"
            subtitle="Closest misses by current PB gap"
            items={summary.closest_missing_maps}
            emptyMessage="No close missing medals right now."
            valueType="gap"
          />
          <SummaryListBlock
            title="Quick Wins"
            subtitle="Reachable missing medals with the best payoff"
            items={summary.quick_wins}
            emptyMessage="No quick wins available yet."
            valueType="gap"
          />
          <SummaryListBlock
            title="Best Margins"
            subtitle="Maps where your PB is safely ahead of Warrior"
            items={summary.best_margin_maps}
            emptyMessage="No earned Warrior medals yet."
            valueType="margin"
          />
        </section>
      )}

      <SyncStatusBlock
        latestSyncJobs={summary.latest_sync_jobs}
        sync={sync}
        positionSync={positionSync}
        playerPbSync={playerPbSync}
        positionProgress={positionProgress}
      />
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <section className="dashboard-stack">
      <section className="hero-card skeleton-block" />
      <section className="summary-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="metric-card skeleton-block" key={index} />
        ))}
      </section>
      <section className="dashboard-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <section className="list-block skeleton-block" key={index} />
        ))}
      </section>
    </section>
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

function SummaryListBlock({
  title,
  subtitle,
  items,
  emptyMessage,
  valueType,
}: {
  title: string;
  subtitle: string;
  items: SummaryMapItem[];
  emptyMessage: string;
  valueType: "gap" | "margin";
}) {
  return (
    <section className="list-block">
      <div className="list-block-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <div className="list-empty">{emptyMessage}</div>
      ) : (
        <div className="summary-list">
          {items.map((item) => (
            <article className="summary-row" key={`${title}-${item.map_uid}`}>
              <div>
                <strong>{cleanTrackmaniaText(item.name) ?? "Unnamed map"}</strong>
                <span>
                  {item.category ?? "Unknown"}
                  {item.campaign_name ? ` · ${item.campaign_name}` : ""}
                </span>
              </div>
              <div className="summary-row-meta">
                <strong>{valueType === "gap" ? formatGap(item.diff_to_warrior_ms) : formatGap(item.margin_vs_warrior_ms)}</strong>
                <span>{formatPositionSummary(item)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SyncStatusBlock({
  latestSyncJobs,
  sync,
  positionSync,
  playerPbSync,
  positionProgress,
}: {
  latestSyncJobs: StatsSummaryResponse["latest_sync_jobs"];
  sync: SyncState;
  positionSync: PositionSyncState;
  playerPbSync: PlayerPbSyncState;
  positionProgress: PositionProgress | null;
}) {
  const jobs: Array<{
    label: string;
    job: LatestSyncJobSummary | null;
    currentStatus: string;
    detail: string;
  }> = [
    {
      label: "Warrior data",
      job: latestSyncJobs.warrior_data,
      currentStatus: sync.status === "running" ? "running" : latestSyncJobs.warrior_data?.status ?? "idle",
      detail:
        sync.status === "running"
          ? "Refreshing local Warrior source cache"
          : sync.status === "error"
            ? sync.message
            : formatSyncJobDetail(latestSyncJobs.warrior_data),
    },
    {
      label: "Warrior positions",
      job: latestSyncJobs.warrior_positions,
      currentStatus:
        positionSync.status === "running" ? "running" : latestSyncJobs.warrior_positions?.status ?? "idle",
      detail:
        positionSync.status === "running"
          ? formatPositionProgress(positionProgress)
          : positionSync.status === "error"
            ? positionSync.message
            : formatSyncJobDetail(latestSyncJobs.warrior_positions),
    },
    {
      label: "Player PBs",
      job: latestSyncJobs.player_pbs,
      currentStatus: playerPbSync.status === "running" ? "running" : latestSyncJobs.player_pbs?.status ?? "idle",
      detail:
        playerPbSync.status === "running"
          ? "Syncing current user PBs from Trackmania OAuth API"
          : playerPbSync.status === "error"
            ? playerPbSync.message
            : formatSyncJobDetail(latestSyncJobs.player_pbs),
    },
  ];

  return (
    <section className="sync-status-block">
      <div className="list-block-header">
        <h3>Sync Status</h3>
        <p>Latest local sync jobs for the three MVP data sources.</p>
      </div>
      <div className="sync-status-grid">
        {jobs.map((item) => (
          <article className="sync-status-card" key={item.label}>
            <div className="sync-status-top">
              <strong>{item.label}</strong>
              <span className={`status-badge status-${item.currentStatus}`}>{formatStatusLabel(item.currentStatus)}</span>
            </div>
            <p>{item.detail}</p>
            <span>{item.job?.finished_at ? `Last finished ${formatDateTime(item.job.finished_at)}` : "No completed sync yet"}</span>
          </article>
        ))}
      </div>
    </section>
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
      {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated, {sync.result.skipped} skipped.
    </p>
  );
}

function PositionSyncMessage({ sync, progress }: { sync: PositionSyncState; progress: PositionProgress | null }) {
  if (sync.status === "idle") {
    return null;
  }

  if (sync.status === "running") {
    return <p className="sync-message">{formatPositionProgress(progress)}</p>;
  }

  if (sync.status === "error") {
    return <p className="sync-message error">Position sync failed: {sync.message}</p>;
  }

  return (
    <p className="sync-message ok">
      Positions {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated, {sync.result.skipped} skipped, {sync.result.exact} exact, {sync.result.over_10000} over 10k.
    </p>
  );
}

function PlayerPbSyncMessage({ sync }: { sync: PlayerPbSyncState }) {
  if (sync.status === "idle") {
    return null;
  }

  if (sync.status === "running") {
    return <p className="sync-message">Player PB sync is running...</p>;
  }

  if (sync.status === "error") {
    return <p className="sync-message error">PB sync failed: {sync.message}</p>;
  }

  return (
    <p className="sync-message ok">
      PBs {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated, {sync.result.skipped} unchanged, {sync.result.history_inserted} history rows, {sync.result.snapshots_inserted} snapshot.
    </p>
  );
}

function TrackmaniaAuthStatus({ auth }: { auth: TrackmaniaAuthState }) {
  if (auth.status === "loading") {
    return <p>Checking Trackmania connection...</p>;
  }

  if (auth.status === "error") {
    return <p className="sync-message error">{auth.message}</p>;
  }

  if (!auth.data.connected) {
    return (
      <p>
        Disconnected. Connect your Trackmania account to sync personal bests through the official
        Trackmania OAuth API.
        {auth.data.last_error ? <span className="auth-error"> {auth.data.last_error}</span> : null}
      </p>
    );
  }

  return (
    <p>
      Connected{auth.data.display_name ? ` as ${auth.data.display_name}` : ""}.
      {auth.data.expires_at ? ` Access token expires ${formatDateTime(auth.data.expires_at)}.` : null}
      {auth.data.has_refresh_token ? " Refresh token stored locally." : " Reconnect required when token expires."}
    </p>
  );
}

function syncJobToProgress(job: SyncJobResponse | null): PositionProgress | null {
  if (!job) {
    return null;
  }

  let details: Partial<PositionProgress> = {};
  if (job.details_json) {
    try {
      details = JSON.parse(job.details_json) as Partial<PositionProgress>;
    } catch {
      details = {};
    }
  }

  const processed =
    details.processed ?? (job.items_success ?? 0) + (job.items_failed ?? 0) + (details.skipped ?? 0);

  return {
    processed,
    total: job.items_total ?? 0,
    exact: details.exact ?? 0,
    over_10000: details.over_10000 ?? 0,
    skipped: details.skipped ?? 0,
    failed: job.items_failed ?? 0,
    status: job.status,
  };
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
                {formatPosition(map)}
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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

function formatGap(ms: number | null) {
  if (ms === null) {
    return "N/A";
  }
  return `${Math.round(ms)} ms`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPosition(map: MapListItem) {
  if (map.position_status === "over_10000") {
    return "10k+";
  }
  if (map.position_status === "not_found") {
    return "Not found";
  }
  if (map.position_status === "failed") {
    return "Failed";
  }
  return map.required_position ? `#${map.required_position}` : "Not synced";
}

function formatPositionSummary(map: SummaryMapItem) {
  if (map.position_status === "over_10000") {
    return "10k+ threshold";
  }
  if (map.required_position) {
    return `Warrior at #${map.required_position}`;
  }
  return "Position not synced";
}

function formatStatusLabel(status: string) {
  switch (status) {
    case "success":
      return "Success";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    case "running":
      return "Running";
    default:
      return "Idle";
  }
}

function formatSyncJobDetail(job: LatestSyncJobSummary | null) {
  if (!job) {
    return "No sync recorded yet.";
  }

  const successPart =
    job.items_total !== null && job.items_success !== null ? `${job.items_success} / ${job.items_total} items processed.` : "Run not fully recorded.";
  if (job.status === "failed" && job.error_message) {
    return job.error_message;
  }
  if (job.status === "partial" && job.error_message) {
    return `${successPart} ${job.error_message}`;
  }
  return successPart;
}

function formatPositionProgress(progress: PositionProgress | null) {
  if (!progress) {
    return "Warrior position sync is running...";
  }
  return `Warrior position sync is running: ${progress.processed} / ${progress.total}, ${progress.exact} exact, ${progress.over_10000} over 10k.`;
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
