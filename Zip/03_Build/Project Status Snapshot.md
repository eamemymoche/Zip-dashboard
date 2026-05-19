# Project Status Snapshot

## Current status

- Frontend is in active iteration and now includes admin-facing `User Access`, `Change Log`, and `Backup & Recovery` boards.
- Auth/session handling has been hardened around signed `zcc_session`, shared `requireRole()` checks, trusted-origin enforcement, and audited mutation helpers.
- Local DB schema, seed, and read/write API surface are aligned with the current auth/data model, including username login and query indexes.
- Demo data now covers May 17-31, 2026 with richer operational spread and the current role/module-access model.

## Verified

- `npm run build`
- `npm run db:generate`
- schema and migration files exist for `SUPERADMIN`, `User.active`, `User.username`, `User.moduleAccessJson`, and query indexes
- backup status API is read-only by design (`GET /api/backup/status`)

## Active local credentials

- `superadmin / super123`
- `manager / manager123`
- `officer / zipline123`
- `account / accounting123`
- `staff / staff123`
- `driver / driver123`

## Known non-blocking issue

- Turbopack still reports the existing NFT warning around `apps/web/next.config.ts` and `apps/web/lib/prisma.ts`, but it does not block build.
- Backup dashboard is intentionally a control surface only. Real restore execution, checksum validation, and storage-provider plugins are still future backend work.

## Important recent changes

- auth moved to username-based login and role authority now comes from signed `zcc_session` only
- password handling moved to `scrypt` for new hashes; legacy SHA-256 hashes still verify for migration compatibility
- shared auth/security helpers now live in `apps/web/lib/auth/server-session.ts` and are reused across mutation APIs
- added `Backup & Recovery` board plus guarded `GET /api/backup/status` scaffold for future plugin-based recovery work
- added Prisma query indexes for common dashboard/API read paths
- added ERD documentation artifacts under `docs/erd.md` and `docs/erd-infographic.png`
