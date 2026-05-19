# AI Agent Operating Manual

Status: Active  
Last updated: 2026-05-18  
Scope: Zipline Command Center operating handbook for future AI agents

## Purpose

This note is the primary onboarding document for any AI agent working on the Zipline project. It defines the real business flow, the current technical state of the repo, the boundaries that should not be broken, and the linked notes that hold the deeper implementation guidance.

This project is not a generic dashboard. It is an operations system for a small zipline business that needs to turn scattered booking inputs into one reliable daily execution flow.

## Business Reality

The real operational truth is not a single email, a voucher PDF, or a spreadsheet row by itself.

The operational truth is the combination of:

1. the source booking artifact
2. the normalized internal booking record
3. the dispatch board / round board
4. the driver job sheet
5. the final closure data such as status, payment, photo, and remarks

If a future implementation keeps one of these layers but breaks the connection between them, the business workflow is damaged even if the UI still renders.

## Operational Chain

The real business flow should be modeled as:

1. Booking intake from email, portal, voucher, or manual source
2. Booking normalization into one internal order
3. Pickup and round interpretation
4. Driver and vehicle assignment
5. Staff assignment and field execution
6. Job order generation
7. Payment, status, photo, and remark closure
8. Reporting, backup, and recovery

## Observed Source Inputs

The current documentation and image evidence show that bookings can originate from:

- Klook merchant confirmations and vouchers
- Trip.com booking notifications
- Ticket2Attraction booking emails
- manual inputs from staff or external requests
- voucher and pickup instruction screenshots or PDFs
- spreadsheet-style operational trackers
- whiteboard dispatch boards used during live execution
- printed driver job order sheets

Future agents should assume that source formats are inconsistent and partially structured. The system must normalize them instead of expecting one clean upstream API.

## Current Repo State

The current implementation repo at `C:\Users\Nuke\Desktop\Zip` is a hybrid state:

- frontend: `Next.js` app under `apps/web`
- data layer: `Prisma` schema under `packages/db/prisma/schema.prisma`
- database target: `PostgreSQL`
- current runtime behavior: mixed DB read path plus fallback seed/local client state

Important current technical facts:

- `apps/web/lib/load-dashboard-data.ts` can read from Prisma when `DATABASE_URL` is available.
- when no working DB connection is present, the dashboard falls back to seed-like dashboard data.
- many dashboard interactions still update local client state and are not yet persisted end to end.
- the large operational surface still lives in `apps/web/app/operations-dashboard.tsx`, so future refactors must be careful and incremental.
- auth/security helpers live in `apps/web/lib/auth/server-session.ts`; new write APIs should use `requireRole()` and `auditData()`.
- signed `zcc_session` is the only role authority; do not reintroduce `zcc_role` as a security source.
- backup dashboard design lives in `[[Backup Dashboard and Plugin Recovery Design]]`; current UI is a control surface, not real restore execution yet.

## What Future Agents Must Preserve

Future agents must preserve the following truths while evolving the codebase:

- Order List, Transport, Staffing, Personnel, and Master Ops are not separate products. They are one workflow.
- operational round planning is first-class and must not be flattened into generic booking CRUD
- driver assignment is incomplete without vehicle assignment
- staffing should remain slot-first and dispatch-oriented, not abstract HR-style scheduling
- printed/exported job sheet output is part of the operational fallback path, not a cosmetic feature
- Thai operational terminology may remain in the UI where it improves clarity for real users
- DB migration must not break existing dashboard behavior during rollout

## Non-Negotiable Guardrails

- Do not replace persisted or auditable flows with browser-only state.
- Do not treat supplier booking time as identical to operational dispatch round.
- Do not remove fallback/export pathways before the DB and recovery model are truly stable.
- Do not overbuild enterprise auth or infrastructure for this small business stage.
- Do not silently overwrite operational changes in a multi-user scenario.
- Do not create new password hashes with SHA-256; use `hashPassword()` from `server-session.ts`.
- Do not add mutation APIs without session-derived role checks, trusted-origin checks, and audit actor attribution.

## Linked Handbook Notes

- [[Real Workflow Model]]
- [[Staffing Operations Model]]
- [[SQL Architecture Strategy]]
- [[Backup Recovery and Versioning]]
- [[Backup Dashboard and Plugin Recovery Design]]
- [[Roles and Permissions]]
- [[Security and Multi-User Guardrails]]
- [[Durable Improvements and Premium Roadmap]]
- [[Module Ownership and Split Guide]]
- [[Agent Command Template]]
- [[Agent Work Queue]]
- [[Agent Review Template]]
- [[Project Status Snapshot]]
- [[Roadmap - Milestone Execution Plan]]

## Recommended Working Order For Future Agents

When making real implementation changes, use this order unless the user explicitly redirects:

1. read this note
2. read [[Real Workflow Model]]
3. read the relevant domain note for the current task
4. inspect the current code path before editing
5. make the smallest safe change that respects the documented model
6. update Obsidian after the change

## Success Test

This handbook is working if a new agent can answer all of the following without guessing:

- how a booking enters the business
- what data must be normalized
- how a booking becomes a dispatch round entry
- how driver, vehicle, and staff assignment fit together
- what is already DB-backed and what is still fallback/local state
- what can be safely changed first without breaking operations
