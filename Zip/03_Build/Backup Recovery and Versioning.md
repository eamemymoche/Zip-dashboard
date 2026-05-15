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
| Applied to live DB | ✗ Not yet verified | No PostgreSQL instance available in this environment |
| End-to-end write path | ✗ Not yet verified | API routes code-reviewed; no live DB smoke test performed |
| Role enforcement against live DB | ✗ Not yet verified | Server-side guards verified in code; no live DB test |

---

### Pre-flight checklist

1. Confirm `DATABASE_URL` environment variable points at the target PostgreSQL instance
2. Confirm target DB is PostgreSQL (not SQLite) — `schema.prisma` uses `provider = "postgresql"`
3. Confirm role has permission to run `CREATE TYPE`, `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`
4. Confirm backup has been taken and validated (see Layer 2: Data and Operational Recovery)
5. Notify relevant users that the app will be unavailable during migration window

---

### Step 1 — Backup

```bash
# Replace with your actual PostgreSQL connection string
pg_dump -h <host> -U <user> -d <database> -F c -b -v -f "pre_migration_backup_$(date +%Y%m%d_%H%M%S).dump"
```

Verify the backup file exists and is non-zero size before proceeding.

Alternative (if pg_dump is not available):

```bash
psql -h <host> -U <user> -d <database> -c "SELECT pg_start_backup('pre_migration');"
# Copy PostgreSQL data directory using OS-level file copy
psql -h <host> -U <user> -d <database> -c "SELECT pg_stop_backup();"
```

---

### Step 2 — Dry-run (optional but strongly recommended)

```bash
cd packages/db
npx prisma migrate resolve --applied 20260514000000_init_vehicle_transport --skip-seed
```

This marks the first migration as applied without running it — useful to test the Prisma migrate engine connection. If this fails, abort.

---

### Step 3 — Apply migrations

```bash
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

```bash
cd packages/db
npx prisma generate
```

This must complete without error. If it fails, do not proceed to seed — investigate.

---

### Step 5 — Seed (if environment supports it)

```bash
cd packages/db
npx prisma db seed
```

The seed script (`seed.mjs`) is idempotent — it clears and recreates seed data on every run. Only run against the target environment if a fresh seed is desired. Typically skip in production.

---

### Step 6 — Smoke test

```bash
# Verify DB connection and schema presence
cd packages/db
npx prisma db execute --stdin <<< "SELECT 1;"

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

```bash
pg_restore -h <host> -U <user> -d <database> -c "pre_migration_backup_YYYYMMDD_HHMMSS.dump"
```

After restoring, mark migrations as not applied so they can be re-run cleanly:

```bash
cd packages/db
npx prisma migrate resolve --rolled-back 20260514000002_add_auth_and_concurrency
npx prisma migrate resolve --rolled-back 20260514000001_add_employee_fields
npx prisma migrate resolve --rolled-back 20260514000000_init_vehicle_transport
```

Then re-apply when the issue is fixed.

---

### Known residual risks (not yet verified against live PostgreSQL)

1. **Optimistic concurrency timing:** The `updatedAt` force-refresh pattern in API routes was reviewed in code; it has not been load-tested against a real PostgreSQL connection under concurrent writes.

2. **Role guard end-to-end:** The `x-user-role` header injection chain (proxy → API route) was traced in code; the full chain has not been smoke-tested with a real browser session against a live DB.

3. **Seed data staleness:** The seed script may contain booking numbers or IDs that overlap with existing production data if the seed was generated before production bookings existed. Review `seed.mjs` before running in a non-dev environment.

4. **No transaction wrapping on multi-write operations:** Some API routes perform multiple Prisma writes in sequence (e.g., audit log + order update). If a write fails mid-sequence, partial state may persist. This has not been tested.

5. **No DB connection pooling config:** `schema.prisma` does not set `relationMode = "prisma"` or connection pool parameters. Under high concurrency, connection exhaustion may occur. Not tested.

---

### When to re-run this runbook

After any schema change (new migration file added to `migrations/`), repeat Steps 3–6. Steps 1–2 only need to be repeated if the target DB was restored from backup.
