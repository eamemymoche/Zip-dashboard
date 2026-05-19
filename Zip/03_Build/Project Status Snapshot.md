# Project Status Snapshot

## Current status

- Repo shape is stable: `apps/web` is the live Next.js dashboard, `packages/db` owns Prisma schema/seed, and `Zip/` is the active Obsidian project vault.
- Main dashboard surfaces now include `Overview`, `Order List`, `Transport`, `Staffing`, `Personnel`, `Accounting`, `Master Ops`, `User Access`, `Change Log`, and `Backup & Recovery`.
- Auth is username-first now. Login uses signed `zcc_session`, role/module authority comes from the session payload + DB user record, and demo fallback still exists for local work.
- Personnel is no longer just a name/phone directory. Employee records now carry English first/last/nickname fields plus `defaultUsername`, and create/edit flows can sync matching user accounts.
- Employee/User sync is now soft-coupled: employee save can succeed even if account sync has a problem, and reconciliation can be run later through `POST /api/users/sync-from-employees`.
- User Access now behaves more like an account operations board: role tabs, sortable columns, stronger role color tiers, and an explicit staff/driver sync action with `synced/skipped/errors` feedback.
- Transport data now treats vehicle plate + transport admin note as first-class fields. Job sheet export includes `Time Slot`, and Assign view surfaces plate/type context directly in vehicle dropdowns.
- Staffing setup moved closer to the real dispatch workflow: fixed minimum guide slots, manual add/remove guide rows, and select-based assignment instead of the old checkbox wall.

## Structure notes

- New active API surface: `apps/web/app/api/users/sync-from-employees/route.ts`
- Employee write path: `apps/web/app/api/employee/route.ts`
- Shared employee/user sync helper: `apps/web/lib/auth/employee-account-sync.ts`
- Core auth helpers: `apps/web/lib/auth/server-session.ts`
- Role/module mapping: `apps/web/lib/auth/role-guards.ts`
- Seed/load alignment for new employee + vehicle fields:
  - `apps/web/lib/ops-data.ts`
  - `apps/web/lib/load-dashboard-data.ts`
  - `packages/db/prisma/seed.mjs`
  - `packages/db/prisma/schema.prisma`

## Verified in this documentation refresh

- Code structure inspected against current working tree on `2026-05-19`.
- Confirmed current login contract is username-based (`apps/web/app/login/page.tsx` -> `/api/auth/login` with `{ username, password }`).
- Confirmed employee schema now includes `englishFirstName`, `englishLastName`, `englishNickname`, and `defaultUsername`.
- Confirmed vehicle schema now includes `licensePlate` and `adminNote`.
- Confirmed User Access board now has employee-to-user sync route and explicit sync feedback behavior.
- Confirmed build passes after the current employee/user sync refactor.

## Verified runtime on 2026-05-19

- `npm run build` passes locally against the current working tree.
- `npm run verify:task24` passes.
- `npm run verify:task26` passes.
- `npm run verify:task27` passes.
- `npm run verify:frontend:access` passes.
- `npm run verify:milestoneC` passes.
- Personnel card expand bug was fixed by preventing CSS grid row stretch in `apps/web/app/globals.css`.
- Active Personnel labels in `apps/web/app/personnel-view.tsx` were cleaned from mojibake back to readable Thai/neutral labels.
- Live DB cleanup completed for the recent Thai-name regression:
  - `Employee.name` / `nickname` restored
  - `User.displayName` for synced staff/driver accounts restored
  - `Booking.customerName` restored for the affected seeded/demo rows

## Historical verification that still stands

- Prior notes already recorded passing runs for `npm run build`, `npm run db:generate`, `npm run verify:milestoneA`, `npm run verify:milestoneB`, `npm run verify:milestoneC`, and `npm run verify:frontend:access`.
- Those commands were not re-run in this Obsidian refresh pass, so this note should be read as structure-truthful, not newly runtime-verified.

## Active local credentials

- `superadmin / super123`
- `manager / manager123`
- `officer / zipline123`
- `account / accounting123`
- `staff / staff123`
- `driver / driver123`

## Current open edges

- New migration for employee/vehicle identity detail has been added and applied locally, but future agents should still confirm target DBs are aligned before assuming these fields exist everywhere.
- Backup dashboard is still a read/status/control surface. Real restore execution, checksum validation, and storage-provider plugins remain future backend work.
- Current build still emits the known Turbopack/NFT tracing warning through `apps/web/lib/prisma.ts`; this is noisy but not currently build-blocking.
