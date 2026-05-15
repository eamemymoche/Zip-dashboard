# Agent Work Queue

Status: Active  
Last updated: 2026-05-16

## Purpose

This note gives the recommended order for future AI-agent implementation work. It is deliberately sequenced to reduce breakage and avoid broad concurrent edits.

## Current Rule

Do not start a broad rewrite.

Do not assign two agents to the same dashboard surface at the same time.

Auth hydration, Order CRUD persistence, Staffing Setup split, and role-enforced write APIs are already in place.

The next priority is not more auth polish. The next priority is to prepare a safe real PostgreSQL rollout and then verify the current persisted paths against a real database.

## Recommended Work Order

### Next Execution Order

Continue in this order:

1. Prepare migration runbook and rollout checklist for real PostgreSQL
2. Apply Prisma migrations against the real PostgreSQL target
3. Run live DB smoke tests for login, Order CRUD, transport assignment, pickup status, and staffing assignment
4. Split Staffing Board if the file size pressure is still high
5. Only then decide whether deeper route-level module enforcement is worth doing

### Task 1

**Prisma migration + DB consistency for Vehicle transport path**

Goal:

- create and run the schema migration for `Vehicle` and `TransportAssignment.vehicleId`
- keep seed data aligned
- verify load path and transport assignment API against migrated schema

Scope:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/*`
- `packages/db/prisma/seed.mjs`
- `apps/web/lib/load-dashboard-data.ts`
- `apps/web/app/api/transport-assignment/route.ts`

Do not:

- refactor other dashboards
- redesign auth
- touch staffing persistence yet

### Task 2

**Align Employee DB schema with current UI-required fields**

Goal:

- decide whether `nickname`, `phone`, `phone2`, `startDate`, and `photo` belong in the DB model now
- remove fake assumptions in loader path
- make employee/personnel reads structurally honest

Scope:

- `packages/db/prisma/schema.prisma`
- migration files
- seed file
- personnel-related mapping code

Do not:

- redesign the personnel UI broadly
- merge this with unrelated dashboard cleanup

### Task 3

**Split Transport Recheck into its own component**

Goal:

- reduce pressure inside `operations-dashboard.tsx`
- keep top-level orchestration in place
- preserve current behavior

Scope:

- create extracted component for Recheck view
- keep persistence and state callbacks explicit
- update `Module Ownership and Split Guide.md`

Do not:

- split Transport Sheet in the same task
- introduce new state management architecture

### Task 4

**Split Transport Sheet into its own component**

Goal:

- isolate printable / driver-facing transport view
- prepare cleaner path for job-sheet persistence later

### Task 5

**Persist pickup status event history**

Goal:

- move pickup status changes from local state to DB-backed event history
- preserve live operational filtering behavior

### Task 6

**Persist staffing assignments**

Goal:

- move staff assignment into DB while preserving slot-first staffing model

### Task 7

**Implement small-business login + role gating**

Goal:

- implement Owner / Accounting / Officer / Staff / Driver model
- route and action restrictions only
- no enterprise overbuild

### Task 8

**Introduce conflict-safe multi-user write guards**

Goal:

- optimistic concurrency or record-version protection
- no silent overwrite for key transport / staffing / booking writes

## New Detailed Next Tasks

### Task 9

**Persist Order create/edit/delete to DB**

Goal:

- move Order List create/edit/delete off browser-only state
- keep the current UI and inline edit flow intact
- preserve fallback seed mode when DB is unavailable

Scope:

- `apps/web/app/operations-dashboard.tsx`
- `apps/web/lib/load-dashboard-data.ts`
- new or existing order API route(s)
- `packages/db/prisma/schema.prisma` only if a tiny compatibility addition is required
- `Zip/03_Build/Decision Log.md`
- `Zip/03_Build/Task Board.md`

Do not:

- rewrite the Order List UI
- redesign modal flow
- mix this with staffing split work

Definition of done:

- create/edit/delete order writes succeed against DB path
- fallback mode remains explicit if DB is unavailable
- local UI state stays in sync with persisted response payload
- `npm.cmd run build` passes

### Task 10

**Split Staffing Setup into its own component**

Goal:

- reduce pressure inside `operations-dashboard.tsx`
- isolate the staffing checkbox grid and filter controls
- prepare a cleaner path for DB-backed staffing reads

Scope:

- extract `Staffing Setup` rendering into a dedicated component
- keep orchestration, persistence callbacks, and top-level state explicit
- update `Module Ownership and Split Guide.md`

Do not:

- split `Staffing Board` and `Staffing KPI` in the same task
- redesign staffing UX
- change staffing persistence semantics

Definition of done:

- extracted component renders with no behavior regression
- parent still owns state and callbacks
- `npm.cmd run build` passes

### Task 11

**Read staffing assignments from DB for Setup/Board/KPI**

Goal:

- stop treating staffing DB writes as write-only
- make setup, board, and KPI screens reflect persisted assignment state

Scope:

- loader mapping
- staffing-related derived data
- board/KPI read path only

Do not:

- redesign KPI math unless required by persisted source-of-truth alignment
- combine with auth or order CRUD work

Definition of done:

- staffing UI reflects persisted assignments after reload
- KPI and board use the same assignment source of truth
- residual fallback behavior is documented clearly

### Task 12

**Run migrations against real PostgreSQL and verify seed path**

Goal:

- move from file-created migrations to an actual DB-applied baseline
- verify auth, vehicles, employee fields, staffing, and pickup event tables on real DB

Scope:

- Prisma migrate
- Prisma generate
- seed verification
- loader smoke test

Do not:

- change application behavior in the same task unless required by real DB verification

Definition of done:

- migrations apply successfully to target PostgreSQL
- seed runs successfully
- loader and auth can read real DB state
- backup step is documented and confirmed before migration

### Task 13

**Route-level role enforcement**

Goal:

- add server-side write guards for sensitive APIs
- align proxy-level route guards with the routes that actually exist
- keep SPA module visibility truthful in docs when proxy cannot enforce per-module access under `/`

Status:

- completed as a baseline implementation
- should not be expanded further unless business priority changes

Residual limitations:

- full per-module server-side enforcement for dashboard views inside `/` is not available in the current SPA structure
- client-side nav filtering remains the enforcement layer for most dashboard modules

### Task 14

**Prepare real PostgreSQL rollout package**

Goal:

- make the repo and Obsidian ready for the first real DB application
- verify migration, generate, seed, smoke-test, and rollback instructions are specific and truthful

Scope:

- `Zip/03_Build/Backup Recovery and Versioning.md`
- `Zip/03_Build/Task Board.md`
- `Zip/03_Build/Decision Log.md`
- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/seed.mjs`
- `packages/db/prisma/migrations/*`

Do not:

- change application UI behavior
- redesign auth or permissions
- apply migrations unless the task explicitly includes a live DB target

Definition of done:

- runbook is exact, step-by-step, and current
- migration status in notes is consistent everywhere
- build still passes

### Task 15

**Live PostgreSQL migration execution**

Goal:

- apply existing migrations to the real target PostgreSQL instance
- generate Prisma client
- optionally seed only if the environment is meant to be initialized with seed data

Scope:

- real DB only
- operational backup confirmation
- post-migration smoke verification

Do not:

- combine schema changes with the first live migration run
- improvise SQL outside the documented runbook unless blocked and clearly documented

Definition of done:

- migrations apply successfully
- Prisma client generates successfully
- app can read the live DB
- rollback path is confirmed before and after the run

### Task 16

**Live DB smoke verification**

Goal:

- prove the current persisted slices behave correctly against the live DB

Scope:

- login
- Order CRUD
- transport assignment
- pickup status
- staffing assignment
- reload verification after writes

Do not:

- broaden this into UI redesign or new feature work

Definition of done:

- every persisted workflow is verified at least once against the live DB
- failures are documented precisely
- Obsidian is updated with verified vs unverified status

### Task 17

**Optional next refactor: split Staffing Board**

Goal:

- reduce `operations-dashboard.tsx` pressure further only if still needed after DB rollout

Scope:

- `apps/web/app/operations-dashboard.tsx`
- new `staffing-board-view.tsx`
- `Zip/03_Build/Module Ownership and Split Guide.md`

Do not:

- mix this with DB migration work
- change staffing persistence semantics

## Priority Notes

- Tasks 9-13 are effectively the current baseline, not the next frontier.
- The immediate operational blocker is the lack of a real PostgreSQL migration run.
- Do not spend more time polishing auth/permissions unless a real user-flow bug appears.
- Do not run Task 14 and Task 15 in parallel; Task 14 prepares the ground for Task 15.
- Do not run Task 15 and Task 17 in parallel; one is production-data-sensitive, the other is refactor work.

## Recommended Ownership Splits

Safe pairings:

- one agent on narrow DB/API work
- one agent on a UI extraction task that does not share files
- one reviewer agent verifying Obsidian truthfulness after implementation

Unsafe pairings:

- two agents editing `operations-dashboard.tsx` at once
- one agent changing schema while another rewrites the loader contract blindly
- one agent changing auth hydration while another changes sidebar role gating
- one agent changing staffing read path while another splits staffing UI

## Definition of Done

A task is not done unless:

- code compiles
- behavior is verified
- residual risk is stated clearly
- Obsidian notes are updated
