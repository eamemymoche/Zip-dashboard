# Agent Work Queue

Status: Active  
Last updated: 2026-05-16

## Purpose

This note is the **active queue only** for future AI-agent implementation work.

Completed historical tasks are tracked in:
- `C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Task Board.md`
- `C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Decision Log.md`

Do not use this file as a changelog. Use it as the next-step execution queue.

## Current Stable Baseline

The following are already in place and should be treated as the current baseline:

- local PostgreSQL `zipline` is migrated and seeded
- DB-backed login works
- Order CRUD persists to DB
- transport assignment persists to DB
- pickup status persists to DB
- staffing assignment persists to DB
- optimistic concurrency guards are wired through the main write APIs
- Transport Assign / Recheck / Sheet, Staffing Setup / Board, Personnel, and Master are already split out of `operations-dashboard.tsx`

## Current Rules

- Do not start a broad rewrite.
- Do not assign two agents to the same dashboard surface at the same time.
- Do not mix render-only split work with schema or auth changes in the same task.
- Keep `operations-dashboard.tsx` as the orchestration layer until an intentional container refactor is planned.
- Any behavior change must update Obsidian in the same pass.

## Active Execution Order

Continue in this order unless a real bug interrupts the sequence:

1. Milestone B - Fallback policy lock
2. Milestone C - Integrated E2E operational verification
3. Optional later - Split additional shared transport/order helper types only if file pressure justifies it

## Task 24

**Browser verification pass after the split sequence**

### Goal

- verify the DB-backed app still behaves correctly after Tasks 17-23
- catch regressions introduced by render-only extraction work

### Minimum verification list

- login
- logout
- Order create/edit/delete
- transport assignment write
- pickup status write
- staffing assignment write
- Personnel expand/edit modal
- Master summary / pivot / product view switching
- reload consistency after writes

### Record results explicitly

- browser-verified
- code/build-verified only
- not yet verified

### Do not

- claim verification that was not actually performed
- mix this task with new feature work unless a smoke-test bug is found

### Definition of done

- the verification log distinguishes real browser testing from code review
- any regressions are documented precisely
- Obsidian reflects actual verified state

### Status

- Done on 2026-05-16 (with explicit verification-scope labels)

### Verification outcome summary

- **Code/build-verified:** `npm.cmd run build` passes.
- **Runtime write-flow verified (authenticated HTTP smoke against running app):**
  - login/logout
  - Order create/edit/delete
  - transport assignment write
  - pickup status write
  - staffing assignment write
  - reload consistency after writes
- **Not yet browser-click verified in this pass:**
  - Personnel expand/edit modal interaction
  - Master summary/pivot/products view switching

## Task 25

**Automate Task 24 smoke verification as a reusable script**

### Goal

- prevent future agents from manually repeating long verification commands
- keep verification output consistent and auditable

### Target files

- `C:\Users\Nuke\Desktop\Zip\scripts\` (new smoke script)
- `C:\Users\Nuke\Desktop\Zip\README.md`
- `C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Task Board.md`
- `C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Decision Log.md`

### Definition of done

- one command runs login + write-flow + logout smoke checks
- script exits non-zero on failure
- run instructions documented

### Status

- Done on 2026-05-16

## Task 26

**Role + concurrency API guardrail tests**

### Goal

- verify key APIs reject unauthorized roles and stale `updatedAt` tokens correctly

### Definition of done

- explicit pass/fail output for `403` role-guard paths and `409` conflict paths
- no production behavior change required

### Status

- Done on 2026-05-16
- Command: `npm run verify:task26`
- Verified outputs:
  - role guard `403` on order/transport/pickup/staff endpoints using a forged DRIVER role session
  - concurrency guard `409` on stale `updatedAt` for order/transport/pickup/staff writes

## Task 27

**Focused browser UI verification for extracted surfaces**

### Goal

- close the remaining Task 24 UI verification gap

### Scope

- Personnel expand/edit modal open/cancel/save path
- Master summary/pivot/products tab switching

### Definition of done

- verification log marks these items as browser-verified
- any regression is recorded with reproducible steps

### Status

- Done on 2026-05-16
- Command: `npm run verify:task27`
- Browser-verified flows:
  - Personnel expand card -> open edit modal -> cancel close
  - Master view switch: summary -> pivot -> products

## Task 28

**Fallback/local-state vs DB write-path reconciliation**

### Goal

- identify remaining interactions that still look persisted but are local-only
- prioritize fixes without broad refactor

### Definition of done

- list of exact UI actions still local-only
- ordered fix plan with smallest-safe patches

### Status

- Done on 2026-05-16
- Output note: `Zip/03_Build/Fallback Local-State Reconciliation.md`

## Task 29

**Audit-log trace helper for ops debugging**

### Goal

- make it easy to inspect recent write events by booking number during verification

### Definition of done

- one lightweight query/helper command documented
- verified against at least one create/update/delete sequence

### Status

- Done on 2026-05-16
- Commands:
  - `npm run audit:booking -- <BOOKING_NUMBER>`
  - `npm run verify:task29`
- Scripts:
  - `scripts/task29-audit-log-by-booking.mjs`
  - `scripts/task29-verify-audit-helper.mjs`

## Task 30

**Delete-flow hardening check (FK + rollback)**

### Goal

- ensure Order delete remains robust when transport/staff/pickup links exist

### Definition of done

- verified delete path with linked rows
- rollback/recovery behavior documented if delete fails mid-flow

### Status

- Done on 2026-05-16
- Command: `npm run verify:task30`
- Script: `scripts/task30-delete-hardening.mjs`
- Verified:
  - linked rows exist before delete (`Booking`, `TransportAssignment`, `PickupStatusEvent`, `StaffAssignment`)
  - stale-token delete returns `409` and rows remain unchanged
  - valid delete removes booking and all linked rows (`0` remain)

## Safe Pairings

Safe:
- one agent on a narrow render extraction
- one reviewer agent on docs truthfulness

Unsafe:
- two agents editing `operations-dashboard.tsx` at once
- one agent refactoring helpers while another extracts the same UI surface
- one agent moving modal state while another touches Order CRUD rendering
