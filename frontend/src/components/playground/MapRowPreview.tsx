import { DifficultyBadge } from "./DifficultyBadge";
import { StatusBadge } from "./StatusBadge";

export type PlaygroundMapRow = {
  map_name: string;
  category: string;
  author: string;
  author_time: string;
  warrior_time: string;
  world_record_time: string;
  required_position: string;
  difficulty_tier: string;
  pb_time: string;
  has_warrior: boolean;
  diff_to_warrior_ms: string;
  grind_status: string;
};

export function MapRowPreview({
  row,
  variant,
}: {
  row: PlaygroundMapRow;
  variant: "compact" | "card" | "thumbnail";
}) {
  const wrapperClass =
    variant === "compact"
      ? "rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 backdrop-blur-[18px]"
      : "rounded-[24px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.028)_56%,rgba(8,27,47,0.10)_100%)] p-5 shadow-[0_18px_44px_rgba(17,75,122,0.16)] backdrop-blur-[20px]";

  return (
    <article className={`group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/22 hover:shadow-[0_20px_56px_rgba(10,44,82,0.22)] ${wrapperClass}`}>
      {variant !== "compact" ? (
        <>
          <div className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-3rem] top-[-2rem] h-28 w-28 rounded-full opacity-80 blur-2xl" />
          <div className="playground-atmospheric-bloom-soft pointer-events-none absolute bottom-[-4rem] right-[18%] h-32 w-32 rounded-full opacity-45 blur-3xl" />
        </>
      ) : null}
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {variant === "thumbnail" ? (
            <div className="relative h-16 w-28 overflow-hidden rounded-2xl border border-cyan-200/24 bg-[linear-gradient(135deg,rgba(8,27,47,0.68),rgba(13,47,82,0.46),rgba(22,118,184,0.34)),radial-gradient(circle_at_top_right,rgba(43,196,255,0.42),transparent_45%)] backdrop-blur-sm">
              <div className="playground-telemetry-grid absolute inset-0 opacity-[0.16]" />
              <div className="absolute inset-x-3 bottom-3 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(125,227,255,0.92),transparent)]" />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-black tracking-[-0.02em] text-slate-50">{row.map_name}</h3>
              <DifficultyBadge tier={row.difficulty_tier} />
              <StatusBadge status={row.has_warrior ? "earned" : "close"} />
            </div>
            <p className="mt-1 text-sm text-sky-100/68">
              {row.category} by {row.author}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-sky-100/72 md:grid-cols-4 xl:grid-cols-6">
          <Meta label="AT" value={row.author_time} />
          <Meta label="Warrior" value={row.warrior_time} />
          <Meta label="WR" value={row.world_record_time} />
          <Meta label="PB" value={row.pb_time} tone={row.has_warrior ? "text-emerald-300" : "text-slate-100"} />
          <Meta label="Req" value={row.required_position} />
          <Meta label="Diff" value={row.diff_to_warrior_ms} tone={row.has_warrior ? "text-emerald-300" : "text-cyan-300"} />
        </div>
      </div>
      <div className="relative mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3.5">
        <StatusBadge status={row.grind_status} />
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-sky-50/84 transition duration-200 hover:border-white/18 hover:bg-white/[0.06]">
            Queue
          </button>
          <button className="rounded-full border border-cyan-300/28 bg-cyan-300/[0.11] px-4 py-2 text-xs font-semibold text-cyan-50 transition duration-200 hover:border-cyan-200/40 hover:bg-cyan-300/[0.18] hover:shadow-[0_0_20px_rgba(43,196,255,0.14)]">
            Inspect
          </button>
        </div>
      </div>
    </article>
  );
}

function Meta({ label, value, tone = "text-slate-100" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.032] px-3 py-2 backdrop-blur-sm">
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/52">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
