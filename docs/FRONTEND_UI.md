# Frontend UI

Short reference for the current frontend shape, routes, and visual-language work.

## Current Routes

The frontend uses a small history-based router inside `frontend/src/app/App.tsx`.

Routes:

- `/` - `ProgressEntryPage`
- `/dashboard` - `DashboardPage`
- `/maps` - `MapsPage`
- `/settings` - `SettingsPage`
- `/design-playground` - `DesignPlaygroundPage`
- `/playground` - alias for `DesignPlaygroundPage`

Unknown paths currently fall back to the progress entry page.

## Current Pages

### Progress Entry Page

File:

- `frontend/src/pages/ProgressEntryPage.tsx`

Purpose:

- first real production-facing entry screen;
- show one strong global Warrior completion signal before the dashboard;
- route into the main dashboard through `Open Dashboard`.

Current characteristics:

- luminous cyan atmospheric background;
- minimal hero composition;
- animated count-up for earned, total, and percentage;
- reusable `WarriorProgressBar` hero component;
- intentionally has no footer, so the hero stays centered and singular;
- warm energy edge treatment reserved for global Warrior completion only.

### Dashboard Page

File:

- `frontend/src/pages/DashboardPage.tsx`

Purpose:

- main data-driven MVP page;
- consume backend summary data;
- show progress, freshness, close medals, quick wins, and best margins;
- stay overview-first, with heavy controls moved out into dedicated workspaces.

Current characteristics:

- fixed desktop sidebar layout shared with the other production workspaces;
- bottom quiet control strip footer shared with maps/settings/playground;
- hero overall progress bar plus compact sticky progress inside the sidebar;
- sidebar now includes a compact `DEBUG` block instead of the older `TARGETS` explainer card;
- the shared debug block owns page-aware `Save full-page PNG` capture actions for production pages;
- compact map recommendation cards without campaign/company chips;
- `CHALLENGE YOURSELF` target block directly under the summary stats grid;
- three compact daily target rows plus one weekly challenge card;
- daily and weekly challenge cards now keep compact chip rows with:
  - semantic status;
  - map category;
  - one muted TMX chip when TMX metadata exists.
- the dashboard TMX chip currently prefers the last saved `tmx_tag_names` entry and falls back to `tmx_style_name`;
- TMX chip labels stay informational only and use muted cyan/blue styling rather than status colors;
- subtle grouped wrappers for summary stats, recommendation columns, and bottom sync telemetry;
- sync telemetry row moved below recommendations and uses compact `sync ... ago` wording;
- dashboard-local target persistence through `localStorage`;
- sidebar debug actions still expose normal reroll and edge-case `0-3 targets` reroll only on the dashboard;
- daily and weekly `BEAT NOW` CTA links open external map pages in a new tab;
- external link priority is `tmx_url -> trackmania_io_url -> Trackmania.io leaderboard fallback`;
- Weekly Challenge now prefers `tmx_thumbnail_url`, falls back to the stored map thumbnail, and then to the existing glass placeholder;
- recommendation rows in `Close medals`, `Quick wins`, and `Best margins` now open TMX directly when `tmx_url` is available;
- those recommendation rows currently use a neutral glass treatment without per-card amber/violet tint accents;
- clickable recommendation rows expose a small `Open on TMX` affordance instead of adding heavier visual chrome;
- `Close medals` rows now keep compact one-line chip rows with difficulty, category, and one muted TMX chip when TMX metadata exists;
- the desktop recommendation/activity split now gives `Close medals` a narrower `2/5` column and `Activity Feed` a wider `3/5` column;
- daily and weekly challenge descriptions now come from stable description pools instead of a single hardcoded sentence.
- the old top-right screenshot controls were removed from the page hero area.
- links users into `Maps` for the full database table and into `Settings` for sync/account actions.

### Maps Page

File:

- `frontend/src/pages/MapsPage.tsx`

Purpose:

- dedicated local Warrior maps workspace;
- own the searchable/filterable/paginated maps table;
- keep full table density away from the dashboard overview.

Current characteristics:

- fixed desktop sidebar layout consistent with dashboard/settings;
- bottom quiet control strip footer shared with dashboard/settings/playground;
- page capture now runs from the shared sidebar `DEBUG` block instead of the page header;
- filters for category, status, search, sorting, and pagination;
- semantic row highlighting for earned, close, and not-played states;
- campaign metadata stays visible here, unlike compact dashboard cards.

### Settings Page

File:

- `frontend/src/pages/SettingsPage.tsx`

Purpose:

- dedicated workspace for sync and Trackmania account controls;
- expose sync status, latest jobs, and OAuth connection state without crowding the dashboard.

Current characteristics:

- fixed desktop sidebar layout consistent with dashboard/maps;
- bottom quiet control strip footer shared with dashboard/maps/playground;
- `Backend {version}` badge is intentionally shown in the hero area only on Settings;
- page capture now runs from the shared sidebar `DEBUG` block instead of the page header;
- sync control cards for Warrior data, positions, PB sync, and TMX metadata sync;
- Trackmania OAuth connect/disconnect/check actions;
- latest sync status block lives here instead of on the main dashboard;
- TMX sync runs from the frontend only through the local backend endpoint, never against TMX directly.

### Design Playground

File:

- `frontend/src/pages/DesignPlaygroundPage.tsx`

Purpose:

- visual language lab for components, surfaces, hierarchy, motion, and states;
- mock-only page with no backend/API dependency;
- source for styling patterns before they move into production pages.

Current characteristics:

- contains the current `Priority 1 Target Cards` reference layout;
- bottom quiet control strip footer shared with the production workspaces;
- daily target rows use compact one-line chips, compact stat pills, and shared `BEAT NOW` CTA styling;
- production target cards currently reserve room for semantic status, category, and one informational TMX chip without adding a second chip row;
- weekly challenge and completion/placeholder states are explored here before dashboard adoption.

## Reusable UI Building Blocks

### WarriorProgressBar

File:

- `frontend/src/components/progress/WarriorProgressBar.tsx`

Purpose:

- reusable global Warrior completion bar;
- intended for the entry page now and future dashboard hero/global summary reuse later.

Current behavior:

- smooth fill animation from 0 to target progress;
- animated percentage count-up;
- optional warm energy edge through `showFlame`;
- respects `prefers-reduced-motion`.

Important constraint:

- the warm flame/heat treatment is intentionally not a generic progress style for all bars in the app.

### SiteFooter

File:

- `frontend/src/components/layout/SiteFooter.tsx`

Purpose:

- shared quiet control strip for non-landing frontend pages;
- keep project attribution and outbound links visible without expanding into a large footer.

Current behavior:

- rendered on `/dashboard`, `/maps`, `/settings`, and `/design-playground`;
- intentionally hidden on `/`;
- compact glass strip with softer chrome than the main content cards;
- left side is primary:
  - `MedalForge` routes to `/`;
  - `TRAIANUSssS` links to the GitHub profile;
  - `GitHub` links to the MedalForge repository.
- right side is secondary:
  - `GitHub` links to the TM Warrior Medals repository;
  - `ezio416` links to the GitHub profile;
  - `TM WARRIOR MEDALS` links to the Openplanet plugin page.
- separators use muted cyan bullets;
- links use subtle cyan/blue hover polish without strong glow or heavy underline.

## Visual Direction

The current frontend visual language is intentionally:

- blue/cyan forward;
- atmospheric instead of flat;
- calm and premium instead of admin-like;
- glass-aware but not glass-chaos;
- restrained with glow;
- product-focused, not marketing-landing styled.

Key rules that now exist in code:

- `ProgressEntryPage` should feel cinematic and singular.
- `DashboardPage` should stay overview-first, not turn back into a mixed settings/table screen.
- `MapsPage` owns the full maps database workflow.
- `SettingsPage` owns sync/account actions and detailed sync status.
- `DesignPlaygroundPage` remains the safe place to test future surface, typography, and interaction ideas before production adoption.
- `SiteFooter` should stay compact, quiet, and attribution-focused rather than becoming a marketing or SaaS footer.

## Styling Notes

Main global style file:

- `frontend/src/styles.css`

It currently contains:

- application shell styles for the existing dashboard layout;
- a subtle thin glass scrollbar treatment shared across production surfaces;
- playground-specific utility classes such as telemetry grid and atmospheric bloom;
- `warrior-progress-*` classes for the entry-page hero progress artifact;
- shared `playground-cta-shimmer` helper used by `BEAT NOW` buttons in playground and dashboard target cards;
- slow background-breathing helpers used only where safe.

When adding new production UI:

- prefer reusing existing atmospheric/glass/typography tokens from `styles.css`;
- do not spread the warm progress heat treatment to generic bars;
- keep design-playground-only experiments isolated unless promoted intentionally.
