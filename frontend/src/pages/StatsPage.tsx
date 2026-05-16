import { useEffect, useRef, useState } from "react";

import {
  getStatsSummary,
  type CategoryBreakdownItem,
  type DifficultyBreakdownItem,
  type StatsSummaryResponse,
  type SummaryMapItem,
} from "../api/client";
import { AppSidebar } from "../components/layout/AppSidebar";
import { SiteFooter } from "../components/layout/SiteFooter";
import { DifficultyBadge } from "../components/playground/DifficultyBadge";
import avgEarnedDiffIcon from "../../icons/avg-earned-diff.svg?raw";
import avgMissingDiffIcon from "../../icons/avg-missing-diff.svg?raw";
import almostThereIcon from "../../icons/almost-there.svg?raw";
import demonEarnedIcon from "../../icons/deamo-earned.svg?raw";
import earnedIcon from "../../icons/earned.svg?raw";
import missingIcon from "../../icons/missing.svg?raw";
import pbCoverageIcon from "../../icons/pb-coverage.svg?raw";
import totalMapsIcon from "../../icons/total-maps.svg?raw";
import { capturePageAsPng } from "../utils/pageCapture";
import {
  cleanTrackmaniaText,
  formatDateTime,
  formatGap,
  formatNumber,
  formatPercent,
  formatRequiredPosition,
  formatTime,
} from "../utils/format";

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
const actionPrimaryClass =
  "rounded-full border border-cyan-200/30 bg-[#2bc4ff]/12 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(43,196,255,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/40 hover:bg-[#2bc4ff]/18 disabled:cursor-not-allowed disabled:opacity-50";
const actionSecondaryClass =
  "rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";

export function StatsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [stats, setStats] = useState<StatsState>({ status: "loading" });
  const [captureState, setCaptureState] = useState<"idle" | "running" | "done" | "error">("idle");

  function loadSummary() {
    setStats({ status: "loading" });
    getStatsSummary()
      .then((data) => setStats({ status: "ok", data }))
      .catch((error: unknown) => setStats({ status: "error", message: getErrorMessage(error, "Unknown stats error") }));
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function handleCapturePage() {
    if (!pageRef.current || captureState === "running") return;
    setCaptureState("running");
    try {
      await capturePageAsPng(
        pageRef.current,
        `medalforge-stats-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`,
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
            activePath="/stats"
            captureState={captureState}
            onNavigate={onNavigate}
            onCapturePage={() => void handleCapturePage()}
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
                  Stats workspace
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">Stats</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/76 md:text-base">
                  Deep breakdown of your Warrior medal progress.
                </p>
              </div>
              {stats.status === "ok" ? (
                <div className="rounded-full border border-white/12 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-cyan-100">
                  {stats.data.latest_progress_snapshot?.snapshot_at
                    ? `Snapshot ${formatDateTime(stats.data.latest_progress_snapshot.snapshot_at)}`
                    : "Snapshot not created yet"}
                </div>
              ) : null}
            </div>
          </section>

          <StatsContent onNavigate={onNavigate} onRetry={loadSummary} stats={stats} />
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}

function StatsContent({
  stats,
  onRetry,
  onNavigate,
}: {
  stats: StatsState;
  onRetry: () => void;
  onNavigate: (path: string) => void;
}) {
  if (stats.status === "loading") {
    return (
      <section className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article className={`${subduedCardClass} h-[136px] animate-pulse`} key={index} />
          ))}
        </section>
        <section className="grid gap-6 2xl:grid-cols-2">
          <article className={`${glassCardClass} h-[420px] animate-pulse`} />
          <article className={`${glassCardClass} h-[420px] animate-pulse`} />
        </section>
        <section className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <article className={`${glassCardClass} h-[360px] animate-pulse`} key={index} />
          ))}
        </section>
      </section>
    );
  }

  if (stats.status === "error") {
    return (
      <section className={`${glassCardClass} p-6 md:p-7`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/76">Stats unavailable</p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Summary failed to load</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100/68">{stats.message}</p>
          </div>
          <button className={actionPrimaryClass} type="button" onClick={onRetry}>Retry summary</button>
        </div>
      </section>
    );
  }

  const summary = stats.data;
  if (summary.total_maps === 0 || !summary.has_player_pbs) {
    return (
      <section className={`${glassCardClass} p-6 md:p-7`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/76">Stats waiting for data</p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
              {summary.total_maps === 0 ? "No synced Warrior maps yet" : "Sync player PBs to unlock stats"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-sky-100/68">
              {summary.total_maps === 0
                ? "Run the Warrior data sync first. Stats breakdowns depend on local maps, positions, and PB coverage."
                : "The detailed breakdown, close funnels, and top lists need synced player PB data from the Trackmania account connection."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={actionSecondaryClass} type="button" onClick={() => onNavigate("/maps")}>Open Maps</button>
            <button className={actionPrimaryClass} type="button" onClick={() => onNavigate("/settings")}>Open Settings</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-8 xl:grid-rows-3">
        <div className="md:col-span-2 xl:col-span-2 xl:row-span-3">
          <CompletionHeroCard
            completionPercent={summary.completion_percent}
            earned={summary.earned_count}
            total={summary.total_maps}
          />
        </div>

        <div className="xl:col-span-2 xl:col-start-3 xl:row-start-1">
          <OverviewCard detail="100% of all maps" iconSrc={totalMapsIcon} iconTone="blue" label="Total Maps" value={formatNumber(summary.total_maps)} />
        </div>

        <div className="xl:col-span-2 xl:col-start-5 xl:row-start-1">
          <OverviewCard detail={`${formatPercent(getDemonCompletionPercent(summary), 1)} of Demon maps`} iconSrc={demonEarnedIcon} iconTone="red" label="Demon Earned" value={formatNumber(getDemonEarnedCount(summary))} />
        </div>

        <div className="xl:col-span-2 xl:col-start-7 xl:row-start-1">
          <OverviewCard detail={`${formatPercent((summary.missing_count / Math.max(summary.total_maps, 1)) * 100, 1)} of all maps`} iconSrc={missingIcon} iconTone="orange" label="Missing" value={formatNumber(summary.missing_count)} />
        </div>

        <div className="md:col-span-2 xl:col-span-3 xl:col-start-3 xl:row-span-2 xl:row-start-2">
          <FeatureOverviewCard
            detail={`${formatPercent(summary.completion_percent, 1)} of all maps`}
            iconSrc={earnedIcon}
            iconTone="green"
            label="Earned"
            subdetail="Warrior medals earned"
            value={formatNumber(summary.earned_count)}
          />
        </div>

        <div className="grid gap-3 md:col-span-2 md:grid-cols-2 xl:col-span-3 xl:col-start-6 xl:row-span-2 xl:row-start-2 xl:grid-cols-2 xl:grid-rows-2">
          <OverviewCard detail="Closest to Warrior" iconSrc={almostThereIcon} iconTone="gold" label="Almost There" value={formatAlmostThereValue(summary)} />
          <OverviewCard detail="Avg WR Margin" iconSrc={avgEarnedDiffIcon} iconTone="green" label="Avg Margin" value={formatGap(summary.avg_margin_earned_ms)} />
          <OverviewCard detail="AVG behind Warrior" iconSrc={avgMissingDiffIcon} iconTone="orange" label="Avg Miss" value={formatGap(summary.avg_diff_missing_ms)} />
          <OverviewCard detail="Of all maps" iconSrc={pbCoverageIcon} iconTone="white" label="PB Coverage" value={formatPercent((summary.played_count / Math.max(summary.total_maps, 1)) * 100, 1)} />
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.02fr_0.98fr]">
        <BreakdownCard
          items={summary.earned_by_difficulty}
          subtitle="Free to Demon, based on synced required positions."
          title="Difficulty Breakdown"
          type="difficulty"
        />
        <BreakdownCard
          items={summary.earned_by_category}
          subtitle="Progress across the current Warrior collections."
          title="Category Breakdown"
          type="category"
        />
      </section>

      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="mb-5">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">Close medals</p>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Close Medals Funnel</h3>
          <p className="mt-3 text-sm leading-6 text-sky-100/68">How much progress is sitting just outside Warrior.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FunnelCard accent="warning-strong" label="within 0.25s" value={summary.close_025_count} />
          <FunnelCard accent="warning" label="within 0.5s" value={summary.close_050_count} />
          <FunnelCard accent="cyan" label="within 1s" value={summary.close_100_count} />
          <FunnelCard accent="muted" label="within 2s" value={summary.close_200_count} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TopListBlock
          emptyMessage="No close missing maps yet."
          items={summary.closest_missing_maps.slice(0, 5)}
          metricLabel="Gap"
          metricType="gap"
          subtitle="Smallest positive gap to Warrior."
          title="Closest Missing"
        />
        <TopListBlock
          emptyMessage="No earned Warrior maps yet."
          items={summary.best_earned_maps.slice(0, 5)}
          metricLabel="Margin"
          metricType="margin"
          subtitle="Largest advantage over Warrior."
          title="Best Earned"
        />
        <TopListBlock
          emptyMessage="No earned maps with synced positions yet."
          items={summary.hardest_earned_maps.slice(0, 5)}
          metricLabel="Required"
          metricType="required"
          subtitle="Earned maps with the hardest required positions."
          title="Hardest Earned"
        />
        <TopListBlock
          emptyMessage="No missing maps with synced positions yet."
          items={summary.easiest_missing_maps.slice(0, 5)}
          metricLabel="Required"
          metricType="required"
          subtitle="Missing maps that should be the easiest pickups."
          title="Easiest Missing"
        />
      </section>
    </section>
  );
}

function OverviewCard({
  label,
  value,
  detail,
  iconSrc,
  iconTone,
}: {
  label: string;
  value: string;
  detail: string;
  iconSrc: string;
  iconTone: "blue" | "green" | "orange" | "white" | "red" | "gold";
}) {
  const iconToneClass = {
    blue: {
      shell: "border-cyan-200/20 bg-cyan-300/[0.08] text-cyan-100",
      halo: "bg-cyan-300/18",
    },
    green: {
      shell: "border-emerald-300/22 bg-emerald-300/[0.09] text-emerald-200",
      halo: "bg-emerald-300/18",
    },
    orange: {
      shell: "border-amber-300/20 bg-amber-300/[0.09] text-amber-100",
      halo: "bg-amber-300/18",
    },
    white: {
      shell: "border-white/16 bg-white/[0.07] text-white",
      halo: "bg-white/14",
    },
    red: {
      shell: "border-rose-300/20 bg-rose-500/[0.10] text-rose-100",
      halo: "bg-rose-300/18",
    },
    gold: {
      shell: "border-amber-300/20 bg-amber-300/[0.09] text-amber-50",
      halo: "bg-amber-300/18",
    },
  } satisfies Record<"blue" | "green" | "orange" | "white" | "red" | "gold", { shell: string; halo: string }>;

  return (
    <article className={`${subduedCardClass} ${interactiveCardClass} relative h-full p-5`}>
      <div className={`pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full blur-2xl ${iconToneClass[iconTone].halo}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/50">{label}</p>
          <strong className="mt-4 block text-3xl font-black tracking-[-0.05em] text-white">{value}</strong>
          <p className="mt-3 text-sm leading-6 text-sky-100/64">{detail}</p>
        </div>
        <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${iconToneClass[iconTone].shell}`}>
          <span
            aria-hidden="true"
            className="block h-7 w-7 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:fill-current [&_svg]:text-current"
            dangerouslySetInnerHTML={{ __html: iconSrc }}
          />
        </div>
      </div>
    </article>
  );
}

function CompletionHeroCard({
  completionPercent,
  earned,
  total,
}: {
  completionPercent: number;
  earned: number;
  total: number;
}) {
  const ringStyle = {
    background: `conic-gradient(rgba(67,164,255,0.98) 0deg, rgba(67,164,255,0.98) ${completionPercent * 3.6}deg, rgba(255,181,80,0.95) ${Math.max(completionPercent * 3.6 - 18, 0)}deg, rgba(255,181,80,0.95) ${completionPercent * 3.6}deg, rgba(255,255,255,0.08) ${completionPercent * 3.6}deg, rgba(255,255,255,0.08) 360deg)`,
  };

  return (
    <article className={`${glassCardClass} flex h-full min-h-[286px] flex-col items-center justify-between p-5 xl:min-h-0`}>
      <div className="w-full">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/52">Completion</p>
      </div>
      <div className="relative grid h-[154px] w-[154px] place-items-center rounded-full p-[10px]" style={ringStyle}>
        <div className="absolute inset-0 rounded-full shadow-[0_0_36px_rgba(43,196,255,0.12)]" />
        <div className="relative grid h-full w-full place-items-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),rgba(255,255,255,0.018),rgba(8,27,47,0.18))]">
          <div className="text-center">
            <strong className="block text-4xl font-black tracking-[-0.05em] text-white">{formatPercent(completionPercent, 1)}</strong>
            <span className="mt-2 block text-sm font-semibold text-sky-100/62">{formatNumber(earned)} / {formatNumber(total)}</span>
          </div>
        </div>
      </div>
      <p className="text-sm leading-6 text-sky-100/64">Earned / Total</p>
    </article>
  );
}

function FeatureOverviewCard({
  label,
  value,
  detail,
  subdetail,
  iconSrc,
  iconTone,
}: {
  label: string;
  value: string;
  detail: string;
  subdetail: string;
  iconSrc: string;
  iconTone: "green";
}) {
  const iconToneClass = {
    green: {
      shell: "border-emerald-300/22 bg-emerald-300/[0.09] text-emerald-200",
      halo: "bg-emerald-300/18",
      accent: "bg-[radial-gradient(circle_at_right,rgba(110,231,183,0.18),transparent_42%)]",
    },
  } satisfies Record<"green", { shell: string; halo: string; accent: string }>;

  return (
    <article className={`${subduedCardClass} ${interactiveCardClass} relative h-full p-5`}>
      <div className={`pointer-events-none absolute right-5 top-5 h-20 w-20 rounded-full blur-3xl ${iconToneClass[iconTone].halo}`} />
      <div className={`pointer-events-none absolute inset-y-0 right-0 w-[44%] ${iconToneClass[iconTone].accent}`} />
      <div className="relative flex h-full items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/50">{label}</p>
          <strong className="mt-4 block text-5xl font-black tracking-[-0.06em] text-white">{value}</strong>
          <p className="mt-3 text-sm leading-6 text-sky-100/70">{subdetail}</p>
          <p className="mt-2 text-sm leading-6 text-sky-100/64">{detail}</p>
        </div>
        <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${iconToneClass[iconTone].shell}`}>
          <span
            aria-hidden="true"
            className="block h-7 w-7 [&_svg]:h-7 [&_svg]:w-7 [&_svg]:fill-current [&_svg]:text-current"
            dangerouslySetInnerHTML={{ __html: iconSrc }}
          />
        </div>
      </div>
    </article>
  );
}

function getDemonEarnedCount(summary: StatsSummaryResponse) {
  return summary.earned_by_difficulty.find((item) => item.tier === "Demon")?.earned ?? 0;
}

function getDemonCompletionPercent(summary: StatsSummaryResponse) {
  return summary.earned_by_difficulty.find((item) => item.tier === "Demon")?.completion_percent ?? 0;
}

function formatAlmostThereValue(summary: StatsSummaryResponse) {
  const closest = summary.closest_missing_maps[0];
  if (!closest || closest.diff_to_warrior_ms === null) return "N/A";
  return `+${formatGap(closest.diff_to_warrior_ms)}`;
}

function BreakdownCard({
  title,
  subtitle,
  items,
  type,
}: {
  title: string;
  subtitle: string;
  items: DifficultyBreakdownItem[] | CategoryBreakdownItem[];
  type: "difficulty" | "category";
}) {
  return (
    <section className={`${glassCardClass} p-5 md:p-6`}>
      <div className="mb-5">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">{type === "difficulty" ? "Difficulty" : "Category"}</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-sky-100/68">{subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.016))]">
        {items.length === 0 ? (
          <div className="p-5 text-sm leading-6 text-sky-100/60">
            No synced breakdown data available yet.
          </div>
        ) : (
          <BreakdownTable items={items} type={type} />
        )}
      </div>
    </section>
  );
}

function BreakdownTable({
  items,
  type,
}: {
  items: DifficultyBreakdownItem[] | CategoryBreakdownItem[];
  type: "difficulty" | "category";
}) {
  const totalMaps = items.reduce((sum, item) => sum + item.total, 0);
  const earnedMaps = items.reduce((sum, item) => sum + item.earned, 0);
  const missingMaps = items.reduce((sum, item) => sum + item.missing, 0);
  const completionPercent = totalMaps > 0 ? (earnedMaps / totalMaps) * 100 : 0;

  return (
    <div className="overflow-hidden">
      <div>
        <div className="grid grid-cols-[minmax(0,1.32fr)_0.72fr_0.72fr_0.72fr_minmax(128px,1fr)] gap-3 border-b border-white/8 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-sky-50/56 lg:grid-cols-[minmax(0,1.32fr)_0.74fr_0.74fr_0.74fr_minmax(148px,1fr)]">
          <span>{type === "difficulty" ? "Tier" : "Category"}</span>
          <span>Total</span>
          <span>Earned</span>
          <span>Missing</span>
          <span>Completion</span>
        </div>

        <div className="grid">
          {items.map((item) => (
            <BreakdownTableRow
              item={item}
              key={type === "difficulty" ? (item as DifficultyBreakdownItem).tier : (item as CategoryBreakdownItem).category}
              type={type}
            />
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1.32fr)_0.72fr_0.72fr_0.72fr_minmax(128px,1fr)] gap-3 border-t border-white/10 px-4 py-4 lg:grid-cols-[minmax(0,1.32fr)_0.74fr_0.74fr_0.74fr_minmax(148px,1fr)]">
          <strong className="text-base font-bold text-white lg:text-lg">Total</strong>
          <strong className="text-base font-bold text-white lg:text-lg">{formatNumber(totalMaps)}</strong>
          <strong className="text-base font-bold text-white lg:text-lg">{formatNumber(earnedMaps)}</strong>
          <strong className="text-base font-bold text-white lg:text-lg">{formatNumber(missingMaps)}</strong>
          <div className="flex items-center justify-between gap-3">
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(43,196,255,0.92),rgba(125,227,255,0.95),rgba(246,199,96,0.86))]"
                style={{ width: `${Math.max(Math.min(completionPercent, 100), completionPercent > 0 ? 2 : 0)}%` }}
              />
            </div>
            <strong className="shrink-0 text-lg font-black tracking-[-0.04em] text-white lg:text-2xl">{formatPercent(completionPercent, 1)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownTableRow({
  item,
  type,
}: {
  item: DifficultyBreakdownItem | CategoryBreakdownItem;
  type: "difficulty" | "category";
}) {
  const label =
    type === "difficulty"
      ? (item as DifficultyBreakdownItem).tier
      : (item as CategoryBreakdownItem).category;

  return (
    <div className={`grid grid-cols-[minmax(0,1.32fr)_0.72fr_0.72fr_0.72fr_minmax(128px,1fr)] gap-3 border-t border-white/6 px-4 ${type === "category" ? "py-[1.375rem]" : "py-4"} lg:grid-cols-[minmax(0,1.32fr)_0.74fr_0.74fr_0.74fr_minmax(148px,1fr)] ${interactiveCardClass}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {type === "difficulty" ? <DifficultyPill tier={label} /> : <CategoryBadge category={label} />}
        </div>
      </div>

      <span className="text-[15px] font-semibold text-slate-100 lg:text-base">{formatNumber(item.total)}</span>
      <span className="text-[15px] font-semibold text-slate-100 lg:text-base">{formatNumber(item.earned)}</span>
      <span className="text-[15px] font-semibold text-slate-100 lg:text-base">{formatNumber(item.missing)}</span>

      <div className="flex items-center justify-between gap-3">
        <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full border border-white/8 bg-white/[0.035]">
          <div
            className={`h-full rounded-full ${getBreakdownProgressClass(label, type)}`}
            style={{ width: `${Math.max(Math.min(item.completion_percent, 100), item.completion_percent > 0 ? 2 : 0)}%` }}
          />
        </div>
        <span className="shrink-0 text-[15px] font-semibold text-sky-50/88 lg:text-base">{formatPercent(item.completion_percent, 1)}</span>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-flex min-h-6 w-[92px] items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${getCategoryBadgeClass(category)}`}
      title={category}
    >
      {category}
    </span>
  );
}

function DifficultyPill({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex min-h-6 w-[92px] items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${getDifficultyPillClass(tier)}`}
      title={tier}
    >
      {tier}
    </span>
  );
}

function getCategoryBadgeClass(category: string) {
  switch (category.toLowerCase()) {
    case "seasonal":
      return "border-emerald-300/22 bg-emerald-400/18 text-emerald-50";
    case "grand":
      return "border-amber-300/22 bg-amber-300/18 text-amber-50";
    case "weekly":
      return "border-sky-300/22 bg-sky-400/18 text-sky-50";
    case "totd":
      return "border-cyan-300/22 bg-cyan-400/18 text-cyan-50";
    default:
      return "border-violet-300/18 bg-violet-400/14 text-violet-100";
  }
}

function getDifficultyPillClass(tier: string) {
  switch (tier.toLowerCase()) {
    case "free":
      return "border-emerald-300/22 bg-emerald-400/18 text-emerald-50";
    case "easy":
      return "border-cyan-300/22 bg-cyan-400/18 text-cyan-50";
    case "normal":
      return "border-sky-300/22 bg-sky-400/18 text-sky-50";
    case "hard":
      return "border-violet-300/18 bg-violet-400/14 text-violet-100";
    case "insane":
      return "border-amber-300/22 bg-amber-300/18 text-amber-50";
    case "demon":
      return "border-rose-300/18 bg-rose-500/14 text-rose-100";
    default:
      return "border-white/12 bg-white/[0.04] text-sky-50/74";
  }
}

function getBreakdownProgressClass(label: string, type: "difficulty" | "category") {
  if (type === "category") {
    switch (label.toLowerCase()) {
      case "seasonal":
        return "bg-[linear-gradient(90deg,rgba(110,231,183,0.92),rgba(52,211,153,0.88))]";
      case "grand":
        return "bg-[linear-gradient(90deg,rgba(251,191,36,0.92),rgba(245,158,11,0.88))]";
      case "weekly":
        return "bg-[linear-gradient(90deg,rgba(125,227,255,0.94),rgba(43,196,255,0.88))]";
      case "totd":
        return "bg-[linear-gradient(90deg,rgba(103,232,249,0.94),rgba(34,211,238,0.88))]";
      default:
        return "bg-[linear-gradient(90deg,rgba(192,132,252,0.90),rgba(167,139,250,0.86))]";
    }
  }

  switch (label.toLowerCase()) {
    case "free":
      return "bg-[linear-gradient(90deg,rgba(110,231,183,0.92),rgba(52,211,153,0.88))]";
    case "easy":
      return "bg-[linear-gradient(90deg,rgba(103,232,249,0.94),rgba(34,211,238,0.88))]";
    case "normal":
      return "bg-[linear-gradient(90deg,rgba(125,227,255,0.94),rgba(43,196,255,0.88))]";
    case "hard":
      return "bg-[linear-gradient(90deg,rgba(192,132,252,0.90),rgba(167,139,250,0.86))]";
    case "insane":
      return "bg-[linear-gradient(90deg,rgba(251,191,36,0.92),rgba(245,158,11,0.88))]";
    default:
      return "bg-[linear-gradient(90deg,rgba(251,113,133,0.92),rgba(244,63,94,0.88))]";
  }
}

function FunnelCard({ label, value, accent }: { label: string; value: number; accent: "warning-strong" | "warning" | "cyan" | "muted" }) {
  const toneClass = {
    "warning-strong": "border-amber-300/18 bg-[linear-gradient(180deg,rgba(251,191,36,0.10),rgba(255,255,255,0.03))] text-amber-100",
    warning: "border-orange-300/18 bg-[linear-gradient(180deg,rgba(249,115,22,0.10),rgba(255,255,255,0.03))] text-orange-100",
    cyan: "border-cyan-200/18 bg-[linear-gradient(180deg,rgba(43,196,255,0.10),rgba(255,255,255,0.03))] text-cyan-100",
    muted: "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] text-sky-50/80",
  } satisfies Record<typeof accent, string>;

  return (
    <article className={`rounded-[24px] border p-5 ${toneClass[accent]}`}>
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-inherit/75">{label}</p>
      <strong className="mt-4 block text-4xl font-black tracking-[-0.05em] text-white">{formatNumber(value)}</strong>
      <p className="mt-3 text-sm leading-6 text-sky-100/58">Maps currently sitting in this funnel bucket.</p>
    </article>
  );
}

function TopListBlock({
  title,
  subtitle,
  items,
  emptyMessage,
  metricType,
  metricLabel,
}: {
  title: string;
  subtitle: string;
  items: SummaryMapItem[];
  emptyMessage: string;
  metricType: "gap" | "margin" | "required";
  metricLabel: string;
}) {
  return (
    <section className={`${glassCardClass} p-5 md:p-6`}>
      <div className="mb-5">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/56">Top list</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-sky-100/68">{subtitle}</p>
      </div>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-white/14 bg-white/[0.025] p-5 text-sm leading-6 text-sky-100/60">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <TopMapCard item={item} key={`${title}:${item.map_uid}`} metricLabel={metricLabel} metricType={metricType} />
          ))
        )}
      </div>
    </section>
  );
}

function TopMapCard({
  item,
  metricLabel,
  metricType,
}: {
  item: SummaryMapItem;
  metricLabel: string;
  metricType: "gap" | "margin" | "required";
}) {
  const name = cleanTrackmaniaText(item.name) ?? "Unnamed map";
  const category = cleanTrackmaniaText(item.category) ?? item.category ?? "Unknown";
  const campaign = cleanTrackmaniaText(item.campaign_name) ?? item.campaign_name ?? null;
  const outboundUrl = item.tmx_url ?? item.trackmania_io_url ?? null;
  const metricValue =
    metricType === "gap"
      ? formatGap(item.diff_to_warrior_ms)
      : metricType === "margin"
        ? formatGap(item.margin_vs_warrior_ms)
        : formatRequiredPosition(item.required_position, item.position_status);

  return (
    <article className={`${subduedCardClass} ${interactiveCardClass} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-base font-bold text-white">{name}</strong>
            {item.difficulty_tier ? <DifficultyBadge tier={item.difficulty_tier} /> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-sky-50/78">{category}</span>
            {campaign ? <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-sky-50/66">{campaign}</span> : null}
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-sky-50/46">{metricLabel}</span>
          <strong className="mt-2 block text-lg font-bold text-cyan-100">{metricValue}</strong>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-sky-100/64 sm:grid-cols-2">
        <span>PB {item.pb_time_ms !== null ? formatTime(item.pb_time_ms) : "No PB"}</span>
        <span>Warrior {item.warrior_time_ms !== null ? formatTime(item.warrior_time_ms) : "N/A"}</span>
        <span>
          {item.diff_to_warrior_ms !== null && item.diff_to_warrior_ms < 0 ? "Ahead" : "Gap"}{" "}
          {item.diff_to_warrior_ms !== null ? formatGap(item.diff_to_warrior_ms) : "N/A"}
        </span>
        <span>Position {formatRequiredPosition(item.required_position, item.position_status)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-sky-100/46">{item.position_status === "over_10000" ? "Required position currently beyond top 10k." : "\u00A0"}</span>
        {outboundUrl ? (
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-cyan-200/24 bg-[#2bc4ff]/10 px-3 text-xs font-semibold text-cyan-50 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/40 hover:bg-[#2bc4ff]/18"
            href={outboundUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open map
          </a>
        ) : null}
      </div>
    </article>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
