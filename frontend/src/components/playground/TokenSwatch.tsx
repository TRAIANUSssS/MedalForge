export function TokenSwatch({
  name,
  value,
  usage,
  className,
}: {
  name: string;
  value: string;
  usage: string;
  className: string;
}) {
  return (
    <article className="rounded-3xl border border-white/12 bg-white/[0.03] p-4 backdrop-blur-xl">
      <div className={`h-20 rounded-2xl border border-white/12 ${className}`} />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-sky-100/45">{value}</p>
        </div>
        <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-sky-50/72">
          {usage}
        </span>
      </div>
    </article>
  );
}
