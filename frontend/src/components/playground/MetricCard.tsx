export function MetricCard({
  label,
  value,
  detail,
  delta,
  tone = "calm",
}: {
  label: string;
  value: string;
  detail: string;
  delta?: string;
  tone?: "calm" | "highlight" | "success" | "warning";
}) {
  const toneClasses = {
    calm: "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))]",
    highlight: "border-cyan-300/24 bg-[linear-gradient(180deg,rgba(43,196,255,0.12),rgba(255,255,255,0.03)_52%,rgba(8,27,47,0.10)_100%)] shadow-[0_0_28px_rgba(43,196,255,0.08)]",
    success: "border-emerald-300/22 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(255,255,255,0.03)_52%,rgba(8,27,47,0.10)_100%)] shadow-[0_0_24px_rgba(16,185,129,0.07)]",
    warning: "border-amber-300/22 bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(255,255,255,0.03)_52%,rgba(8,27,47,0.10)_100%)] shadow-[0_0_24px_rgba(245,158,11,0.07)]",
  } satisfies Record<string, string>;

  return (
    <article className={`group relative overflow-hidden rounded-[24px] border p-5 backdrop-blur-[20px] transition duration-200 hover:-translate-y-1 hover:border-cyan-200/18 hover:shadow-[0_24px_52px_rgba(12,52,94,0.22)] ${toneClasses[tone]}`}>
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,236,255,0.6),transparent)]" />
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute right-[-2rem] top-[-2rem] h-24 w-24 rounded-full opacity-75 blur-2xl" />
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">{label}</p>
        {delta ? <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">{delta}</span> : null}
      </div>
      <div className="mt-4 text-3xl font-black tabular-nums tracking-[-0.07em] text-slate-50 md:text-[2.75rem]">{value}</div>
      <p className="mt-2 max-w-[24ch] text-sm leading-6 text-sky-100/68">{detail}</p>
    </article>
  );
}
