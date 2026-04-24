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
- **Contractors are Users** (`role=CONTRACTOR`, as of Phase 2 backend rollout). The old `/api/v1/contractors` CRUD is gone — those routes return 410. Manage Business Associates via `/api/v1/users` endpoints with contractor-only fields on User: `trades: string[]` (required non-empty for CONTRACTOR, forbidden on other roles), `company: string | null`, plus `email`/`phone` (all roles). Assignment endpoints are unchanged: `POST /api/v1/entries/{entryId}/assign-contractor/{contractorUserId}` + mirror `DELETE`. Assignment accepts `?force=true` to replace an existing assignment; 409 `EXCLUSIVE_CONFLICT` otherwise. Assignment validates trade match — `entry.trade` must be in `contractor.trades`, else 422 `TRADE_MISMATCH`. `src/api/contractors.ts` is a thin shim over `/users` endpoints (`listContractors` fetches all users and filters `role === "CONTRACTOR"` client-side — backend does not yet accept a `?role=` filter param).
- **Inspection fix-flow is a state machine.** `snag_fix_status`: `OPEN → FIXED` (contractor, via app — not portal) → `VERIFIED` (manager, `POST /entries/{id}/verify` with `verification_remark`) or back to `OPEN` with `rejection_remark`/`rejected_at` set (manager, `POST /entries/{id}/reject`). **Do NOT PATCH `snag_fix_status`** to transition states — backend rejects any value that isn't an idempotent no-op. The InspectionDetailPage Update form only exposes `status`, `severity`, `notes` for this reason. Rejection-vs-fresh-OPEN must be differentiated by checking `rejected_at !== null` AND `snag_fix_status === "OPEN"` (never `snag_fix_status === "OPEN"` alone).
- **`ContractorAssignmentBrief` shape** (embedded on `InspectionEntry.contractor_assignments` and as the full response of the assign endpoint): `{ id, inspection_entry_id, contractor_id, contractor_name, contractor_trades: string[], assigned_at, due_date?, notes? }`. Always eager-loaded on entry reads — use it to render the AssignmentCard without a second fetch.
- **`SnagImage.kind`** is `"NC"` (inspector defect photo) or `"CLOSURE"` (contractor post-fix photo). `InspectionDetailPage` splits them into two galleries (`NCGallery`, `ClosureGallery`). ClosureGallery only renders for FAIL entries. The portal doesn't upload CLOSURE photos — that's contractor-app-only.
- **CONTRACTOR role is blocked from the portal.** `AuthContext.login` throws `new Error("CONTRACTOR_ROLE")` before persisting the token when the login response has `role === "CONTRACTOR"`; `LoginPage` catches this and shows a "log in from the mobile app" message. No CONTRACTOR token ever lands in `localStorage`. When `UserFormDialog` is opened from `UserListPage` (no `lockedRole`), the CONTRACTOR option is hidden from the role select so managers don't accidentally create a contractor that vanishes from the Users table filter.
- **Default creds:** `admin` / `admin123`.
- **Error boundary** in `main.tsx` catches React crashes and shows the error message instead of white screen.
- **Sidebar highlighting:** "Projects" stays highlighted on hierarchy pages (`/buildings/*`, `/floors/*`) via `matchPrefixes` on the nav item. Uses `useLocation` pathname matching.
- **Media URLs:** Use `getMediaUrl(minioKey)` from `src/api/media.ts`. Builds `{backendUrl}/api/v1/files/{minioKey}?token={jwt}`. Don't `encodeURIComponent` the minio key — slashes must stay as path segments.
- **Media upload (portal-side):** `POST /api/v1/files/upload` (NOT `/media/upload`), multipart form field `inspection_entry_id` (NOT `entry_id`). Portal uploads are always `kind=NC` (inspector workflow); `uploadMedia()` in `src/api/media.ts` is the single caller — if it ever needs CLOSURE support, note the backend role-gate (only CONTRACTOR can upload CLOSURE).
- **"Business Associate" = Contractor (UI label only).** User-visible strings say "Business Associate" / "Business Associates" (sidebar, page headings, dialog titles, dropdown placeholder, inspection-detail card, deactivation dialog, orphaned-assignments page). Everything else — route path `/contractors`, component file names, the `contractor_id` URL segment in assignment endpoints — still uses `contractor`. Pure UI rename first introduced 2026-04-20; preserved through the Phase 2 + Phase 3 migration.

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
│   ├── inspections.ts      # /entries/ — read + update, snag list, verification queue, verify/reject, orphaned-assignments, assign/unassign contractor
│   ├── media.ts            # getMediaUrl (builds /files/{key}?token= URL), uploadMedia
│   ├── users.ts            # CRUD + assign/unassign project/building/flat; updateUser supports ?force=true
│   ├── contractors.ts      # Thin shim: listContractors() filters /users by role=CONTRACTOR client-side; re-exports assignment helpers
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
│   ├── users/               # UserListPage (filters CONTRACTOR out), UserFormDialog (role picker + trades/company when CONTRACTOR, lockedRole prop, is_active toggle), ProjectAssignmentDialog, UserDetailPanel
│   ├── contractors/         # ContractorListPage (Business Associates — CRUD via /users), DeactivateContractorDialog (two-step with 409 orphan guard)
│   ├── verification-queue/  # VerificationQueuePage (MANAGER — approve/reject FIXED snags)
│   ├── orphaned-assignments/# OrphanedAssignmentsPage (MANAGER — triage assignments on deactivated contractors)
│   └── reports/             # ReportPage
├── components/inspection/   # AssignmentCard (trade-filtered dropdown + 409 force-replace prompt), FixTimeline (timeline keyed on rejected_at, not snag_fix_status alone), NCGallery / ClosureGallery (split by image.kind), RemarkDialog (shared verify/reject capture)
├── types/
│   ├── api.ts              # All interfaces — IDs are string, matches backend exactly. Contractor/ContractorCreate/ContractorUpdate removed; contractors are Users.
│   └── enums.ts            # CheckStatus, Severity, SnagFixStatus, InspectionStatus, UserRole (MANAGER/INSPECTOR/CONTRACTOR), Trade (8-value taxonomy), SnagImageKind (NC/CLOSURE), etc.
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
/inspections    → All snags (filterable, incl. contractor_id filter)
/inspections/:entryId → Inspection entry detail (update status/severity/notes, assign Business Associate, split NC/CLOSURE galleries, fix timeline, inline verify/reject when FIXED)
/verification-queue → FIXED snags awaiting manager verification (verify/reject with remark)
/floor-plans    → Floor plan templates (1BHK/2BHK/3BHK previews)
/checklists     → Template management (flat-type tabs, with trade selector per item)
/checklists/room-definitions → Room definitions per flat type
/users          → User (MANAGER/INSPECTOR) management + access control; CONTRACTOR users are hidden here
/contractors    → Business Associates management (trades, company, deactivation with open-assignment guard)
/orphaned-assignments → Assignments on deactivated / role-changed Business Associates; triage + reassign
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
