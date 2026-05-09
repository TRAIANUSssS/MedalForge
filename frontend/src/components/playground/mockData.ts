import type { PlaygroundMapRow } from "./MapRowPreview";

export const designTokens = {
  backgrounds: [
    { name: "Deep Grid", value: "#081b2f", usage: "base", className: "bg-[#081b2f]" },
    { name: "Mid Cyan Blue", value: "#0d2f52", usage: "page", className: "bg-[#0d2f52]" },
    { name: "Atmospheric Blue", value: "#114b7a", usage: "alt", className: "bg-[#114b7a]" },
  ],
  surfaces: [
    { name: "Glass Calm", value: "rgba(255,255,255,0.035)", usage: "card", className: "bg-white/[0.035]" },
    { name: "Glass Lifted", value: "rgba(255,255,255,0.06)", usage: "active", className: "bg-white/[0.06]" },
    { name: "Blue Glass", value: "rgba(17,75,122,0.18)", usage: "panel", className: "bg-[#114b7a]/25" },
  ],
  accents: [
    { name: "Primary Cyan", value: "#2bc4ff", usage: "primary", className: "bg-[#2bc4ff]" },
    { name: "Signal Blue", value: "#1676b8", usage: "secondary", className: "bg-[#1676b8]" },
    { name: "Elite Purple", value: "#a855f7", usage: "elite", className: "bg-violet-500" },
    { name: "Achievement Gold", value: "#f59e0b", usage: "records", className: "bg-amber-400" },
    { name: "Danger Red", value: "#f43f5e", usage: "danger", className: "bg-rose-500" },
    { name: "Success Emerald", value: "#10b981", usage: "earned", className: "bg-emerald-500" },
  ],
  text: [
    { name: "Hero Text", value: "#f8fbff", usage: "titles", className: "bg-[#f8fbff]" },
    { name: "Body Text", value: "#d7e6fb", usage: "body", className: "bg-[#d7e6fb]" },
    { name: "Muted Text", value: "#93a9c6", usage: "muted", className: "bg-[#93a9c6]" },
  ],
  borders: [
    { name: "Glass Edge", value: "rgba(255,255,255,0.14)", usage: "default", className: "bg-white/20" },
    { name: "Cyan Edge", value: "rgba(43,196,255,0.35)", usage: "focus", className: "bg-[#2bc4ff]/70" },
    { name: "Slate Edge", value: "rgba(71,85,105,0.45)", usage: "secondary", className: "bg-slate-500/70" },
  ],
};

export const metricCards = [
  { label: "Warrior medals", value: "2,346 / 3,240", detail: "72.4% completion across synced maps", delta: "+154 this week", tone: "highlight" as const },
  { label: "Completion", value: "72.4%", detail: "Tracking local PB coverage and earned medals", delta: "+2.3%", tone: "success" as const },
  { label: "Close medals", value: "42", detail: "Within 1 second of Warrior time", delta: "12 within 250ms", tone: "calm" as const },
  { label: "Not played", value: "318", detail: "Maps with no local PB yet", delta: "23 seasonal", tone: "calm" as const },
  { label: "PB improvements", value: "87", detail: "New best times recorded this week", delta: "+14 today", tone: "success" as const },
  { label: "Required position", value: "#8,732", detail: "Current target rank for a close recommendation", tone: "warning" as const },
  { label: "Total play time", value: "412h 28m", detail: "Tracked from local progress snapshots", tone: "calm" as const },
  { label: "Sync freshness", value: "2 min ago", detail: "Warrior data, positions, and PBs all fresh", tone: "highlight" as const },
];

export const mapRows: PlaygroundMapRow[] = [
  {
    map_name: "Summer 2024 - 01",
    category: "Seasonal",
    author: "Nadeo",
    author_time: "0:57.842",
    warrior_time: "0:56.973",
    world_record_time: "0:54.618",
    required_position: "#8,732",
    difficulty_tier: "Normal",
    pb_time: "0:57.244",
    has_warrior: false,
    diff_to_warrior_ms: "+271 ms",
    grind_status: "in_progress",
  },
  {
    map_name: "Winter 2023 - 05",
    category: "Campaign",
    author: "Nadeo",
    author_time: "1:02.340",
    warrior_time: "1:00.118",
    world_record_time: "0:57.445",
    required_position: "#12,540",
    difficulty_tier: "Easy",
    pb_time: "1:00.094",
    has_warrior: true,
    diff_to_warrior_ms: "-24 ms",
    grind_status: "done",
  },
  {
    map_name: "Deep Dip Lite",
    category: "TOTD",
    author: "Astra",
    author_time: "2:41.402",
    warrior_time: "2:31.995",
    world_record_time: "2:24.551",
    required_position: "#312",
    difficulty_tier: "Insane",
    pb_time: "2:35.844",
    has_warrior: false,
    diff_to_warrior_ms: "+3,849 ms",
    grind_status: "grind_queue",
  },
];

export const recommendationCards = [
  {
    title: "Quick win",
    subtitle: "Summer 2024 - 01",
    reason: "Only 271 ms off Warrior and your last PB is 11 days old. High payoff, low recovery cost.",
    reward: "+1 Warrior today",
    difficulty: "Normal",
    status: "in_progress",
  },
  {
    title: "Close medal",
    subtitle: "Fall 2023 - 12",
    reason: "You are inside the <=500 ms bucket. This is the cleanest conversion target in your queue.",
    reward: "Close -> earned",
    difficulty: "Hard",
    status: "grind_queue",
  },
  {
    title: "Hard challenge",
    subtitle: "Deep Dip Lite",
    reason: "Large gap, but huge rating value and strong practice overlap with other tech maps.",
    reward: "Elite push",
    difficulty: "Insane",
    status: "skip_for_now",
  },
  {
    title: "Stale PB",
    subtitle: "Spring 2024 - 06",
    reason: "Last improved 37 days ago. The line is likely rusty and worth a refresh session.",
    reward: "Fresh snapshot",
    difficulty: "Easy",
    status: "stale",
  },
  {
    title: "Category completion",
    subtitle: "Winter 2024 campaign",
    reason: "Three missing medals remain in this campaign. Clearing them improves completion visibility fast.",
    reward: "Campaign closure",
    difficulty: "Normal",
    status: "grind_queue",
  },
  {
    title: "Random missing",
    subtitle: "Weekly 2025 - 14",
    reason: "A wildcard pick for low-burn sessions when you want novelty without queue pressure.",
    reward: "Variety session",
    difficulty: "Free",
    status: "not_played",
  },
];

export const activityFeed = [
  { title: "New Warrior medal", detail: "Winter 2024 - 03 moved from close to earned with a 0:44.118 PB.", time: "2m ago", status: "earned" },
  { title: "PB improved", detail: "Summer 2024 - 07 improved by 0.532s and entered the <=1s bucket.", time: "15m ago", status: "close" },
  { title: "Sync completed", detail: "Warrior positions sync finished with 4559 maps processed and 0 failures.", time: "21m ago", status: "up_to_date" },
  { title: "Token error", detail: "Trackmania OAuth refresh failed once. Manual reconnect may be needed soon.", time: "2h ago", status: "failed" },
  { title: "Map added to grind queue", detail: "Deep Dip Lite flagged for challenge rotation after PB review.", time: "5h ago", status: "grind_queue" },
  { title: "New progress snapshot", detail: "Completion moved from 71.9% to 72.4% after the last PB sync.", time: "Today", status: "success" },
];
