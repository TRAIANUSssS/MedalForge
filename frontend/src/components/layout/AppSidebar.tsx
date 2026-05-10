const navItems: Array<{ label: string; route?: string; badge?: string }> = [
  { label: "Dashboard", route: "/dashboard" },
  { label: "Maps", route: "/maps" },
  { label: "Stats" },
  { label: "Charts" },
  { label: "Grind Queue", badge: "Soon" },
  { label: "Settings", route: "/settings" },
  { label: "Design Playground", route: "/design-playground" },
];

export function AppSidebar({
  activePath,
  onNavigate,
  progress,
}: {
  activePath: string;
  onNavigate: (path: string) => void;
  progress?: { earned: number; total: number } | null;
}) {
  const earned = progress?.earned ?? 0;
  const total = progress?.total ?? 0;
  const percentage = total > 0 ? Math.min((earned / total) * 100, 100) : 0;

  return (
    <div className="app-sidebar-shell relative isolate flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.024),rgba(8,27,47,0.10))] bg-clip-padding p-5 shadow-[0_24px_80px_rgba(9,41,86,0.16)] backdrop-blur-[24px]">
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.028]" />
      <button
        className="relative rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(43,196,255,0.05),rgba(8,27,47,0.14))] px-5 py-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/28 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(43,196,255,0.08),rgba(8,27,47,0.16))] hover:shadow-[0_14px_32px_rgba(43,196,255,0.12)]"
        type="button"
        onClick={() => onNavigate("/")}
      >
        <span className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-1rem] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full opacity-75 blur-2xl" />
        <span className="relative block text-[2rem] font-black tracking-[-0.08em] text-white sm:text-[2.2rem]">
          MedalForge
        </span>
      </button>

      <div className="relative mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        <nav className="relative" aria-label="Main navigation">
          <p className="mb-2 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/52">
            Core views
          </p>
          <div className="grid gap-2.5">
            {navItems.map((item) => {
              const active = item.route === activePath;
              return (
                <button
                  className={`relative flex min-h-14 items-center justify-between overflow-hidden rounded-[18px] border px-4 text-left text-sm font-semibold transition duration-200 ${
                    active
                        ? "border-cyan-200/34 bg-[linear-gradient(135deg,rgba(43,196,255,0.18),rgba(255,255,255,0.04),rgba(8,27,47,0.14))] text-cyan-50 shadow-[0_12px_28px_rgba(43,196,255,0.12)]"
                        : item.route
                        ? "border-white/10 bg-white/[0.024] text-slate-100 hover:-translate-y-0.5 hover:border-white/16 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(43,196,255,0.03))]"
                        : "cursor-default border-white/10 bg-white/[0.02] text-slate-400"
                  }`}
                  disabled={!item.route}
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.route) {
                      onNavigate(item.route);
                    }
                  }}
                >
                  {active ? (
                    <span className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-1rem] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full opacity-80 blur-2xl" />
                  ) : null}
                  <span className="relative">{item.label}</span>
                  {item.badge ? (
                    <span className="relative rounded-full border border-cyan-200/24 bg-[#2bc4ff]/10 px-2.5 py-1 text-[11px] text-cyan-100">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="relative mt-6 overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 backdrop-blur-md">
          <div className="playground-atmospheric-bloom-soft pointer-events-none absolute right-[-1rem] top-[-1rem] h-24 w-24 rounded-full opacity-50 blur-2xl" />
          <p className="relative font-mono text-xs font-black uppercase tracking-[0.28em] text-sky-50/56">
            STICKY PROGRESS
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-sky-100/68">Warrior medals</span>
            <span className="font-semibold text-cyan-100">
              {new Intl.NumberFormat().format(earned)} / {new Intl.NumberFormat().format(total)}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-2.5 rounded-full bg-[linear-gradient(90deg,rgba(58,188,231,0.96)_0%,rgba(190,208,210,0.95)_35%,rgba(236,230,206,0.93)_58%,rgba(244,214,142,0.92)_78%,rgba(255,198,98,0.92)_100%)]"
              style={{ width: `${Math.max(percentage, percentage > 0 ? 2 : 0)}%` }}
            />
          </div>
          <div className="relative mt-3 flex items-center justify-between text-sm">
            <span className="text-sky-50/72">
              {new Intl.NumberFormat().format(earned)} / {new Intl.NumberFormat().format(total)}
            </span>
            <span className="font-semibold tabular-nums text-cyan-100">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
