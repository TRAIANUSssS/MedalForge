import { useEffect, useRef, useState } from "react";

import {
  getMapCollections,
  getMaps,
  getMapsMeta,
  getStatsSummary,
  type MapCollectionItem,
  type MapListItem,
  type MapsMetaResponse,
  type StatsSummaryResponse,
} from "../api/client";
import { AppSidebar } from "../components/layout/AppSidebar";
import { SiteFooter } from "../components/layout/SiteFooter";
import { DifficultyBadge } from "../components/playground/DifficultyBadge";
import { capturePageAsPng } from "../utils/pageCapture";

type MapsState = { status: "loading" } | { status: "ok"; items: MapListItem[]; total: number } | { status: "error"; message: string };
type MapsMetaState = { status: "loading" } | { status: "ok"; data: MapsMetaResponse } | { status: "error"; message: string };
type CollectionsState = { status: "loading" } | { status: "ok"; items: MapCollectionItem[] } | { status: "error"; message: string };
type StatsState = { status: "loading" } | { status: "ok"; data: StatsSummaryResponse } | { status: "error"; message: string };
type SortKey = "name" | "category" | "warrior_time_ms" | "author_time_ms" | "world_record_time_ms" | "required_position" | "pb_time_ms";
type FilterStatus = "all" | "earned" | "missing" | "close" | "not_played";
type PbState = "any" | "has_pb" | "no_pb";

type CollectionTab = { value: string; label: string; description: string };
type CollectionGroup = { label: string; items: MapCollectionItem[] };
type SelectOption = { value: string; label: string };
type DraftFilters = {
  search: string;
  difficultyTier: string;
  tmxStyleName: string;
  pbState: PbState;
  positionMin: number;
  positionMax: number;
};
type AppliedFilters = DraftFilters;

const glassCardClass =
  "relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.024),rgba(8,27,47,0.10))] shadow-[0_24px_80px_rgba(9,41,86,0.16)] backdrop-blur-[24px]";
const actionPrimaryClass =
  "rounded-full border border-cyan-100/42 bg-[#2bc4ff]/14 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(43,196,255,0.16)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-50/56 hover:bg-[#2bc4ff]/22 disabled:cursor-not-allowed disabled:opacity-50";
const actionSecondaryClass =
  "rounded-full border border-white/18 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:border-white/26 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50";
const inputClass =
  "min-h-11 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-100 outline-none transition duration-200 placeholder:text-sky-50/38 hover:border-white/16 focus:border-cyan-200/28 focus:bg-white/[0.06]";
const interactiveCardClass =
  "transition duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.055] hover:shadow-[0_18px_42px_rgba(11,47,84,0.16)]";
const browseCollectionTabs: CollectionTab[] = [
  { value: "Seasonal", label: "Seasonal", description: "Official seasonal campaigns grouped by quarter." },
  { value: "Grand", label: "Grands", description: "Grand campaign maps grouped by Warrior week." },
  { value: "Weekly", label: "Shorts", description: "Short weekly sets grouped by week." },
  { value: "Totd", label: "Track of the Day", description: "Daily releases grouped into month collections." },
  { value: "Other", label: "Other", description: "Training, custom campaigns, and community collections." },
];
const statusFilters: Array<{ value: FilterStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "earned", label: "Earned" },
  { value: "missing", label: "Missing" },
  { value: "close", label: "Close" },
  { value: "not_played", label: "Not played" },
];
const pbStateOptions: SelectOption[] = [
  { value: "any", label: "Any PB" },
  { value: "has_pb", label: "Has PB" },
  { value: "no_pb", label: "No PB" },
];

export function MapsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [maps, setMaps] = useState<MapsState>({ status: "loading" });
  const [mapsMeta, setMapsMeta] = useState<MapsMetaState>({ status: "loading" });
  const [collections, setCollections] = useState<CollectionsState>({ status: "loading" });
  const [stats, setStats] = useState<StatsState>({ status: "loading" });
  const [category, setCategory] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [offset, setOffset] = useState(0);
  const [browseExpanded, setBrowseExpanded] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<string>("Seasonal");
  const [captureState, setCaptureState] = useState<"idle" | "running" | "done" | "error">("idle");
  const limit = 50;
  const defaultDraftFilters: DraftFilters = { search: "", difficultyTier: "", tmxStyleName: "", pbState: "any", positionMin: 1, positionMax: 10000 };
  const [draftFilters, setDraftFilters] = useState<DraftFilters>(defaultDraftFilters);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultDraftFilters);

  function loadCollections(cancelledRef?: { current: boolean }) {
    setCollections({ status: "loading" });
    getMapCollections()
      .then((data) => {
        if (!cancelledRef?.current) setCollections({ status: "ok", items: data.items });
      })
      .catch((error: unknown) => {
        if (!cancelledRef?.current) {
          setCollections({
            status: "error",
            message: getErrorMessage(error, "Unable to reach /api/maps/collections. Restart the backend if it is still running old routes."),
          });
        }
      });
  }

  useEffect(() => {
    const cancelledRef = { current: false };
    loadCollections(cancelledRef);
    getStatsSummary()
      .then((data) => {
        if (!cancelledRef.current) setStats({ status: "ok", data });
      })
      .catch((error: unknown) => {
        if (!cancelledRef.current) setStats({ status: "error", message: getErrorMessage(error, "Unknown stats error") });
      });
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const cancelledRef = { current: false };
    setMapsMeta({ status: "loading" });
    getMapsMeta({
      category,
      campaign_name: campaignName || undefined,
      search: appliedFilters.search || undefined,
      difficulty_tier: appliedFilters.difficultyTier || undefined,
      tmx_style_name: appliedFilters.tmxStyleName || undefined,
      pb_state: appliedFilters.pbState,
      position_min: appliedFilters.positionMin !== 1 ? appliedFilters.positionMin : undefined,
      position_max: appliedFilters.positionMax !== 10000 ? appliedFilters.positionMax : undefined,
    })
      .then((data) => {
        if (!cancelledRef.current) {
          setMapsMeta({ status: "ok", data });
          setDraftFilters((current) => ({
            ...current,
            positionMin: current.positionMin === defaultDraftFilters.positionMin ? data.position_bounds.min : current.positionMin,
            positionMax: current.positionMax === defaultDraftFilters.positionMax ? data.position_bounds.max : current.positionMax,
          }));
        }
      })
      .catch((error: unknown) => {
        if (!cancelledRef.current) setMapsMeta({ status: "error", message: getErrorMessage(error, "Unknown maps metadata error") });
      });
    return () => {
      cancelledRef.current = true;
    };
  }, [appliedFilters.difficultyTier, appliedFilters.pbState, appliedFilters.positionMax, appliedFilters.positionMin, appliedFilters.search, appliedFilters.tmxStyleName, campaignName, category]);

  useEffect(() => {
    setMaps({ status: "loading" });
    getMaps({
      status: statusFilter,
      category,
      campaign_name: campaignName || undefined,
      search: appliedFilters.search || undefined,
      difficulty_tier: appliedFilters.difficultyTier || undefined,
      tmx_style_name: appliedFilters.tmxStyleName || undefined,
      pb_state: appliedFilters.pbState,
      position_min: appliedFilters.positionMin !== 1 ? appliedFilters.positionMin : undefined,
      position_max: appliedFilters.positionMax !== 10000 ? appliedFilters.positionMax : undefined,
      sort,
      order,
      limit,
      offset,
    })
      .then((data) => setMaps({ status: "ok", items: data.items, total: data.total }))
      .catch((error: unknown) => setMaps({ status: "error", message: getErrorMessage(error, "Unknown maps error") }));
  }, [appliedFilters, campaignName, category, limit, offset, order, sort, statusFilter]);

  async function handleCapturePage() {
    if (!pageRef.current || captureState === "running") return;
    setCaptureState("running");
    try {
      await capturePageAsPng(pageRef.current, `medalforge-maps-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`);
      setCaptureState("done");
      window.setTimeout(() => setCaptureState("idle"), 1800);
    } catch {
      setCaptureState("error");
      window.setTimeout(() => setCaptureState("idle"), 2400);
    }
  }

  function applyDraftFilters() {
    setOffset(0);
    setAppliedFilters({ ...draftFilters });
  }

  function resetAllFilters() {
    setCategory("");
    setCampaignName("");
    setStatusFilter("all");
    setSort("name");
    setOrder("asc");
    setOffset(0);
    setDraftFilters(defaultDraftFilters);
    setAppliedFilters(defaultDraftFilters);
  }

  function handleSort(nextSort: SortKey) {
    setOffset(0);
    if (sort === nextSort) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(nextSort);
    setOrder("asc");
  }

  const pageStart = maps.status === "ok" && maps.total > 0 ? offset + 1 : 0;
  const pageEnd = maps.status === "ok" ? Math.min(offset + limit, maps.total) : 0;
  const activeCollection = collections.status === "ok" && category && campaignName ? collections.items.find((item) => item.category === category && item.campaign_name === campaignName) ?? null : null;
  const positionBounds = mapsMeta.status === "ok" ? mapsMeta.data.position_bounds : { min: 1, max: 10000 };
  const difficultyOptions: SelectOption[] = [{ value: "", label: "Any difficulty" }, ...(mapsMeta.status === "ok" ? mapsMeta.data.difficulty_tiers.map((tier) => ({ value: tier, label: tier })) : [])];
  const tmxStyleOptions: SelectOption[] = [{ value: "", label: "Any TMX style" }, ...(mapsMeta.status === "ok" ? mapsMeta.data.tmx_styles.map((style) => ({ value: style, label: style })) : [])];

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#18496f] text-slate-100" ref={pageRef}>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_7%,rgba(43,196,255,0.20),transparent_34%),radial-gradient(circle_at_34%_14%,rgba(125,227,255,0.10),transparent_30%),radial-gradient(circle_at_78%_10%,rgba(80,210,255,0.08),transparent_30%),radial-gradient(circle_at_72%_62%,rgba(22,118,184,0.12),transparent_34%),radial-gradient(circle_at_32%_86%,rgba(43,196,255,0.10),transparent_34%),linear-gradient(180deg,#2a769f_0px,#246d97_320px,#1d5d87_920px,#194e77_1500px,#18496f_2100px,#18496f_100%)]" />
      <div className="playground-telemetry-grid pointer-events-none fixed inset-0 z-0 opacity-[0.035]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96 bg-[linear-gradient(180deg,rgba(186,236,255,0.06),rgba(125,227,255,0.03),transparent)]" />
      <div className="pointer-events-none fixed -left-28 top-6 z-0 h-[34rem] w-[34rem] rounded-full bg-[#7de3ff]/10 blur-3xl" />
      <div className="pointer-events-none fixed right-[-10rem] top-16 z-0 h-[40rem] w-[40rem] rounded-full bg-[#2bc4ff]/08 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        <aside className="relative mb-6 xl:fixed xl:left-[max(2rem,calc((100vw-1700px)/2+2rem))] xl:top-6 xl:z-30 xl:mb-0 xl:h-[calc(100vh-3rem)] xl:w-[292px]">
          <AppSidebar
            activePath="/maps"
            captureState={captureState}
            onNavigate={onNavigate}
            onCapturePage={() => void handleCapturePage()}
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
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.38em] text-cyan-100/82">Maps workspace</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">Local Warrior maps database</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/76 md:text-base">
                  Dedicated browsing space for filters, sorting, PB state, difficulty and required position, without competing with dashboard overview blocks.
                </p>
              </div>
            </div>
          </section>

          <section className={`${glassCardClass} p-5 md:p-6`}>
            <div>
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-sky-50/56">Maps database</p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Browse local Warrior maps</h3>
              <p className="mt-3 text-sm leading-6 text-sky-100/68">
                {maps.status === "ok" ? `${pageStart}-${pageEnd} of ${maps.total} maps` : "Browse Warrior source rows, PB status, and required positions."}
              </p>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02),rgba(8,27,47,0.12))] p-4 shadow-[0_20px_56px_rgba(7,31,63,0.14)] md:p-5">
              <BrowseCollectionsPanel
                activeCategory={category}
                activeCollection={activeCollection}
                browseCategory={browseCategory}
                collections={collections}
                expanded={browseExpanded}
                onClear={() => {
                  setOffset(0);
                  setCategory("");
                  setCampaignName("");
                }}
                onSelectCategory={(nextCategory) => {
                  if (collections.status === "error") loadCollections();
                  setOffset(0);
                  setBrowseCategory(nextCategory);
                  if (category === nextCategory && !campaignName) {
                    setCategory("");
                    return;
                  }
                  setCategory(nextCategory);
                  setCampaignName("");
                }}
                onSelectCollection={(item) => {
                  setBrowseCategory(item.category);
                  setOffset(0);
                  if (category === item.category && campaignName === item.campaign_name) {
                    setCampaignName("");
                    return;
                  }
                  setCategory(item.category);
                  setCampaignName(item.campaign_name);
                }}
                onRetry={() => loadCollections()}
                onToggle={() => {
                  if (!browseExpanded && collections.status === "error") loadCollections();
                  setBrowseExpanded((current) => !current);
                }}
              />

              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyDraftFilters();
                }}
              >
                <div>
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.28em] text-sky-50/52">Filtes</p>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.8fr))]">
                  <input
                    aria-label="Search maps"
                    className={inputClass}
                    placeholder="Search maps, authors, campaigns"
                    value={draftFilters.search}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                  />
                  <GlassSelect
                    ariaLabel="Filter by difficulty tier"
                    options={difficultyOptions}
                    value={draftFilters.difficultyTier}
                    onChange={(nextValue) => setDraftFilters((current) => ({ ...current, difficultyTier: nextValue }))}
                  />
                  <GlassSelect
                    ariaLabel="Filter by TMX style"
                    options={tmxStyleOptions}
                    value={draftFilters.tmxStyleName}
                    onChange={(nextValue) => setDraftFilters((current) => ({ ...current, tmxStyleName: nextValue }))}
                  />
                  <GlassSelect
                    ariaLabel="Filter by PB presence"
                    options={pbStateOptions}
                    value={draftFilters.pbState}
                    onChange={(nextValue) => setDraftFilters((current) => ({ ...current, pbState: nextValue as PbState }))}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-end">
                  <div className="xl:col-span-1">
                    <PositionRangeControl
                      max={positionBounds.max}
                      min={positionBounds.min}
                      valueMax={draftFilters.positionMax}
                      valueMin={draftFilters.positionMin}
                      onChange={(nextMin, nextMax) => setDraftFilters((current) => ({ ...current, positionMin: nextMin, positionMax: nextMax }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <StatusFilters
                    active={statusFilter}
                    meta={mapsMeta}
                    onChange={(next) => {
                      setOffset(0);
                      setStatusFilter(next);
                    }}
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      className={`${actionSecondaryClass} min-w-[112px]`}
                      type="button"
                      onClick={resetAllFilters}
                    >
                      Reset
                    </button>
                    <button className={`${actionPrimaryClass} min-w-[112px]`} type="submit">
                      Search
                    </button>
                  </div>
                </div>
              </form>
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

            <div className="mt-4">
              <MapsTable maps={maps} order={order} sort={sort} onSort={handleSort} />
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
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}

function BrowseCollectionsPanel({
  activeCategory,
  activeCollection,
  browseCategory,
  collections,
  expanded,
  onClear,
  onRetry,
  onSelectCategory,
  onSelectCollection,
  onToggle,
}: {
  activeCategory: string;
  activeCollection: MapCollectionItem | null;
  browseCategory: string;
  collections: CollectionsState;
  expanded: boolean;
  onClear: () => void;
  onRetry: () => void;
  onSelectCategory: (category: string) => void;
  onSelectCollection: (item: MapCollectionItem) => void;
  onToggle: () => void;
}) {
  const tabCollections = collections.status === "ok" ? collections.items.filter((item) => item.category === browseCategory) : [];
  const groupedCollections = groupCollectionsForBrowse(tabCollections, browseCategory);

  return (
    <div className={expanded ? "overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018),rgba(8,27,47,0.10))] p-4" : ""}>
      <div className={`rounded-[18px] ${expanded ? "" : "border border-white/10 bg-white/[0.03] px-4 py-3"}`}>
        <button className="flex w-full items-start justify-between gap-4 text-left" type="button" onClick={onToggle} aria-expanded={expanded}>
          <div>
            <h4 className="text-lg font-black tracking-[-0.03em] text-white md:text-xl">Browse collections</h4>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-100/66">Pick a Warrior category or campaign to filter the maps database.</p>
          </div>
          <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-lg text-sky-50/72">{expanded ? "-" : "+"}</span>
        </button>
      </div>

      {activeCollection ? (
        <div className="mt-3 flex flex-col gap-2 rounded-[18px] border border-cyan-200/18 bg-[linear-gradient(135deg,rgba(43,196,255,0.14),rgba(255,255,255,0.05),rgba(8,27,47,0.16))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-cyan-50/92">
            {getBrowseLabel(activeCollection.category)} / {cleanTrackmaniaText(activeCollection.campaign_name) ?? activeCollection.campaign_name} · {activeCollection.earned} / {activeCollection.total} earned · {formatPercent(activeCollection.completion_percent)}
          </p>
          <button className={actionSecondaryClass} type="button" onClick={onClear}>Clear</button>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            {browseCollectionTabs.map((tab) => {
              const isActive = browseCategory === tab.value;
              const isSelectedFilter = activeCategory === tab.value && !activeCollection;
              return (
                <button
                  className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 text-sm font-semibold transition duration-200 ${isActive || isSelectedFilter ? "border-cyan-100/36 bg-[linear-gradient(135deg,rgba(43,196,255,0.16),rgba(17,42,66,0.34),rgba(8,27,47,0.20))] text-cyan-50 shadow-[0_12px_28px_rgba(43,196,255,0.12)]" : "border-white/10 bg-white/[0.03] text-slate-100 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.05]"}`}
                  key={tab.value}
                  type="button"
                  onClick={() => onSelectCategory(tab.value)}
                  title={tab.description}
                >
                  <span>{tab.label}</span>
                  {collections.status === "ok" ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-inherit">{tabCollectionsTotal(collections.items, tab.value)}</span> : null}
                </button>
              );
            })}
          </div>

          {collections.status === "loading" ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div className="h-16 animate-pulse rounded-[18px] border border-white/10 bg-white/[0.035]" key={index} />)}</div> : null}
          {collections.status === "error" ? (
            <div className="flex flex-col gap-3 rounded-[20px] border border-rose-300/18 bg-rose-500/10 px-4 py-4 text-sm font-semibold text-rose-100 sm:flex-row sm:items-center sm:justify-between">
              <p>Collections failed to load: {collections.message}</p>
              <button className={actionSecondaryClass} type="button" onClick={onRetry}>Retry</button>
            </div>
          ) : null}
          {collections.status === "ok" ? (
            <div className="max-h-[27rem] space-y-3 overflow-y-auto rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.034),rgba(255,255,255,0.022),rgba(34,102,148,0.05))] shadow-[inset_0_1px_0_rgba(186,236,255,0.03)] p-2 pr-1">
              {groupedCollections.length > 0 ? groupedCollections.map((group) => (
                <section key={group.label}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-px flex-1 bg-white/10" />
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-sky-50/48">{group.label}</p>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    {group.items.map((item) => {
                      const isActive = activeCollection?.category === item.category && activeCollection.campaign_name === item.campaign_name;
                      const campaignLabel = cleanTrackmaniaText(item.campaign_name) ?? item.campaign_name;
                      return (
                        <button
                          className={`rounded-[18px] border px-3.5 py-2.5 text-left transition-all duration-200 ${getCollectionButtonClass(item, isActive)}`}
                          key={`${item.category}:${item.campaign_name}`}
                          type="button"
                          onClick={() => onSelectCollection(item)}
                        >
                          <strong className="block truncate text-[13px] font-bold tracking-[-0.01em] text-white/98">{campaignLabel}</strong>
                          <span className="mt-1 block text-[11px] font-semibold text-sky-100/56">{item.earned} / {item.total} • {formatPercent(item.completion_percent)}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )) : <div className="rounded-[20px] border border-dashed border-white/14 bg-white/[0.025] px-4 py-5 text-sm text-sky-100/60">No collection groups found for this category.</div>}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PositionRangeControl({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (nextMin: number, nextMax: number) => void;
}) {
  const safeMin = Math.min(valueMin, valueMax);
  const safeMax = Math.max(valueMin, valueMax);
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Required position</p>
          <p className="mt-1 text-xs text-sky-100/56">Filter by warrior rank window from #{safeMin} to #{safeMax}.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-sky-50/72">#{safeMin} - #{safeMax}</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[104px_minmax(0,1fr)_104px] md:items-center">
        <input
          aria-label="Minimum required position field"
          className={`${inputClass} min-h-10 px-3`}
          max={safeMax}
          min={min}
          type="number"
          value={safeMin}
          onChange={(event) => onChange(Math.max(min, Math.min(Number(event.target.value || min), safeMax)), safeMax)}
        />
        <div className="relative px-1">
          <div className="absolute left-1 right-1 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
          <div
            className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(43,196,255,0.55),rgba(125,227,255,0.75))]"
            style={{
              left: `calc(${((safeMin - min) / Math.max(1, max - min)) * 100}% + 0.25rem)`,
              right: `calc(${100 - ((safeMax - min) / Math.max(1, max - min)) * 100}% + 0.25rem)`,
            }}
          />
          <input
            aria-label="Minimum required position"
            className="pointer-events-none absolute left-0 top-1/2 z-20 h-8 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cyan-200 [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(43,196,255,0.18)] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-cyan-200 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(43,196,255,0.18)]"
            max={max}
            min={min}
            type="range"
            value={safeMin}
            onChange={(event) => onChange(Math.min(Number(event.target.value), safeMax), safeMax)}
          />
          <input
            aria-label="Maximum required position"
            className="pointer-events-none absolute left-0 top-1/2 z-10 h-8 w-full -translate-y-1/2 appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cyan-100 [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(125,227,255,0.16)] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-cyan-100 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(125,227,255,0.16)]"
            max={max}
            min={min}
            type="range"
            value={safeMax}
            onChange={(event) => onChange(safeMin, Math.max(Number(event.target.value), safeMin))}
          />
        </div>
        <input
          aria-label="Maximum required position field"
          className={`${inputClass} min-h-10 px-3`}
          max={max}
          min={safeMin}
          type="number"
          value={safeMax}
          onChange={(event) => onChange(safeMin, Math.min(max, Math.max(Number(event.target.value || max), safeMin)))}
        />
      </div>
    </div>
  );
}

function GlassSelect({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`${inputClass} flex w-full items-center justify-between gap-3 pr-3 text-left ${open ? "border-cyan-100/34 bg-white/[0.07] shadow-[0_0_24px_rgba(43,196,255,0.10)]" : ""}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-sky-50/72 transition duration-200 ${open ? "rotate-180 border-cyan-100/24 text-cyan-50" : ""}`}>
          ▼
        </span>
      </button>

      <div
        className={`absolute left-0 right-0 top-[calc(100%+0.45rem)] z-30 origin-top rounded-[18px] border border-cyan-100/14 bg-[rgba(43,101,140,0.78)] shadow-[0_24px_48px_rgba(8,30,57,0.24),0_0_0_1px_rgba(125,227,255,0.035)] backdrop-blur-[22px] transition duration-200 ${open ? "pointer-events-auto translate-y-0 opacity-100 scale-100" : "pointer-events-none -translate-y-1.5 opacity-0 scale-[0.98]"}`}
      >
        <div className="rounded-[17px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018),rgba(8,27,47,0.08))] p-2">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                aria-selected={isSelected}
                className={`flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm transition duration-150 ${isSelected ? "bg-[rgba(255,255,255,0.055)] text-cyan-50 shadow-[0_8px_18px_rgba(43,196,255,0.05)]" : "text-sky-50/88 hover:bg-white/[0.07] hover:text-white"}`}
                key={option.value || "__empty__"}
                role="option"
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                <span className={`text-[11px] font-semibold ${isSelected ? "text-cyan-100/90" : "text-sky-100/30"}`}>{isSelected ? "Selected" : ""}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MapsTable({
  maps,
  sort,
  order,
  onSort,
}: {
  maps: MapsState;
  sort: SortKey;
  order: "asc" | "desc";
  onSort: (nextSort: SortKey) => void;
}) {
  if (maps.status === "loading") return <div className="grid gap-3">{Array.from({ length: 8 }).map((_, index) => <div className="h-16 animate-pulse rounded-[22px] border border-white/10 bg-white/[0.035]" key={index} />)}</div>;
  if (maps.status === "error") return <div className="rounded-[22px] border border-rose-300/20 bg-rose-500/10 p-5 text-sm font-semibold text-rose-100">Maps failed to load: {maps.message}</div>;
  if (maps.items.length === 0) return <div className="rounded-[22px] border border-dashed border-white/14 bg-white/[0.025] p-5 text-sm leading-6 text-sky-100/60">No maps match the current filters.</div>;

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "name", label: "Map" },
    { key: "category", label: "Category" },
    { key: "warrior_time_ms", label: "Warrior" },
    { key: "author_time_ms", label: "AT" },
    { key: "world_record_time_ms", label: "WR" },
    { key: "required_position", label: "Required" },
    { key: "pb_time_ms", label: "PB" },
  ];

  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.042),rgba(255,255,255,0.02))]">
      <div className="hidden grid-cols-[minmax(0,2.4fr)_1.45fr_0.82fr_0.82fr_0.82fr_1.12fr_1fr_0.72fr] gap-3 border-b border-white/8 bg-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/64 lg:sticky lg:top-0 lg:z-10 lg:grid">
        {columns.map((column) => (
          <button
            className="flex items-center gap-2 text-left transition hover:text-cyan-50"
            key={column.key}
            type="button"
            onClick={() => onSort(column.key)}
          >
            <span>{column.label}</span>
            <span className={`text-[10px] ${sort === column.key ? "text-cyan-100/78" : "text-sky-50/28"}`}>{sort === column.key ? (order === "asc" ? "↑" : "↓") : "↕"}</span>
          </button>
        ))}
        <span>TMX link</span>
      </div>
      <div className="grid">
        {maps.items.map((map) => {
          const mapName = cleanTrackmaniaText(map.name) ?? "Unnamed map";
          const campaignLabel = cleanTrackmaniaText(map.campaign_name);
          const authorLabel = cleanTrackmaniaText(map.author_name);
          const infoTag = getMapInfoTag(map);
          return (
            <article className={`grid gap-3 border-t border-white/6 px-4 py-3 first:border-t-0 lg:grid-cols-[minmax(0,2.4fr)_1.45fr_0.82fr_0.82fr_0.82fr_1.12fr_1fr_0.72fr] lg:items-center ${interactiveCardClass} ${getMapRowClass(map)}`} key={map.map_uid}>
              <div className="min-w-0">
                <strong className="block truncate text-[15px] font-bold text-white">{mapName}</strong>
                {campaignLabel ? <span className="mt-1 block truncate text-sm text-sky-100/46">{campaignLabel}</span> : null}
                {authorLabel ? <span className="mt-1 block truncate text-xs text-sky-100/40">{authorLabel}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getCategoryClass(map.category)}`}>{map.category ?? "Unknown"}</span>
                {infoTag ? <span className="inline-flex rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-sky-50/76">{infoTag}</span> : null}
              </div>
              <DataCell label="Warrior" value={formatTime(map.warrior_time_ms)} />
              <DataCell label="AT" value={formatTime(map.author_time_ms)} />
              <DataCell label="WR" value={formatTime(map.world_record_time_ms)} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm font-semibold text-slate-100">{formatPosition(map)}</strong>
                  {map.difficulty_tier ? <DifficultyBadge tier={map.difficulty_tier} /> : null}
                </div>
              </div>
              <div>
                <DataCell label="PB" value={map.pb_time_ms ? formatTime(map.pb_time_ms) : "No PB"} valueClassName={getMapPbClass(map)} />
                {map.diff_to_warrior_ms !== null ? <span className={`mt-1.5 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getDiffBadgeClass(map)}`}>{map.has_warrior ? `Ahead ${formatGap(-map.diff_to_warrior_ms)}` : `Gap ${formatGap(map.diff_to_warrior_ms)}`}</span> : null}
              </div>
              <div>
                {map.tmx_url ? <a className="inline-flex min-h-10 items-center justify-center rounded-full border border-cyan-200/24 bg-[#2bc4ff]/10 px-3 text-xs font-semibold text-cyan-50 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-100/40 hover:bg-[#2bc4ff]/18" href={map.tmx_url} rel="noreferrer" target="_blank">Open</a> : <span className="text-xs text-sky-100/36">N/A</span>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DataCell({ label, value, valueClassName = "text-slate-100" }: { label: string; value: string; valueClassName?: string }) {
  return <div><span className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-50/40 lg:hidden">{label}</span><strong className={`mt-1 block text-sm font-semibold ${valueClassName}`}>{value}</strong></div>;
}

function StatusFilters({ active, meta, onChange }: { active: FilterStatus; meta: MapsMetaState; onChange: (status: FilterStatus) => void }) {
  const counts = meta.status === "ok" ? meta.data.status_counts : {};
  return (
    <div className="flex flex-wrap gap-3" aria-label="Map status filters">
      {statusFilters.map((filter) => (
        <button
          className={`inline-flex min-h-11 items-center gap-3 rounded-full border px-4 text-sm font-semibold transition duration-200 ${active === filter.value ? "border-cyan-200/32 bg-[linear-gradient(135deg,rgba(43,196,255,0.18),rgba(255,255,255,0.04),rgba(8,27,47,0.14))] text-cyan-50 shadow-[0_10px_24px_rgba(43,196,255,0.10)]" : "border-white/10 bg-white/[0.03] text-slate-100 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.05]"}`}
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
        >
          <span>{filter.label}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-inherit">{counts[filter.value] ?? 0}</span>
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
        <button className={`${actionSecondaryClass} min-w-[112px]`} disabled={disabled || !canGoBack} type="button" onClick={() => onPage(Math.max(0, offset - limit))}>Previous</button>
        <button className={`${actionSecondaryClass} min-w-[112px]`} disabled={disabled || !canGoNext} type="button" onClick={() => onPage(offset + limit)}>Next</button>
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
  if (map.position_status === "over_10000") return "#10k+";
  if (map.position_status === "not_found") return "Not found";
  if (map.position_status === "failed") return "Failed";
  return map.required_position ? `#${map.required_position}` : "Not synced";
}

function getCategoryClass(category: string | null) {
  switch ((category ?? "unknown").toLowerCase()) {
    case "grand": return "border-rose-300/20 bg-rose-400/14 text-rose-100";
    case "seasonal": return "border-emerald-300/22 bg-emerald-400/18 text-emerald-50";
    case "weekly": return "border-amber-300/20 bg-amber-300/16 text-amber-50";
    case "totd": return "border-sky-300/22 bg-sky-400/18 text-sky-50";
    case "other": return "border-violet-300/18 bg-violet-400/14 text-violet-100";
    default: return "border-white/12 bg-white/[0.04] text-sky-50/74";
  }
}

function getMapRowClass(map: MapListItem) {
  if (map.has_warrior) return "bg-[linear-gradient(180deg,rgba(22,163,74,0.11),rgba(255,255,255,0.012))]";
  if (map.pb_time_ms === null) return "bg-[linear-gradient(180deg,rgba(148,163,184,0.085),rgba(255,255,255,0.012))]";
  if ((map.diff_to_warrior_ms ?? 999999) <= 1000) return "bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(255,255,255,0.012))]";
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

function getMapInfoTag(map: MapListItem) {
  if (map.tmx_tag_names && map.tmx_tag_names.length > 0) return cleanTrackmaniaText(map.tmx_tag_names[map.tmx_tag_names.length - 1]) ?? map.tmx_tag_names[map.tmx_tag_names.length - 1];
  return cleanTrackmaniaText(map.tmx_style_name ?? null);
}

function tabCollectionsTotal(items: MapCollectionItem[], category: string) {
  return items.filter((item) => item.category === category).length;
}

function groupCollectionsForBrowse(items: MapCollectionItem[], category: string): CollectionGroup[] {
  const groups = new Map<string, MapCollectionItem[]>();
  for (const item of [...items].sort((left, right) => compareCollectionItems(left, right, category))) {
    const label = getCollectionYearGroup(item.campaign_name);
    const existing = groups.get(label);
    if (existing) existing.push(item);
    else groups.set(label, [item]);
  }
  return [...groups.entries()].sort(([left], [right]) => compareGroupLabels(left, right)).map(([label, groupedItems]) => ({ label, items: groupedItems }));
}

function compareGroupLabels(left: string, right: string) {
  if (left === "Other") return 1;
  if (right === "Other") return -1;
  return Number(right) - Number(left);
}

function compareCollectionItems(left: MapCollectionItem, right: MapCollectionItem, category: string) {
  const seasonalLeft = parseSeasonalCollection(left.campaign_name);
  const seasonalRight = parseSeasonalCollection(right.campaign_name);
  if (seasonalLeft && seasonalRight) {
    if (seasonalLeft.year !== seasonalRight.year) return seasonalRight.year - seasonalLeft.year;
    return seasonalRight.index - seasonalLeft.index;
  }
  const datedLeft = parseMonthCollection(left.campaign_name);
  const datedRight = parseMonthCollection(right.campaign_name);
  if (datedLeft && datedRight) {
    if (datedLeft.year !== datedRight.year) return datedRight.year - datedLeft.year;
    return datedRight.month - datedLeft.month;
  }
  const weekLeft = parseWeekCollection(left.campaign_name);
  const weekRight = parseWeekCollection(right.campaign_name);
  if (weekLeft !== null && weekRight !== null) return category === "Grand" ? weekLeft - weekRight : weekRight - weekLeft;
  return left.campaign_name.localeCompare(right.campaign_name);
}

function parseSeasonalCollection(value: string) {
  const match = /^(Winter|Spring|Summer|Fall)\s+(\d{4})$/i.exec(value);
  if (!match) return null;
  const seasonOrder: Record<string, number> = { Winter: 1, Spring: 2, Summer: 3, Fall: 4 };
  return { year: Number(match[2]), index: seasonOrder[capitalizeWord(match[1])] ?? 0 };
}

function parseMonthCollection(value: string) {
  const match = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i.exec(value);
  if (!match) return null;
  const monthOrder: Record<string, number> = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
  return { year: Number(match[2]), month: monthOrder[capitalizeWord(match[1])] ?? 0 };
}

function parseWeekCollection(value: string) {
  const match = /^Week\s+(\d+)$/i.exec(value);
  return match ? Number(match[1]) : null;
}

function capitalizeWord(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1).toLowerCase();
}

function getCollectionYearGroup(value: string) {
  const match = /(19|20)\d{2}/.exec(value);
  return match ? match[0] : "Other";
}

function getBrowseLabel(category: string) {
  return browseCollectionTabs.find((tab) => tab.value === category)?.label ?? category;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getCollectionButtonClass(item: MapCollectionItem, isActive: boolean) {
  const base = isActive
    ? "border-cyan-100/28 shadow-[0_12px_24px_rgba(12,48,88,0.14),0_0_0_1px_rgba(125,227,255,0.10),0_0_16px_rgba(125,227,255,0.05)] -translate-y-[1px]"
    : "border-white/7 shadow-[0_7px_16px_rgba(9,34,64,0.04),0_0_12px_rgba(125,227,255,0.03)] hover:-translate-y-0.5 hover:border-white/13 hover:shadow-[0_10px_22px_rgba(12,48,88,0.08),0_0_16px_rgba(43,196,255,0.07)]";
  if (item.completion_percent >= 100) return `${base} bg-[linear-gradient(180deg,rgba(84,165,120,0.26),rgba(255,255,255,0.056),rgba(8,27,47,0.11))]`;
  if (item.completion_percent >= 80) return `${base} bg-[linear-gradient(180deg,rgba(198,152,70,0.26),rgba(255,255,255,0.056),rgba(8,27,47,0.11))]`;
  if (item.completion_percent >= 40) return `${base} bg-[linear-gradient(180deg,rgba(58,172,164,0.24),rgba(255,255,255,0.052),rgba(8,27,47,0.11))]`;
  if (item.completion_percent > 0) return `${base} bg-[linear-gradient(180deg,rgba(53,205,255,0.24),rgba(255,255,255,0.052),rgba(8,27,47,0.11))]`;
  return `${base} bg-[linear-gradient(180deg,rgba(110,180,224,0.20),rgba(255,255,255,0.048),rgba(8,27,47,0.11))]`;
}

function cleanTrackmaniaText(value: string | null) {
  if (!value) return null;
  return value.replace(/\$[0-9a-fA-F]{3}/g, "").replace(/\$[a-zA-Z<>]/g, "").replace(/\s+/g, " ").trim();
}
