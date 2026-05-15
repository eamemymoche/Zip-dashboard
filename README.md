# Zipline Command Center

Internal operations dashboard for Zipline booking intake, transport assignment, staffing, driver sheets, and master-data workflows.

## Live demo

- [Vercel demo](https://zip-dashboard-web-eight.vercel.app/)

## Current phase

This repo is in a solid internal-alpha phase.

What is already in place:

- Next.js dashboard under `apps/web`
- Prisma/PostgreSQL schema under `packages/db/prisma`
- fallback dashboard seed mode when `DATABASE_URL` is unavailable
- session login with local dev fallback accounts
- server-side write guards for Order CRUD, transport assignment, pickup status, and staffing assignment
- optimistic concurrency guards on key write paths
- Obsidian project vault under `Zip/` for workflow, decisions, and agent guidance

What is not yet fully complete:

- Prisma migrations have been created but not yet applied to a real PostgreSQL database in this workspace
- end-to-end live DB verification has not yet been completed
- route/module permissions are intentionally lightweight and may be refined later if the business needs them

## Project structure

- `apps/web` - Next.js application
- `packages/db` - Prisma schema, migrations, and seed script
- `Zip` - Obsidian vault for planning, workflow notes, task tracking, and AI-agent operating docs

## Local development

```powershell
npm install
npm run dev
```

Default local URL:

- `http://127.0.0.1:3000/`

## Local login fallback

When no working PostgreSQL-backed auth is available, these local dev accounts can be used:

- `officer@zipline.com` / `zipline123`
- `owner@zipline.com` / `owner123`
- `accounting@zipline.com` / `accounting123`

This fallback is for local development only. It is not production auth.

## Database commands

```powershell
npm run db:generate
npm run db:seed
```

If you are using a real database, set `DATABASE_URL` first.

## PostgreSQL rollout status

Verified in code/build:

- schema validates
- Prisma client generates
- migration files exist
- app builds successfully

Not yet verified in this workspace:

- migrations applied to a live PostgreSQL instance
- smoke-tested end-to-end persistence against a real DB

The rollout checklist and rollback notes live in:

- `Zip/03_Build/Backup Recovery and Versioning.md`

## GitHub / deploy notes

Before pushing:

- make sure no `.env`, `.env.local`, API keys, or production secrets are included
- review changed Obsidian notes so project status is truthful
- keep `*.tsbuildinfo` and other local build artifacts out of commits

For Vercel:

- connect the GitHub repo
- add required environment variables
- if using Prisma in deploy, ensure the build step runs `prisma generate`
