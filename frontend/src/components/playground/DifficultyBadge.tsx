const difficultyClasses: Record<string, string> = {
  Free: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  Easy: "border-cyan-400/30 bg-cyan-400/12 text-cyan-200",
  Normal: "border-sky-400/30 bg-sky-400/12 text-sky-200",
  Hard: "border-violet-400/30 bg-violet-400/12 text-violet-200",
  Insane: "border-amber-400/30 bg-amber-400/12 text-amber-200",
  Demon: "border-rose-500/30 bg-rose-500/12 text-rose-200",
};

export function DifficultyBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] ${
        difficultyClasses[tier] ?? "border-slate-400/20 bg-slate-400/10 text-slate-200"
      }`}
    >
      {tier}
    </span>
  );
}
