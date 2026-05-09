const statusClasses: Record<string, string> = {
  earned: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  missing: "border-slate-300/20 bg-slate-300/10 text-slate-200",
  close: "border-cyan-400/30 bg-cyan-400/12 text-cyan-200",
  not_played: "border-slate-500/25 bg-slate-500/12 text-slate-300",
  up_to_date: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  stale: "border-amber-400/30 bg-amber-400/12 text-amber-200",
  failed: "border-rose-500/30 bg-rose-500/12 text-rose-200",
  running: "border-cyan-400/30 bg-cyan-400/12 text-cyan-200",
  grind_queue: "border-sky-400/30 bg-sky-400/12 text-sky-200",
  in_progress: "border-violet-400/30 bg-violet-400/12 text-violet-200",
  tilted: "border-rose-500/30 bg-rose-500/12 text-rose-200",
  skip_for_now: "border-slate-400/25 bg-slate-400/12 text-slate-300",
  done: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  success: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/12 text-amber-200",
  error: "border-rose-500/30 bg-rose-500/12 text-rose-200",
};

function toLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${
        statusClasses[status] ?? "border-slate-400/20 bg-slate-400/10 text-slate-200"
      }`}
    >
      {toLabel(status)}
    </span>
  );
}
