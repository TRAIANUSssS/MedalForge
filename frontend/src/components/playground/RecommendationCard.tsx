import { DifficultyBadge } from "./DifficultyBadge";
import { StatusBadge } from "./StatusBadge";

export function RecommendationCard({
  title,
  subtitle,
  reason,
  reward,
  difficulty,
  status,
  emphasis = "default",
}: {
  title: string;
  subtitle: string;
  reason: string;
  reward: string;
  difficulty: string;
  status: string;
  emphasis?: "featured" | "default" | "quiet";
}) {
  const emphasisClasses = {
    featured:
      "border-cyan-200/24 bg-[linear-gradient(160deg,rgba(36,151,214,0.18),rgba(255,255,255,0.05)_42%,rgba(8,27,47,0.16)_100%)] shadow-[0_24px_60px_rgba(17,75,122,0.22)]",
    default:
      "border-cyan-200/14 bg-[linear-gradient(160deg,rgba(25,112,168,0.12),rgba(255,255,255,0.04)_42%,rgba(8,27,47,0.16)_100%)] shadow-[0_18px_44px_rgba(17,75,122,0.16)]",
    quiet:
      "border-white/12 bg-[linear-gradient(160deg,rgba(18,93,142,0.10),rgba(255,255,255,0.035)_42%,rgba(8,27,47,0.14)_100%)] shadow-[0_16px_38px_rgba(17,75,122,0.14)]",
  } satisfies Record<string, string>;

  return (
    <article
      className={`group relative overflow-hidden rounded-[28px] border p-5 backdrop-blur-[24px] transition duration-200 hover:-translate-y-1 hover:border-cyan-200/24 hover:shadow-[0_28px_72px_rgba(17,75,122,0.24)] ${emphasisClasses[emphasis]}`}
    >
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute left-[-4rem] top-[-3rem] h-40 w-40 rounded-full opacity-80 blur-2xl" />
      <div className="playground-atmospheric-bloom-soft pointer-events-none absolute bottom-[-5rem] right-[-2rem] h-44 w-44 rounded-full opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(186,236,255,0.7),transparent)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-cyan-50/66">Recommended route</p>
              {emphasis === "featured" ? (
                <span className="rounded-full border border-cyan-200/20 bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-50/90">
                  Best payoff
                </span>
              ) : null}
            </div>
            <h3 className={`mt-2 font-black tracking-[-0.03em] text-slate-50 ${emphasis === "featured" ? "text-[1.35rem]" : "text-lg"}`}>
              {title}
            </h3>
            <p className="mt-1 text-sm font-medium text-sky-100/76">{subtitle}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className={`mt-4 flex flex-wrap gap-2 ${emphasis === "featured" ? "md:gap-2.5" : ""}`}>
          <DifficultyBadge tier={difficulty} />
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
            {reward}
          </span>
        </div>
        <p className={`mt-4 text-sm leading-6 text-sky-50/82 ${emphasis === "featured" ? "max-w-[38ch]" : "max-w-[34ch]"}`}>{reason}</p>
        {emphasis === "featured" ? (
          <div className="mt-5 grid gap-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/52">Focus window</span>
              <span className="text-sm font-semibold text-cyan-50">Low recovery cost</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/52">Suggested session</span>
              <span className="text-sm font-semibold text-slate-100">15-20 min retry block</span>
            </div>
          </div>
        ) : null}
        <div className={`flex items-center justify-between gap-3 ${emphasis === "featured" ? "mt-6" : "mt-5"}`}>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-sky-50/54">Best next session</div>
          <button className="rounded-full border border-cyan-300/30 bg-cyan-300/[0.11] px-4 py-2 text-sm font-semibold text-cyan-50 shadow-[0_0_24px_rgba(43,196,255,0.10)] transition duration-200 hover:border-cyan-200/44 hover:bg-cyan-300/[0.18] hover:shadow-[0_0_30px_rgba(43,196,255,0.16)]">
            Grind now
          </button>
        </div>
      </div>
    </article>
  );
}
