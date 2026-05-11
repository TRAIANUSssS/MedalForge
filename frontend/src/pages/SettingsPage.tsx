import { useEffect, useRef, useState } from "react";

import {
  disconnectTrackmaniaAuth,
  getHealth,
  getLatestSyncJob,
  getStatsSummary,
  getTrackmaniaAuthStatus,
  startTrackmaniaAuth,
  syncPlayerPbs,
  syncTmxMapInfo,
  syncWarriorData,
  syncWarriorPositions,
  type HealthResponse,
  type LatestSyncJobSummary,
  type PlayerPbSyncResponse,
  type PositionSyncResponse,
  type StatsSummaryResponse,
  type SyncJobResponse,
  type TrackmaniaAuthStatusResponse,
  type WarriorSyncResponse,
} from "../api/client";
import { AppSidebar } from "../components/layout/AppSidebar";
import { capturePageAsPng } from "../utils/pageCapture";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; data: HealthResponse }
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

const glassCardClass =
  "relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.024),rgba(8,27,47,0.10))] shadow-[0_24px_80px_rgba(9,41,86,0.16)] backdrop-blur-[24px]";
const subduedCardClass =
  "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] backdrop-blur-[22px]";
const interactiveCardClass =
  "transition duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.055] hover:shadow-[0_18px_42px_rgba(11,47,84,0.16)]";
const actionPrimaryClass =
  "rounded-full border border-cyan-200/30 bg-[#2bc4ff]/12 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(43,196,255,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/40 hover:bg-[#2bc4ff]/18 disabled:cursor-not-allowed disabled:opacity-50";
const actionSecondaryClass =
  "rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";

export function SettingsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [stats, setStats] = useState<StatsState>({ status: "loading" });
  const [sync, setSync] = useState<SyncState>({ status: "idle" });
  const [positionSync, setPositionSync] = useState<PositionSyncState>({ status: "idle" });
  const [playerPbSync, setPlayerPbSync] = useState<PlayerPbSyncState>({ status: "idle" });
  const [tmxSync, setTmxSync] = useState<SyncState>({ status: "idle" });
  const [trackmaniaAuth, setTrackmaniaAuth] = useState<TrackmaniaAuthState>({ status: "loading" });
  const [positionProgress, setPositionProgress] = useState<PositionProgress | null>(null);
  const [captureState, setCaptureState] = useState<"idle" | "running" | "done" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) setHealth({ status: "ok", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setHealth({ status: "error", message: getErrorMessage(error, "Unknown backend error") });
      });

    loadStatsSummary();
    loadTrackmaniaAuthStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (positionSync.status !== "running") return;
    let cancelled = false;
    const interval = window.setInterval(() => {
      getLatestSyncJob("warrior_positions")
        .then((job) => {
          if (!cancelled) setPositionProgress(syncJobToProgress(job));
        })
        .catch(() => {
          if (!cancelled) setPositionProgress(null);
        });
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [positionSync.status]);

  function loadStatsSummary() {
    setStats({ status: "loading" });
    return getStatsSummary()
      .then((data) => {
        setStats({ status: "ok", data });
      })
      .catch((error: unknown) => {
        setStats({ status: "error", message: getErrorMessage(error, "Unknown settings error") });
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

  function refreshSettingsData() {
    void loadStatsSummary();
    void loadTrackmaniaAuthStatus();
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
        refreshSettingsData();
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
        refreshSettingsData();
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
        refreshSettingsData();
      })
      .catch((error: unknown) => {
        setPlayerPbSync({ status: "error", message: getErrorMessage(error, "Unknown PB sync error") });
      });
  }

  function handleTmxSync(options: { limit?: number; force?: boolean } = { force: true }) {
    setTmxSync({ status: "running" });
    syncTmxMapInfo(options)
      .then((result) => {
        setTmxSync({ status: "ok", result });
        refreshSettingsData();
      })
      .catch((error: unknown) => {
        setTmxSync({ status: "error", message: getErrorMessage(error, "Unknown TMX sync error") });
      });
  }

  async function handleCapturePage() {
    if (!pageRef.current || captureState === "running") return;
    setCaptureState("running");
    try {
      await capturePageAsPng(
        pageRef.current,
        `medalforge-settings-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`,
      );
      setCaptureState("done");
      window.setTimeout(() => setCaptureState("idle"), 1800);
    } catch {
      setCaptureState("error");
      window.setTimeout(() => setCaptureState("idle"), 2400);
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_12%_7%,rgba(43,196,255,0.20),transparent_34%),radial-gradient(circle_at_34%_14%,rgba(125,227,255,0.10),transparent_30%),radial-gradient(circle_at_78%_10%,rgba(80,210,255,0.08),transparent_30%),radial-gradient(circle_at_72%_62%,rgba(22,118,184,0.12),transparent_34%),radial-gradient(circle_at_32%_86%,rgba(43,196,255,0.10),transparent_34%),linear-gradient(180deg,#2a769f_0%,#246d97_20%,#1d5d87_48%,#194e77_72%,#18496f_100%)] text-slate-100"
      ref={pageRef}
    >
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.035]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[linear-gradient(180deg,rgba(186,236,255,0.06),rgba(125,227,255,0.03),transparent)]" />
      <div className="pointer-events-none absolute -left-28 top-6 h-[34rem] w-[34rem] rounded-full bg-[#7de3ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-16 h-[40rem] w-[40rem] rounded-full bg-[#2bc4ff]/08 blur-3xl" />

      <div className="relative mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        <aside className="relative mb-6 xl:fixed xl:left-[max(2rem,calc((100vw-1700px)/2+2rem))] xl:top-6 xl:z-30 xl:mb-0 xl:h-[calc(100vh-3rem)] xl:w-[292px]">
          <AppSidebar
            activePath="/settings"
            onNavigate={onNavigate}
            progress={stats.status === "ok" ? { earned: stats.data.earned_count, total: stats.data.total_maps } : null}
          />
        </aside>

        <main className="grid gap-6 xl:ml-[308px]">
            <section className={`${glassCardClass} p-7 md:p-9`}>
              <div className="playground-racing-line pointer-events-none absolute inset-0 opacity-70" />
              <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.045]" />
              <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#2bc4ff]/10 blur-3xl" />
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(22,118,184,0.16),transparent_46%)]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.38em] text-cyan-100/82">
                    Settings workspace
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">
                    Sync controls and account state
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/76 md:text-base">
                    Dedicated place for manual refresh operations, latest sync status, and Trackmania
                    OAuth controls, separated from the overview dashboard.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                  <button
                    className={`${actionSecondaryClass} sm:col-span-2`}
                    disabled={captureState === "running"}
                    type="button"
                    onClick={() => void handleCapturePage()}
                  >
                    {captureState === "running" ? "Capturing full page..." : "Save full-page PNG"}
                  </button>
                  <div className="rounded-[20px] border border-white/12 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50/58">
                    {captureState === "done" ? "PNG saved" : captureState === "error" ? "Capture failed" : "Full settings screenshot"}
                  </div>
                  <HealthBadge health={health} />
                </div>
              </div>
            </section>

            <section className={`${glassCardClass} p-5 md:p-6`}>
              <div className="mb-5">
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-sky-50/56">Settings / Sync</p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Manual operations</h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/68">
                  Use this page for refreshes and connection management while the dashboard stays focused on
                  overview metrics and recommendations.
                </p>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.95fr]">
                <section className={`${subduedCardClass} ${interactiveCardClass} p-5`}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-xl">
                      <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">Sync control</p>
                      <h4 className="mt-3 text-xl font-black tracking-[-0.04em] text-white">Refresh local data</h4>
                      <p className="mt-3 text-sm leading-6 text-sky-100/68">
                        Refresh Warrior source data, update required positions, and sync PB state.
                      </p>
                      <div className="mt-4 space-y-2">
                        <SyncMessage sync={sync} />
                        <PositionSyncMessage progress={positionProgress} sync={positionSync} />
                        <PlayerPbSyncMessage sync={playerPbSync} />
                        <TmxSyncMessage sync={tmxSync} />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
                      <button className={actionPrimaryClass} disabled={sync.status === "running"} type="button" onClick={() => handleSync(false)}>
                        {sync.status === "running" ? "Syncing..." : "Sync Warrior data"}
                      </button>
                      <button className={actionSecondaryClass} disabled={sync.status === "running"} type="button" onClick={() => handleSync(true)}>
                        Parse local cache
                      </button>
                      <button className={actionSecondaryClass} disabled={positionSync.status === "running"} type="button" onClick={() => handlePositionSync()}>
                        {positionSync.status === "running" ? "Syncing positions..." : "Sync positions"}
                      </button>
                      <button className={actionSecondaryClass} disabled={positionSync.status === "running"} type="button" onClick={() => handlePositionSync({ limit: 5, force: true })}>
                        Test top sync
                      </button>
                      <button
                        className={actionSecondaryClass}
                        disabled={playerPbSync.status === "running" || trackmaniaAuth.status !== "ok" || !trackmaniaAuth.data.connected}
                        type="button"
                        onClick={() => handlePlayerPbSync({ limit: 10 })}
                      >
                        Test PB sync
                      </button>
                      <button className={actionSecondaryClass} disabled={tmxSync.status === "running"} type="button" onClick={() => handleTmxSync({ force: true })}>
                        {tmxSync.status === "running" ? "Syncing TMX..." : "Sync TMX data"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className={`${subduedCardClass} ${interactiveCardClass} p-5`}>
                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">Trackmania account</p>
                      <h4 className="mt-3 text-xl font-black tracking-[-0.04em] text-white">OAuth connection</h4>
                      <div className="mt-3 text-sm leading-6 text-sky-100/68">
                        <TrackmaniaAuthStatus auth={trackmaniaAuth} />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button className={actionPrimaryClass} type="button" onClick={handleTrackmaniaConnect}>Connect Trackmania account</button>
                      <button className={actionSecondaryClass} type="button" onClick={() => void loadTrackmaniaAuthStatus()}>Check connection</button>
                      <button className={actionSecondaryClass} disabled={trackmaniaAuth.status !== "ok" || !trackmaniaAuth.data.connected} type="button" onClick={handleTrackmaniaDisconnect}>Disconnect</button>
                      <button className={actionSecondaryClass} disabled={playerPbSync.status === "running" || trackmaniaAuth.status !== "ok" || !trackmaniaAuth.data.connected} type="button" onClick={() => handlePlayerPbSync()}>
                        {playerPbSync.status === "running" ? "Syncing PBs..." : "Sync My PBs"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <SyncStatusBlock
              latestSyncJobs={stats.status === "ok" ? stats.data.latest_sync_jobs : { player_pbs: null, warrior_data: null, warrior_positions: null, tmx_map_info: null }}
              playerPbSync={playerPbSync}
              positionProgress={positionProgress}
              positionSync={positionSync}
              sync={sync}
              tmxSync={tmxSync}
            />
        </main>
      </div>
    </div>
  );
}

function HealthBadge({ health }: { health: HealthState }) {
  if (health.status === "loading") return <div className="rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">Checking backend</div>;
  if (health.status === "error") return <div className="rounded-full border border-rose-300/20 bg-rose-500/14 px-4 py-3 text-sm font-semibold text-rose-100">Backend offline</div>;
  return <div className="rounded-full border border-emerald-300/22 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">Backend {health.data.version}</div>;
}

function SyncStatusBlock({
  latestSyncJobs,
  sync,
  positionSync,
  playerPbSync,
  positionProgress,
  tmxSync,
}: {
  latestSyncJobs: StatsSummaryResponse["latest_sync_jobs"];
  sync: SyncState;
  positionSync: PositionSyncState;
  playerPbSync: PlayerPbSyncState;
  positionProgress: PositionProgress | null;
  tmxSync: SyncState;
}) {
  const jobs: Array<{ label: string; job: LatestSyncJobSummary | null; currentStatus: string; detail: string }> = [
    {
      label: "Warrior data",
      job: latestSyncJobs.warrior_data,
      currentStatus: sync.status === "running" ? "running" : latestSyncJobs.warrior_data?.status ?? "idle",
      detail: sync.status === "running" ? "Refreshing local Warrior source cache" : sync.status === "error" ? sync.message : formatSyncJobDetail(latestSyncJobs.warrior_data),
    },
    {
      label: "Warrior positions",
      job: latestSyncJobs.warrior_positions,
      currentStatus: positionSync.status === "running" ? "running" : latestSyncJobs.warrior_positions?.status ?? "idle",
      detail: positionSync.status === "running" ? formatPositionProgress(positionProgress) : positionSync.status === "error" ? positionSync.message : formatSyncJobDetail(latestSyncJobs.warrior_positions),
    },
    {
      label: "Player PBs",
      job: latestSyncJobs.player_pbs,
      currentStatus: playerPbSync.status === "running" ? "running" : latestSyncJobs.player_pbs?.status ?? "idle",
      detail: playerPbSync.status === "running" ? "Syncing current user PBs from Trackmania OAuth API" : playerPbSync.status === "error" ? playerPbSync.message : formatSyncJobDetail(latestSyncJobs.player_pbs),
    },
    {
      label: "TMX map info",
      job: latestSyncJobs.tmx_map_info ?? null,
      currentStatus: tmxSync.status === "running" ? "running" : latestSyncJobs.tmx_map_info?.status ?? "idle",
      detail: tmxSync.status === "running" ? "Refreshing Trackmania Exchange map metadata for all local Warrior maps" : tmxSync.status === "error" ? tmxSync.message : formatSyncJobDetail(latestSyncJobs.tmx_map_info ?? null),
    },
  ];

  return (
    <section className={`${glassCardClass} p-5 md:p-6`}>
      <div className="mb-5">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">Sync status</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Latest local jobs</h3>
        <p className="mt-2 text-sm leading-6 text-sky-100/64">Current state for the three MVP data sources.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {jobs.map((item) => (
          <article className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5" key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <strong className="text-base font-bold text-white">{item.label}</strong>
              <StatusBadge status={item.currentStatus} />
            </div>
            <p className="mt-4 text-sm leading-6 text-sky-100/64">{item.detail}</p>
            <span className="mt-4 block text-xs leading-5 text-sky-100/48">{item.job?.finished_at ? `Last finished ${formatDateTime(item.job.finished_at)}` : "No completed sync yet"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function SyncMessage({ sync }: { sync: SyncState }) {
  if (sync.status === "idle") return null;
  if (sync.status === "running") return <p className="text-sm font-semibold text-cyan-100">Sync is running...</p>;
  if (sync.status === "error") return <p className="text-sm font-semibold text-rose-200">{sync.message}</p>;
  return <p className="text-sm font-semibold text-emerald-100">{sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated, {sync.result.skipped} skipped.</p>;
}

function PositionSyncMessage({ sync, progress }: { sync: PositionSyncState; progress: PositionProgress | null }) {
  if (sync.status === "idle") return null;
  if (sync.status === "running") return <p className="text-sm font-semibold text-cyan-100">{formatPositionProgress(progress)}</p>;
  if (sync.status === "error") return <p className="text-sm font-semibold text-rose-200">Position sync failed: {sync.message}</p>;
  return <p className="text-sm font-semibold text-emerald-100">Positions {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated, {sync.result.skipped} skipped, {sync.result.exact} exact, {sync.result.over_10000} over 10k.</p>;
}

function PlayerPbSyncMessage({ sync }: { sync: PlayerPbSyncState }) {
  if (sync.status === "idle") return null;
  if (sync.status === "running") return <p className="text-sm font-semibold text-cyan-100">Player PB sync is running...</p>;
  if (sync.status === "error") return <p className="text-sm font-semibold text-rose-200">PB sync failed: {sync.message}</p>;
  return <p className="text-sm font-semibold text-emerald-100">PBs {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated, {sync.result.skipped} unchanged, {sync.result.history_inserted} history rows, {sync.result.snapshots_inserted} snapshot.</p>;
}

function TmxSyncMessage({ sync }: { sync: SyncState }) {
  if (sync.status === "idle") return null;
  if (sync.status === "running") return <p className="text-sm font-semibold text-cyan-100">TMX map info sync is running...</p>;
  if (sync.status === "error") return <p className="text-sm font-semibold text-rose-200">TMX sync failed: {sync.message}</p>;
  return <p className="text-sm font-semibold text-emerald-100">TMX {sync.result.status}: {sync.result.inserted} inserted, {sync.result.updated} updated, {sync.result.skipped} skipped.</p>;
}

function TrackmaniaAuthStatus({ auth }: { auth: TrackmaniaAuthState }) {
  if (auth.status === "loading") return <p>Checking Trackmania connection...</p>;
  if (auth.status === "error") return <p className="font-semibold text-rose-200">{auth.message}</p>;
  if (!auth.data.connected) {
    return <p>Disconnected. Connect your Trackmania account to sync personal bests through the official Trackmania OAuth API.{auth.data.last_error ? <span className="font-bold text-rose-200"> {auth.data.last_error}</span> : null}</p>;
  }
  return <p>Connected{auth.data.display_name ? ` as ${auth.data.display_name}` : ""}.{auth.data.expires_at ? ` Access token expires ${formatDateTime(auth.data.expires_at)}.` : null}{auth.data.has_refresh_token ? " Refresh token stored locally." : " Reconnect required when token expires."}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const classes = {
    success: "border-emerald-300/22 bg-emerald-400/10 text-emerald-100",
    running: "border-amber-200/20 bg-amber-300/10 text-amber-100",
    partial: "border-orange-300/20 bg-orange-300/10 text-orange-100",
    failed: "border-rose-300/22 bg-rose-500/14 text-rose-100",
    idle: "border-white/12 bg-white/[0.05] text-sky-50/72",
  } satisfies Record<string, string>;

  const normalized: keyof typeof classes = status in classes ? (status as keyof typeof classes) : "idle";
  return <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-black uppercase tracking-[0.18em] ${classes[normalized]}`}>{formatStatusLabel(status)}</span>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
function syncJobToProgress(job: SyncJobResponse | null): PositionProgress | null {
  if (!job) return null;
  let details: Partial<PositionProgress> = {};
  if (job.details_json) {
    try { details = JSON.parse(job.details_json) as Partial<PositionProgress>; } catch { details = {}; }
  }
  const processed = details.processed ?? (job.items_success ?? 0) + (job.items_failed ?? 0) + (details.skipped ?? 0);
  return { processed, total: job.items_total ?? 0, exact: details.exact ?? 0, over_10000: details.over_10000 ?? 0, skipped: details.skipped ?? 0, failed: job.items_failed ?? 0, status: job.status };
}
function formatStatusLabel(status: string) {
  switch (status) {
    case "success": return "Success";
    case "partial": return "Partial";
    case "failed": return "Failed";
    case "running": return "Running";
    default: return "Idle";
  }
}
function formatSyncJobDetail(job: LatestSyncJobSummary | null) {
  if (!job) return "No sync recorded yet.";
  const successPart = job.items_total !== null && job.items_success !== null ? `${job.items_success} / ${job.items_total} items processed.` : "Run not fully recorded.";
  if (job.status === "failed" && job.error_message) return job.error_message;
  if (job.status === "partial" && job.error_message) return `${successPart} ${job.error_message}`;
  return successPart;
}
function formatPositionProgress(progress: PositionProgress | null) {
  if (!progress) return "Warrior position sync is running...";
  return `Warrior position sync is running: ${progress.processed} / ${progress.total}, ${progress.exact} exact, ${progress.over_10000} over 10k.`;
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
