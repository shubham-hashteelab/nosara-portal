# CLAUDE.md — nosara-portal

## What Is Nosara

Snagging inspection system for real estate handover. Three repos, one backend:

| Repo | Role | Stack | Hosted |
|---|---|---|---|
| **nosara-backend** | API server | FastAPI, SQLAlchemy, PostgreSQL, MinIO | RunPod CPU pod |
| **nosara-portal** (this) | Manager web UI | React 19, Vite, TypeScript, Tailwind | Vercel |
| **nosara** (Android) | Inspector field app | Kotlin, Jetpack Compose, Room | `~/StudioProjects/nosara` |

**Data flow:** This portal calls nosara-backend for all data. The backend URL is dynamic (RunPod assigns a new URL each pod restart), so it's configured at runtime, not build time.

## Tech Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS 3** — styling
- **shadcn-style components** — manually built in `src/components/ui/`
- **TanStack Query + Axios** — data fetching
- **React Router v6** — routing
- **React Hook Form + Zod** — form validation
- **Recharts** — dashboard charts

## Critical Conventions

- **Backend URL is runtime-configured via `localStorage`**, NOT env vars. Login page always shows server config step first (RunPod URL changes each restart). All API calls go through `src/api/client.ts` which reads base URL from `localStorage`.
- **Auth:** JWT token in `localStorage`. Axios interceptor attaches it to every request. 401 responses auto-redirect to login.
- **Enums:** Use `const` object pattern (not TypeScript `enum` keyword) — required by TypeScript `erasableSyntaxOnly` mode.
- **All IDs are strings** (backend returns UUIDs). Never use `Number()` on IDs.
- **HTTP methods:** All updates use `PATCH` (not PUT) to match backend.
- **Nested create URLs:** Buildings created via `POST /projects/{id}/buildings`, floors via `POST /buildings/{id}/floors`, flats via `POST /floors/{id}/flats`. Parent ID is in URL path, not request body.
- **Inspection entries:** Endpoint path is `/entries/` not `/inspections/`. Field names: `status` (not `check_status`), `item_name` (not `checklist_item`). Cross-project snag list lives at `GET /api/v1/entries/snags` with `project_id`/`severity`/`category`/`snag_fix_status` query params — the portal calls this from `InspectionListPage` via `listAllSnags()`. Status literals: `PASS` / `FAIL` / `NA` (snags are `status === "FAIL"`).
- **Contractor field names:** Portal types use `specialty` (not `trade`) to match the backend column. Contractor update is `PATCH /api/v1/contractors/{id}` (not PUT). Assigning a contractor to a snag is `POST /api/v1/entries/{entryId}/assign-contractor/{contractorId}` — both IDs in the URL, optional body `{ due_date?, notes? }`. Unassign is the mirror `DELETE` on the same path. A prior revision used `PUT`, `/inspections/…`, and `/contractor-assignments/{id}` — none of those routes exist backend-side.
- **SnagContractorAssignment shape** mirrors backend exactly: `{ id, inspection_entry_id, contractor_id, assigned_at, due_date, notes }`. There is no `entry_id`/`contractor_name`/`resolved_at` — portal interfaces that declared those were silently receiving `undefined`.
- **Default creds:** `admin` / `admin123`.
- **Error boundary** in `main.tsx` catches React crashes and shows the error message instead of white screen.
- **Sidebar highlighting:** "Projects" stays highlighted on hierarchy pages (`/buildings/*`, `/floors/*`) via `matchPrefixes` on the nav item. Uses `useLocation` pathname matching.
- **Media URLs:** Use `getMediaUrl(minioKey)` from `src/api/media.ts`. Builds `{backendUrl}/api/v1/files/{minioKey}?token={jwt}`. Don't `encodeURIComponent` the minio key — slashes must stay as path segments.
- **Media upload (portal-side):** `POST /api/v1/files/upload` (NOT `/media/upload`), multipart form field `inspection_entry_id` (NOT `entry_id`). `uploadMedia()` in `src/api/media.ts` is the single caller.
- **"Business Associate" = Contractor (UI label only).** User-visible strings say "Business Associate" / "Business Associates" (sidebar, page headings, dialog titles, dropdown placeholder, inspection-detail card). Everything else — route path `/contractors`, component file names, types (`Contractor`, `ContractorCreate`, `SnagContractorAssignment`), API client (`listContractors`, `assignContractorToSnag`), backend endpoints (`/api/v1/contractors`), DB tables — still uses `contractor`. Pure UI rename on 2026-04-20. Do not rename identifiers/paths/types without a full cross-repo migration.

## Design System

- **Sidebar** — light theme. White bg, right border `border-gray-200`, gray nav text, active item uses soft `bg-primary-50 text-primary-600` pill. Tokens defined in `tailwind.config.js` under `colors.sidebar.*` and `.sidebar-link` / `.sidebar-link-active` in `src/index.css`.
- **Cards** — base `Card` component is `rounded-2xl border-gray-100 shadow-sm`. Any custom card-like wrapper (flat tiles in `FloorDetailPage`, tower cards in `TowerProgressCard`, DataTable wrapper) should match: `rounded-2xl border border-gray-100`. Avoid `border-gray-200` for card borders — reserve gray-200 for hard separators.
- **Tower status pills** — use dot + count + label (no filled background): `<span class="w-1.5 h-1.5 rounded-full bg-*-500" /> {count} {label}`. Severity row follows the same pattern (`StatusDot` in `TowerProgressCard`). Do NOT reintroduce filled pastel pills for status counts.
- **KPI icon chips** (Dashboard `StatCard`) — keep colored (`bg-blue-50 text-blue-600`, etc.), use `rounded-xl p-3`.
- **Form inputs** (Input, Select, Textarea) — stay `rounded-md border-gray-300`. Do NOT bump to `rounded-2xl` — inputs have a tighter radius than cards by convention.
- **Dialogs** — `rounded-2xl shadow-xl`. Matches card radius for visual continuity.

## Project Structure

```
src/
├── api/
│   ├── client.ts           # Axios instance, dynamic base URL, auth interceptor
│   ├── projects.ts         # CRUD (PATCH for updates)
│   ├── buildings.ts        # Nested under projects for create
│   ├── floors.ts           # Nested under buildings for create
│   ├── flats.ts            # Nested under floors for create
│   ├── inspections.ts      # /entries/ endpoints (read + update only; entries auto-init on flat create)
│   ├── media.ts            # getMediaUrl (builds /files/{key}?token= URL), uploadMedia
│   ├── users.ts            # CRUD + assign/unassign project/building/flat
│   └── checklists.ts       # Templates (PATCH not PUT), flat type rooms, floor plan layouts, seed
├── contexts/AuthContext.tsx
├── components/
│   ├── layout/             # Sidebar, TopBar, MainLayout
│   ├── common/             # DataTable, StatusBadge, SeverityBadge, FloorPlanView, EmptyState
│   ├── charts/             # ProgressDonut (size-configurable), SnagsByCategoryBar, InspectorActivityLine
│   └── dashboard/          # TowerProgressCard (detailed + mini variants), TowerBuildingViz, TowerDetailModal, FloorProgressList
├── pages/
│   ├── LoginPage.tsx        # Server config + login (always shows URL step first)
│   ├── DashboardPage.tsx
│   ├── projects/            # ProjectListPage (+ Seed Demo Data), ProjectDetailPage
│   ├── hierarchy/           # BuildingDetailPage, FloorDetailPage, FlatDetailPage (+ FloorPlanView + InitializeChecklistDialog)
│   ├── inspections/         # InspectionListPage, InspectionDetailPage (photos, voice notes, videos)
│   ├── floorplans/          # FloorPlansPage (1BHK/2BHK/3BHK layout previews)
│   ├── checklists/          # ChecklistTemplatePage (flat-type tabs), FlatTypeRoomsPage
│   ├── users/               # UserListPage, UserFormDialog, ProjectAssignmentDialog (hierarchical)
│   ├── contractors/         # ContractorListPage
│   └── reports/             # ReportPage
├── types/
│   ├── api.ts              # All interfaces — IDs are string, matches backend exactly
│   └── enums.ts            # CheckStatus, Severity, SnagFixStatus, InspectionStatus, etc.
└── main.tsx                # App root with ErrorBoundary
```

## Key Features

- **Dashboard Tower Grid** — Responsive grid of per-tower cards (`TowerProgressCard`, detailed variant). Each card renders a literal building (`TowerBuildingViz`) with stacked floor rows; each floor shows N flat-blocks colored by `inspection_status` (emerald = COMPLETED, amber = IN_PROGRESS, stone = NOT_STARTED). Block counts come from the per-floor aggregates in `tower-stats` — flats are not individually identified, so blocks have no spatial meaning beyond count. Card header shows a dark letter badge (last A-Z char of building name), name, derived phase string (`phaseLabel(completion_pct)`: Pre-inspection → Early/Active/Final → Handover ready), and completion %. Footer: flat-status row + severity row (critical/major/minor) + open-snag count. **Hover** a floor inside the building → black tooltip with that floor's Done/In-progress/Open-snags. **Click** the card → opens `TowerDetailModal` (no longer navigates). Data from `GET /dashboard/projects/{id}/tower-stats`. All values from DB — no hardcoded towers/floors.
- **Tower Detail Modal** — `TowerDetailModal` opens from the dashboard tower card. Tall building viz on the left (same `TowerBuildingViz` with `size="tall"`), per-floor list on the right with mini-blocks + linear progress bar + % + open-snag badge. Filter tabs: All / With snags (`open_snags > 0`) / Pending (`completion_pct < 100`). Hovering a floor row in the list highlights the matching floor in the building (`highlightFloorId`). Clicking a floor row navigates to the floor's flat grid. "Open tower page →" footer link preserves the route to `/projects/:id/buildings/:bid`. Heatmap/List view modes are intentionally out of scope.
- **Projects list card layout** — `ProjectListPage` is a card grid, not a table. Each project card shows name/location/totals and a horizontal scrollable strip of `TowerProgressCard` (mini variant). Data from `GET /dashboard/projects-overview` in one call (no N+1). Search, create, delete preserved.
- **Floor Plan View** (`FloorPlanView.tsx`) — SVG-based room layout with progress colors (not started/in progress/completed). Rooms are **clickable** — clicking a room scrolls to and filters its entries, with blue selection highlight and hover effects.
- **Room-wise Inspection Entries** — Entries grouped by room with collapsible rows showing stacked progress bars (passed/snags/pending). Expanding shows full checklist table with notes, media counts. Replaces the old flat DataTable.
- **Floor Plans Page** — Sidebar entry showing read-only 1BHK/2BHK/3BHK layout previews with room lists.
- **Checklist Templates** — organized by flat type tabs (1BHK/2BHK/3BHK), showing rooms and their checklist items.
- **Media Display** — InspectionDetailPage shows photos (with lightbox), voice notes (audio player), and videos (video player). Media URLs use `?token=` query param auth via `/api/v1/files/{minio_key}`.
- **Hierarchical Access Control** — `ProjectAssignmentDialog` lets managers assign inspectors at project, tower, or flat level. Live updates via `getUser` query after each mutation.
- **Seed Demo Data** — one-click button on Projects page seeds 5 Godrej projects + checklist defaults.
- **Flat Inspection Status** — `flat.inspection_status` (NOT_STARTED/IN_PROGRESS/COMPLETED) is **backend-computed** from entry counts. Portal is a pure pass-through — displays via `StatusBadge`, never computes or mutates it. The separate room-level progress coloring in `FloorPlanView` is computed client-side from entries (independent system).
- **Akash Ganga Pool** — Floating widget (fixed bottom-right) for drag-and-drop tower card inspection. Three components: `AkashGangaPool.tsx` (the pool card with collapse/expand), `AkashGangaModal.tsx` (detail modal on drop), `akash-ganga.css` (all styles, `ag-` prefixed to avoid Tailwind collisions). The pool renders animated SVG caustics (two `feTurbulence` layers with `baseFrequency` animation), drifting blend layers, ripple rings, and a glint highlight. Has two states: **expanded** (full 340×380 card with header/footer) and **collapsed** (64px circle). Both states render the same caustics animation — the collapsed state uses `.ag-pool-mini` (48px) inside the circle button. Do NOT replace the caustics with a static gradient in either state.
- **SPA routing** — `vercel.json` has rewrite rule for client-side routing.

## Key Routes

```
/login          → Server config + login (always shows URL step)
/               → Dashboard
/projects       → Project list (+ Seed Demo Data button)
/projects/:id   → Project detail (buildings table, stats)
/projects/:id/buildings/:bid → Building detail (floors table)
/buildings/:bid/floors/:fid  → Floor detail (flats grid)
/floors/:fid/flats/:flatId   → Flat detail (floor plan, checklist entries — auto-populated)
/inspections    → All snags (filterable)
/inspections/:entryId → Inspection entry detail (update status, assign contractor, photos/voice/video)
/floor-plans    → Floor plan templates (1BHK/2BHK/3BHK previews)
/checklists     → Template management (flat-type tabs)
/checklists/room-definitions → Room definitions per flat type
/users          → User management + access control
/contractors    → Contractor management
/reports        → Reports
/settings       → Backend URL config
```

## Deployment

- **Vercel** — auto-deploys from `main` branch. Output: `dist/`.
- `vercel.json` has SPA rewrite rule (`/(.*) → /index.html`).
- No build-time env vars needed for backend URL (it's runtime).

## Commands

```bash
npm install
npm run dev      # Vite dev server on :5173
npm run build    # Production build → dist/ (tsc -b && vite build)
```
