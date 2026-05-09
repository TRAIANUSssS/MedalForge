import type { ReactNode } from "react";

export function DesignSection({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`group relative overflow-hidden rounded-[28px] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.032)_42%,rgba(8,27,47,0.10)_100%)] p-6 shadow-[0_24px_90px_rgba(9,41,86,0.16)] backdrop-blur-[24px] transition duration-200 hover:border-cyan-200/18 hover:shadow-[0_28px_96px_rgba(16,65,110,0.20)] md:p-8 ${className}`}>
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.045]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,236,255,0.65),transparent)]" />
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute right-4 top-[-2rem] h-24 w-24 rounded-full opacity-55 blur-2xl" />
      <div className="relative mb-7 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.34em] text-cyan-50/74">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-50 md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100/72">{description}</p>
        </div>
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
