# Module Ownership and Split Guide

Status: Active
Last updated: 2026-05-16

## Intent

This note tells future AI agents how the large dashboard code should be split safely, and which files currently own which responsibilities.

The goal is to reduce chaos in `operations-dashboard.tsx` without creating a multi-agent merge disaster.

## Migration Baseline (2026-05-14)

Vehicle model and `TransportAssignment.vehicleId` are committed as migration `20260514000000_init_vehicle_transport` at `packages/db/prisma/migrations/`. The migration is idempotent and runnable once a PostgreSQL instance is available. Do not duplicate the `Vehicle` model in the schema — it already exists.

## Migration Baseline (2026-05-14) — Employee Fields

`Employee` model extended with `nickname`, `phone`, `phone2`, `startDate`, `photo` via migration `20260514000001_add_employee_fields`. All fields are nullable/optional. Migration is idempotent. Seed data includes all new fields. Loader no longer fabricates `nickname` from name split.

## Migration Baseline (2026-05-17) — SUPERADMIN Role and User Active Flag

`User` model extended with:
- `SUPERADMIN` added to `UserRole` enum
- `active Boolean @default(true)` field

Migration `20260517000000_add_superadmin_role_and_user_active` is idempotent. Existing users remain visible (default `active = true`).

## Current Safe Split Boundary

The first safe split has already been started in the transport domain.

### Current ownership

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\operations-dashboard.tsx`
  - still owns overall dashboard orchestration
  - owns top-level state, cross-module filters, modal state, and shared toast behavior
  - **modal boundary decision (2026-05-16):** keep both `showOrderModal` and `showEmployeeModal` parent-owned for now
  - reason: both modals still depend on parent-owned persistence callbacks, shared seed/master data, and cross-view orchestration state; moving them now would create more coupling than clarity

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\transport-assign-table.tsx`
  - owns the Transport > Assign table rendering
  - owns row-level driver / vehicle / admin-note controls
  - does not own persistence itself; it calls parent callbacks

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\transport-recheck-table.tsx`
  - owns the Transport > Recheck table rendering
  - owns stats cards, driver/status filter controls, status-toggle and move-round action
  - does not own persistence itself; calls parent `onUpdateOrder` for status/round changes

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\transport-sheet-view.tsx`
  - owns the Transport > Sheet (driver job sheet) view rendering
  - owns driver slot selector and printable job sheet table
  - does not own persistence; calls parent `onSelectDriverAndSlot` and `onPrint` callbacks

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\api\transport-assignment\route.ts`
  - owns driver + vehicle + admin-note transport persistence
  - resolves stable codes to DB records
  - writes audit log entries for assignment changes
  - returns `updatedAt` in response for concurrency token tracking

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\api\pickup-status\route.ts`
  - owns pickup status event persistence
  - appends `PickupStatusEvent` record on status change or round move
  - writes audit log entry for each status change
  - does not update `Booking.status` (local state remains the source of truth for display)
  - returns `updatedAt` in response for concurrency token tracking

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\api\staff-assignment\route.ts`
  - owns staff assignment persistence
  - replaces all `StaffAssignment` records for a booking on each save (full sync)
  - writes audit log entry for assignment changes
  - uses staff code as the write identifier
  - returns `updatedAt` in response for concurrency token tracking

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\staffing-setup-table.tsx`
  - owns the Staffing > Setup table rendering
  - owns date/time/packet filter toolbar and staff assignment checkbox grid per order row
  - does not own persistence; calls parent `updateOrder` and `saveStaffAssignment` callbacks
  - uses `DatePicker` from `./date-picker`
  - props: `staffDate`, `staffTime`, `staffPacket`, `staffingOrders`, `staffMembers`, `initialData`, `onStaffDateChange`, `onStaffTimeChange`, `onStaffPacketChange`, `updateOrder`, `saveStaffAssignment`

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\staffing-board-view.tsx`
  - owns the Staffing > Board rendering
  - owns board date picker, slot columns, warning/no-show card rendering, and total-join footer per slot
  - does not own persistence; receives already-shaped `boardOrders` from the parent dashboard
  - uses `DatePicker` from `./date-picker`
  - props: `boardDate`, `boardOrders`, `initialData`, `onBoardDateChange`

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\personnel-view.tsx`
  - owns the Personnel dashboard rendering
  - owns the Staff and Driver card grids, employee counts, expand/collapse detail panels, and top-right "new employee" action
  - does not own persistence; receives employees, expanded employee state, and open/edit callbacks from the parent dashboard
  - keeps modal state, employee form state, and employee submission logic centralized in `operations-dashboard.tsx`

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\master-view.tsx`
  - owns the Master dashboard rendering
  - owns the Master subnav plus `summary`, `pivot`, and `products` surfaces
  - does not own persistence; receives `masterView`, `pivotGroupBy`, `pivotMap`, and parent callbacks via props
  - keeps export toast behavior and parent-owned orchestration state centralized in `operations-dashboard.tsx`

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\order-detail-row.tsx`
  - owns the expanded Order List detail row rendering
  - owns both read-only detail layout and inline edit surface for one expanded booking row
  - does not own persistence; receives edit state, status formatters, and parent callbacks for save/cancel/start-edit/delete
  - keeps Order CRUD persistence, toast behavior, and conflict handling centralized in `operations-dashboard.tsx`

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\dashboard-selectors.ts`
  - owns pure derived selectors and summary builders used by `operations-dashboard.tsx`
  - includes filter/sort builders, slot capacity builders, staffing/transport/day selectors, pivot builders, and assistant context helpers
  - must remain free of React state ownership, API calls, and side effects
  - exists to reduce density in the orchestration file without changing behavior

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\api\auth\login\route.ts`
  - owns session auth: POST (login), GET (session), DELETE (logout)
  - issues httpOnly `zcc_session` cookie with HMAC-signed session token
  - validates password against SHA256 hash (DB) or hardcoded dev fallback when DB unavailable
  - **Dev auth fallback** (local-dev only, NOT production): hardcoded users `officer@zipline.com/zipline123`, `owner@zipline.com/owner123`, `accounting@zipline.com/accounting123` with `dev-` prefixed IDs and MANAGER/ADMIN/ACCOUNTING roles. Used when `DATABASE_URL` is not set or DB is unavailable.

- `C:\Users\Nuke\Desktop\Zip\apps\web\lib\auth\auth-context.tsx`
  - owns client-side auth state via `AuthProvider` + `useAuth()` hook
  - exposes `{ user, loading, refresh, logout }` to React component tree
  - `user` is `CurrentUser | null` (shape: `{ id, email, displayName, role }`)
  - `loading` is `true` during initial session fetch, `false` after resolution
  - `refresh()` re-fetches session; `logout()` calls DELETE then redirects to `/login` via `window.location.replace`
  - uses `AbortController`, `cache: "no-store"`, and request sequencing so stale auth fetches cannot keep the UI in a loading loop
  - refreshes auth state again on `pageshow` so browser back/forward cache cannot keep a stale logged-in dashboard alive after logout

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\providers.tsx`
  - wraps `AuthProvider` as a client component for Next.js app tree

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\login\page.tsx`
  - owns the login page (email + password form)
  - uses `window.location.replace("/")` after successful login to avoid extra history entries during auth transitions
  - redirects to `/` on successful auth

- `C:\Users\Nuke\Desktop\Zip\apps\web\proxy.ts`
  - owns auth proxy: session cookie parsing with HMAC-SHA256, `x-user-id` and `x-user-role` header injection, redirect to `/login` on failure with `from` param
  - uses `crypto` module (Node.js runtime — no Edge Runtime crypto warnings in Next.js 16)
  - renamed from `middleware.ts` to `proxy.ts` to follow Next.js 16 convention; exported function is `proxy` not `middleware`
  - gates all non-public paths; public: `/login`, `/api/auth`, `/api/subagent`, Next.js internals
  - `/personnel` route guarded: ADMIN, MANAGER only; redirects to `/login?from=/personnel` otherwise
  - Dashboard is a single-page SPA at `/`; proxy cannot enforce per-module visibility for `/` since all main-view routes share one entry point — client-side nav filtering is the enforced layer for module access

- `C:\Users\Nuke\Desktop\Zip\apps\web\lib\auth\role-guards.ts`
  - owns shared role constants and guard helpers for all API routes
  - exports `UserRole` type, `MODULE_ACCESS` map, `ALLOWED_ROLES_*` constants for each write API, `hasAccess()`, `getRoleGuardResponse()`
  - `MODULE_ACCESS` keys: overview (all), orderlist (ADMIN/ACCOUNTING/MANAGER), transport (all), staffing (no DRIVER), personnel (ADMIN/MANAGER only), master (ADMIN/ACCOUNTING/MANAGER)
  - Used by all write API routes for server-side role enforcement

- `C:\Users\Nuke\Desktop\Zip\apps\web\app\api\order\route.ts`
  - owns Order CRUD persistence: POST (create), PUT (edit), DELETE
  - POST: accepts booking fields, creates `Booking` record, returns `{ id, bookingNumber, updatedAt }`; 409 on duplicate `bookingNumber`
  - PUT: accepts fields + `updatedAt` for concurrency guard; returns 409 on conflict; writes audit log
  - DELETE: accepts `bookingNumber` via query param; returns 409 on conflict; writes audit log
  - All writes call explicit `prisma.booking.update({ where: { id }, data: {}, select: { updatedAt: true } })` to force-refresh `Booking.updatedAt`
  - Server-side role-gated: ADMIN, ACCOUNTING, MANAGER only; returns 403 for STAFF, DRIVER

- `C:\Users\Nuke\Desktop\Zip\apps\web\lib\ops-data.ts`
  - owns dashboard seed types and fallback seed data
  - now includes vehicle seed data and stable `driverCode` / `vehicleCode` fields

- `C:\Users\Nuke\Desktop\Zip\apps\web\lib\load-dashboard-data.ts`
  - owns DB-to-dashboard mapping
  - must keep compatibility with current dashboard shape during migration

- `apps/web/app/user-access-view.tsx`
  - owns the User Access Board rendering
  - owns user list, search/filter, add user modal, edit role modal, confirm role dialog, enable/disable toggle
  - does NOT own user persistence; calls `/api/users` for all writes
  - visibility: `SUPERADMIN` and `ADMIN` only (enforced at nav level in `operations-dashboard.tsx`)
  - uses local component state for optimistic UI updates

- `apps/web/app/api/users/route.ts`
  - owns User CRUD: GET (list all), POST (create with password hash), PUT (update role/active)
  - role-gated: `SUPERADMIN`, `ADMIN`, `ACCOUNTING`, `MANAGER` only (ALLOWED_ROLES_WRITE)
  - writes `AuditLog` on role/active changes
  - does not expose passwordHash in responses

- `apps/web/app/change-log-view.tsx`
  - owns the Change Log Board rendering
  - owns tab bar (All/Orders/Transport/Staffing/Personnel/Users), search/date filters, log table with pagination
  - read-only; calls `/api/audit-log` for data
  - error banner + empty table state when API unavailable (no fake data)
  - visibility: `SUPERADMIN` and `ADMIN` only (enforced at nav level in `operations-dashboard.tsx`)

- `apps/web/app/api/audit-log/route.ts`
  - owns audit log read: GET with domain/keyword/date/pagination query params
  - maps DB `AuditLog` rows to log item shape (id, timestamp, actorDisplay, actorRole, domain, action, entityType, entityId, beforeSummary, afterSummary)
  - domain derived from entityType mapping; before/after summaries parsed from JSON strings
  - role-gated: `ALLOWED_ROLES_USER_ACCESS` (`SUPERADMIN`, `ADMIN`)
  - read-only; no writes

## Transport Contract

Future agents must preserve this contract:

- UI row uses:
  - `driver` for display name
  - `driverCode` for stable write value
  - `vehicle` for display code
  - `vehicleCode` for stable write value

- API transport persistence uses:
  - `bookingNumber`
  - `driverCode`
  - `vehicleCode`
  - `adminNote`

Do not switch the UI back to name-based writes. Display names are not stable identifiers.

## Split Rules

When splitting `operations-dashboard.tsx`, follow this order:

1. transport views
2. staffing views
3. order-list detail/editor surfaces
4. master/reporting views

Do not split everything at once.

## Safe Pattern

Preferred split pattern:

- top-level container keeps cross-cutting state
- extracted child component renders one view or one dense table
- persistence remains explicit via props/callbacks
- DB mapping remains in `load-dashboard-data.ts` until a broader adapter refactor is intentionally planned

## Unsafe Pattern

Avoid:

- moving unrelated dashboards in one refactor
- mixing DB mapping, fetch logic, and rendering into the same new child file
- rewriting all local state into context/store just because the file is large
- changing identifier strategy during a UI refactor

## Next Recommended Splits

Recommended next extractions:

1. ~~Transport Recheck view~~ (done — extracted 2026-05-14)
2. ~~Transport Sheet view~~ (done — extracted 2026-05-14)
3. ~~Staffing Setup view~~ (done — extracted 2026-05-15)
4. ~~Staffing Board~~ (done - extracted 2026-05-16)
5. ~~Personnel view~~ (done - extracted 2026-05-16)
6. ~~Master view surfaces (`summary` / `pivot` / `products`)~~ (done - extracted 2026-05-16)
7. ~~Order List detail/editor surfaces~~ (done - extracted 2026-05-16)
8. ~~shared transport/order selectors/helpers~~ (done - extracted 2026-05-16)
9. ~~modal boundary reassessment (order / employee)~~ (done - keep parent-owned, documented 2026-05-16)
10. browser verification pass after the split sequence

## Modal Ownership Rule

Current intentional boundary:

- `Order modal` stays in `operations-dashboard.tsx`
- `Employee modal` stays in `operations-dashboard.tsx`

Why this is the current recommended boundary:

- the Order modal still depends on parent-owned Order CRUD persistence callbacks and shared packet/time-slot data
- the Employee modal still depends on parent-owned create/edit mode, form reset behavior, and submission flow
- both modals are opened from multiple render surfaces that were extracted only as view components

Do not move either modal unless one of these becomes true:

- the modal gets its own narrow persistence boundary
- the parent orchestration file becomes significantly simpler as a direct result
- the extraction does not blur ownership of submit/cancel/reset/conflict behavior

## Obsidian Rule

Whenever a major view is split out of `operations-dashboard.tsx`, update this note with:

- new file path
- ownership summary
- whether it owns rendering only or rendering + persistence
- any identifier or API contract that future agents must preserve
