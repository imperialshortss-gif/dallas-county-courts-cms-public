# Dallas County Statutory Probate Courts CMS

A full-stack case management system for Statutory Probate Courts – Dallas County, Texas. Court staff can search, view, track, create, and update probate cases, with role-based access control separating public read-only access from staff write access.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — express-session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: express-session + bcryptjs (session-based, no JWT)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Wouter + shadcn/ui + Tailwind

## Where things live

- `artifacts/probate-cms/` — React+Vite frontend (served at `/`)
- `artifacts/api-server/` — Express 5 API server (served at `/api`, port 8080)
- `lib/db/` — Drizzle ORM schema + migrations
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Orval-generated React Query hooks
- `lib/api-zod/` — Orval-generated Zod schemas
- `artifacts/api-server/src/routes/auth.ts` — login / logout / me / user management
- `artifacts/api-server/src/middleware/auth.ts` — requireAuth / requireRole middleware
- `artifacts/probate-cms/src/contexts/auth-context.tsx` — AuthProvider, useAuth hook

## DB Tables

- `cases` — main case records
- `parties` — petitioners, respondents, attorneys per case
- `hearings` — hearing dates/outcomes per case
- `fees` — fee assessments and payments per case
- `notices` — court notices/orders per case
- `documents` — document metadata per case
- `activity` — auto-logged timeline of all case changes
- `cms_users` — staff login accounts (username, bcrypt hash, role: admin|clerk)

## Default login credentials

- **Admin**: `admin` / `Admin@2024`
- **Clerk**: `clerk` / `Clerk@2024`

Default users are seeded automatically at server startup if the `cms_users` table is empty.

## Access Control

| Role | Capabilities |
|------|-------------|
| Public (no login) | Search cases, view case detail, view hearings/fees/notices/documents/parties |
| Clerk | Everything above + create new cases, update/add hearings/fees/notices/documents/parties |
| Admin | Everything above + Users, Settings, Audit Logs pages |

All POST and PATCH endpoints require `requireAuth` middleware. GET endpoints are public.

## Architecture decisions

- Session-based auth (not JWT) — simpler for a court staff app; sessions stored in-memory (MemoryStore)
- All write mutations auto-log to the `activity` table — preserves full chronological audit trail
- Case creation auto-seeds default users on startup — no separate seed script needed
- Tabs-based update module pattern: separate tabs for hearings, fees, notices, docs, status — each appends to DB, never overwrites
- OpenAPI-first: all API contracts defined in `lib/api-spec/openapi.yaml`; hooks generated via Orval

## Product

- **Case Search & Browse**: search by case number, file number, or party name; filter by status
- **Case Detail**: full view with parties, hearings, fees, notices, documents, activity timeline
- **New Case Entry**: Create a new case record with all empty fields; then add hearings, fees, notices, documents, parties, and status entries via tabs — all historical data entry in one place
- **Update Existing Case**: Find and update any existing case — record hearings, payments, notices, status changes
- **Dashboard**: key stats, upcoming hearings, pending fees
- **Reports, Calendar, Parties, Hearings, Fees, Notices, Documents**: cross-case list views

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- MemoryStore for sessions: sessions reset on server restart. For production use connect-pg-simple.
- All POST routes require auth — the frontend must send `credentials: 'include'` with every fetch/mutation.
- Do not add leaf workspace packages to the root `tsconfig.json` references.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
