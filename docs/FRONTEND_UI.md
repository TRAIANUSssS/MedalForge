# Frontend UI

Short reference for the current frontend shape, routes, and visual-language work.

## Current Routes

The frontend uses a small history-based router inside `frontend/src/app/App.tsx`.

Routes:

- `/` - `ProgressEntryPage`
- `/dashboard` - `DashboardPage`
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
- warm energy edge treatment reserved for global Warrior completion only.

### Dashboard Page

File:

- `frontend/src/pages/DashboardPage.tsx`

Purpose:

- main data-driven MVP page;
- consume backend summary and sync endpoints;
- show progress, close medals, quick wins, sync visibility, and map-table workflow.

### Design Playground

File:

- `frontend/src/pages/DesignPlaygroundPage.tsx`

Purpose:

- visual language lab for components, surfaces, hierarchy, motion, and states;
- mock-only page with no backend/API dependency;
- source for styling patterns before they move into production pages.

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
- `DashboardPage` should feel information-dense but still premium.
- `DesignPlaygroundPage` remains the safe place to test future surface, typography, and interaction ideas before production adoption.

## Styling Notes

Main global style file:

- `frontend/src/styles.css`

It currently contains:

- application shell styles for the existing dashboard layout;
- playground-specific utility classes such as telemetry grid and atmospheric bloom;
- `warrior-progress-*` classes for the entry-page hero progress artifact;
- slow background-breathing helpers used only where safe.

When adding new production UI:

- prefer reusing existing atmospheric/glass/typography tokens from `styles.css`;
- do not spread the warm progress heat treatment to generic bars;
- keep design-playground-only experiments isolated unless promoted intentionally.
