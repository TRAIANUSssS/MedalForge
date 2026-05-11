import { type ReactNode } from "react";

import { ActivityFeedItem } from "../components/playground/ActivityFeedItem";
import { DesignSection } from "../components/playground/DesignSection";
import { DifficultyBadge } from "../components/playground/DifficultyBadge";
import { MapRowPreview } from "../components/playground/MapRowPreview";
import { MetricCard } from "../components/playground/MetricCard";
import { MockChartCard } from "../components/playground/MockChartCard";
import { RecommendationCard } from "../components/playground/RecommendationCard";
import { StatusBadge } from "../components/playground/StatusBadge";
import { TokenSwatch } from "../components/playground/TokenSwatch";
import {
  activityFeed,
  designTokens,
  mapRows,
  metricCards,
  recommendationCards,
} from "../components/playground/mockData";

const primarySidebarItems = ["Dashboard", "Maps", "Stats", "Charts", "Grind Queue"];
const utilitySidebarItems = ["Settings", "Design Playground"];
const dailyTargetCards = [
  {
    title: "S14 Ice Chicane",
    category: "Seasonal",
    difficulty: "Normal",
    status: "close",
    detail: "Recoverable final wall contact.",
    pbTime: "1:02.711",
    warriorTime: "1:02.440",
    requiredPosition: "#5,902",
    diffLabel: "+271 ms",
    diffTone: "close",
  },
  {
    title: "Spring 2025 - 03",
    category: "TOTD",
    difficulty: "Easy",
    status: "close",
    detail: "Small cleanup target, almost there.",
    pbTime: "0:57.018",
    warriorTime: "0:56.973",
    requiredPosition: "#2,814",
    diffLabel: "+45 ms",
    diffTone: "very_close",
  },
  {
    title: "G03 Neon Valley",
    category: "Grand League",
    difficulty: "Easy",
    status: "earned",
    detail: "Already secured, good replay run.",
    pbTime: "0:49.696",
    warriorTime: "0:49.880",
    requiredPosition: "#7,112",
    diffLabel: "-184 ms ahead",
    diffTone: "earned",
  },
] as const;

const weeklyTargetCard = {
  title: "W07 River Pressure",
  category: "Weekly",
  difficulty: "Hard",
  status: "in_progress",
  detail: "Longer session pick with a more random route profile and a calmer weekly cadence.",
  pbTime: "1:12.094",
  warriorTime: "1:11.482",
  requiredPosition: "#1,948",
  diffLabel: "+612 ms",
  sessionLabel: "Longer session pick",
  thumbnailLabel: "Wet speedway",
} as const;

export function DesignPlaygroundPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_7%,rgba(43,196,255,0.20),transparent_34%),radial-gradient(circle_at_36%_12%,rgba(125,227,255,0.12),transparent_34%),radial-gradient(circle_at_76%_10%,rgba(80,210,255,0.10),transparent_32%),radial-gradient(circle_at_50%_32%,rgba(17,75,122,0.18),transparent_40%),radial-gradient(circle_at_78%_62%,rgba(22,118,184,0.14),transparent_34%),radial-gradient(circle_at_32%_86%,rgba(43,196,255,0.11),transparent_34%),radial-gradient(circle_at_72%_92%,rgba(125,227,255,0.08),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(22,118,184,0.16),transparent_48%),linear-gradient(180deg,#2a769f_0%,#246d97_18%,#1d5d87_44%,#1a4f79_72%,#18496f_100%)] text-slate-100"
    >
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.035]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[linear-gradient(180deg,rgba(186,236,255,0.05),rgba(125,227,255,0.03),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[28%] h-[36rem] bg-[radial-gradient(circle_at_center,rgba(125,227,255,0.05),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-28 top-8 h-[34rem] w-[34rem] rounded-full bg-[#7de3ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-16 h-[40rem] w-[40rem] rounded-full bg-[#2bc4ff]/08 blur-3xl" />
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[34px] border border-white/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.045)_24%,rgba(43,196,255,0.06)_54%,rgba(13,47,82,0.08)_100%),radial-gradient(circle_at_14%_10%,rgba(43,196,255,0.16),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(125,227,255,0.08),transparent_32%)] p-7 shadow-[0_24px_88px_rgba(9,41,86,0.15)] backdrop-blur-[28px] md:p-10">
          <div className="playground-racing-line pointer-events-none absolute inset-0 opacity-70" />
          <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.045]" />
          <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#2bc4ff]/10 blur-3xl" />
          <div className="absolute left-[34%] top-[18%] h-72 w-[34rem] -translate-x-1/2 rounded-full bg-[#7de3ff]/06 blur-3xl" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(22,118,184,0.16),transparent_46%)]" />
          <div className="absolute bottom-[-56px] left-1/3 h-56 w-[36rem] rounded-full bg-[#1676b8]/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-32 w-40 bg-[linear-gradient(135deg,rgba(43,196,255,0.14),transparent_76%)] [clip-path:polygon(30%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col gap-10 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.38em] text-cyan-100/82">Trackmania Warrior Medals Dashboard</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
                UI Playground / Design Sandbox
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/76 md:text-base">
                Mock-only frontend lab for cyber racing dashboard patterns: glass surfaces, calm blue depth,
                selective neon emphasis, and reusable blocks for future Dashboard, Maps, Stats, Charts,
                Grind Queue, and Settings screens.
              </p>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-2 xl:w-[380px]">
              <button
                className="rounded-full border border-cyan-200/28 bg-[#2bc4ff]/12 px-5 py-3 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(43,196,255,0.14)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/40 hover:bg-[#2bc4ff]/18 hover:shadow-[0_0_38px_rgba(43,196,255,0.18)]"
                type="button"
                onClick={() => onNavigate("/dashboard")}
              >
                Back to dashboard
              </button>
              <button
                className="rounded-full border border-white/12 bg-white/[0.035] px-5 py-3 text-sm font-semibold text-slate-100 backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06]"
                type="button"
                onClick={() => onNavigate("/playground")}
              >
                Alias route /playground
              </button>
              <div className="rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 backdrop-blur-md sm:col-span-2">
                <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/58">Sandbox rules</p>
                <p className="mt-3 text-sm leading-6 text-sky-50/72">
                  No API calls, no backend mutations, no SQLite touch. Everything below is driven by local mock data
                  shaped like current and planned project entities.
                </p>
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-sky-100/40">Use this route for full mock-only UI iteration.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-7 grid gap-6 xl:grid-cols-[292px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.024),rgba(8,27,47,0.10))] p-5 shadow-[0_18px_60px_rgba(17,75,122,0.12)] backdrop-blur-[24px]">
            <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
            <div className="relative rounded-[24px] border border-cyan-200/22 bg-[linear-gradient(135deg,rgba(43,196,255,0.10),rgba(255,255,255,0.045),rgba(17,75,122,0.10))] p-4 backdrop-blur-md">
              <p className="text-sm font-semibold text-cyan-100">Sidebar style probe</p>
              <p className="mt-2 text-sm leading-6 text-sky-50/72">
                Real route is isolated to the playground. Other nav entries stay visually represented but untouched.
              </p>
            </div>
            <nav className="relative mt-6">
              <p className="mb-2 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/52">Core views</p>
              <div className="grid gap-2">
                {primarySidebarItems.map((item) => {
                  const active = item === "Design Playground";
                  return (
                    <button
                      className={`flex min-h-14 items-center justify-between rounded-[18px] border px-4 text-left text-sm font-semibold transition duration-200 ${
                        active
                          ? "border-cyan-200/34 bg-[linear-gradient(135deg,rgba(43,196,255,0.18),rgba(255,255,255,0.04),rgba(8,27,47,0.14))] text-cyan-50 shadow-[0_10px_28px_rgba(43,196,255,0.12)]"
                          : "border-white/10 bg-white/[0.024] text-slate-100 hover:-translate-y-0.5 hover:border-white/16 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(43,196,255,0.03))] hover:shadow-[0_10px_24px_rgba(11,47,84,0.14)]"
                      }`}
                      key={item}
                      type="button"
                    >
                      <span>{item}</span>
                      {item === "Grind Queue" ? (
                        <span className="rounded-full border border-cyan-200/25 bg-[#2bc4ff]/10 px-2.5 py-1 text-[11px] text-cyan-100">
                          18
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 pt-4">
                <p className="mb-2 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/52">Sandbox</p>
                <div className="grid gap-2.5">
                  {utilitySidebarItems.map((item) => {
                    const active = item === "Design Playground";
                    const muted = item === "Settings";
                    return (
                      <button
                        className={`relative flex min-h-14 items-center justify-between overflow-hidden rounded-[18px] border px-4 text-left text-sm font-semibold transition duration-200 ${
                          active
                            ? "border-cyan-200/34 bg-[linear-gradient(135deg,rgba(43,196,255,0.18),rgba(255,255,255,0.04),rgba(8,27,47,0.14))] text-cyan-50 shadow-[0_12px_28px_rgba(43,196,255,0.12)]"
                            : muted
                              ? "border-white/10 bg-white/[0.02] text-slate-500"
                              : "border-white/10 bg-white/[0.024] text-slate-100 hover:-translate-y-0.5 hover:border-white/16 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(43,196,255,0.03))] hover:shadow-[0_10px_24px_rgba(11,47,84,0.14)]"
                        }`}
                        disabled={muted}
                        key={item}
                        type="button"
                      >
                        {active ? <span className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-1rem] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full opacity-80 blur-2xl" /> : null}
                        <span className="relative">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
            <div className="relative mt-6 overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 backdrop-blur-md">
              <div className="playground-atmospheric-bloom-soft pointer-events-none absolute right-[-1rem] top-[-1rem] h-24 w-24 rounded-full opacity-60 blur-2xl" />
              <p className="relative font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">Sticky progress</p>
              <div className="mt-3 overflow-hidden rounded-full bg-white/8">
                <div className="h-2.5 w-[72.4%] rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.92),rgba(43,196,255,0.95))]" />
              </div>
              <div className="relative mt-3 flex items-center justify-between text-sm">
                <span className="text-sky-50/72">2,346 / 3,240</span>
                <span className="font-semibold tabular-nums text-cyan-100">72.4%</span>
              </div>
            </div>
          </aside>

          <main className="grid gap-5 xl:gap-6">
            <DesignSection
              eyebrow="01 / Tokens"
              title="Design Tokens"
              description="Cyan and blue stay primary. Emerald signals earned states. Purple marks elite/special surfaces. Gold is reserved for record energy. The UI stays mostly calm, with glow concentrated on high-value actions and hero data."
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <TokenGroup title="Background colors" items={designTokens.backgrounds} />
                <TokenGroup title="Surface colors" items={designTokens.surfaces} />
                <TokenGroup title="Accent colors" items={designTokens.accents} />
                <TokenGroup title="Text colors" items={designTokens.text} />
                <TokenGroup title="Border colors" items={designTokens.borders} />
                <article className="rounded-3xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <h3 className="text-sm font-semibold text-slate-100">Glow / shadow examples</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <GlowPreview label="Calm surface" className="bg-white/[0.05]" />
                    <GlowPreview label="Hero accent" className="bg-[#2bc4ff]/14 shadow-[0_0_42px_rgba(43,196,255,0.28)]" />
                    <GlowPreview label="Achievement pulse" className="bg-[#1676b8]/14 shadow-[0_0_42px_rgba(22,118,184,0.24)]" />
                  </div>
                </article>
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="02 / Type"
              title="Typography"
              description="Numbers push toward gaming analytics: tighter tracking, darker surface contrast, and stronger weight separation than a generic admin panel."
            >
              <div className="grid gap-6 rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl md:grid-cols-2">
                <div>
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.34em] text-cyan-100/80">Page title</p>
                  <h1 className="mt-3 text-5xl font-black tracking-[-0.06em] text-white">Warrior Medal Progress</h1>
                </div>
                <div className="space-y-4">
                  <TypographySample label="Section title" className="text-2xl font-black tracking-[-0.03em] text-white">
                    What to grind today?
                  </TypographySample>
                  <TypographySample label="Card title" className="text-lg font-bold text-slate-50">
                    Required position distribution
                  </TypographySample>
                  <TypographySample label="Normal text" className="text-sm leading-6 text-slate-300/80">
                    Compare variants quickly, then transplant the winners into real pages once the data contracts are ready.
                  </TypographySample>
                  <TypographySample label="Muted text" className="text-sm leading-6 text-sky-50/64">
                    Sync status, activity context, and table hints should stay informative without shouting.
                  </TypographySample>
                  <TypographySample label="Numeric / stat text" className="text-4xl font-black tracking-[-0.06em] text-cyan-50">
                    2,346 / 3,240
                  </TypographySample>
                  <TypographySample label="Small labels" className="text-xs font-black uppercase tracking-[0.32em] text-cyan-50/70">
                    {"CLOSE MEDALS <= 1S"}
                  </TypographySample>
                  <TypographySample label="Table text" className="text-sm font-semibold text-slate-100">
                    Summer 2024 - 01 | Warrior 0:56.973 | PB 0:57.244
                  </TypographySample>
                </div>
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="03 / Buttons"
              title="Button Language"
              description="Primary actions glow subtly. Secondary and ghost actions stay calm. Dangerous operations are explicit and visually isolated."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PlaygroundButton label="Primary" tone="primary" />
                <PlaygroundButton label="Secondary" tone="secondary" />
                <PlaygroundButton label="Ghost" tone="ghost" />
                <PlaygroundButton label="Outline" tone="outline" />
                <PlaygroundButton label="Danger" tone="danger" />
                <PlaygroundButton label="Sync / Action" tone="sync" />
                <PlaygroundButton label="Icon button" tone="icon" />
                <PlaygroundButton label="Disabled" tone="disabled" />
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="04 / Cards"
              title="Card Hierarchy"
              description="Main cards are brighter, secondary cards are quieter, and only the CTA-tier cards get a stronger neon edge. This keeps the page readable while still feeling premium."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CardVariant title="Flat card" detail="Quiet information block with minimal lift." />
                <CardVariant title="Glass card" detail="Default page surface for general modules." glow="soft" />
                <CardVariant title="Elevated card" detail="More depth for important summaries." tone="elevated" />
                <CardVariant title="Glow card" detail="Reserved for hero or recommendation emphasis." glow="strong" />
                <CardVariant title="Active card" detail="Current filter / selected object state." tone="active" />
                <CardVariant title="Compact metric" detail="Small stat block for dense layouts." compact />
                <CardVariant title="Chart card" detail="Neutral frame around data visuals." tone="chart" />
                <CardVariant title="Recommendation" detail="Action-oriented card with visible payoff." tone="recommendation" />
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="05 / Metrics"
              title="Metric Cards"
              description="Mock values mirror real project concerns: earned medals, completion, close windows, PB volume, required position, play time, and sync freshness."
              className="mt-1 p-6 md:p-7"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </div>
            </DesignSection>

            <div className="grid gap-6 xl:grid-cols-2">
              <DesignSection
                eyebrow="06 / Badges"
                title="Badges / Pills"
                description="Difficulty, medal state, sync state, and grind state all have separate color semantics."
              >
                <div className="grid gap-6">
                  <BadgeRow title="Difficulty tiers">
                    {["Free", "Easy", "Normal", "Hard", "Insane", "Demon"].map((tier) => (
                      <DifficultyBadge key={tier} tier={tier} />
                    ))}
                  </BadgeRow>
                  <BadgeRow title="Status">
                    {["earned", "missing", "close", "not_played"].map((status) => (
                      <StatusBadge key={status} status={status} />
                    ))}
                  </BadgeRow>
                  <BadgeRow title="Sync status">
                    {["up_to_date", "stale", "failed", "running"].map((status) => (
                      <StatusBadge key={status} status={status} />
                    ))}
                  </BadgeRow>
                  <BadgeRow title="Grind status">
                    {["grind_queue", "in_progress", "tilted", "skip_for_now", "done"].map((status) => (
                      <StatusBadge key={status} status={status} />
                    ))}
                  </BadgeRow>
                </div>
              </DesignSection>

              <DesignSection
                eyebrow="07 / Sidebar"
                title="Sidebar Variants"
                description="Preview states for real navigation: calm defaults, soft hover, stronger active, badge count, and disabled/secondary."
              >
                <div className="grid gap-3">
                  <SidebarVariant label="Dashboard" state="normal" />
                  <SidebarVariant label="Maps" state="hover" />
                  <SidebarVariant label="Design Playground" state="active" />
                  <SidebarVariant label="Grind Queue" state="badge" />
                  <SidebarVariant label="Settings" state="disabled" />
                </div>
              </DesignSection>
            </div>

            <DesignSection
              eyebrow="08 / Tables"
              title="Map Row Variants"
              description="Rows are modeled after the future `/api/maps` shape: map name, category, AT, Warrior, WR, required position, difficulty, PB, has_warrior, diff, grind status, and actions."
              className="p-5 md:p-6"
            >
              <div className="grid gap-4">
                <MapRowPreview row={mapRows[0]} variant="compact" />
                <MapRowPreview row={mapRows[1]} variant="card" />
                <MapRowPreview row={mapRows[2]} variant="thumbnail" />
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="09 / Progress"
              title="Progress Components"
              description="Circular, linear, segmented, sticky, and difficulty breakdown components all use the same blue-forward visual system."
              className="p-5 md:p-6"
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                <CircularProgress />
                <LinearProgress />
                <StickyMiniProgress />
                <SegmentedProgress />
                <DifficultyBreakdown />
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="10 / Recommendations"
              title="What To Grind Today?"
              description="These cards are tuned to answer the core product question directly: what should I play right now for the best progress payoff?"
              className="mt-2 p-7 md:p-9"
            >
              <div className="mb-5 grid gap-3 rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(43,196,255,0.05),rgba(8,27,47,0.10))] p-4 backdrop-blur-md md:grid-cols-[1.2fr_0.8fr]">
                <div>
                    <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-cyan-50/66">Recommendation focus</p>
                  <p className="mt-2 max-w-[42ch] text-sm leading-6 text-sky-50/76">
                    Bias the first slot toward low-friction conversion targets, then keep the rest calm and comparable so the section feels curated instead of template-generated.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                  <MiniRecommendationStat label="Quick wins" value="2" />
                  <MiniRecommendationStat label="Close medals" value="42" />
                  <MiniRecommendationStat label="Stale runs" value="11d" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {recommendationCards.map((card, index) => (
                  <div className={index === 0 ? "xl:col-span-2" : ""} key={`${card.title}-${card.subtitle}`}>
                    <RecommendationCard
                      emphasis={index === 0 ? "featured" : index === 5 ? "quiet" : "default"}
                      {...card}
                    />
                  </div>
                ))}
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="11 / Hero Widgets"
              title="Priority 1 Target Cards"
              description="Dashboard-ready mock layout for future target selection: compact daily rows on the left, one calmer weekly challenge card on the right, and a shared BEAT NOW CTA language."
              className="mt-2 p-5 md:p-6"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <div className="rounded-[24px] border border-cyan-200/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02),rgba(8,27,47,0.10))] p-4 shadow-[0_18px_54px_rgba(17,75,122,0.14)] backdrop-blur-xl md:p-4.5">
                  <div className="mb-3 flex flex-col gap-3 border-b border-white/8 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-50/62">Today Targets</p>
                      <h3 className="mt-1.5 text-[1.4rem] font-black tracking-[-0.04em] text-slate-50">BEAT NOW</h3>
                      <p className="mt-1.5 max-w-[44ch] text-sm leading-5 text-sky-100/68">
                        Compact low-friction target list for the future dashboard.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:w-[280px]">
                      <MiniRecommendationStat label="Targets" value="3" />
                      <MiniRecommendationStat label="Closest" value="45 ms" />
                      <MiniRecommendationStat label="Earned" value="1" />
                    </div>
                  </div>
                  <div className="grid gap-2.5">
                    {dailyTargetCards.map((card) => (
                      <TargetDailyRowCard key={card.title} card={card} />
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-violet-300/16 bg-[linear-gradient(160deg,rgba(122,92,255,0.14),rgba(255,255,255,0.04)_34%,rgba(8,27,47,0.18)_100%)] p-4 shadow-[0_20px_56px_rgba(52,35,100,0.18)] backdrop-blur-xl md:p-4.5">
                  <TargetWeeklyCard card={weeklyTargetCard} />
                </div>
              </div>
            </DesignSection>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <DesignSection
                eyebrow="11 / Activity"
                title="Activity Feed"
                description="Event feed blocks should highlight actual progress, sync visibility, and failure states without becoming noisy."
                className="p-5 md:p-6"
              >
                <div className="grid gap-2.5">
                  {activityFeed.map((item) => (
                    <ActivityFeedItem key={`${item.title}-${item.time}`} {...item} />
                  ))}
                </div>
              </DesignSection>

              <DesignSection
                eyebrow="13 / Settings Preview"
                title="Settings / Sync Preview"
                description="UI-only sync controls for future settings flows: action buttons, freshness, token validity, and last sync status."
                className="p-5 md:p-6"
              >
                <div className="grid gap-3.5 md:grid-cols-2">
                  <SettingsPreview title="Sync Warrior Data" status="up_to_date" detail="Last sync 2 min ago. Raw cache and parsed rows aligned." />
                  <SettingsPreview title="Sync Warrior Positions" status="running" detail="Processed 3,824 / 4,559 maps. 1,948 exact positions stored." />
                  <SettingsPreview title="Sync My PBs" status="stale" detail="Last PB sync 3 days ago. 42 close medals may be outdated." />
                  <SettingsPreview title="Sync All" status="warning" detail="Use only when you want a full local refresh. Manual action stays explicit." />
                  <SettingsPreview title="Check Nadeo token" status="success" detail="Token valid. Refresh token stored locally for the connected account." />
                  <SettingsPreview title="Token expired state" status="error" detail="Refresh failed. Reconnect Trackmania account before the next PB sync." />
                </div>
              </DesignSection>
            </div>

            <DesignSection
              eyebrow="12 / Charts"
              title="Chart Containers"
              description="These are container and style studies, not real analytics yet. Focus is on frame treatment, legend language, tooltip feel, and empty/loading behavior."
              className="p-5 md:p-6"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MockChartCard title="Progress over time" subtitle="Line trend with soft glow and two series." variant="line" />
                <MockChartCard title="Medals per week" subtitle="Compact weekly gain bars." variant="bars" />
                <MockChartCard title="Difficulty distribution" subtitle="Donut shell with inner hero stat." variant="donut" />
                <MockChartCard title="Required position distribution" subtitle="Scatter / percentile framing." variant="scatter" />
                <MockChartCard title="Activity heatmap preview" subtitle="Calendar density study for medal and PB activity." variant="heatmap" />
                <MockChartCard title="Empty / loading states" subtitle="A chart slot should degrade cleanly before real data exists." variant="empty" />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MockChartCard title="Loading placeholder" subtitle="Async chart region without visual jitter." variant="loading" />
                <MockChartCard title="Diff to Warrior distribution" subtitle="Reserved slot for real histogram / violin styling later." variant="bars" />
              </div>
            </DesignSection>

            <DesignSection
              eyebrow="14 / States"
              title="Empty / Loading / Error"
              description="The product has long-running syncs and partial failure cases, so state design needs to be explicit and easy to parse."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StateCard title="Loading skeleton" status="running" detail="Cards shimmer lightly while preserving final layout density." />
                <StateCard title="Empty state" status="missing" detail="No PBs synced yet. Connect Trackmania and run Sync My PBs." />
                <StateCard title="Error state" status="failed" detail="Player PB sync failed: OAuth refresh token rejected." />
                <StateCard title="Partial sync warning" status="warning" detail="4483 / 4559 maps updated. 76 rows need manual retry." />
                <StateCard title="Token missing warning" status="error" detail="Trackmania account disconnected. PB features are unavailable." />
              </div>
            </DesignSection>
          </main>
        </div>
      </div>
    </div>
  );
}

function TokenGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; value: string; usage: string; className: string }>;
}) {
  return (
    <div className="rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.042),rgba(255,255,255,0.018))] p-5 backdrop-blur-xl">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <TokenSwatch key={`${title}-${item.name}`} {...item} />
        ))}
      </div>
    </div>
  );
}

function GlowPreview({ label, className }: { label: string; className: string }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] p-4 backdrop-blur-md">
      <div className={`h-24 rounded-[20px] border border-white/12 ${className}`} />
      <p className="mt-3 text-sm font-semibold text-slate-200">{label}</p>
    </div>
  );
}

function TypographySample({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: string;
}) {
  return (
    <div>
      <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">{label}</p>
      <div className={`mt-2 ${className}`}>{children}</div>
    </div>
  );
}

function PlaygroundButton({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "secondary" | "ghost" | "outline" | "danger" | "sync" | "icon" | "disabled";
}) {
  const classes = {
    primary: "border-cyan-200/30 bg-[#2bc4ff]/12 text-cyan-50 shadow-[0_0_30px_rgba(43,196,255,0.14)] hover:-translate-y-0.5 hover:border-cyan-100/42 hover:bg-[#2bc4ff]/18 hover:shadow-[0_0_38px_rgba(43,196,255,0.18)]",
    secondary: "border-white/12 bg-white/[0.04] text-slate-100 backdrop-blur-md hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06]",
    ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.05]",
    outline: "border-sky-100/18 bg-transparent text-slate-200 hover:-translate-y-0.5 hover:border-sky-100/28 hover:bg-white/[0.035]",
    danger: "border-rose-500/30 bg-rose-500/14 text-rose-100 hover:-translate-y-0.5 hover:bg-rose-500/18",
    sync: "border-emerald-400/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(43,196,255,0.12))] text-emerald-100 shadow-[0_0_26px_rgba(16,185,129,0.10)] hover:-translate-y-0.5 hover:border-emerald-300/42 hover:shadow-[0_0_32px_rgba(16,185,129,0.16)]",
    icon: "border-cyan-200/20 bg-white/[0.04] text-cyan-100 hover:-translate-y-0.5 hover:border-cyan-100/32 hover:bg-white/[0.06]",
    disabled: "border-white/10 bg-white/[0.02] text-slate-500",
  } satisfies Record<string, string>;

  return (
    <button
      className={`min-h-14 rounded-[18px] border px-4 text-sm font-semibold transition duration-200 ${classes[tone]}`}
      disabled={tone === "disabled"}
      type="button"
    >
      {tone === "icon" ? ">> " : ""}
      {label}
    </button>
  );
}

function CardVariant({
  title,
  detail,
  tone = "calm",
  glow = "none",
  compact = false,
}: {
  title: string;
  detail: string;
  tone?: "calm" | "elevated" | "active" | "chart" | "recommendation";
  glow?: "none" | "soft" | "strong";
  compact?: boolean;
}) {
  const toneClass = {
    calm: "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]",
    elevated: "bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.028))] shadow-[0_18px_50px_rgba(17,75,122,0.14)]",
    active: "bg-[linear-gradient(145deg,rgba(43,196,255,0.14),rgba(255,255,255,0.03),rgba(8,27,47,0.12))] border-cyan-200/22",
    chart: "bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.016))]",
    recommendation: "bg-[linear-gradient(180deg,rgba(17,75,122,0.14),rgba(255,255,255,0.03))]",
  } satisfies Record<string, string>;

  const glowClass = {
    none: "",
    soft: "shadow-[0_0_28px_rgba(43,196,255,0.08)]",
    strong: "shadow-[0_0_38px_rgba(43,196,255,0.14)]",
  } satisfies Record<string, string>;

  return (
    <article
      className={`relative overflow-hidden rounded-[26px] border border-white/12 p-5 backdrop-blur-[22px] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/18 ${toneClass[tone]} ${glowClass[glow]}`}
    >
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute right-[-2rem] top-[-2rem] h-20 w-20 rounded-full opacity-70 blur-2xl" />
      <p className="relative font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">{title}</p>
      <div className={`relative mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(8,27,47,0.10))] ${compact ? "p-4" : "p-5"}`}>
        <div className={`text-slate-50 ${compact ? "text-2xl font-black tracking-[-0.05em]" : "text-lg font-bold"}`}>
          {compact ? "72.4%" : title}
        </div>
        <p className="mt-2 text-sm leading-6 text-sky-100/68">{detail}</p>
      </div>
    </article>
  );
}

function BadgeRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

type TargetDailyCardData = {
  title: string;
  category: string;
  difficulty: string;
  status: string;
  detail: string;
  diffLabel: string;
  diffTone: "close" | "very_close" | "earned";
  warriorTime: string;
  pbTime: string;
  requiredPosition: string;
};

type TargetWeeklyCardData = {
  title: string;
  category: string;
  difficulty: string;
  status: string;
  detail: string;
  diffLabel: string;
  pbTime: string;
  warriorTime: string;
  requiredPosition: string;
  sessionLabel: string;
  thumbnailLabel: string;
};

function TargetDailyRowCard({ card }: { card: TargetDailyCardData }) {
  const accentClass = {
    close: {
      shell:
        "border-amber-300/18 bg-[linear-gradient(145deg,rgba(251,191,36,0.08),rgba(43,196,255,0.06),rgba(8,27,47,0.12))] hover:border-amber-200/26 shadow-[0_14px_34px_rgba(120,90,20,0.10)]",
      glow: "bg-amber-300/10",
      rail: "bg-[linear-gradient(180deg,rgba(251,191,36,0.88),rgba(43,196,255,0.52))]",
      diff: "text-amber-200",
      chip: "warning",
    },
    very_close: {
      shell:
        "border-cyan-200/18 bg-[linear-gradient(145deg,rgba(43,196,255,0.12),rgba(255,226,120,0.04),rgba(8,27,47,0.12))] hover:border-cyan-100/26 shadow-[0_14px_34px_rgba(17,75,122,0.12)]",
      glow: "bg-cyan-300/10",
      rail: "bg-[linear-gradient(180deg,rgba(125,227,255,0.92),rgba(43,196,255,0.56))]",
      diff: "text-cyan-100",
      chip: "info",
    },
    earned: {
      shell:
        "border-emerald-300/18 bg-[linear-gradient(145deg,rgba(16,185,129,0.10),rgba(255,255,255,0.03),rgba(8,27,47,0.12))] hover:border-emerald-200/26 shadow-[0_14px_34px_rgba(11,98,84,0.10)]",
      glow: "bg-emerald-300/10",
      rail: "bg-[linear-gradient(180deg,rgba(110,231,183,0.92),rgba(16,185,129,0.56))]",
      diff: "text-emerald-200",
      chip: "success",
    },
  } satisfies Record<TargetDailyCardData["diffTone"], { shell: string; glow: string; rail: string; diff: string; chip: "info" | "warning" | "success" }>;

  const diffClass = {
    close: accentClass.close.diff,
    very_close: accentClass.very_close.diff,
    earned: accentClass.earned.diff,
  } satisfies Record<TargetDailyCardData["diffTone"], string>;

  return (
    <article
      className={`group relative overflow-hidden rounded-[20px] border p-3 backdrop-blur-[20px] transition duration-200 hover:-translate-y-0.5 md:p-3.5 ${accentClass[card.diffTone].shell}`}
    >
      <div className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${accentClass[card.diffTone].rail}`} />
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-55" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className={`pointer-events-none absolute right-[-2rem] top-[-2rem] h-20 w-20 rounded-full blur-3xl ${accentClass[card.diffTone].glow}`} />
      <div className="relative grid min-h-[118px] gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
        <div className="min-w-0 pl-2">
          <div className="app-sidebar-scroll flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1">
            <TargetChip label={card.category} tone="neutral" compact />
            <DifficultyBadge tier={card.difficulty} />
            <TargetStageChip label={card.status === "earned" ? "Earned" : "Close"} tone={accentClass[card.diffTone].chip} />
          </div>
          <h3 className="mt-1.5 truncate text-[1.08rem] font-black tracking-[-0.04em] text-slate-50">{card.title}</h3>
          <p className="mt-1 truncate text-[12.5px] leading-5 text-sky-100/62">{card.detail}</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-4">
          <TargetStatPill label="PB" value={card.pbTime} compact />
          <TargetStatPill label="Warrior" value={card.warriorTime} compact />
          <TargetStatPill label="Req" value={card.requiredPosition} compact />
          <TargetStatPill label="Diff" value={card.diffLabel} valueClassName={diffClass[card.diffTone]} compact />
        </div>
        <div className="xl:justify-self-end">
          <TargetBeatNowButton compact />
        </div>
      </div>
    </article>
  );
}

function TargetWeeklyCard({ card }: { card: TargetWeeklyCardData }) {
  return (
    <article className="group relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[22px] border border-violet-300/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02),rgba(33,12,53,0.18))] p-5 backdrop-blur-[22px] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200/24 hover:shadow-[0_24px_60px_rgba(52,35,100,0.22)] md:p-6">
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-60" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.04]" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,236,255,0.72),transparent)]" />
      <div className="pointer-events-none absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full bg-violet-300/12 blur-3xl" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-violet-100/66">Weekly Challenge</p>
            <h3 className="mt-3 text-[1.55rem] font-black tracking-[-0.04em] text-slate-50">{card.title}</h3>
          </div>
          <TargetWeeklyThumbnail label={card.thumbnailLabel} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <TargetChip label={card.category} tone="elite" />
          <DifficultyBadge tier={card.difficulty} />
          <StatusBadge status={card.status} />
        </div>

        <p className="mt-4 text-sm leading-6 text-sky-100/72">{card.detail}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <TargetStatPill label="PB" value={card.pbTime} />
          <TargetStatPill label="Warrior" value={card.warriorTime} />
          <TargetStatPill label="Required pos" value={card.requiredPosition} />
          <TargetStatPill label="Diff" value={card.diffLabel} valueClassName="text-violet-100" />
        </div>

        <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.035] p-4">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/52">Session note</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{card.sessionLabel}</p>
          <p className="mt-2 text-sm leading-6 text-sky-100/68">
            Randomized weekly-style slot with more room for route learning than a pure daily conversion attempt.
          </p>
        </div>

        <div className="mt-auto pt-5">
          <TargetBeatNowButton />
        </div>
      </div>
    </article>
  );
}

function TargetWeeklyThumbnail({ label }: { label: string }) {
  return (
    <div className="relative h-[6.25rem] w-[6.25rem] min-w-[6.25rem] overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(33,12,53,0.20))]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(167,139,250,0.22),rgba(125,227,255,0.06),transparent)]" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
      <div className="absolute inset-x-3 bottom-3">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-sky-50/52">Mock thumb</p>
        <p className="mt-1 text-xs font-semibold text-slate-100">{label}</p>
      </div>
    </div>
  );
}

function TargetBeatNowButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      className={`playground-cta-shimmer rounded-full border border-cyan-200/34 bg-cyan-300/[0.14] font-semibold text-cyan-50 shadow-[0_0_26px_rgba(43,196,255,0.14)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/48 hover:bg-cyan-300/[0.20] hover:shadow-[0_0_34px_rgba(43,196,255,0.20)] ${
        compact ? "px-4 py-2.5 text-[13px]" : "px-5 py-3 text-sm"
      }`}
      type="button"
    >
      BEAT NOW
    </button>
  );
}

function TargetChip({ label, tone, compact = false }: { label: string; tone: "neutral" | "elite"; compact?: boolean }) {
  const toneClass = {
    neutral: "border-white/12 bg-white/[0.05] text-slate-100",
    elite: "border-violet-300/20 bg-violet-300/[0.10] text-violet-100",
  } satisfies Record<string, string>;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border font-mono font-bold uppercase whitespace-nowrap ${
        compact ? "min-h-7 px-2.5 text-[10px] tracking-[0.16em]" : "min-h-8 px-3 text-[11px] tracking-[0.18em]"
      } ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}

function TargetStageChip({ label, tone }: { label: string; tone: "info" | "warning" | "success" }) {
  const toneClass = {
    info: "border-cyan-300/24 bg-cyan-300/[0.10] text-cyan-100",
    warning: "border-amber-300/26 bg-amber-300/[0.11] text-amber-100",
    success: "border-emerald-300/24 bg-emerald-300/[0.11] text-emerald-100",
  } satisfies Record<string, string>;

  return (
    <span className={`inline-flex min-h-7 shrink-0 items-center rounded-full border px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] whitespace-nowrap ${toneClass[tone]}`}>
      {label}
    </span>
  );
}

function TargetStatPill({
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

function SidebarVariant({ label, state }: { label: string; state: "normal" | "hover" | "active" | "badge" | "disabled" }) {
  const className = {
    normal: "border-white/10 bg-white/[0.024] text-slate-200",
    hover: "border-white/16 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(43,196,255,0.03))] text-slate-100 shadow-[0_10px_24px_rgba(11,47,84,0.14)]",
    active: "border-cyan-200/34 bg-[linear-gradient(135deg,rgba(43,196,255,0.18),rgba(255,255,255,0.04),rgba(8,27,47,0.14))] text-cyan-50 shadow-[0_12px_28px_rgba(43,196,255,0.12)]",
    badge: "border-white/12 bg-white/[0.035] text-slate-100",
    disabled: "border-white/10 bg-white/[0.02] text-slate-500",
  } satisfies Record<string, string>;

  return (
    <div className={`relative flex min-h-14 items-center justify-between overflow-hidden rounded-[18px] border px-4 text-sm font-semibold ${className[state]}`}>
      {state === "active" ? <span className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-1rem] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full opacity-80 blur-2xl" /> : null}
      <span>{label}</span>
      {state === "badge" ? (
        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/12 px-2.5 py-1 text-[11px] text-cyan-100">
        
          18
        </span>
      ) : null}
    </div>
  );
}

function CircularProgress() {
  return (
    <article className="relative overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.052),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-2rem] top-[-1rem] h-28 w-28 rounded-full opacity-75 blur-2xl" />
      <p className="relative font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">Circular progress</p>
      <div className="mt-4 grid place-items-center">
        <div
          className="playground-energy-ring grid h-40 w-40 place-items-center rounded-full shadow-[0_0_52px_rgba(43,196,255,0.18)]"
          style={{
            background:
              "conic-gradient(rgba(34,211,238,0.95) 0deg 260deg, rgba(255,255,255,0.08) 260deg 360deg)",
          }}
          >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-[#0b2340]/90 text-center backdrop-blur-md">
            <div>
              <div className="text-3xl font-black tabular-nums tracking-[-0.07em] text-white">72.4%</div>
              <div className="mt-1 font-mono text-xs uppercase tracking-[0.24em] text-sky-50/54">Completion</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function LinearProgress() {
  return (
    <article className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
      <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">Linear progress</p>
      <div className="mt-6 space-y-4">
        {[
          ["Overall medals", "72.4%", "72.4%"],
          ["Campaign completion", "81.2%", "81.2%"],
          ["PB coverage", "90.1%", "90.1%"],
        ].map(([label, value, width]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-100/68">{label}</span>
              <span className="font-semibold tabular-nums text-slate-100">{value}</span>
            </div>
            <div className="mt-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-2.5 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95),rgba(59,130,246,0.95))]"
                style={{ width }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function StickyMiniProgress() {
  return (
    <article className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.042),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
      <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">Sticky mini bar</p>
      <div className="relative mt-6 overflow-hidden rounded-[22px] border border-cyan-200/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(8,27,47,0.11))] p-4">
        <div className="playground-atmospheric-bloom-soft pointer-events-none absolute right-[-1rem] top-[-1rem] h-20 w-20 rounded-full opacity-60 blur-2xl" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-sky-100/68">Warrior medals</span>
          <span className="font-semibold tabular-nums text-cyan-100">2,346 / 3,240</span>
        </div>
        <div className="mt-3 overflow-hidden rounded-full bg-white/8">
          <div className="h-2 w-[72.4%] rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.95),rgba(34,211,238,0.95))]" />
        </div>
      </div>
    </article>
  );
}

function SegmentedProgress() {
  const segments = [
    ["Earned", "72%", "bg-emerald-400/80"],
    ["Close", "11%", "bg-cyan-400/80"],
    ["Missing", "9%", "bg-violet-400/80"],
    ["Not played", "8%", "bg-slate-500/80"],
  ];
  return (
    <article className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
      <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">Segmented progress</p>
      <div className="mt-6 overflow-hidden rounded-full bg-white/8">
        <div className="flex h-3">
          {segments.map(([label, width, color]) => (
            <div className={color} key={label} style={{ width }} />
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        {segments.map(([label, width, color]) => (
          <div className="flex items-center justify-between" key={label}>
            <span className="inline-flex items-center gap-2 text-sky-100/68">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {label}
            </span>
            <span className="font-semibold tabular-nums text-slate-100">{width}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function DifficultyBreakdown() {
  const rows = [
    ["Free", "542", "bg-emerald-400"],
    ["Easy", "812", "bg-cyan-400"],
    ["Normal", "604", "bg-sky-400"],
    ["Hard", "198", "bg-violet-400"],
    ["Insane", "62", "bg-amber-400"],
    ["Demon", "18", "bg-rose-500"],
  ];
  return (
    <article className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
      <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">Difficulty breakdown</p>
      <div className="mt-5 space-y-3">
        {rows.map(([label, count, color]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sky-100/68">{label}</span>
              <span className="font-semibold tabular-nums text-slate-100">{count}</span>
            </div>
            <div className="mt-2 overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-2.5 rounded-full ${color}`}
                style={{ width: `${Math.min(Number(count) / 10, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function SettingsPreview({ title, status, detail }: { title: string; status: string; detail: string }) {
  return (
    <article className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-[18px] backdrop-blur-xl transition duration-200 hover:border-cyan-200/18 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2.5 text-sm leading-6 text-sky-100/68">{detail}</p>
      <div className="mt-3.5 flex gap-2 rounded-[18px] border border-white/8 bg-white/[0.026] p-2">
        <button className="rounded-full border border-cyan-200/25 bg-[#2bc4ff]/10 px-4 py-2 text-xs font-semibold text-cyan-50 transition duration-200 hover:border-cyan-100/36 hover:bg-[#2bc4ff]/18">
          Run action
        </button>
        <button className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition duration-200 hover:border-white/18 hover:bg-white/[0.06]">
          View log
        </button>
      </div>
    </article>
  );
}

function MiniRecommendationStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(8,27,47,0.09))] px-3.5 py-3 backdrop-blur-sm">
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-sky-50/52">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums tracking-[-0.04em] text-slate-50">{value}</p>
    </div>
  );
}

function StateCard({ title, status, detail }: { title: string; status: string; detail: string }) {
  return (
    <article className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <StatusBadge status={status} />
      </div>
      <div className="mt-4 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(8,27,47,0.09))] p-4">
        {status === "running" ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="h-4 animate-pulse rounded-full bg-white/[0.08]" key={index} />
            ))}
          </div>
        ) : null}
        {status !== "running" ? <p className="text-sm leading-6 text-sky-100/68">{detail}</p> : null}
      </div>
    </article>
  );
}
