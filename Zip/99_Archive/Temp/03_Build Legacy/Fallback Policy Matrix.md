# Fallback Policy Matrix

Status: Active  
Last updated: 2026-05-16

## Intent

Define one truth source for when a feature may run in fallback mode and when it must fail fast.

## Policy Categories

- `DB-required write`: API must return `503` when DB is unavailable, and UI must not show fake success.
- `Fallback-allowed read`: UI may show seed/fallback data with clear dev-context assumptions.

## Feature Matrix

| Domain | API / Flow | Policy | Expected behavior on DB unavailable |
|---|---|---|---|
| Auth login | `POST /api/auth/login` | Fallback-allowed read/auth (dev-only) | Dev credentials may authenticate via local fallback path. |
| Orders | `POST/PUT/DELETE /api/order` | DB-required write | Write fails; UI shows failure toast; no local-only write success. |
| Transport assignment | `POST/DELETE /api/transport-assignment` | DB-required write | Write fails; UI shows failure toast; no silent local persistence. |
| Pickup status | `POST /api/pickup-status` | DB-required write | Write fails; UI shows failure toast; no silent local persistence. |
| Staffing assignment | `POST /api/staff-assignment` | DB-required write | Write fails; UI shows failure toast; no silent local persistence. |
| Personnel | `POST/PUT /api/employee` | DB-required write | Returns `503`; UI shows fail-fast error and does not mutate local employee state as success. |
| Product package | `POST/PUT/PATCH /api/product-package` | DB-required write | Returns `503`; UI shows failure toast and does not fake success. |
| Dashboard seed reads | `load-dashboard-data` fallback slices | Fallback-allowed read | Seed/fallback values may render when DB is unavailable. |

## UX Message Baseline

- DB-required write failures should use a clear "database unavailable" error tone (red) and avoid ambiguous "saved on this page only" language.
- Conflict (`409`) remains a separate user message: data changed by another user, refresh required.

## Milestone B Progress

- B.1 complete: Personnel no longer applies local-only success on `503`.
- B.2 complete: Policy matrix defined and verification script added (`npm run verify:milestoneB`).
