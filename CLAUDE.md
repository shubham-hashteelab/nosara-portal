# CLAUDE.md — nosara-portal

## System Context

Nosara is a 3-repo snagging inspection system for real estate handover workflows:

| Repo | Stack | GitHub |
|---|---|---|
| **nosara** (Android app) | Kotlin, Jetpack Compose, Room | `hashtee-engineering/nosara` |
| **nosara-backend** (FastAPI backend) | FastAPI, SQLAlchemy, PostgreSQL | `shubham-hashteelab/nosara-backend` |
| **nosara-portal** (this repo) | React, Vite, TypeScript | `shubham-hashteelab/nosara-portal` |

Architecture plan: `/Users/hashteelab/Desktop/Work/Nosara/architecture-plan.md`

This is the manager web portal. It talks to the FastAPI backend, which also serves the Android app.

## Tech Stack

- **Build:** Vite + React 19 + TypeScript
- **Styling:** Tailwind CSS 3
- **Components:** Manually built shadcn-style in `src/components/ui/`
- **Data Fetching:** TanStack Query + Axios
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts

## Important Conventions

- **Backend URL is dynamic (RunPod)** — configured at runtime via `localStorage`, NOT environment variables. `ServerConfigPage` lets the user paste the URL and test the connection.
- **All API calls** go through `src/api/client.ts`, which reads the base URL from `localStorage`.
- **Auth:** JWT token stored in `localStorage`. An Axios interceptor attaches it to every request.
- **Enums:** Uses `const` object pattern (not TypeScript `enum` keyword) due to TypeScript 6 `erasableSyntaxOnly` mode.

## Key Pages

- `ServerConfigPage` — paste RunPod backend URL, test connection
- `LoginPage` — JWT login
- `DashboardPage` — overview stats and charts
- Projects CRUD
- Buildings / Floors / Flats hierarchy
- Inspections viewer
- Checklist template management
- Users management
- Contractors management
- Reports

## Default Credentials

`admin` / `admin123`

## Deployment

Vercel — auto-deploys from `main` branch. Output directory: `dist`.

## Local Development

```bash
npm install
npm run dev    # Vite dev server on :5173
```

## Build

```bash
npm install
npm run build
```
