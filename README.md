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

Smoke verification (Task 24 flow, reusable):

```powershell
npm run verify:task24
```

Guardrail verification (Task 26 - 403/409 checks):

```powershell
npm run verify:task26
```

UI verification (Task 27 - Personnel + Master click flow):

```powershell
npm run verify:task27
```

Audit helper verification (Task 29):

```powershell
npm run verify:task29
```

Audit trace by booking number:

```powershell
npm run audit:booking -- BK12345
```

Milestone A product lifecycle verification:

```powershell
npm run verify:milestoneA
```

Milestone B fallback policy verification:

```powershell
npm run verify:milestoneB
```

Milestone C integrated end-to-end verification:

```powershell
npm run verify:milestoneC
```

Optional base URL override:

```powershell
$env:ZIPLINE_BASE_URL = "http://127.0.0.1:3000"
npm run verify:task24
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
# Generate Prisma client from schema (run after any schema change)
npm run db:generate

# Seed the database with initial data (requires live PostgreSQL and DATABASE_URL set)
npm run db:seed
```

**Prerequisites for all DB commands:**
- `DATABASE_URL` must be set — commands fail fast without it (no silent localhost fallback)
- `SESSION_SECRET` must match the value used by the auth API (defaults to `dev-secret-change-in-production`)
- Copy `.env.example` → `.env.local` and fill in your values before running DB commands

**Fail-fast behavior:**
- `prisma.config.ts` now throws a clear error if `DATABASE_URL` is missing
- The app itself still runs in fallback mode without PostgreSQL (dashboard loads from seed data)

## PostgreSQL rollout — what you need first

The migration runbook (`Zip/03_Build/Backup Recovery and Versioning.md`) requires a **real PostgreSQL instance** before it can be executed.

**What you need to prepare before Task 15:**

1. **Install PostgreSQL** (or use an existing hosted instance)
   - Minimum version: PostgreSQL 13+
   - Windows: download from https://www.postgresql.org/download/windows/ or use winget/chocolatey
   - Confirm `psql` and `pg_dump` are in your `PATH`

2. **Create a database**
   ```powershell
   psql -h <host> -U <postgres> -c "CREATE DATABASE zipline;"
   ```
   (Replace `<host>` and `<postgres>` with your instance values)

3. **Set `DATABASE_URL`**
   Copy `.env.example` → `.env.local` and set your connection string:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/zipline"
   ```

4. **Set `SESSION_SECRET`** (used for session token signing)
   ```
   SESSION_SECRET="any-long-random-string"
   ```

5. **Run the migration runbook** — see `Zip/03_Build/Backup Recovery and Versioning.md` Step 1–6

**If you skip the migration runbook**, the app still runs in fallback mode using seed data (no PostgreSQL needed). All dev login accounts remain available.

## PostgreSQL rollout status

**Verified in code/build (no live DB required):**

| Check | Status |
|---|---|
| schema validates | ✓ |
| Prisma client generates | ✓ |
| migration files exist (3 files, idempotent) | ✓ |
| app builds successfully | ✓ |
| runbook is Windows/PowerShell-ready | ✓ |
| seed credentials match dev fallback | ✓ |

**Requires a live PostgreSQL instance (not yet available in this workspace):**

| Check | Status |
|---|---|
| migrations applied to live DB | ✗ Pending |
| end-to-end write path smoke-tested | ✗ Pending |
| role enforcement against live DB | ✗ Pending |

The full runbook, pre-flight checklist, and rollback procedure are in `Zip/03_Build/Backup Recovery and Versioning.md`.

## GitHub / deploy notes

Before pushing:

- make sure no `.env`, `.env.local`, API keys, or production secrets are included
- review changed Obsidian notes so project status is truthful
- keep `*.tsbuildinfo` and other local build artifacts out of commits

For Vercel:

- connect the GitHub repo
- add required environment variables
- if using Prisma in deploy, ensure the build step runs `prisma generate`
