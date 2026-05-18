# Backup Recovery and Versioning

Status: Active
Last updated: 2026-05-16

## Intent

This note defines how Zipline should recover from two different failure types:

1. code or schema damage caused by development mistakes, including AI-agent mistakes
2. operational data damage or production incidents

This is intentionally practical for a small business. The goal is reliable recovery, not enterprise ceremony.

## Layer 1: Code and Version Recovery

### Working Rule

All important implementation work should be checkpointed in small, recoverable steps.

### Required Practices

- commit important changes in small batches
- create a recoverable checkpoint before large refactors
- create a recoverable checkpoint before schema changes
- prefer branches for risky or broad AI-agent changes
- keep Obsidian updated after meaningful milestones

### AI-Agent Safety Policy

Before an AI agent performs large structural work, create a version point:

- Git commit if the repo state is valid
- branch if the work is exploratory or risky
- documented note in Obsidian if the repo is mid-transition

### Agent Broke The App Procedure

If an AI agent breaks the app:

1. stop additional edits
2. identify the last known-good commit or branch
3. compare broken files against that checkpoint
4. restore only the affected code path if possible
5. if necessary, roll back to the last known-good checkpoint
6. document the incident briefly in Obsidian

Do not continue stacking edits on top of a broken state unless the root cause is clearly understood.

## Layer 2: Data and Operational Recovery

### Database Backup Policy

Recommended minimum policy:

- daily database backup
- additional backup before any schema migration in production
- dated retention history

### Restore Validation

Backups are not enough by themselves. Restores must be tested.

Recommended small-business cadence:

- periodic restore drill on non-production DB
- verify that booking, transport, staffing, and reconciliation data can be read correctly after restore

### Operational Fallback Artifacts

The business should also be able to continue daily work if the app is temporarily unavailable.

Critical export/fallback artifacts:

- dispatch / round board export
- driver job sheet export
- key daily booking list export

These are contingency tools and should be treated as part of resilience planning.

## Practical Retention Model

Suggested starting policy:

- short-term recent backups for fast recovery
- medium-term dated backups for incident lookback
- longer-term milestone backups around important releases or migrations

The exact retention period can evolve, but dated backup discipline should start early.

## Recovery For Corrupted Operational Data

If booking or assignment data is corrupted:

1. identify the time window of damage
2. inspect audit/event history if available
3. isolate whether corruption came from code path, manual edit, or import
4. restore from backup only when targeted repair is unsafe
5. re-export round boards or job sheets if operations are in progress

## Documentation Requirement

Every significant recovery-related change should be reflected in:

- Git history
- Obsidian notes
- migration notes if schema was involved

## Success Test

This note is working if a future agent can answer:

- how to create a safe checkpoint before risky work
- how to recover from a broken AI-agent change
- how to recover from DB corruption or failed migration
- how operations continue while the app is unavailable

---

## PostgreSQL Migration Runbook

**Scope:** Applying `packages/db/prisma/migrations/*` to a live PostgreSQL target environment.

**Verification status (as of 2026-05-16):**

| Check | Status | Evidence |
|---|---|---|
| Build passes | ✓ Verified | `npm run build` succeeds — TypeScript, no errors |
| Prisma schema valid | ✓ Verified | `npx prisma validate` passes |
| Prisma client generates | ✓ Verified | `npx prisma generate` completes without error |
| Migration SQL idempotent | ✓ Verified | All three migrations use `IF NOT EXISTS` guards |
| Migration apply order documented | ✓ Verified | Migration lock confirms postgresql; step numbers in runbook are correct |
| Rollback mark-rolled-back names match migration IDs | ✓ Verified | Lock file: `20260514000000`, `20260514000001`, `20260514000002` |
| Prisma 7 config datasource path | ✓ Verified | `prisma.config.ts` exists at repo root with `datasource.url`; `schema.prisma` has no `url` field (Prisma 7 requirement) |
| Runbook Windows/PowerShell friendly | ✓ Verified | All `bash` blocks replaced with `powershell` equivalents; heredoc syntax removed |
| DB commands fail fast when DATABASE_URL missing | ✓ Verified | `prisma.config.ts` throws a clear error if `DATABASE_URL` is absent — no silent localhost fallback |
| Live DB schema populated | ✓ Verified | All tables present; 3 users, 6 employees, 3 vehicles, 6 packages, 5 bookings seeded |
| Applied to live local DB | ✓ Verified | Local `zipline` DB at `localhost:5432` confirmed with 3 migrations applied |
| API persistence contracts — code review | ✓ Verified | All five APIs (login, order CRUD, transport, pickup, staff) structurally correct; audit logs present; concurrency guards in place |
| Loader DB-to-dashboard mapping — code review | ✓ Verified | `load-dashboard-data.ts` correctly includes TransportAssignment.driver/vehicle and StaffAssignment.employee; uses stable `driverCode`/`vehicleCode` identifiers |
| End-to-end smoke via running app + browser | ✗ Not yet verified | Requires live app server; API contracts verified via code review + direct Prisma query only |
| Role enforcement via live app | ✗ Not yet verified | Server-side guards verified in code review; not yet exercised against live app |

---

### Pre-flight checklist

1. Confirm `prisma.config.ts` exists at the repo root with a valid `datasource.url` — Prisma 7 reads the connection URL from `prisma.config.ts`, not from `schema.prisma`
2. Confirm `DATABASE_URL` environment variable is set — `prisma.config.ts` fails fast with a clear error if it is absent (no silent localhost fallback)
3. Confirm target DB is PostgreSQL (not SQLite) — `schema.prisma` uses `provider = "postgresql"`
4. Confirm role has permission to run `CREATE TYPE`, `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`
5. Confirm backup has been taken and validated (see Layer 2: Data and Operational Recovery)
6. Notify relevant users that the app will be unavailable during migration window

---

### Step 1 — Backup

```powershell
# Replace with your actual PostgreSQL connection string
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "pre_migration_backup_$Timestamp.dump"
pg_dump -h <host> -U <user> -d <database> -F c -b -v -f $BackupFile
```

> **Note:** `pg_dump` and `psql` must be in your `PATH`. On Windows, ensure the PostgreSQL `bin` directory (e.g., `C:\Program Files\PostgreSQL\<version>\bin`) is added to `PATH`, or use the full path to the executables.

Verify the backup file exists and is non-zero size before proceeding.

Alternative (if pg_dump is not available):

```powershell
psql -h <host> -U <user> -d <database> -c "SELECT pg_start_backup('pre_migration');"
# Copy PostgreSQL data directory using OS-level file copy
psql -h <host> -U <user> -d <database> -c "SELECT pg_stop_backup();"
```

---

### Step 2 — Verify connectivity (optional but strongly recommended)

Before running `migrate deploy`, confirm the Prisma migrate engine can reach the target database:

```powershell
# Run from the repo root
cd packages/db
npx prisma migrate deploy --dry-run
```

> On Windows: if `npx` is slow, run directly via `node .\node_modules\prisma\build\index.js migrate deploy --dry-run` from the `packages/db` directory.

If this fails, abort — the database is unreachable or credentials are wrong. Do not proceed to Step 3.

---

### Step 3 — Apply migrations

```powershell
cd packages/db
npx prisma migrate deploy
```

Expected output: `migration XXX applied successfully` for each of the three migrations.

If a migration fails:
- Check the error message (usually a duplicate object or permission issue)
- All migrations are idempotent (`IF NOT EXISTS` guards) so re-running is safe
- If schema is in a bad state, restore from backup and re-run

---

### Step 4 — Generate Prisma Client

```powershell
cd packages/db
npx prisma generate
```

This must complete without error. If it fails, do not proceed to seed — investigate.

---

### Step 5 — Seed (if environment supports it)

```powershell
cd packages/db
npx prisma db seed
```

The seed script (`seed.mjs`) is idempotent — it clears and recreates seed data on every run. Only run against the target environment if a fresh seed is desired. Typically skip in production.

---

### Step 6 — Smoke test

```powershell
# Verify DB connection and schema presence using psql
# DATABASE_URL must be set in your environment or .env file
psql $env:DATABASE_URL -c "SELECT 1 AS result;"

# Verify Prisma client can reach the DB (run from apps/web)
cd apps/web
npx prisma --version  # confirm generate is reflected
```

Then start the app and verify:

1. Login with any seed user → sidebar loads → no crash
2. Open Order List (as ADMIN/ACCOUNTING/MANAGER) → orders render or empty state shows
3. Create a new order via UI → `POST /api/order` succeeds → 201 returned
4. Delete that order → `DELETE /api/order` succeeds → 200 returned
5. As STAFF or DRIVER, attempt `POST /api/order` → 403 returned

If any of these fail, treat as migration failure and restore from backup.

---

### Rollback procedure

There is no automated Prisma migrate rollback. Use the backup:

```powershell
pg_restore -h <host> -U <user> -d <database> -c "$BackupFile"
```

After restoring, mark migrations as not applied so they can be re-run cleanly:

```powershell
cd packages/db
npx prisma migrate resolve --rolled-back 20260514000002_add_auth_and_concurrency
npx prisma migrate resolve --rolled-back 20260514000001_add_employee_fields
npx prisma migrate resolve --rolled-back 20260514000000_init_vehicle_transport
npx prisma migrate resolve --rolled-back 20260513000000_baseline_initial_schema
```

Then re-apply when the issue is fixed.

---

### Known residual risks (not yet verified against live PostgreSQL)

1. **Optimistic concurrency timing:** The `updatedAt` force-refresh pattern in API routes was reviewed in code; it has not been load-tested against a real PostgreSQL connection under concurrent writes.

2. **Role guard end-to-end:** The `x-user-role` header injection chain (proxy → API route) was traced in code; the full chain has not been smoke-tested with a real browser session against a live DB.

3. **Seed data staleness:** The seed script may contain booking numbers or IDs that overlap with existing production data if the seed was generated before production bookings existed. Review `seed.mjs` before running in a non-dev environment.

4. **No transaction wrapping on multi-write operations:** Some API routes perform multiple Prisma writes in sequence (e.g., audit log + order update). If a write fails mid-sequence, partial state may persist. This has not been tested.

5. **Seed user password hashes verified:** Seed creates users with password hashes computed using `SESSION_SECRET` (falls back to `dev-secret-change-in-production`). Seed credentials match dev fallback credentials: `officer@zipline.com/zipline123`, `owner@zipline.com/owner123`, `accounting@zipline.com/accounting123`.

6. **No DB connection pooling config:** `schema.prisma` does not set `relationMode = "prisma"` or connection pool parameters. Under high concurrency, connection exhaustion may occur. Not tested.

---

### When to re-run this runbook

After any schema change (new migration file added to `migrations/`), repeat Steps 3–6. Steps 1–2 only need to be repeated if the target DB was restored from backup.
