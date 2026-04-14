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

- **Backend URL is runtime-configured via `localStorage`**, NOT env vars. `ServerConfigPage` lets user paste URL and test connection. All API calls go through `src/api/client.ts` which reads base URL from `localStorage`.
- **Auth:** JWT token in `localStorage`. Axios interceptor attaches it to every request.
- **Enums:** Use `const` object pattern (not TypeScript `enum` keyword) — required by TypeScript `erasableSyntaxOnly` mode.
- **Default creds:** `admin` / `admin123`.

## Project Structure

```
src/
├── api/
│   ├── client.ts           # Axios instance, dynamic base URL from localStorage, auth interceptor
│   └── *.ts                # API modules (auth, projects, buildings, etc.)
├── hooks/                  # React Query hooks
├── contexts/AuthContext.tsx
├── components/
│   ├── layout/             # Sidebar, TopBar, MainLayout
│   ├── common/             # DataTable, StatusBadge, ConfirmDialog
│   └── charts/             # Dashboard chart components
├── pages/
│   ├── ServerConfigPage    # First screen — paste RunPod URL, test connection
│   ├── LoginPage, DashboardPage
│   ├── projects/, hierarchy/, inspections/
│   ├── checklists/, users/, contractors/, reports/
└── types/                  # API types, enums
```

## Key Routes

```
/setup          → ServerConfigPage (if no backend URL configured)
/login          → LoginPage (redirects to /setup if no URL)
/               → Dashboard
/projects       → Project list → /projects/:id → detail
/inspections    → All snags (filterable) → /inspections/:id → detail
/checklists     → Template management
/users          → User management
/contractors    → Contractor management
/reports        → Reports
```

## Deployment

- **Vercel** — auto-deploys from `main` branch. Output: `dist/`.
- No build-time env vars needed for backend URL (it's runtime).

## Commands

```bash
npm install
npm run dev      # Vite dev server on :5173
npm run build    # Production build → dist/
```
