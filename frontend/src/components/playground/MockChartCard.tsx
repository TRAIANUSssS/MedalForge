export function MockChartCard({
  title,
  subtitle,
  variant,
}: {
  title: string;
  subtitle: string;
  variant: "line" | "bars" | "donut" | "scatter" | "heatmap" | "empty" | "loading";
}) {
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.042),rgba(255,255,255,0.02))] p-5 backdrop-blur-[22px]">
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.02]" />
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute right-[-3rem] top-[-3rem] h-28 w-28 rounded-full opacity-60 blur-3xl" />
      <div className="relative mb-4">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-sky-100/68">{subtitle}</p>
      </div>
      <div className="relative rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(8,27,47,0.09))] p-4">
        {variant === "line" ? <LinePreview /> : null}
        {variant === "bars" ? <BarPreview /> : null}
        {variant === "donut" ? <DonutPreview /> : null}
        {variant === "scatter" ? <ScatterPreview /> : null}
        {variant === "heatmap" ? <HeatmapPreview /> : null}
        {variant === "empty" ? <EmptyPreview /> : null}
        {variant === "loading" ? <LoadingPreview /> : null}
      </div>
    </article>
  );
}

function LinePreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-sky-100/45">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          Progress
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Medal gain
        </span>
      </div>
      <svg className="h-36 w-full" viewBox="0 0 320 140" fill="none">
        <path d="M0 118 C35 112 44 88 70 84 C104 78 113 56 146 49 C176 43 196 36 222 29 C245 23 274 19 320 13" stroke="rgba(34,211,238,0.95)" strokeWidth="3" />
        <path d="M0 126 C34 124 54 112 76 103 C107 90 122 88 152 73 C179 60 208 64 236 52 C255 42 288 49 320 22" stroke="rgba(52,211,153,0.85)" strokeWidth="2.5" strokeDasharray="5 5" />
      </svg>
    </div>
  );
}

function BarPreview() {
  const bars = ["38%", "52%", "46%", "68%", "72%", "84%", "61%"];
  return (
    <div className="flex h-36 items-end gap-3">
      {bars.map((height, index) => (
        <div className="flex-1" key={index}>
          <div
            className="rounded-t-2xl bg-[linear-gradient(180deg,rgba(34,211,238,0.95),rgba(59,130,246,0.18))]"
            style={{ height }}
          />
        </div>
      ))}
    </div>
  );
}

function DonutPreview() {
  return (
    <div className="flex items-center gap-6">
      <div
        className="playground-energy-ring grid h-28 w-28 place-items-center rounded-full shadow-[0_0_40px_rgba(43,196,255,0.12)]"
        style={{
          background:
            "conic-gradient(rgba(34,211,238,0.95) 0deg 144deg, rgba(168,85,247,0.9) 144deg 250deg, rgba(245,158,11,0.9) 250deg 312deg, rgba(16,185,129,0.95) 312deg 360deg)",
        }}
      >
        <div className="grid h-18 w-18 place-items-center rounded-full bg-[#081b2f]/90 text-sm font-semibold text-slate-100">
          72.4%
        </div>
      </div>
      <div className="space-y-3 text-sm text-sky-100/68">
        <LegendItem color="bg-cyan-300" label="Normal" />
        <LegendItem color="bg-violet-300" label="Hard" />
        <LegendItem color="bg-amber-300" label="Insane" />
        <LegendItem color="bg-emerald-300" label="Free" />
      </div>
    </div>
  );
}

function ScatterPreview() {
  const dots = [
    ["12%", "78%"],
    ["20%", "64%"],
    ["29%", "58%"],
    ["38%", "46%"],
    ["53%", "42%"],
    ["70%", "38%"],
    ["84%", "30%"],
    ["90%", "18%"],
  ];
  return (
    <div className="relative h-36 rounded-[20px] border border-dashed border-white/10 bg-white/[0.015]">
      {dots.map(([left, top], index) => (
        <span
          className="absolute h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.8)]"
          key={index}
          style={{ left, top }}
        />
      ))}
      <div className="absolute right-[18%] top-[22%] rounded-2xl border border-cyan-300/24 bg-[#0d2f52]/60 px-3 py-2 text-xs text-cyan-50 backdrop-blur-md">
        You: #8,732
      </div>
    </div>
  );
}

function HeatmapPreview() {
  return (
    <div className="grid grid-cols-9 gap-2">
      {Array.from({ length: 54 }).map((_, index) => {
        const levels = [
          "bg-[#0d2f52]",
          "bg-[#114b7a]",
          "bg-[#1676b8]",
          "bg-[#2bc4ff]/65",
          "bg-emerald-500/80",
        ];
        const level = levels[index % levels.length];
        return <span className={`aspect-square rounded-md ${level}`} key={index} />;
      })}
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="grid h-36 place-items-center rounded-[20px] border border-dashed border-white/12 bg-white/[0.015] text-center">
      <div>
        <p className="text-sm font-semibold text-slate-200">No synced history yet</p>
        <p className="mt-2 text-sm text-sky-100/42">Run PB sync to unlock progress-over-time charts.</p>
      </div>
    </div>
  );
}

function LoadingPreview() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="h-6 animate-pulse rounded-full bg-white/[0.08]" key={index} />
      ))}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
