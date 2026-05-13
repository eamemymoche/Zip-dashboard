# Implementation Plan

## Phase 1

- Establish real repo structure at the root workspace.
- Preserve the original prototype for comparison.
- Draft the first database schema.
- Create a frontend shell that states the MVP direction.
- Replace the placeholder shell with a prototype-derived Order List dashboard.
- Port the full prototype visual language and Thai operational structure into a reusable Next.js dashboard component.

## Phase 2

- Hook the booking list page to Prisma-backed records instead of local seed data.
- Replace browser-only order state with a persisted bookings table.
- Add filters for date, round, booking number, customer, and hotel.
- Connect transport, staffing, master log, and job sheet modules to persisted records.

## Phase 3

- Add transport assignment workflow.
- Add pickup status updates and No Show move flow.
- Add printable driver sheet layout.
- Add a Thai MiniMax subagent that summarizes dashboard state and drafts ops follow-ups.
