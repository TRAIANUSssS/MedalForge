import { StatusBadge } from "./StatusBadge";

export function ActivityFeedItem({
  title,
  detail,
  time,
  status,
}: {
  title: string;
  detail: string;
  time: string;
  status: string;
}) {
  return (
    <article className="flex items-start justify-between gap-4 rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-3 backdrop-blur-[18px] transition duration-200 hover:border-cyan-200/18 hover:bg-white/[0.05]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm leading-6 text-sky-100/68">{detail}</p>
      </div>
      <span className="shrink-0 font-mono text-xs uppercase tracking-[0.24em] text-sky-50/52">{time}</span>
    </article>
  );
}
