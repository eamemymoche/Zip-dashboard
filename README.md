# Zipline Command Center

Internal operations dashboard for booking intake, transport assignment, staffing, personnel, user access, accounting, and backup/status workflows.

## Status

- Current phase: internal alpha with active local PostgreSQL support and fallback/demo paths for local development
- Deployment target: Vercel for the `apps/web` Next.js app
- Verified on `2026-05-19`:
  - `npm run build`
  - `npm run verify:task24`
  - `npm run verify:task26`
  - `npm run verify:task27`
  - `npm run verify:frontend:access`
  - `npm run verify:milestoneC`

## Demo

- [Vercel Demo](https://zip-dashboard-web-eight.vercel.app/)

## Tech Stack

- Next.js 16
- React
- Prisma
- PostgreSQL
- Playwright
- Obsidian vault in `Zip/` for project memory and agent handoff

## Project Layout

- `apps/web` - main app, UI, API routes, auth, and dashboard modules
- `packages/db` - Prisma schema, migrations, and seed script
- `scripts` - smoke checks and verification helpers
- `Zip` - Obsidian notes, status tracking, and agent operating docs

## Quick Start

```powershell
npm install
npm run dev
```

Local app:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

Demo login:

- `superadmin / super123`
- `officer / zipline123`
- `account / accounting123`
- `staff / staff123`
- `driver / driver123`

## Database

Required for DB-backed flows:

- `DATABASE_URL`
- `SESSION_SECRET`

Useful commands:

```powershell
npm run db:generate
npm run db:seed
```

If `DATABASE_URL` is unavailable, the dashboard can still run in fallback/demo mode for local work.

## Verification

```powershell
npm run build
npm run verify:task24
npm run verify:task26
npm run verify:task27
npm run verify:frontend:access
npm run verify:milestoneC
```

## Notes

- Auth is username-first and uses signed `zcc_session`.
- Personnel and User Access are connected through shared employee-to-user sync logic.
- Backup is currently a status/control surface, not full restore execution.
