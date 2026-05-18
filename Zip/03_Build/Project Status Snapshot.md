# Project Status Snapshot

## Current status

- Frontend is in active iteration but build-clean.
- Local DB schema and seed are aligned with the current auth/data model.
- Demo data now covers May 17-31, 2026 with richer operational spread.
- User access and changelog boards are implemented.

## Verified

- `npm run build`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`

## Active local credentials

- `superadmin / super123`
- `manager / manager123`
- `officer / zipline123`
- `account / accounting123`
- `staff / staff123`
- `driver / driver123`

## Known non-blocking issue

- Turbopack still reports the existing NFT warning around `apps/web/next.config.ts` and `apps/web/lib/prisma.ts`, but it does not block build.

## Important recent changes

- auth moved to username-based login
- signed-session parsing is now reused server-side for API authorization
- old `@zipline.com` demo users were cleaned from local seed
- project notes were reduced and restructured for easier handoff
