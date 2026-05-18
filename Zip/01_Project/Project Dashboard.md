# Project Dashboard

## 1. Project state

Zipline Command Center is now a Next.js operations dashboard with DB-backed auth, role/module access, order management, transport assignment, staffing, personnel, accounting placeholder, user controls, and audit/changelog boards.

Current local baseline:

- App build passes
- Local PostgreSQL schema is migrated
- Local seed is aligned with the current demo users and the generated May 17-31, 2026 dataset
- Login uses username-based auth with baseline rate-limit and session hardening

## 2. Source map

Main app surface:

- `apps/web/app/operations-dashboard.tsx`
  - main shell
  - sidebar navigation
  - top-level board routing/state
- `apps/web/app/top-bar.tsx`
  - language/theme/time controls
  - account settings modal
- `apps/web/app/globals.css`
  - main design system and board styling

Board components:

- `apps/web/app/transport-assign-table.tsx`
- `apps/web/app/transport-recheck-table.tsx`
- `apps/web/app/transport-sheet-view.tsx`
- `apps/web/app/staffing-setup-table.tsx`
- `apps/web/app/staffing-board-view.tsx`
- `apps/web/app/personnel-view.tsx`
- `apps/web/app/accounting-view.tsx`
- `apps/web/app/user-access-view.tsx`
- `apps/web/app/change-log-view.tsx`
- `apps/web/app/master-view.tsx`

Data + selectors:

- `apps/web/lib/ops-data.ts`
  - generated local dashboard seed data
- `apps/web/app/dashboard-selectors.ts`
  - dashboard filtering/sorting/derived slices
- `apps/web/lib/job-order.ts`
  - job order formatting helpers

Auth + access:

- `apps/web/app/api/auth/login/route.ts`
- `apps/web/app/api/auth/profile/route.ts`
- `apps/web/lib/auth/auth-context.tsx`
- `apps/web/lib/auth/role-guards.ts`
- `apps/web/lib/auth/server-session.ts`
- `apps/web/proxy.ts`

Operational APIs:

- `apps/web/app/api/order/route.ts`
- `apps/web/app/api/transport-assignment/route.ts`
- `apps/web/app/api/pickup-status/route.ts`
- `apps/web/app/api/staff-assignment/route.ts`
- `apps/web/app/api/employee/route.ts`
- `apps/web/app/api/product-package/route.ts`
- `apps/web/app/api/users/route.ts`
- `apps/web/app/api/audit-log/route.ts`

Database:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/`
- `packages/db/prisma/seed.mjs`

## 3. Demo access

Primary local demo users:

- `superadmin / super123`
- `manager / manager123`
- `officer / zipline123`
- `account / accounting123`
- `staff / staff123`
- `driver / driver123`

## 4. What is stable now

- Order CRUD
- Transport assign/recheck/sheet
- Staffing setup/board/KPI baseline
- Personnel board
- User controls with per-board permissions
- Changelog/audit board
- Username login
- Local DB seed for May 17-31, 2026

## 5. Where to look next

Go to `03_Build/Next Step Plan.md` for the active improvement queue.
