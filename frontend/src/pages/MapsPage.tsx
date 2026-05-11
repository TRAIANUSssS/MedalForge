import { useEffect, useRef, useState } from "react";

import { getHealth, getMaps, getMapsMeta, getStatsSummary, type HealthResponse, type MapListItem, type MapsMetaResponse, type StatsSummaryResponse } from "../api/client";
import { AppSidebar } from "../components/layout/AppSidebar";
import { DifficultyBadge } from "../components/playground/DifficultyBadge";
import { capturePageAsPng } from "../utils/pageCapture";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; data: HealthResponse }
  | { status: "error"; message: string };

type MapsState =
  | { status: "loading" }
  | { status: "ok"; items: MapListItem[]; total: number }
  | { status: "error"; message: string };

type MapsMetaState =
  | { status: "loading" }
  | { status: "ok"; data: MapsMetaResponse }
  | { status: "error"; message: string };
type StatsState =
  | { status: "loading" }
  | { status: "ok"; data: StatsSummaryResponse }
  | { status: "error"; message: string };

const glassCardClass =
  "relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.024),rgba(8,27,47,0.10))] shadow-[0_24px_80px_rgba(9,41,86,0.16)] backdrop-blur-[24px]";
const actionPrimaryClass =
  "rounded-full border border-cyan-200/30 bg-[#2bc4ff]/12 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(43,196,255,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/40 hover:bg-[#2bc4ff]/18 disabled:cursor-not-allowed disabled:opacity-50";
const actionSecondaryClass =
  "rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50";
const inputClass =
  "min-h-12 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-100 outline-none transition duration-200 placeholder:text-sky-50/38 hover:border-white/16 focus:border-cyan-200/28 focus:bg-white/[0.06]";
const interactiveCardClass =
  "transition duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.055] hover:shadow-[0_18px_42px_rgba(11,47,84,0.16)]";

export function MapsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [maps, setMaps] = useState<MapsState>({ status: "loading" });
  const [mapsMeta, setMapsMeta] = useState<MapsMetaState>({ status: "loading" });
  const [stats, setStats] = useState<StatsState>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [offset, setOffset] = useState(0);
  const [captureState, setCaptureState] = useState<"idle" | "running" | "done" | "error">("idle");
  const limit = 50;

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth({ status: "ok", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setHealth({ status: "error", message: getErrorMessage(error, "Unknown backend error") });
        }
      });

    getMapsMeta()
      .then((data) => {
        if (!cancelled) {
          setMapsMeta({ status: "ok", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMapsMeta({ status: "error", message: getErrorMessage(error, "Unknown maps metadata error") });
        }
      });

    getStatsSummary()
      .then((data) => {
        if (!cancelled) {
          setStats({ status: "ok", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStats({ status: "error", message: getErrorMessage(error, "Unknown stats error") });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMaps({ status: "loading" });
    getMaps({
      status: statusFilter,
      category,
      search: query,
      sort,
      order,
      limit,
      offset,
    })
      .then((data) => {
        setMaps({ status: "ok", items: data.items, total: data.total });
      })
      .catch((error: unknown) => {
        setMaps({ status: "error", message: getErrorMessage(error, "Unknown maps error") });
      });
  }, [category, limit, offset, order, query, sort, statusFilter]);

  async function handleCapturePage() {
    if (!pageRef.current || captureState === "running") {
      return;
    }

    setCaptureState("running");
    try {
      await capturePageAsPng(
        pageRef.current,
        `medalforge-maps-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`,
      );
      setCaptureState("done");
      window.setTimeout(() => setCaptureState("idle"), 1800);
    } catch {
      setCaptureState("error");
      window.setTimeout(() => setCaptureState("idle"), 2400);
    }
  }

  const pageStart = maps.status === "ok" && maps.total > 0 ? offset + 1 : 0;
  const pageEnd = maps.status === "ok" ? Math.min(offset + limit, maps.total) : 0;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_12%_7%,rgba(43,196,255,0.20),transparent_34%),radial-gradient(circle_at_34%_14%,rgba(125,227,255,0.10),transparent_30%),radial-gradient(circle_at_78%_10%,rgba(80,210,255,0.08),transparent_30%),radial-gradient(circle_at_72%_62%,rgba(22,118,184,0.12),transparent_34%),radial-gradient(circle_at_32%_86%,rgba(43,196,255,0.10),transparent_34%),linear-gradient(180deg,#2a769f_0%,#246d97_20%,#1d5d87_48%,#194e77_72%,#18496f_100%)] text-slate-100"
      ref={pageRef}
    >
      <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.035]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[linear-gradient(180deg,rgba(186,236,255,0.06),rgba(125,227,255,0.03),transparent)]" />
      <div className="pointer-events-none absolute -left-28 top-6 h-[34rem] w-[34rem] rounded-full bg-[#7de3ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-16 h-[40rem] w-[40rem] rounded-full bg-[#2bc4ff]/08 blur-3xl" />

      <div className="relative mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        <aside className="relative mb-6 xl:fixed xl:left-[max(2rem,calc((100vw-1700px)/2+2rem))] xl:top-6 xl:z-30 xl:mb-0 xl:h-[calc(100vh-3rem)] xl:w-[292px]">
          <AppSidebar
            activePath="/maps"
            onNavigate={onNavigate}
            progress={stats.status === "ok" ? { earned: stats.data.earned_count, total: stats.data.total_maps } : null}
          />
        </aside>

        <main className="grid gap-6 xl:ml-[308px]">
            <section className={`${glassCardClass} p-7 md:p-9`}>
              <div className="playground-racing-line pointer-events-none absolute inset-0 opacity-70" />
              <div className="playground-telemetry-grid pointer-events-none absolute inset-0 opacity-[0.045]" />
              <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#2bc4ff]/10 blur-3xl" />
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(22,118,184,0.16),transparent_46%)]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.38em] text-cyan-100/82">
                    Maps workspace
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">
                    Local Warrior maps database
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/76 md:text-base">
                    Dedicated browsing space for filters, sorting, PB state, difficulty and required
                    position, without competing with dashboard overview blocks.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                  <button
                    className={`${actionSecondaryClass} sm:col-span-2`}
                    disabled={captureState === "running"}
                    type="button"
                    onClick={() => void handleCapturePage()}
                  >
                    {captureState === "running" ? "Capturing full page..." : "Save full-page PNG"}
                  </button>
                  <div className="rounded-[20px] border border-white/12 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50/58">
                    {captureState === "done"
                      ? "PNG saved"
                      : captureState === "error"
                        ? "Capture failed"
                        : "Full maps screenshot"}
                  </div>
                  <HealthBadge health={health} />
                </div>
              </div>
            </section>

            <section className={`${glassCardClass} p-5 md:p-6`}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-sky-50/56">
                    Maps database
                  </p>
                  <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Browse local Warrior maps</h3>
                  <p className="mt-3 text-sm leading-6 text-sky-100/68">
                    {maps.status === "ok"
                      ? `${pageStart}-${pageEnd} of ${maps.total} maps`
                      : "Browse Warrior source rows, PB status, and required positions."}
                  </p>
                </div>

                <form
                  className="grid gap-3 lg:grid-cols-6 xl:w-[1040px]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setOffset(0);
                    setQuery(search.trim());
                  }}
                >
                  <input
                    aria-label="Search maps"
                    className={`${inputClass} lg:col-span-2 xl:col-span-2`}
                    placeholder="Search maps, authors, campaigns"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select
                    aria-label="Filter by category"
                    className={inputClass}
                    value={category}
                    onChange={(event) => {
                      setOffset(0);
                      setCategory(event.target.value);
                    }}
                  >
                    <option className="bg-slate-900" value="">
                      All categories
                    </option>
                    {mapsMeta.status === "ok"
                      ? mapsMeta.data.categories.map((item) => (
                          <option className="bg-slate-900" key={item.name} value={item.name}>
                            {item.name} ({item.count})
                          </option>
                        ))
                      : null}
                  </select>
                  <select
                    aria-label="Sort maps"
                    className={inputClass}
                    value={sort}
                    onChange={(event) => {
                      setOffset(0);
                      setSort(event.target.value);
                    }}
                  >
                    <option className="bg-slate-900" value="name">Name</option>
                    <option className="bg-slate-900" value="warrior_time_ms">Warrior time</option>
                    <option className="bg-slate-900" value="author_time_ms">Author time</option>
                    <option className="bg-slate-900" value="category">Category</option>
                    <option className="bg-slate-900" value="campaign_name">Campaign</option>
                  </select>
                  <button
                    className={actionSecondaryClass}
                    type="button"
                    onClick={() => {
                      setOffset(0);
                      setOrder((current) => (current === "asc" ? "desc" : "asc"));
                    }}
                  >
                    {order === "asc" ? "Asc" : "Desc"}
                  </button>
                  <div className="flex gap-3 lg:col-span-2 xl:col-span-2">
                    <button
                      className={`flex-1 ${actionSecondaryClass}`}
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setQuery("");
                        setCategory("");
                        setStatusFilter("all");
                        setOffset(0);
                      }}
                    >
                      Reset
                    </button>
                    <button className={`flex-1 ${actionPrimaryClass}`} type="submit">
                      Search
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-5">
                <StatusFilters
                  active={statusFilter}
                  meta={mapsMeta}
                  onChange={(next) => {
                    setOffset(0);
                    setStatusFilter(next);
                  }}
                />
              </div>

              <div className="mt-5">
                <MapsTable maps={maps} />
              </div>

              <div className="mt-5">
                <Pagination
                  disabled={maps.status !== "ok"}
                  limit={limit}
                  offset={offset}
                  total={maps.status === "ok" ? maps.total : 0}
                  onPage={(nextOffset) => setOffset(nextOffset)}
                />
              </div>
            </section>
        </main>
      </div>
    </div>
  );
}

function HealthBadge({ health }: { health: HealthState }) {
  if (health.status === "loading") {
    return <div className="rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">Checking backend</div>;
  }
  if (health.status === "error") {
    return <div className="rounded-full border border-rose-300/20 bg-rose-500/14 px-4 py-3 text-sm font-semibold text-rose-100">Backend offline</div>;
  }
  return <div className="rounded-full border border-emerald-300/22 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">Backend {health.data.version}</div>;
}

function MapsTable({ maps }: { maps: MapsState }) {
  if (maps.status === "loading") {
    return <div className="grid gap-3">{Array.from({ length: 8 }).map((_, index) => <div className="h-20 animate-pulse rounded-[22px] border border-white/10 bg-white/[0.035]" key={index} />)}</div>;
  }
  if (maps.status === "error") {
    return <div className="rounded-[22px] border border-rose-300/20 bg-rose-500/10 p-5 text-sm font-semibold text-rose-100">Maps failed to load: {maps.message}</div>;
  }
  if (maps.items.length === 0) {
    return <div className="rounded-[22px] border border-dashed border-white/14 bg-white/[0.025] p-5 text-sm leading-6 text-sky-100/60">No maps in the local database yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))]">
      <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_0.8fr_0.8fr_0.8fr_1fr_1fr] gap-4 border-b border-white/10 bg-[linear-gradient(180deg,rgba(20,67,102,0.82),rgba(15,50,77,0.72))] px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-sky-50/72 lg:sticky lg:top-0 lg:z-10 lg:grid">
        <span>Map</span><span>Category</span><span>Warrior</span><span>AT</span><span>WR</span><span>Required</span><span>PB</span>
      </div>
      <div className="grid">
        {maps.items.map((map) => (
          <article className={`grid gap-4 border-t border-white/6 px-5 py-4 first:border-t-0 lg:grid-cols-[minmax(0,2.2fr)_1fr_0.8fr_0.8fr_0.8fr_1fr_1fr] lg:items-center ${interactiveCardClass} ${getMapRowClass(map)}`} key={map.map_uid}>
            <div className="min-w-0">
              <strong className="block truncate text-base font-bold text-white">{cleanTrackmaniaText(map.name) ?? "Unnamed map"}</strong>
              <span className="mt-1.5 block truncate text-sm text-sky-100/50">{map.author_name ?? map.map_uid}</span>
            </div>
            <div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getCategoryClass(map.category)}`}>{map.category ?? "Unknown"}</span>
              <span className="mt-1.5 block truncate text-sm text-sky-100/46">{cleanTrackmaniaText(map.campaign_name) ?? "No campaign"}</span>
            </div>
            <DataCell label="Warrior" value={formatTime(map.warrior_time_ms)} />
            <DataCell label="AT" value={formatTime(map.author_time_ms)} />
            <DataCell label="WR" value={formatTime(map.world_record_time_ms)} />
            <div>
              <DataCell label="Required" value={formatPosition(map)} />
              {map.difficulty_tier ? <div className="mt-1.5"><DifficultyBadge tier={map.difficulty_tier} /></div> : null}
            </div>
            <div>
              <DataCell label="PB" value={map.pb_time_ms ? formatTime(map.pb_time_ms) : "No PB"} valueClassName={getMapPbClass(map)} />
              {map.diff_to_warrior_ms !== null ? <span className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getDiffBadgeClass(map)}`}>{map.has_warrior ? `Ahead by ${formatGap(-map.diff_to_warrior_ms)}` : `Gap ${formatGap(map.diff_to_warrior_ms)}`}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DataCell({ label, value, valueClassName = "text-slate-100" }: { label: string; value: string; valueClassName?: string }) {
  return <div><span className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/40 lg:hidden">{label}</span><strong className={`mt-1 block text-sm font-semibold ${valueClassName}`}>{value}</strong></div>;
}

function StatusFilters({ active, meta, onChange }: { active: string; meta: MapsMetaState; onChange: (status: string) => void }) {
  const filters = [["all", "All"], ["earned", "Earned"], ["missing", "Missing"], ["close", "Close"], ["not_played", "Not played"]];
  const counts = meta.status === "ok" ? meta.data.status_counts : {};
  return (
    <div className="flex flex-wrap gap-3" aria-label="Map status filters">
      {filters.map(([value, label]) => (
        <button
          className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 text-sm font-semibold transition duration-200 ${active === value ? "border-cyan-200/32 bg-[linear-gradient(135deg,rgba(43,196,255,0.18),rgba(255,255,255,0.04),rgba(8,27,47,0.14))] text-cyan-50 shadow-[0_10px_24px_rgba(43,196,255,0.10)]" : "border-white/10 bg-white/[0.03] text-slate-100 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.05]"}`}
          key={value}
          type="button"
          onClick={() => onChange(value)}
        >
          <span>{label}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-inherit">{counts[value] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

function Pagination({ disabled, limit, offset, total, onPage }: { disabled: boolean; limit: number; offset: number; total: number; onPage: (offset: number) => void }) {
  const canGoBack = offset > 0;
  const canGoNext = offset + limit < total;
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-sky-100/68 sm:flex-row sm:items-center sm:justify-between">
      <span>Page {total === 0 ? 0 : Math.floor(offset / limit) + 1} of {Math.max(1, Math.ceil(total / limit))}</span>
      <div className="flex gap-3">
        <button className={actionSecondaryClass} disabled={disabled || !canGoBack} type="button" onClick={() => onPage(Math.max(0, offset - limit))}>Previous</button>
        <button className={actionSecondaryClass} disabled={disabled || !canGoNext} type="button" onClick={() => onPage(offset + limit)}>Next</button>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
function formatTime(ms: number | null) {
  if (ms === null) return "N/A";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
function formatGap(ms: number | null) {
  if (ms === null) return "N/A";
  return `${Math.abs(Math.round(ms))} ms`;
}
function formatPosition(map: MapListItem) {
  if (map.position_status === "over_10000") return "10k+";
  if (map.position_status === "not_found") return "Not found";
  if (map.position_status === "failed") return "Failed";
  return map.required_position ? `#${map.required_position}` : "Not synced";
}
function getCategoryClass(category: string | null) {
  switch ((category ?? "unknown").toLowerCase()) {
    case "grand": return "border-rose-300/18 bg-rose-400/12 text-rose-100";
    case "seasonal": return "border-emerald-300/18 bg-emerald-400/12 text-emerald-100";
    case "weekly": return "border-amber-300/18 bg-amber-300/12 text-amber-100";
    case "totd": return "border-sky-300/18 bg-sky-400/12 text-sky-100";
    case "other": return "border-violet-300/18 bg-violet-400/12 text-violet-100";
    default: return "border-white/12 bg-white/[0.04] text-sky-50/74";
  }
}
function getMapRowClass(map: MapListItem) {
  if (map.has_warrior) return "bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.012))]";
  if (map.pb_time_ms === null) return "bg-[linear-gradient(180deg,rgba(148,163,184,0.08),rgba(255,255,255,0.012))]";
  if ((map.diff_to_warrior_ms ?? 999999) <= 1000) return "bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.012))]";
  return "bg-transparent";
}
function getMapPbClass(map: MapListItem) {
  if (map.has_warrior) return "text-emerald-100";
  if (map.pb_time_ms === null) return "text-sky-50/54";
  if ((map.diff_to_warrior_ms ?? 999999) <= 1000) return "text-amber-100";
  return "text-rose-100";
}
function getDiffBadgeClass(map: MapListItem) {
  if (map.has_warrior) return "border-emerald-300/18 bg-emerald-400/10 text-emerald-100";
  if ((map.diff_to_warrior_ms ?? 999999) <= 1000) return "border-amber-300/18 bg-amber-300/10 text-amber-100";
  return "border-rose-300/18 bg-rose-500/10 text-rose-100";
}
function cleanTrackmaniaText(value: string | null) {
  if (!value) return null;
  return value
    .replace(/\$[0-9a-fA-F]{3}/g, "")
    .replace(/\$[a-zA-Z<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
