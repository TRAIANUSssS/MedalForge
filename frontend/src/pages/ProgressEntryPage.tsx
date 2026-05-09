import { useEffect, useState } from "react";

import { WarriorProgressBar } from "../components/progress/WarriorProgressBar";

const progressEntryMock = {
  earned: 2346,
  total: 3240,
};

export function ProgressEntryPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const earnedCount = useAnimatedCount(progressEntryMock.earned);
  const totalCount = useAnimatedCount(progressEntryMock.total);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(43,196,255,0.24),transparent_42%),radial-gradient(circle_at_68%_14%,rgba(125,227,255,0.14),transparent_40%),radial-gradient(circle_at_52%_48%,rgba(74,204,255,0.10),transparent_30%),radial-gradient(circle_at_50%_62%,rgba(17,75,122,0.14),transparent_52%),radial-gradient(circle_at_30%_88%,rgba(43,196,255,0.11),transparent_44%),radial-gradient(circle_at_76%_84%,rgba(125,227,255,0.09),transparent_36%),linear-gradient(180deg,#3790bb_0%,#2f81ab_24%,#287198_56%,#226589_100%)] text-slate-100">
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.025]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] bg-[linear-gradient(180deg,rgba(186,236,255,0.08)_0%,rgba(125,227,255,0.055)_22%,rgba(125,227,255,0.028)_44%,rgba(125,227,255,0.012)_60%,transparent_82%)]" />
      <div className="pointer-events-none absolute left-[-10%] top-[-10vh] h-[calc(100vh+24rem)] w-[120%] bg-[radial-gradient(ellipse_at_center,rgba(125,227,255,0.06)_0%,rgba(125,227,255,0.03)_34%,rgba(125,227,255,0.014)_52%,rgba(125,227,255,0.006)_66%,transparent_82%)]" />
      <div className="hero-breathe-slow pointer-events-none absolute left-[-10rem] top-[-4rem] h-[38rem] w-[38rem] rounded-full bg-[#7de3ff]/12 blur-3xl" />
      <div className="hero-breathe-slower pointer-events-none absolute left-[16%] top-[24%] h-[22rem] w-[22rem] rounded-full bg-[#2bc4ff]/06 blur-3xl" />
      <div className="hero-breathe-slow pointer-events-none absolute right-[-12rem] top-0 h-[42rem] w-[42rem] rounded-full bg-[#2bc4ff]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-[1520px] items-center justify-center px-6 pt-24 pb-14 sm:px-8 md:pt-28 md:pb-18">
        <section className="relative w-full max-w-6xl">
          <div className="playground-atmospheric-bloom pointer-events-none absolute left-[16%] top-[18%] h-56 w-56 rounded-full opacity-62 blur-3xl" />
          <div className="playground-atmospheric-bloom-soft pointer-events-none absolute bottom-[20%] right-[12%] h-64 w-64 rounded-full opacity-58 blur-3xl" />

          <div className="relative mx-auto max-w-5xl">
            <div className="flex flex-col items-center text-center">
              <h1 className="mt-2 text-balance text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
                Warrior Medal Progress
              </h1>
              <p className="mt-4 max-w-[46rem] text-nowrap text-sm leading-7 text-sky-50/56 sm:text-[0.95rem]">
                Global Warrior completion at a glance. Calm telemetry, one strong signal, then straight into the dashboard.
              </p>
            </div>

            <div className="relative mx-auto mt-16 max-w-[82rem]">
              <div className="playground-atmospheric-bloom-soft pointer-events-none absolute inset-x-[16%] top-1/2 h-48 -translate-y-1/2 rounded-full opacity-72 blur-3xl" />
              <div className="pointer-events-none absolute left-[32%] top-1/2 h-24 w-[38%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,202,110,0.14),rgba(255,202,110,0.03),transparent_72%)] blur-3xl" />
              <div className="grid items-center gap-5 md:grid-cols-[minmax(0,128px)_minmax(0,1fr)_minmax(0,128px)] md:gap-8">
                <StatPill align="right" value={formatNumber(earnedCount)} />
                <div className="min-w-0">
                  <WarriorProgressBar earned={progressEntryMock.earned} total={progressEntryMock.total} />
                </div>
                <StatPill align="left" value={formatNumber(totalCount)} />
              </div>
            </div>

            <div className="mt-14 flex justify-center">
              <button
                className="group relative translate-y-0 font-mono text-[13px] font-extrabold uppercase tracking-[0.28em] text-cyan-50/82 transition duration-200 hover:-translate-y-px hover:text-cyan-50"
                type="button"
                onClick={() => onNavigate("/dashboard")}
              >
                <span>Open Dashboard</span>
                <span className="absolute left-1/2 top-[calc(100%+10px)] h-px w-20 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(180,234,255,0.9),transparent)] opacity-90 transition duration-300 group-hover:w-28 group-hover:bg-[linear-gradient(90deg,transparent,rgba(255,219,133,0.98),transparent)] group-hover:opacity-100" />
                <span className="absolute left-1/2 top-[calc(100%+8px)] h-4 w-24 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,214,122,0.18),transparent_72%)] opacity-0 blur-xl transition duration-300 group-hover:opacity-100" />
                <span className="absolute left-1/2 top-1/2 h-6 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,235,189,0.10),rgba(255,214,122,0.04),transparent_74%)] opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatPill({ value, align }: { value: string; align: "left" | "right" }) {
  return (
    <div className={`${align === "right" ? "text-right" : "text-left"}`}>
      <div className="relative inline-block">
        <span className="pointer-events-none absolute inset-x-2 top-1/2 h-12 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(186,236,255,0.18),rgba(43,196,255,0.05),transparent_74%)] blur-2xl" />
        <span className="relative inline-block text-[2.45rem] font-black tabular-nums tracking-[-0.075em] text-white drop-shadow-[0_0_18px_rgba(109,209,255,0.12)] sm:text-[3.2rem]">
          {value}
        </span>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function useAnimatedCount(target: number, durationMs = 1850) {
  const [displayedValue, setDisplayedValue] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayedValue(target);
      return;
    }

    const startTime = window.performance.now();
    const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = Math.min((now - startTime) / durationMs, 1);
      const eased = easeOutCubic(elapsed);
      setDisplayedValue(Math.round(target * eased));

      if (elapsed < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [durationMs, target]);

  return displayedValue;
}
