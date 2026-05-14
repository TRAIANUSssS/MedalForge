export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.048),rgba(255,255,255,0.02),rgba(8,27,47,0.085))] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_42px_rgba(9,41,86,0.12)] backdrop-blur-[20px] ${className}`.trim()}
    >
      <div className="playground-racing-line-soft pointer-events-none absolute inset-0 opacity-48" />
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.028]" />
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-1.5rem] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full opacity-45 blur-2xl" />
      <div className="relative flex flex-col gap-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sky-50/68">
          <a
            className="font-semibold tracking-[0.16em] text-sky-50/88 transition duration-200 ease-out hover:text-cyan-50 hover:opacity-100"
            href="/"
          >
            MedalForge
          </a>
          <span aria-hidden="true" className="text-cyan-100/46">
            •
          </span>
          <a
            className="font-mono uppercase tracking-[0.22em] text-sky-100/66 transition duration-200 ease-out hover:text-cyan-100 hover:opacity-100"
            href="https://github.com/TRAIANUSssS"
            rel="noreferrer"
            target="_blank"
          >
            TRAIANUSssS
          </a>
          <span aria-hidden="true" className="text-cyan-100/46">
            •
          </span>
          <a
            className="font-mono uppercase tracking-[0.22em] text-cyan-100/74 transition duration-200 ease-out hover:text-cyan-50 hover:opacity-100"
            href="https://github.com/TRAIANUSssS/MedalForge"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-[11px] text-sky-50/54 sm:justify-end">
          <a
            className="font-mono uppercase tracking-[0.24em] text-cyan-100/62 transition duration-200 ease-out hover:text-cyan-50 hover:opacity-100"
            href="https://github.com/ezio416/tm-warrior-medals"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <span aria-hidden="true" className="text-cyan-100/42">
            •
          </span>
          <a
            className="font-mono uppercase tracking-[0.24em] text-sky-100/50 transition duration-200 ease-out hover:text-cyan-100 hover:opacity-100"
            href="https://github.com/ezio416"
            rel="noreferrer"
            target="_blank"
          >
            ezio416
          </a>
          <span aria-hidden="true" className="text-cyan-100/42">
            •
          </span>
          <a
            className="font-mono font-black uppercase tracking-[0.3em] text-cyan-100/66 transition duration-200 ease-out hover:text-cyan-50 hover:opacity-100"
            href="https://openplanet.dev/plugin/warriormedals"
            rel="noreferrer"
            target="_blank"
          >
            TM WARRIOR MEDALS
          </a>
        </div>
      </div>
    </footer>
  );
}
