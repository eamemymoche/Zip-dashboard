# Current Code Structure Map

Status: Active  
Last updated: 2026-05-19  
Scope: practical architecture map for future AI agents

## Why this note exists

This project has moved beyond the original prototype phase. Several agents changed different slices of the app across auth, personnel, user access, transport, staffing, and backup. This note is the shortest path for a new agent to understand the current code shape without guessing from old task history.

## Repo map

- `apps/web`
  - live Next.js application
  - almost all active UI and API work happens here
- `packages/db`
  - Prisma schema, migrations, seed script
- `Zip/`
  - Obsidian vault
  - active project memory and operating docs

## Main dashboard surfaces

The main shell still lives in:

- `apps/web/app/operations-dashboard.tsx`

This file still owns most cross-board state and orchestration. Extracted surfaces already exist, but they are still parent-driven:

- `apps/web/app/transport-assign-table.tsx`
- `apps/web/app/transport-recheck-table.tsx`
- `apps/web/app/transport-sheet-view.tsx`
- `apps/web/app/staffing-setup-table.tsx`
- `apps/web/app/staffing-board-view.tsx`
- `apps/web/app/personnel-view.tsx`
- `apps/web/app/master-view.tsx`
- `apps/web/app/accounting-view.tsx`
- `apps/web/app/backup-view.tsx`
- `apps/web/app/user-access-view.tsx`
- `apps/web/app/change-log-view.tsx`
- `apps/web/app/order-detail-row.tsx`

Pure derived selectors/helpers are already split into:

- `apps/web/app/dashboard-selectors.ts`

## Current domain model

### Orders / operations

- Bookings are the operational center.
- Transport assignment, pickup status history, and staffing assignment all hang off bookings.
- `Booking.updatedAt` is the optimistic concurrency token for the main write APIs.

### Personnel

- `Employee` is now more than a staffing record.
- The schema carries:
  - `code`
  - Thai display name
  - `englishFirstName`
  - `englishLastName`
  - `englishNickname`
  - `defaultUsername`
  - phone/start-date/photo fields

### Users / access

- `User` is login + authorization state.
- Current auth fields that matter:
  - `username`
  - `email`
  - `passwordHash`
  - `role`
  - `active`
  - `moduleAccessJson`

### Vehicles

- `Vehicle` now carries:
  - `code`
  - `licensePlate`
  - `type`
  - `adminNote`
  - `capacity`
  - `active`
  - `notes`

## Auth and access model

Primary auth files:

- `apps/web/app/api/auth/login/route.ts`
- `apps/web/lib/auth/server-session.ts`
- `apps/web/lib/auth/role-guards.ts`
- `apps/web/lib/auth/auth-context.tsx`
- `apps/web/proxy.ts`

Current truths:

- login is username-first
- signed `zcc_session` is the only authority source
- `moduleAccessJson` controls board-level access in the app
- dev/demo users still exist for local work
- new password writes must use `hashPassword()`

## Employee <-> User sync model

This is the most important architecture update that older notes do not fully explain.

### Current intent

- `Employee` is the identity source for staff/driver account generation
- `User` is the login/access record
- the system should sync them, but one side should not hard-crash the other

### Current implementation

Shared sync logic now lives in:

- `apps/web/lib/auth/employee-account-sync.ts`

This helper owns:

- employee-role -> user-role mapping
- username derivation
- best-effort user upsert
- optional employee backfill of missing username/English fields

### Behavior rules

- `POST/PUT /api/employee` saves the employee first
- after employee save, it runs account sync as best-effort
- if account sync fails, the employee save still succeeds
- the response includes warning/sync status so UI can surface it

Route:

- `apps/web/app/api/employee/route.ts`

- `POST /api/users/sync-from-employees` is the explicit reconciliation path
- it reuses the same shared helper instead of custom copy-pasted logic
- it returns `syncedCount`, `skippedCount`, and `errorCount`

Route:

- `apps/web/app/api/users/sync-from-employees/route.ts`

UI surface:

- `apps/web/app/user-access-view.tsx`

### Practical consequence for future agents

- do not duplicate employee->user sync rules in more routes
- change sync behavior in `employee-account-sync.ts` first
- do not make Personnel save depend transactionally on User save unless the product direction changes on purpose
- verification scripts now assume the username-first auth contract; if auth changes again, update `scripts/task24-smoke.ps1`, `scripts/task26-guardrails.ps1`, `scripts/task27-ui-verify.mjs`, `scripts/verify-frontend-access-guardrails.mjs`, and `scripts/verify-milestone-c-e2e.mjs` in the same pass

## Persistence map

### DB-backed write paths

- order create/edit/delete
- transport assignment write/unassign
- pickup status event append
- staffing assignment replace-sync
- employee create/edit
- product package create/edit/activate/deactivate
- user create/update/delete
- user sync from employees

### DB-backed read paths

- dashboard load attempts DB first through `apps/web/lib/load-dashboard-data.ts`
- auth/profile/user access/change log/backup status APIs read from DB when available

### Fallback / hybrid behavior still present

- dashboard can still fall back to seed-like data when DB read path is unavailable
- demo auth users still exist
- some UI orchestration is still local-state-first even when writes are persisted
- backup board is still a read/status/control surface, not execution
- seed/demo data includes multilingual Thai content, so bulk text repair should use UTF-8 project sources instead of terminal-inlined literals

## Staffing and transport changes that matter

### Staffing setup

- `apps/web/app/staffing-setup-table.tsx`
- no longer checkbox-wall only
- guide slots are row-based
- minimum two slots
- add/remove guide rows supported

### Transport assign

- `apps/web/app/transport-assign-table.tsx`
- rows sort by time
- vehicle dropdown shows code + plate + type
- admin note is part of active dispatch editing

### Transport sheet

- `apps/web/app/transport-sheet-view.tsx`
- export now includes `Time Slot`
- printed/job-sheet behavior is still an operational fallback path, not a cosmetic extra

## Data/seed/schema alignment

Primary files:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/seed.mjs`
- `apps/web/lib/ops-data.ts`
- `apps/web/lib/load-dashboard-data.ts`

Important recent migration:

- `packages/db/prisma/migrations/20260519000000_add_employee_identity_and_vehicle_details/migration.sql`

This migration adds:

- employee English identity fields + `defaultUsername`
- vehicle `licensePlate`
- vehicle `adminNote`

## Safe edit boundaries

Prefer small, local changes in these files when possible:

- auth/session logic -> `server-session.ts`, `role-guards.ts`
- employee/user sync logic -> `employee-account-sync.ts`
- explicit reconciliation behavior -> `api/users/sync-from-employees/route.ts`
- personnel persistence -> `api/employee/route.ts`
- transport/staffing subview rendering -> extracted component files

Use extra care when touching:

- `apps/web/app/operations-dashboard.tsx`

It still coordinates a large amount of state. Edit it surgically.

## Known quirks

- role labels are not perfectly intuitive: current UI labels map `ADMIN` to `Officer` while `MANAGER` still exists as a separate role
- demo/dev accounts can confuse runtime understanding if an agent assumes all visible users are DB-backed business users
- `apps/web/lib/prisma.ts` still triggers the known Turbopack/NFT warning because of env file lookup and dynamic filesystem access
- Personnel cards depend on CSS grid `align-items: start` to avoid same-row stretch artifacts when one card expands

## Minimum reading set for a future agent

1. `[[AI Agent Operating Manual]]`
2. this note
3. `[[Project Status Snapshot]]`
4. `[[Security and Multi-User Guardrails]]`
5. inspect the exact code path before editing
