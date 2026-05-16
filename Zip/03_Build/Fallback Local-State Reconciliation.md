# Fallback / Local-State Reconciliation (Task 28)

Status: Completed  
Last updated: 2026-05-16

## Purpose

Track places where UI looked persisted but was actually local-only, then close each gap with SQL-first behavior.

## Final state

No critical write path remains local-only by default for Task 28 scope.

## Task 28 outcomes

1. **Task 28.1 - Employee write API** ✅ Done (2026-05-16)
   - Added `apps/web/app/api/employee/route.ts` (`POST`, `PUT`) with role guard (`ADMIN`/`MANAGER`).
   - Personnel modal now submits to API first.
   - For DB unavailable (`503`), UI now shows error and does not apply fake local success.

2. **Task 28.2 - Employee/data loader alignment** ✅ Done (2026-05-16)
   - Updated `apps/web/lib/load-dashboard-data.ts` to avoid full-seed fallback caused only by empty bookings.
   - Employees, vehicles, and product packages now map from DB independently when DB is available.

3. **Task 28.3 - Product package persistence** ✅ Done (2026-05-16)
   - Added `apps/web/app/api/product-package/route.ts` with lifecycle:
     - `POST` create
     - `PUT` edit
     - `PATCH` activate/deactivate
   - Master view buttons are connected to API writes with role checks.
   - New order form uses active packages only.

4. **Task 28.4 - Regression verify pass** ✅ Done (2026-05-16)
   - Verified with:
     - `npm run verify:task24`
     - `npm run verify:task26`
     - `npm run verify:task27`
     - `npm run verify:task29`
     - `npm run verify:task30`
     - `npm run verify:milestoneA`

## Guardrails kept

- No broad dashboard refactor mixed into Task 28 closure.
- `operations-dashboard.tsx` remains orchestration owner.
- Obsidian notes updated in same delivery window.
