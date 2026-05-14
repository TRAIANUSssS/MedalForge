import { useEffect, useRef, useState } from "react";

import { getMaps, getStatsSummary, type LatestSyncJobSummary, type MapListItem, type StatsSummaryResponse, type SummaryMapItem } from "../api/client";
import { AppSidebar } from "../components/layout/AppSidebar";
import { SiteFooter } from "../components/layout/SiteFooter";
import { ActivityFeedItem } from "../components/playground/ActivityFeedItem";
import { DifficultyBadge } from "../components/playground/DifficultyBadge";
import { WarriorProgressBar } from "../components/progress/WarriorProgressBar";
import { capturePageAsPng } from "../utils/pageCapture";

type StatsState =
  | { status: "loading" }
  | { status: "ok"; data: StatsSummaryResponse }
  | { status: "error"; message: string };

const glassCardClass =
  "relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.024),rgba(8,27,47,0.10))] shadow-[0_24px_80px_rgba(9,41,86,0.16)] backdrop-blur-[24px]";
const subduedCardClass =
  "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] backdrop-blur-[22px]";
const interactiveCardClass =
  "transition duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.055] hover:shadow-[0_18px_42px_rgba(11,47,84,0.16)]";
const dashboardGroupFrameClass =
  "relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.018),rgba(10,32,52,0.038))] shadow-[0_10px_28px_rgba(8,35,70,0.06)] backdrop-blur-[16px]";
const dashboardGroupInnerGlowClass =
  "pointer-events-none absolute inset-[1px] rounded-[29px] border border-white/5 bg-[radial-gradient(circle_at_top,rgba(186,236,255,0.04),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.010),transparent)]";
const dashboardStatHoverClass =
  "transition duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.055] hover:shadow-[0_18px_38px_rgba(11,47,84,0.14)]";
const actionSecondaryClass =
  "rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";
const actionPrimaryClass =
  "rounded-full border border-cyan-200/30 bg-[#2bc4ff]/12 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(43,196,255,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/40 hover:bg-[#2bc4ff]/18 disabled:cursor-not-allowed disabled:opacity-50";
const challengeTargetsStorageKey = "medalforge.dashboard.challengeTargets.v1";
const challengeTargetsRerollEvent = "medalforge:reroll-challenge-targets";
const challengeTargetsEdgeRerollEvent = "medalforge:reroll-edge-challenge-targets";
const beatNowButtonClass =
  "playground-cta-shimmer rounded-full border border-cyan-200/34 bg-cyan-300/[0.14] font-semibold text-cyan-50 shadow-[0_0_26px_rgba(43,196,255,0.14)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/48 hover:bg-cyan-300/[0.20] hover:shadow-[0_0_34px_rgba(43,196,255,0.20)]";
const challengePlaceholderTitles = ["THE LAST STEP", "JUST A LITTLE LEFT", "ALMOST EVERYTHING"] as const;
const challengePlaceholderSubtitles: Record<(typeof challengePlaceholderTitles)[number], string> = {
  "THE LAST STEP": "What remains now is precision.",
  "JUST A LITTLE LEFT": "Only a few difficult roads remain.",
  "ALMOST EVERYTHING": "Most of the grind is already behind you.",
};
const challengeCompletionQuote =
  "Straight roads are for fast cars. Turns are for fast drivers.";
const challengeCompletionQuoteAuthor = "Colin McRae";
const dailyChallengeDescriptions = {
  missing: [
    "Fresh target with no synced PB yet.",
    "Untouched route waiting for a first clean line.",
    "Good candidate for a first serious attempt.",
    "No stable run recorded on this map yet.",
    "Still completely open for progression.",
    "A clean baseline run could change everything.",
    "One of the remaining untouched targets.",
    "No synced progress on this route so far.",
    "Early attempts should reveal the main lines.",
    "Good map for discovering a new rhythm.",
    "A blank entry in the current grind path.",
    "Still waiting for its first confident PB.",
    "Low-pressure target for exploration attempts.",
    "No history here yet. Start building consistency.",
    "Fresh route with room for experimentation.",
    "Nothing locked in yet on this map.",
    "A good opportunity for a first breakthrough.",
    "This route still has untapped potential.",
    "No synced replay line available yet.",
    "A fresh target ready for early session attempts.",
  ],
  close: [
    "Already close. A cleaner line should convert it.",
    "Strong potential for a short retry session.",
    "One focused attempt could secure this medal.",
    "The pace is already there. Just stabilize it.",
    "Close enough to justify another quick session.",
    "Only minor mistakes separate this from Warrior.",
    "The current PB already shows good pace.",
    "Small cleanup target with reliable conversion odds.",
    "A safer grind target with visible progress.",
    "The difficult part is mostly behind you.",
    "This route is already trending in the right direction.",
    "Current consistency suggests a near-term conversion.",
    "Good target for a focused retry block.",
    "One cleaner sector could finish this map.",
    "The margin is manageable with stable execution.",
    "Already close enough to feel realistic.",
    "A few sharper turns could secure the run.",
    "This map is entering conversion territory.",
    "Solid pace. Needs a calmer finish.",
    "Worth revisiting while the rhythm is fresh.",
  ],
  nearMiss: [
    "Almost there. One clean run should do it.",
    "The medal is already within reach.",
    "Tiny improvements could finish this target.",
    "One stable replay away from conversion.",
    "This route is practically solved already.",
    "The current PB is dangerously close.",
    "Only milliseconds remain between you and Warrior.",
    "The next clean attempt could be enough.",
    "This target is deep in near-miss territory.",
    "The required pace is already visible.",
    "One confident finish should secure it.",
    "The gap is now mostly execution.",
    "This map deserves one more serious push.",
    "The line is there. It just needs commitment.",
    "Very high conversion odds on the next session.",
    "The hardest part may already be done.",
    "A near-perfect attempt should close the gap.",
    "The remaining difference is now razor-thin.",
    "One cleaner recovery could finish this route.",
    "This medal is already starting to crack.",
  ],
  earned: [
    "Already secured. Safe replay territory.",
    "This target has already been conquered.",
    "Warrior pace already achieved here.",
    "A completed route with stable progress.",
    "This map is already part of the collection.",
    "The difficult work here is already finished.",
    "A secured result with room for refinement.",
    "Already cleared with a synced Warrior PB.",
    "The medal is safe. Improvement is optional.",
    "A completed target worth revisiting casually.",
    "Already mastered well enough for progression.",
    "This route no longer needs urgent attention.",
    "The grind here is already behind you.",
    "This map is now part of your stable pool.",
    "Conversion complete. Precision remains optional.",
    "Already closed out with solid execution.",
    "The replay already speaks for itself.",
    "No pressure left on this route anymore.",
    "This medal is already locked in.",
    "One less road left unfinished.",
  ],
} as const;
const weeklyChallengeDescriptions = [
  "Longer session pick with more room for experimentation.",
  "Good candidate for a deeper route-learning session.",
  "Weekly-style target suited for calmer grinding.",
  "A tougher route worth studying over multiple runs.",
  "More demanding than a typical daily conversion.",
  "Good map for extended retry sessions and refinement.",
  "This route rewards patience more than aggression.",
  "A strong weekly candidate for focused progression.",
  "Designed for longer sessions and cleaner consistency.",
  "Better approached with patience than quick retries.",
] as const;
const dashboardActivityFeed = [
  {
    title: "New Warrior medal",
    detail: "Spring 2025 - 03 moved from close to earned with a 0:56.973 PB.",
    time: "2m ago",
    status: "earned",
  },
  {
    title: "PB improved",
    detail: "Fall 2025 - 04 improved by 0.532s and entered the <=1s bucket.",
    time: "15m ago",
    status: "close",
  },
  {
    title: "Challenge targets rerolled",
    detail: "New daily targets generated for the next grind block.",
    time: "32m ago",
    status: "targets",
  },
  {
    title: "Sync completed",
    detail: "Player PB sync finished successfully.",
    time: "1h ago",
    status: "up_to_date",
  },
  {
    title: "Weekly challenge selected",
    detail: "Royal Valley selected as this week's longer session pick.",
    time: "today",
    status: "weekly",
  },
  {
    title: "Sync notice",
    detail: "Positions data is a few days old. Refresh when needed.",
    time: "today",
    status: "notice",
  },
] as const;

export function DashboardPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [stats, setStats] = useState<StatsState>({ status: "loading" });
  const [captureState, setCaptureState] = useState<"idle" | "running" | "done" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    getStatsSummary()
      .then((data) => {
        if (!cancelled) setStats({ status: "ok", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setStats({ status: "error", message: getErrorMessage(error, "Unknown dashboard error") });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCapturePage() {
    if (!pageRef.current || captureState === "running") return;
    setCaptureState("running");
    try {
      await capturePageAsPng(
        pageRef.current,
        `medalforge-dashboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`,
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
            activePath="/dashboard"
            captureState={captureState}
            onNavigate={onNavigate}
            onCapturePage={() => void handleCapturePage()}
            progress={stats.status === "ok" ? { earned: stats.data.earned_count, total: stats.data.total_maps } : null}
            showChallengeDebug
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
                    Dashboard overview
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">
                    Warrior medal dashboard
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/76 md:text-base">
                    Overview-first cockpit for progress, near-misses, and what to grind next. Detailed
                    sync actions now live in Settings and the full table lives in Maps.
                  </p>
                </div>
              </div>
          </section>

          <DashboardSection
            onOpenMaps={() => onNavigate("/maps")}
            onOpenSettings={() => onNavigate("/settings")}
            onRetry={() => {
              setStats({ status: "loading" });
              getStatsSummary()
                .then((data) => setStats({ status: "ok", data }))
                .catch((error: unknown) => setStats({ status: "error", message: getErrorMessage(error, "Unknown dashboard error") }));
            }}
            stats={stats}
          />
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}

function DashboardSection({
  stats,
  onRetry,
  onOpenMaps,
  onOpenSettings,
}: {
  stats: StatsState;
  onRetry: () => void;
  onOpenMaps: () => void;
  onOpenSettings: () => void;
}) {
  if (stats.status === "loading") {
    return (
      <section className="grid gap-6">
        <section className={`${glassCardClass} h-[280px] animate-pulse`} />
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <article className={`${subduedCardClass} h-[156px] animate-pulse`} key={index} />)}
        </section>
      </section>
    );
  }

  if (stats.status === "error") {
    return (
      <section className={`${glassCardClass} p-6 md:p-7`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/76">Dashboard unavailable</p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Summary failed to load</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100/68">{stats.message}</p>
          </div>
          <button className={actionPrimaryClass} type="button" onClick={onRetry}>Retry summary</button>
        </div>
      </section>
    );
  }

  const summary = stats.data;
  const snapshotTime = summary.latest_progress_snapshot?.snapshot_at ?? null;
  const freshnessItems = buildFreshnessItems(summary);

  return (
    <section className="grid gap-6">
      <section className={`${glassCardClass} p-6 md:p-7`}>
        <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-80" />
        <div className="absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_center,rgba(43,196,255,0.12),transparent_54%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.32em] text-cyan-100/78">Overall progress</p>
            <h3 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              {summary.earned_count} / {summary.total_maps} Warrior medals
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/74">
              {summary.missing_count} missing, {summary.not_played_count} not played,
              {snapshotTime ? ` last snapshot ${formatDateTime(snapshotTime)}.` : " snapshot not created yet."}
            </p>

            <div className="mt-8 max-w-4xl">
              <WarriorProgressBar animated earned={summary.earned_count} label="Overall Warrior completion progress" total={summary.total_maps} />
            </div>

            <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-md">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/50">Close buckets</p>
                  <p className="mt-1 text-sm text-sky-100/62">Nearest Warrior gaps distribution</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <ProgressChip label="<=250 ms" tone="warning-strong" value={summary.close_025_count} />
                  <ProgressChip label="<=500 ms" tone="warning" value={summary.close_050_count} />
                  <ProgressChip label="<=1s" tone="cyan" value={summary.close_100_count} />
                  <ProgressChip label="<=2s" tone="muted" value={summary.close_200_count} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 content-start">
            <SpotlightCard detail="Live completion" label="Completion" value={formatPercent(summary.completion_percent)} />
            <SpotlightCard detail="Maps with synced PBs" label="Coverage" value={formatPercent(summary.total_maps > 0 ? (summary.played_count / summary.total_maps) * 100 : 0)} />
          </div>
        </div>
      </section>

      <section className={`${dashboardGroupFrameClass} p-3.5 md:p-4`}>
        <div className={dashboardGroupInnerGlowClass} />
        <div className="relative grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard detail="Current PBs already beat Warrior" label="Earned" tone="emerald" value={String(summary.earned_count)} />
          <MetricCard detail={summary.avg_diff_missing_ms !== null ? `Average gap ${formatGap(summary.avg_diff_missing_ms)}` : "No missing PBs yet"} label="Missing" tone="rose" value={String(summary.missing_count)} />
          <MetricCard detail="Maps with a synced local PB" label="Played" tone="cyan" value={String(summary.played_count)} />
          <MetricCard detail="Maps with no local PB record" label="Not played" tone="slate" value={String(summary.not_played_count)} />
        </div>
      </section>

      <ChallengeTargetsBlock totalMaps={summary.total_maps} />

      {!summary.has_player_pbs ? (
        <section className={`${glassCardClass} p-6 md:p-7`}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/76">PB sync required</p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">No personal bests synced yet</h3>
              <p className="mt-3 text-sm leading-6 text-sky-100/68">
                Connect your Trackmania account and run Sync My PBs from Settings. The dashboard will start
                showing completion, close medals, and progress activity as soon as local PB data exists.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className={actionPrimaryClass} type="button" onClick={onOpenSettings}>Open Settings</button>
              <button className={actionSecondaryClass} type="button" onClick={onOpenMaps}>Open Maps</button>
            </div>
          </div>
        </section>
      ) : (
        <section className={`${dashboardGroupFrameClass} p-3.5 md:p-4`}>
          <div className={dashboardGroupInnerGlowClass} />
          <div className="relative grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <SummaryListBlock emptyMessage="No close missing medals right now." items={summary.closest_missing_maps} subtitle="Closest misses by current PB gap" title="Close medals" valueType="gap" />
            <ActivityFeedBlock />
          </div>
        </section>
      )}

      <section className={`${dashboardGroupFrameClass} p-3 md:p-3.5`}>
        <div className={dashboardGroupInnerGlowClass} />
        <div className="relative grid gap-3 xl:grid-cols-3">
          {freshnessItems.map((item) => <FreshnessPill detail={item.detail} key={item.label} label={item.label} tone={item.tone} />)}
        </div>
      </section>
    </section>
  );
}

function ProgressChip({ label, value, tone }: { label: string; value: number; tone: "warning-strong" | "warning" | "cyan" | "muted" }) {
  const toneClass = {
    "warning-strong": "border-amber-300/24 bg-amber-300/12 text-amber-100",
    warning: "border-orange-300/22 bg-orange-300/10 text-orange-100",
    cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
    muted: "border-white/10 bg-white/[0.04] text-sky-50/74",
  } satisfies Record<string, string>;
  return <div className={`rounded-[18px] border px-3.5 py-3 backdrop-blur-md ${toneClass[tone]}`}><p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] opacity-75">{label}</p><p className="mt-1.5 text-lg font-black tracking-[-0.05em] text-inherit">{formatNumber(value)}</p></div>;
}

function SpotlightCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className={`rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl ${dashboardStatHoverClass}`}><p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/72">{label}</p><p className="mt-3 text-4xl font-black tracking-[-0.07em] text-white">{value}</p><p className="mt-2 text-sm leading-6 text-sky-100/62">{detail}</p></article>;
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "emerald" | "cyan" | "slate" | "rose" }) {
  const toneClasses = {
    emerald: "from-emerald-400/16 via-white/5 to-white/[0.03]",
    cyan: "from-cyan-400/16 via-white/5 to-white/[0.03]",
    slate: "from-slate-300/10 via-white/5 to-white/[0.03]",
    rose: "from-rose-400/14 via-white/5 to-white/[0.03]",
  } satisfies Record<string, string>;
  const valueTone = {
    emerald: "text-emerald-100",
    cyan: "text-cyan-100",
    slate: "text-slate-100",
    rose: "text-rose-100",
  } satisfies Record<string, string>;
  return <article className={`${subduedCardClass} p-3.5 ${dashboardStatHoverClass}`}><div className={`rounded-[18px] bg-[linear-gradient(135deg,var(--tw-gradient-stops))] px-4 py-3.5 ${toneClasses[tone]}`}><p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">{label}</p><strong className={`mt-2.5 block text-[2rem] font-black tracking-[-0.07em] ${valueTone[tone]}`}>{value}</strong><span className="mt-1.5 block text-[13px] leading-5 text-sky-100/64">{detail}</span></div></article>;
}

type ChallengeTargetsState =
  | { status: "loading" }
  | {
      status: "ok";
      daily: MapListItem[];
      weekly: MapListItem | null;
      mode: "default" | "edge";
      dailyExpiresAt: number;
      weeklyExpiresAt: number;
    }
  | { status: "empty" }
  | { status: "error"; message: string };

type ChallengeTargetsStoredEntry<TSelection> = {
  selection: TSelection;
  generatedAt: number;
  expiresAt: number;
};

type ChallengeTargetsStoredSelection = {
  mode?: "default" | "edge";
  daily: ChallengeTargetsStoredEntry<string[]>;
  weekly: ChallengeTargetsStoredEntry<string | null>;
};

function ChallengeTargetsBlock({ totalMaps }: { totalMaps: number }) {
  const [state, setState] = useState<ChallengeTargetsState>({ status: "loading" });
  const [countdownNow, setCountdownNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadChallengeTargets(options: { forceReroll?: boolean; edgeMode?: boolean } = {}) {
      setState({ status: "loading" });

      try {
        const response = await getMaps({
          limit: Math.max(totalMaps, 200),
          offset: 0,
          sort: "name",
          order: "asc",
        });

        if (cancelled) return;

        const maps = response.items;
        const missingMaps = maps.filter((map) => !map.has_warrior);
        const standardMissingMaps = buildStandardChallengePool(missingMaps);
        const storedSelection = readStoredChallengeTargetSelection(maps);

        if (standardMissingMaps.length === 0 && !options.edgeMode) {
          setState({ status: "empty" });
          return;
        }

        const selection = options.forceReroll
          ? options.edgeMode
            ? createStoredChallengeSelection(createEdgeChallengeTargetSelection(missingMaps))
            : createStoredChallengeSelection(createChallengeTargetSelection(standardMissingMaps))
          : resolveChallengeTargetSelection({
              missingMaps,
              standardMissingMaps,
              storedSelection,
            });

        if (!selection) {
          setState(
            options.edgeMode
              ? {
                  status: "ok",
                  daily: [],
                  weekly: null,
                  mode: "edge",
                  dailyExpiresAt: getNextDailyReset(),
                  weeklyExpiresAt: getNextWeeklyReset(),
                }
              : { status: "empty" },
          );
          return;
        }

        writeStoredChallengeTargetSelection(selection);
        setState({
          status: "ok",
          daily: selection.daily,
          weekly: selection.weekly,
          mode: selection.mode,
          dailyExpiresAt: selection.dailyExpiresAt,
          weeklyExpiresAt: selection.weeklyExpiresAt,
        });
      } catch (error: unknown) {
        if (!cancelled) {
          setState({ status: "error", message: getErrorMessage(error, "Challenge targets failed to load") });
        }
      }
    }

    void loadChallengeTargets();

    function handleReroll() {
      void loadChallengeTargets({ forceReroll: true });
    }

    function handleEdgeReroll() {
      void loadChallengeTargets({ forceReroll: true, edgeMode: true });
    }

    window.addEventListener(challengeTargetsRerollEvent, handleReroll);
    window.addEventListener(challengeTargetsEdgeRerollEvent, handleEdgeReroll);

    return () => {
      cancelled = true;
      window.removeEventListener(challengeTargetsRerollEvent, handleReroll);
      window.removeEventListener(challengeTargetsEdgeRerollEvent, handleEdgeReroll);
    };
  }, [totalMaps]);

  return (
    <section className={`${glassCardClass} p-5 md:p-6`}>
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-70" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_center,rgba(122,92,255,0.10),transparent_62%)]" />
      <div className="relative">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/76">CHALLENGE YOURSELF</p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Challenge targets</h3>
            <p className="mt-2 max-w-[68rem] text-sm leading-6 text-sky-100/68">
              Randomly selected missing Warrior medals for daily targets or a weekly challenge when you do not know what to grind next.
            </p>
          </div>
          {state.status === "ok" ? (
            <div className="flex flex-wrap gap-2 xl:max-w-[24rem] xl:justify-end">
              <ChallengeResetPill label="DAILY RESET" value={formatResetCountdown(state.dailyExpiresAt, countdownNow, "daily")} />
              <ChallengeResetPill label="WEEKLY RESET" value={formatResetCountdown(state.weeklyExpiresAt, countdownNow, "weekly")} />
            </div>
          ) : null}
        </div>

        {state.status === "loading" ? <ChallengeTargetsLoadingState /> : null}
        {state.status === "empty" ? <ChallengeTargetsEmptyState /> : null}
        {state.status === "error" ? <ChallengeTargetsErrorState message={state.message} /> : null}
        {state.status === "ok" ? <ChallengeTargetsReadyState daily={state.daily} weekly={state.weekly} mode={state.mode} /> : null}
      </div>
    </section>
  );
}

function ChallengeTargetsLoadingState() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <div className="grid gap-2.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="h-[118px] rounded-[20px] border border-white/10 bg-white/[0.04] animate-pulse" key={index} />
        ))}
      </div>
      <div className="min-h-[420px] rounded-[24px] border border-white/10 bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function ChallengeTargetsEmptyState() {
  return (
    <div className="rounded-[22px] border border-dashed border-white/14 bg-white/[0.025] p-5 text-sm leading-6 text-sky-100/62">
      No missing medals available. Sync PBs or maps to generate targets.
    </div>
  );
}

function ChallengeTargetsErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[22px] border border-rose-300/16 bg-rose-500/[0.08] p-5 text-sm leading-6 text-rose-100/84">
      {message}
    </div>
  );
}

function ChallengeResetPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-3.5 py-2.5 backdrop-blur-md">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-sky-50/48">{label}</p>
      <p className="mt-1 text-sm font-semibold text-sky-50/86">{value}</p>
    </div>
  );
}

function ChallengeTargetsReadyState({
  daily,
  weekly,
  mode,
}: {
  daily: MapListItem[];
  weekly: MapListItem | null;
  mode: "default" | "edge";
}) {
  const dailyRows = buildChallengeDailyRows(daily);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <div className="grid gap-2.5">
        {dailyRows.map((row) => (
          row.kind === "real" ? (
            <DashboardChallengeDailyRow key={row.map.map_uid} map={row.map} />
          ) : (
            <DashboardChallengePlaceholderRow key={row.title} title={row.title} />
          )
        ))}
      </div>
      {weekly ? <DashboardChallengeWeeklyCard map={weekly} /> : <DashboardChallengeCompletionCard mode={mode} />}
    </div>
  );
}

function DashboardChallengeDailyRow({ map }: { map: MapListItem }) {
  const accent = getChallengeAccent(map, "daily");
  const hint = getChallengeHint(map, "daily");
  const externalUrl = getMapExternalUrl(map);
  const tmxStyleLabel = getTmxPrimaryChipLabel(map.tmx_tag_names, map.tmx_style_name);

  return (
    <article className={`group relative overflow-hidden rounded-[20px] border p-3 backdrop-blur-[20px] transition duration-200 hover:-translate-y-0.5 md:p-3.5 ${accent.shell}`}>
      <div className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${accent.rail}`} />
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-55" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className={`pointer-events-none absolute right-[-2rem] top-[-2rem] h-20 w-20 rounded-full blur-3xl ${accent.glow}`} />
      <div className="relative grid min-h-[118px] gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
        <div className="min-w-0 pl-2">
          <div className="app-sidebar-scroll flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1">
            {map.difficulty_tier ? <DifficultyBadge tier={map.difficulty_tier} /> : null}
            <ChallengeChip label={accent.stageLabel} tone={accent.chipTone} compact />
            <ChallengeChip label={map.category ?? "Unknown"} tone="neutral" compact truncate />
            {tmxStyleLabel ? <ChallengeChip label={tmxStyleLabel} tone="tmx" compact truncate /> : null}
          </div>
          <h4 className="mt-1.5 truncate text-[1.08rem] font-black tracking-[-0.04em] text-slate-50">
            {cleanTrackmaniaText(map.name) ?? "Unnamed map"}
          </h4>
          {hint ? <p className="mt-1 truncate text-[12.5px] leading-5 text-sky-100/62">{hint}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-4">
          <ChallengeStatPill label="PB" value={formatMapTime(map.pb_time_ms)} compact />
          <ChallengeStatPill label="Warrior" value={formatMapTime(map.warrior_time_ms)} compact />
          <ChallengeStatPill label="Req" value={formatRequiredPosition(map)} compact />
          <ChallengeStatPill label="Diff" value={formatDiffCompact(map)} valueClassName={accent.diffClass} compact />
        </div>
        <div className="xl:justify-self-end">
          <BeatNowLink href={externalUrl} sizeClassName="px-4 py-2.5 text-[13px]" />
        </div>
      </div>
    </article>
  );
}

function DashboardChallengePlaceholderRow({ title }: { title: (typeof challengePlaceholderTitles)[number] }) {
  return (
    <article className="group relative overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02),rgba(8,27,47,0.12))] p-3 backdrop-blur-[20px] md:p-3.5">
      <div className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(110,231,183,0.92),rgba(16,185,129,0.56))]" />
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-45" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.035]" />
      <div className="pointer-events-none absolute right-[-2rem] top-[-2rem] h-20 w-20 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="relative grid min-h-[118px] gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
        <div className="min-w-0 pl-2">
          <div className="app-sidebar-scroll flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1">
            <ChallengeChip label="Complete" tone="neutral" compact />
            <ChallengeChip label="Recovery" tone="neutral" compact />
            <ChallengeChip label="No target" tone="neutral" compact />
          </div>
          <h4 className="mt-1.5 truncate text-[1.08rem] font-black tracking-[-0.04em] text-slate-50">{title}</h4>
          <p className="mt-1 truncate text-[12.5px] leading-5 text-sky-100/56">
            {challengePlaceholderSubtitles[title]}
          </p>
        </div>
        <div className="rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(8,27,47,0.10))] px-3 py-2.5 text-sm leading-6 text-sky-100/60 sm:col-span-2 xl:col-span-1">
          Take a breather or reroll when you want a new challenge.
        </div>
        <div className="xl:justify-self-end">
          <button className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-sky-50/58 opacity-80" disabled type="button">
            ROAD CLEARED
          </button>
        </div>
      </div>
    </article>
  );
}

function DashboardChallengeWeeklyCard({ map }: { map: MapListItem }) {
  const accent = getChallengeAccent(map, "weekly");
  const weeklyShellClass = "weeklyShell" in accent ? accent.weeklyShell : accent.shell;
  const externalUrl = getMapExternalUrl(map);
  const tmxStyleLabel = getTmxPrimaryChipLabel(map.tmx_tag_names, map.tmx_style_name);

  return (
    <article className={`group relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[24px] border p-5 backdrop-blur-[22px] transition duration-200 hover:-translate-y-0.5 md:p-6 ${weeklyShellClass}`}>
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-60" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,236,255,0.72),transparent)]" />
      <div className={`pointer-events-none absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full blur-3xl ${accent.glow}`} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-violet-100/66">Weekly Challenge</p>
            <h4 className="mt-3 text-[1.55rem] font-black tracking-[-0.04em] text-slate-50">
              {cleanTrackmaniaText(map.name) ?? "Unnamed map"}
            </h4>
          </div>
          <WeeklyChallengeThumbnail map={map} />
        </div>

        <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap">
          {map.difficulty_tier ? <DifficultyBadge tier={map.difficulty_tier} /> : null}
          <ChallengeChip label={accent.stageLabel} tone={accent.chipTone} />
          <ChallengeChip label={map.category ?? "Unknown"} tone="neutral" truncate />
          {tmxStyleLabel ? <ChallengeChip label={tmxStyleLabel} tone="tmx" truncate /> : null}
        </div>

        <p className="mt-4 text-sm leading-6 text-sky-100/72">
          {getChallengeHint(map, "weekly") ?? "Longer session pick for route learning and more random grind variety."}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <ChallengeStatPill label="PB" value={formatMapTime(map.pb_time_ms)} />
          <ChallengeStatPill label="Warrior" value={formatMapTime(map.warrior_time_ms)} />
          <ChallengeStatPill label="Required pos" value={formatRequiredPosition(map)} />
          <ChallengeStatPill label="Diff" value={formatDiffCompact(map)} valueClassName={accent.diffClass} />
        </div>

        <div className="mt-auto pt-5">
          <BeatNowLink href={externalUrl} sizeClassName="px-5 py-3 text-sm" />
        </div>
      </div>
    </article>
  );
}

function DashboardChallengeCompletionCard({ mode }: { mode: "default" | "edge" }) {
  return (
    <article className="group relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-emerald-300/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02),rgba(8,47,39,0.18))] p-5 backdrop-blur-[22px] md:p-6">
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-50" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,236,255,0.72),transparent)]" />
      <div className="pointer-events-none absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full bg-emerald-300/12 blur-3xl" />
      <div className="relative flex h-full flex-col">
        <div>
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-emerald-100/70">
            {mode === "edge" ? "MASTERED" : "Completion"}
          </p>
          <h4 className="mt-3 text-[1.55rem] font-black tracking-[-0.04em] text-slate-50">
            CONGRATULATIONS, YOU'VE COME A LONG WAY!
          </h4>
          <p className="mt-4 text-sm leading-6 text-sky-100/68">
            Most drivers never make it this far. At this point, every medal becomes a story.
          </p>
        </div>

        <blockquote className="relative mt-6 overflow-hidden rounded-[22px] border border-emerald-300/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.018))] p-5 text-sky-50/84">
          <p className="pointer-events-none absolute left-4 top-1 text-[5.5rem] font-black leading-none text-emerald-200/10">
            "
          </p>
          <p className="relative mt-5 text-base font-medium italic leading-7 text-sky-50/80">
            {challengeCompletionQuote}
          </p>
          <footer className="relative mt-3 text-sm font-semibold text-emerald-100/78">
            {challengeCompletionQuoteAuthor}
          </footer>
        </blockquote>

        <div className="mt-auto pt-5">
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.10] px-4 py-3 text-center text-sm font-semibold text-emerald-100">
            COMPLETE
          </div>
        </div>
      </div>
    </article>
  );
}

function FreshnessPill({ label, detail, tone }: { label: string; detail: string; tone: "success" | "warning" | "danger" | "muted" }) {
  const toneClass = {
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    danger: "border-rose-300/20 bg-rose-500/12 text-rose-100",
    muted: "border-white/10 bg-white/[0.03] text-sky-50/72",
  } satisfies Record<string, string>;
  return <article className={`rounded-[18px] border px-4 py-3 ${toneClass[tone]}`}><p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p><p className="mt-1.5 text-sm font-semibold text-white">{detail}</p></article>;
}

function BeatNowLink({ href, sizeClassName }: { href: string | null; sizeClassName: string }) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        className={`inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.035] font-semibold text-sky-50/42 opacity-80 ${sizeClassName}`}
      >
        BEAT NOW
      </span>
    );
  }

  return (
    <a
      className={`inline-flex items-center justify-center ${beatNowButtonClass} ${sizeClassName}`}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      BEAT NOW
    </a>
  );
}

function WeeklyChallengeThumbnail({ map }: { map: MapListItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const thumbnailUrl = !imageFailed ? (map.tmx_thumbnail_url ?? map.thumbnail_url ?? null) : null;
  const altLabel = `${cleanTrackmaniaText(map.name) ?? "Unnamed map"} thumbnail`;

  return (
    <div className="relative h-[6.25rem] w-[6.25rem] min-w-[6.25rem] overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(33,12,53,0.20))]">
      {thumbnailUrl ? (
        <>
          <img
            alt={altLabel}
            className="absolute inset-0 h-full w-full object-cover opacity-[0.58] saturate-[0.88]"
            src={thumbnailUrl}
            onError={() => setImageFailed(true)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,24,40,0.10),rgba(9,24,40,0.34)),linear-gradient(135deg,rgba(167,139,250,0.12),rgba(125,227,255,0.04),transparent)]" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(167,139,250,0.22),rgba(125,227,255,0.06),transparent)]" />
      )}
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="absolute inset-x-3 bottom-3">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-sky-50/52">Target</p>
        <p className="mt-1 text-xs font-semibold text-slate-100">Weekly pick</p>
      </div>
    </div>
  );
}

function SummaryListBlock({ title, subtitle, items, emptyMessage, valueType }: { title: string; subtitle: string; items: SummaryMapItem[]; emptyMessage: string; valueType: "gap" | "margin" }) {
  return (
    <section className={`${glassCardClass} p-5`}>
      <div className="mb-5">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">{title}</p>
        <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-sky-100/64">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/14 bg-white/[0.025] p-5 text-sm leading-6 text-sky-100/60">{emptyMessage}</div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const externalUrl = item.tmx_url ?? null;
            const tmxStyleLabel = getTmxPrimaryChipLabel(item.tmx_tag_names, item.tmx_style_name);
            const content = (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <strong className="block truncate text-base font-bold text-white">{cleanTrackmaniaText(item.name) ?? "Unnamed map"}</strong>
                  <div className="mt-2 flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap">
                    {item.difficulty_tier ? <DifficultyBadge tier={item.difficulty_tier} /> : null}
                    <SmallChip label={item.category ?? "Unknown"} tone={getCategoryTone(item.category)} truncate />
                    {tmxStyleLabel ? <ChallengeChip label={tmxStyleLabel} tone="tmx" compact truncate /> : null}
                  </div>
                </div>
                <div className="text-right">
                  <strong className={`block text-lg font-black tracking-[-0.04em] ${getSummaryValueClass(title, valueType, item)}`}>
                    {valueType === "gap" ? formatGap(item.diff_to_warrior_ms) : formatGap(item.margin_vs_warrior_ms)}
                  </strong>
                  <span className="mt-2 block text-xs leading-5 text-sky-100/54">{formatPositionSummary(item)}</span>
                  {externalUrl ? <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/58">Open on TMX</span> : null}
                </div>
              </div>
            );

            if (externalUrl) {
              return (
                <a
                  className={`block cursor-pointer rounded-[22px] border p-4 ${interactiveCardClass} ${getSummaryRowClass()}`}
                  href={externalUrl}
                  key={`${title}-${item.map_uid}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {content}
                </a>
              );
            }

            return <article className={`rounded-[22px] border p-4 ${getSummaryRowClass()}`} key={`${title}-${item.map_uid}`}>{content}</article>;
          })}
        </div>
      )}
    </section>
  );
}

function ActivityFeedBlock() {
  return (
    <section className={`${glassCardClass} p-5`}>
      <div className="mb-5">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">ACTIVITY</p>
        <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-white">Activity Feed</h3>
        <p className="mt-2 text-sm leading-6 text-sky-100/64">Recent progress, sync events, and challenge updates.</p>
      </div>
      <div className="grid gap-2.5">
        {dashboardActivityFeed.map((item) => (
          <ActivityFeedItem detail={item.detail} key={`${item.title}-${item.time}`} status={item.status} time={item.time} title={item.title} />
        ))}
      </div>
    </section>
  );
}

function SmallChip({
  label,
  tone,
  truncate = false,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "muted" | "cyan" | "purple";
  truncate?: boolean;
}) {
  const toneClass = {
    success: "border-emerald-300/18 bg-emerald-400/12 text-emerald-100",
    warning: "border-amber-300/18 bg-amber-300/12 text-amber-100",
    danger: "border-rose-300/18 bg-rose-500/12 text-rose-100",
    muted: "border-white/10 bg-white/[0.04] text-sky-50/66",
    cyan: "border-cyan-300/18 bg-cyan-400/12 text-cyan-100",
    purple: "border-violet-300/18 bg-violet-400/12 text-violet-100",
  } satisfies Record<string, string>;
  return (
    <span
      className={`inline-flex ${truncate ? "max-w-[8.5rem]" : ""} min-h-8 items-center justify-center whitespace-nowrap rounded-full border px-[14px] font-mono text-[11px] font-bold leading-none tracking-[0.2em] ${toneClass[tone]}`}
      title={label}
    >
      <span className={truncate ? "block truncate" : undefined}>{label}</span>
    </span>
  );
}

function ChallengeChip({
  label,
  tone,
  compact = false,
  truncate = false,
}: {
  label: string;
  tone: "neutral" | "elite" | "info" | "teal" | "warning" | "success" | "tmx";
  compact?: boolean;
  truncate?: boolean;
}) {
  const toneClass = {
    neutral: "border-white/12 bg-white/[0.05] text-slate-100",
    elite: "border-violet-300/20 bg-violet-300/[0.10] text-violet-100",
    info: "border-cyan-300/24 bg-cyan-300/[0.10] text-cyan-100",
    teal: "border-teal-300/24 bg-teal-300/[0.10] text-teal-100",
    warning: "border-amber-300/26 bg-amber-300/[0.11] text-amber-100",
    success: "border-emerald-300/24 bg-emerald-300/[0.11] text-emerald-100",
    tmx: "border-sky-200/14 bg-sky-300/[0.07] text-sky-100/78",
  } satisfies Record<string, string>;

  return (
    <span
      className={`inline-flex ${truncate ? "max-w-[8.5rem]" : "shrink-0"} items-center rounded-full border font-mono font-bold uppercase whitespace-nowrap ${
        compact ? "min-h-7 px-2.5 text-[10px] tracking-[0.16em]" : "min-h-8 px-3 text-[11px] tracking-[0.18em]"
      } ${toneClass[tone]}`}
      title={label}
    >
      <span className={truncate ? "block truncate" : undefined}>{label}</span>
    </span>
  );
}

function normalizeTmxChipLabel(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  switch (normalized) {
    case "RPG-Immersive":
      return "RPG";
    case "Moving Items":
      return "Moving";
    case "No Steering":
      return "No steer";
    default:
      return normalized;
  }
}

function getTmxPrimaryChipLabel(tags: string[] | null | undefined, style: string | null | undefined) {
  const lastTag = tags && tags.length > 0 ? tags[tags.length - 1] : null;
  return normalizeTmxChipLabel(lastTag) ?? normalizeTmxChipLabel(style);
}

function ChallengeStatPill({
  label,
  value,
  valueClassName = "text-slate-50",
  compact = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(8,27,47,0.10))] backdrop-blur-sm ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}
    >
      <p className={`font-mono font-black uppercase text-sky-50/46 ${compact ? "text-[9px] tracking-[0.18em]" : "text-[10px] tracking-[0.22em]"}`}>{label}</p>
      <p className={`mt-1 font-semibold ${compact ? "text-[12.5px]" : "text-sm"} ${valueClassName}`}>{value}</p>
    </div>
  );
}

function buildFreshnessItems(summary: StatsSummaryResponse) {
  return [
    { label: "Warrior data", detail: formatFreshness(summary.latest_sync_jobs.warrior_data, "Data ready"), tone: getFreshnessTone(summary.latest_sync_jobs.warrior_data?.status) },
    { label: "Positions", detail: formatFreshness(summary.latest_sync_jobs.warrior_positions, "Positions pending"), tone: getFreshnessTone(summary.latest_sync_jobs.warrior_positions?.status) },
    { label: "Player PBs", detail: formatFreshness(summary.latest_sync_jobs.player_pbs, "PB sync required"), tone: getFreshnessTone(summary.latest_sync_jobs.player_pbs?.status, !summary.has_player_pbs) },
  ] as const;
}

function formatFreshness(job: LatestSyncJobSummary | null, fallback: string) {
  if (!job?.finished_at) return fallback;
  return `sync ${formatRelativeTime(job.finished_at)} ago`;
}
function formatRelativeTime(value: string) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime());
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} d`;
}
function getFreshnessTone(lastStatus?: string | null, forceDanger = false) {
  if (forceDanger) return "danger" as const;
  if (lastStatus === "failed") return "danger" as const;
  if (lastStatus === "partial") return "warning" as const;
  if (lastStatus === "success") return "success" as const;
  return "muted" as const;
}
function formatGap(ms: number | null) {
  if (ms === null) return "N/A";
  return `${Math.abs(Math.round(ms))} ms`;
}
function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}
function formatPositionSummary(map: SummaryMapItem) {
  if (map.position_status === "over_10000") return "10k+ threshold";
  if (map.required_position) return `Warrior at #${map.required_position}`;
  return "Position not synced";
}
function getMapExternalUrl(map: Pick<MapListItem, "tmx_url" | "trackmania_io_url" | "map_id" | "map_uid">) {
  if (map.tmx_url) return map.tmx_url;
  if (map.trackmania_io_url) return map.trackmania_io_url;
  if (map.map_id && map.map_uid) return `https://trackmania.io/#/leaderboard/${map.map_id}/${map.map_uid}`;
  // TODO: add TMX MapID enrichment later and prefer trackmania.exchange/mapshow/{tmxMapId} when available.
  return null;
}
function getCategoryTone(category: string | null) {
  switch ((category ?? "unknown").toLowerCase()) {
    case "seasonal": return "success" as const;
    case "weekly": return "warning" as const;
    case "totd": return "cyan" as const;
    case "grand": return "danger" as const;
    case "other": return "purple" as const;
    default: return "muted" as const;
  }
}
function getSummaryValueClass(title: string, valueType: "gap" | "margin", item: SummaryMapItem) {
  if (title === "Best margins" || valueType === "margin") return "text-violet-100";
  if ((item.diff_to_warrior_ms ?? 999999) <= 500) return "text-amber-100";
  return "text-orange-100";
}
function getSummaryRowClass() {
  return "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]";
}
function cleanTrackmaniaText(value: string | null) {
  if (!value) return null;
  return value
    .replace(/\$[0-9a-fA-F]{3}/g, "")
    .replace(/\$[a-zA-Z<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getNextDailyReset(from = new Date()) {
  const reset = new Date(from);
  reset.setHours(5, 0, 0, 0);

  if (from.getTime() >= reset.getTime()) {
    reset.setDate(reset.getDate() + 1);
  }

  return reset.getTime();
}

function getNextWeeklyReset(from = new Date()) {
  const reset = new Date(from);
  const day = reset.getDay();
  const daysUntilMonday = (8 - day) % 7;

  reset.setDate(reset.getDate() + daysUntilMonday);
  reset.setHours(5, 0, 0, 0);

  if (daysUntilMonday === 0 && from.getTime() >= reset.getTime()) {
    reset.setDate(reset.getDate() + 7);
  }

  return reset.getTime();
}

function formatResetCountdown(expiresAt: number, now: number, mode: "daily" | "weekly") {
  const remainingMs = Math.max(0, expiresAt - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (mode === "daily") {
    const totalHours = days * 24 + hours;
    return `${String(totalHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  if (days > 0) {
    return `${days}D ${String(hours).padStart(2, "0")}H`;
  }

  return `${String(hours).padStart(2, "0")}H ${String(minutes).padStart(2, "0")}M`;
}

function readStoredChallengeTargetSelection(maps: MapListItem[]) {
  try {
    const raw = window.localStorage.getItem(challengeTargetsStorageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ChallengeTargetsStoredSelection>;
    if (
      !parsed
      || !parsed.daily
      || !Array.isArray(parsed.daily.selection)
      || typeof parsed.daily.generatedAt !== "number"
      || typeof parsed.daily.expiresAt !== "number"
      || !parsed.weekly
      || (parsed.weekly.selection !== null && typeof parsed.weekly.selection !== "string")
      || typeof parsed.weekly.generatedAt !== "number"
      || typeof parsed.weekly.expiresAt !== "number"
    ) {
      return null;
    }

    const byUid = new Map(maps.map((map) => [map.map_uid, map] as const));
    const daily = parsed.daily.selection
      .map((uid) => byUid.get(uid))
      .filter((map): map is MapListItem => map !== undefined && !map.has_warrior);
    const weekly = parsed.weekly.selection ? byUid.get(parsed.weekly.selection) ?? null : null;
    const mode: "default" | "edge" = parsed.mode === "edge" ? "edge" : "default";

    if (mode === "default") {
      if (daily.length !== 3 || !weekly || weekly.has_warrior) return null;
      if (!daily.every(isStandardChallengeCandidate) || !isStandardChallengeCandidate(weekly)) return null;
      const unique = new Set([...daily.map((map) => map.map_uid), weekly.map_uid]);
      if (unique.size !== 4) return null;
      return {
        daily,
        weekly,
        mode,
        dailyGeneratedAt: parsed.daily.generatedAt,
        dailyExpiresAt: parsed.daily.expiresAt,
        weeklyGeneratedAt: parsed.weekly.generatedAt,
        weeklyExpiresAt: parsed.weekly.expiresAt,
      };
    }

    if (daily.length > 3) return null;
    if (weekly && weekly.has_warrior) return null;
    const unique = new Set([...daily.map((map) => map.map_uid), ...(weekly ? [weekly.map_uid] : [])]);
    if (unique.size !== daily.length + (weekly ? 1 : 0)) return null;

    return {
      daily,
      weekly,
      mode,
      dailyGeneratedAt: parsed.daily.generatedAt,
      dailyExpiresAt: parsed.daily.expiresAt,
      weeklyGeneratedAt: parsed.weekly.generatedAt,
      weeklyExpiresAt: parsed.weekly.expiresAt,
    };
  } catch {
    return null;
  }
}

function writeStoredChallengeTargetSelection(selection: {
  daily: MapListItem[];
  weekly: MapListItem | null;
  mode: "default" | "edge";
  dailyGeneratedAt: number;
  dailyExpiresAt: number;
  weeklyGeneratedAt: number;
  weeklyExpiresAt: number;
}) {
  try {
    const payload: ChallengeTargetsStoredSelection = {
      mode: selection.mode,
      daily: {
        selection: selection.daily.map((map) => map.map_uid),
        generatedAt: selection.dailyGeneratedAt,
        expiresAt: selection.dailyExpiresAt,
      },
      weekly: {
        selection: selection.weekly?.map_uid ?? null,
        generatedAt: selection.weeklyGeneratedAt,
        expiresAt: selection.weeklyExpiresAt,
      },
    };
    window.localStorage.setItem(challengeTargetsStorageKey, JSON.stringify(payload));
  } catch {
    // Ignore localStorage failures and keep the in-memory selection.
  }
}

function createStoredChallengeSelection(selection: { daily: MapListItem[]; weekly: MapListItem | null; mode: "default" | "edge" } | null) {
  if (!selection) return null;

  const now = Date.now();
  return {
    ...selection,
    dailyGeneratedAt: now,
    dailyExpiresAt: getNextDailyReset(new Date(now)),
    weeklyGeneratedAt: now,
    weeklyExpiresAt: getNextWeeklyReset(new Date(now)),
  };
}

function resolveChallengeTargetSelection({
  missingMaps,
  standardMissingMaps,
  storedSelection,
}: {
  missingMaps: MapListItem[];
  standardMissingMaps: MapListItem[];
  storedSelection: ReturnType<typeof readStoredChallengeTargetSelection>;
}) {
  if (!storedSelection) {
    return createStoredChallengeSelection(createChallengeTargetSelection(standardMissingMaps));
  }

  const now = Date.now();
  const dailyExpired = storedSelection.dailyExpiresAt <= now;
  const weeklyExpired = storedSelection.weeklyExpiresAt <= now;

  if (!dailyExpired && !weeklyExpired) {
    return storedSelection;
  }

  if (dailyExpired && weeklyExpired) {
    return storedSelection.mode === "edge"
      ? createStoredChallengeSelection(createEdgeChallengeTargetSelection(missingMaps))
      : createStoredChallengeSelection(createChallengeTargetSelection(standardMissingMaps));
  }

  if (storedSelection.mode === "edge") {
    const nextDaily = dailyExpired
      ? rerollEdgeDailyTargets(missingMaps, storedSelection.weekly)
      : storedSelection.daily;
    const nextWeekly = weeklyExpired
      ? rerollEdgeWeeklyChallenge(missingMaps, storedSelection.daily)
      : storedSelection.weekly;

    return {
      daily: nextDaily,
      weekly: nextWeekly,
      mode: "edge" as const,
      dailyGeneratedAt: dailyExpired ? now : storedSelection.dailyGeneratedAt,
      dailyExpiresAt: dailyExpired ? getNextDailyReset(new Date(now)) : storedSelection.dailyExpiresAt,
      weeklyGeneratedAt: weeklyExpired ? now : storedSelection.weeklyGeneratedAt,
      weeklyExpiresAt: weeklyExpired ? getNextWeeklyReset(new Date(now)) : storedSelection.weeklyExpiresAt,
    };
  }

  const nextDaily = dailyExpired
    ? rerollDailyTargets(standardMissingMaps, storedSelection.weekly) ?? storedSelection.daily
    : storedSelection.daily;
  const nextWeekly = weeklyExpired
    ? rerollWeeklyChallenge(standardMissingMaps, storedSelection.daily) ?? storedSelection.weekly
    : storedSelection.weekly;

  const unique = new Set([
    ...nextDaily.map((map) => map.map_uid),
    ...(nextWeekly ? [nextWeekly.map_uid] : []),
  ]);

  if (unique.size !== nextDaily.length + (nextWeekly ? 1 : 0)) {
    return createStoredChallengeSelection(createChallengeTargetSelection(standardMissingMaps));
  }

  return {
    daily: nextDaily,
    weekly: nextWeekly,
    mode: "default" as const,
    dailyGeneratedAt: dailyExpired ? now : storedSelection.dailyGeneratedAt,
    dailyExpiresAt: dailyExpired ? getNextDailyReset(new Date(now)) : storedSelection.dailyExpiresAt,
    weeklyGeneratedAt: weeklyExpired ? now : storedSelection.weeklyGeneratedAt,
    weeklyExpiresAt: weeklyExpired ? getNextWeeklyReset(new Date(now)) : storedSelection.weeklyExpiresAt,
  };
}

function createChallengeTargetSelection(missingMaps: MapListItem[]) {
  if (missingMaps.length === 0) return null;

  const available = [...missingMaps];
  const requirePb = Math.random() < 0.5;
  const anchorSlot = Math.floor(Math.random() * 4);
  const selected: Array<MapListItem | null> = [null, null, null, null];

  if (requirePb) {
    const pbAnchor = pickRandom(
      available.filter((map) => map.pb_time_ms !== null),
    );

    if (pbAnchor) {
      selected[anchorSlot] = pbAnchor;
      removeMapByUid(available, pbAnchor.map_uid);
    }
  }

  if (!selected[3]) {
    const weeklyPool = prioritizeWeeklyCandidates(available);
    selected[3] = pickRandom(weeklyPool) ?? pickRandom(available) ?? null;
    if (selected[3]) removeMapByUid(available, selected[3].map_uid);
  }

  for (let index = 0; index < 3; index += 1) {
    if (selected[index]) continue;
    const dailyPool = prioritizeDailyCandidates(available);
    selected[index] = pickRandom(dailyPool) ?? pickRandom(available) ?? null;
    const picked = selected[index];
    if (picked) removeMapByUid(available, picked.map_uid);
  }

  const daily = selected.slice(0, 3).filter((map): map is MapListItem => map !== null);
  const weekly = selected[3];

  if (daily.length !== 3 || !weekly) return null;

  return { daily, weekly, mode: "default" as const };
}

function buildStandardChallengePool(missingMaps: MapListItem[]) {
  const standardCandidates = missingMaps.filter(isStandardChallengeCandidate);
  return standardCandidates.length > 0 ? standardCandidates : missingMaps;
}

function isStandardChallengeCandidate(map: MapListItem) {
  return !map.has_warrior && (map.diff_to_warrior_ms === null || map.diff_to_warrior_ms >= 0);
}

function createEdgeChallengeTargetSelection(missingMaps: MapListItem[]) {
  const totalRealTargets = Math.min(missingMaps.length, Math.floor(Math.random() * 4));
  if (totalRealTargets === 0) {
    return { daily: [], weekly: null, mode: "edge" as const };
  }

  const shuffled = shuffleMaps(missingMaps).slice(0, totalRealTargets);
  const ranked = [...shuffled].sort(compareChallengeDifficulty);
  const weekly = ranked[0] ?? null;
  const daily = ranked.slice(1, 4);

  return { daily, weekly, mode: "edge" as const };
}

function rerollDailyTargets(maps: MapListItem[], currentWeekly: MapListItem | null) {
  const available = maps.filter((map) => map.map_uid !== currentWeekly?.map_uid);
  if (available.length < 3) return null;

  const selected: MapListItem[] = [];
  const nextAvailable = [...available];
  const requirePb = Math.random() < 0.5;

  if (requirePb) {
    const pbAnchor = pickRandom(nextAvailable.filter((map) => map.pb_time_ms !== null));
    if (pbAnchor) {
      selected.push(pbAnchor);
      removeMapByUid(nextAvailable, pbAnchor.map_uid);
    }
  }

  while (selected.length < 3 && nextAvailable.length > 0) {
    const dailyPool = prioritizeDailyCandidates(nextAvailable);
    const picked = pickRandom(dailyPool) ?? pickRandom(nextAvailable);
    if (!picked) break;
    selected.push(picked);
    removeMapByUid(nextAvailable, picked.map_uid);
  }

  return selected.length === 3 ? selected : null;
}

function rerollWeeklyChallenge(maps: MapListItem[], currentDaily: MapListItem[]) {
  const excluded = new Set(currentDaily.map((map) => map.map_uid));
  const available = maps.filter((map) => !excluded.has(map.map_uid));
  if (available.length === 0) return null;

  const weeklyPool = prioritizeWeeklyCandidates(available);
  return pickRandom(weeklyPool) ?? pickRandom(available) ?? null;
}

function rerollEdgeDailyTargets(maps: MapListItem[], currentWeekly: MapListItem | null) {
  const available = maps.filter((map) => map.map_uid !== currentWeekly?.map_uid);
  const totalRealTargets = Math.min(available.length, Math.floor(Math.random() * 4));
  return shuffleMaps(available).slice(0, totalRealTargets);
}

function rerollEdgeWeeklyChallenge(maps: MapListItem[], currentDaily: MapListItem[]) {
  const excluded = new Set(currentDaily.map((map) => map.map_uid));
  const available = maps.filter((map) => !excluded.has(map.map_uid));
  if (available.length === 0) return null;

  const sampleSize = Math.min(available.length, Math.max(1, Math.floor(Math.random() * 4)));
  const ranked = shuffleMaps(available).slice(0, sampleSize).sort(compareChallengeDifficulty);
  return ranked[0] ?? null;
}

function prioritizeDailyCandidates(maps: MapListItem[]) {
  const easier = maps.filter((map) => ["free", "easy", "normal"].includes((map.difficulty_tier ?? "").toLowerCase()));
  if (easier.length > 0) return shuffleMaps(easier);

  return shuffleMaps(maps);
}

function prioritizeWeeklyCandidates(maps: MapListItem[]) {
  const harder = maps.filter((map) => ["hard", "insane", "demon"].includes((map.difficulty_tier ?? "").toLowerCase()));
  if (harder.length > 0) return shuffleMaps(harder);
  return shuffleMaps(maps);
}

function removeMapByUid(maps: MapListItem[], mapUid: string) {
  const index = maps.findIndex((map) => map.map_uid === mapUid);
  if (index >= 0) maps.splice(index, 1);
}

function pickRandom<T>(items: T[]) {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function shuffleMaps(items: MapListItem[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function compareChallengeDifficulty(left: MapListItem, right: MapListItem) {
  const difficultyDelta = getDifficultyRank(right.difficulty_tier) - getDifficultyRank(left.difficulty_tier);
  if (difficultyDelta !== 0) return difficultyDelta;

  const leftPosition = left.required_position ?? Number.MAX_SAFE_INTEGER;
  const rightPosition = right.required_position ?? Number.MAX_SAFE_INTEGER;
  if (leftPosition !== rightPosition) return leftPosition - rightPosition;

  return left.map_uid.localeCompare(right.map_uid);
}

function getDifficultyRank(value: string | null) {
  const rank = {
    free: 0,
    easy: 1,
    normal: 2,
    hard: 3,
    insane: 4,
    demon: 5,
  } satisfies Record<string, number>;

  const normalized = (value ?? "").toLowerCase();
  return normalized in rank ? rank[normalized as keyof typeof rank] : -1;
}

function getChallengeHint(map: MapListItem, mode: "daily" | "weekly") {
  if (mode === "weekly") {
    return pickStableChallengeDescription(weeklyChallengeDescriptions, `${map.map_uid}:weekly`);
  }

  const semanticState = getChallengeSemanticState(map);
  const descriptionGroup =
    semanticState === "near_miss"
      ? dailyChallengeDescriptions.nearMiss
      : semanticState === "close"
        ? dailyChallengeDescriptions.close
        : semanticState === "earned"
          ? dailyChallengeDescriptions.earned
          : dailyChallengeDescriptions.missing;

  return pickStableChallengeDescription(descriptionGroup, `${map.map_uid}:daily:${semanticState}`);
}

function pickStableChallengeDescription(options: readonly string[], seed: string) {
  if (options.length === 0) return null;
  const index = hashStringToIndex(seed, options.length);
  return options[index] ?? options[0] ?? null;
}

function hashStringToIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return modulo > 0 ? hash % modulo : 0;
}

function getChallengeSemanticState(map: MapListItem) {
  if (map.pb_time_ms !== null && map.diff_to_warrior_ms !== null && map.diff_to_warrior_ms < 0) {
    return "earned" as const;
  }

  if (map.pb_time_ms !== null && map.diff_to_warrior_ms !== null && map.diff_to_warrior_ms <= 250) {
    return "near_miss" as const;
  }

  if (map.pb_time_ms !== null) {
    return "close" as const;
  }

  return "missing" as const;
}

function getChallengeAccent(map: MapListItem, mode: "daily" | "weekly") {
  const semanticState = getChallengeSemanticState(map);

  const semanticPalette = {
    missing: {
      shell: "border-cyan-200/18 bg-[linear-gradient(145deg,rgba(43,196,255,0.10),rgba(255,255,255,0.03),rgba(8,27,47,0.12))] hover:border-cyan-100/26 shadow-[0_14px_34px_rgba(17,75,122,0.10)]",
      glow: "bg-cyan-300/10",
      rail: "bg-[linear-gradient(180deg,rgba(125,227,255,0.88),rgba(43,196,255,0.52))]",
      diffClass: "text-cyan-100/80",
      chipTone: "info" as const,
      stageLabel: "Missing",
    },
    close: {
      shell: "border-teal-300/18 bg-[linear-gradient(145deg,rgba(45,212,191,0.10),rgba(43,196,255,0.05),rgba(8,27,47,0.12))] hover:border-teal-200/26 shadow-[0_14px_34px_rgba(19,103,98,0.12)]",
      glow: "bg-teal-300/10",
      rail: "bg-[linear-gradient(180deg,rgba(94,234,212,0.88),rgba(13,148,136,0.54))]",
      diffClass: "text-teal-100",
      chipTone: "teal" as const,
      stageLabel: "Close",
    },
    near_miss: {
      shell: "border-amber-300/18 bg-[linear-gradient(145deg,rgba(251,191,36,0.10),rgba(255,255,255,0.03),rgba(8,27,47,0.12))] hover:border-amber-200/28 shadow-[0_16px_38px_rgba(120,90,20,0.14)]",
      glow: "bg-amber-300/12",
      rail: "bg-[linear-gradient(180deg,rgba(252,211,77,0.90),rgba(245,158,11,0.56))]",
      diffClass: "text-amber-100",
      chipTone: "warning" as const,
      stageLabel: "Near miss",
    },
    earned: {
      shell: "border-emerald-300/18 bg-[linear-gradient(145deg,rgba(16,185,129,0.10),rgba(255,255,255,0.03),rgba(8,27,47,0.12))] hover:border-emerald-200/26 shadow-[0_14px_34px_rgba(11,98,84,0.10)]",
      glow: "bg-emerald-300/10",
      rail: "bg-[linear-gradient(180deg,rgba(110,231,183,0.92),rgba(16,185,129,0.56))]",
      diffClass: "text-emerald-200",
      chipTone: "success" as const,
      stageLabel: "Earned",
    },
  } satisfies Record<ReturnType<typeof getChallengeSemanticState>, {
    shell: string;
    glow: string;
    rail: string;
    diffClass: string;
    chipTone: "info" | "teal" | "warning" | "success";
    stageLabel: string;
  }>;

  if (mode === "weekly") {
    return {
      ...semanticPalette[semanticState],
      weeklyShell:
        "border-violet-300/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02),rgba(33,12,53,0.18))] hover:border-violet-200/24 hover:shadow-[0_24px_60px_rgba(52,35,100,0.22)]",
      glow: "bg-violet-300/12",
    };
  }

  return semanticPalette[semanticState];
}

function formatMapTime(value: number | null) {
  if (value === null) return "—";
  const minutes = Math.floor(value / 60000);
  const seconds = Math.floor((value % 60000) / 1000);
  const milliseconds = Math.abs(value % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function formatDiffCompact(map: MapListItem) {
  if (map.pb_time_ms === null || map.diff_to_warrior_ms === null) return "No PB";
  const rounded = Math.round(map.diff_to_warrior_ms);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "±";
  return `${sign}${Math.abs(rounded)} ms`;
}

function formatRequiredPosition(map: MapListItem) {
  if (map.position_status === "over_10000") return "10k+";
  if (typeof map.required_position === "number") return `#${formatNumber(map.required_position)}`;
  return "—";
}

function buildChallengeDailyRows(daily: MapListItem[]) {
  const rows: Array<{ kind: "real"; map: MapListItem } | { kind: "placeholder"; title: (typeof challengePlaceholderTitles)[number] }> = daily.map((map) => ({
    kind: "real",
    map,
  }));

  for (let index = rows.length; index < 3; index += 1) {
    rows.push({
      kind: "placeholder",
      title: challengePlaceholderTitles[index],
    });
  }

  return rows;
}
