# SQL Architecture Strategy

Status: Active  
Last updated: 2026-05-14

## Intent

This note explains how the project should evolve from the current hybrid data state into a stable SQL-backed production system without breaking the existing dashboards or introducing unnecessary cost.

## Current Technical Reality

Observed repo state:

- UI is a `Next.js` app in `apps/web`
- Prisma schema exists in `packages/db/prisma/schema.prisma`
- target database is `PostgreSQL`
- current reads are partially DB-backed when `DATABASE_URL` is available
- several writes and dashboard interactions still rely on local client state

This means the project is not starting from zero, but it is also not yet fully DB-driven.

## Architectural Goal

Move to PostgreSQL as the primary system of record while preserving the current dashboard contract during migration.

The migration should be gradual, feature-by-feature, with adapter logic where needed.

## Recommended Canonical Model

At minimum, the target model should include:

- `Booking`
  - canonical normalized order record

- `BookingSourceRecord`
  - raw source capture for merchant email, voucher, screenshot metadata, parsed source payload, and import provenance

- `TransportAssignment`
  - transport history with round, driver, vehicle, notes, and timing context

- `StaffAssignment`
  - staffing history with round, staff member, and workload context

- `PaymentReconciliation`
  - cash, transfer, voucher, discount, and closure-related fields

- `AttachmentReference`
  - voucher, screenshot, photo, job sheet reference, and supporting file metadata

- `AuditEvent`
  - append-only operational changes

## Vehicle Model

Vehicle must be treated as a separate assignable resource.

Minimum target fields:

- code or short name
- vehicle type
- active status
- capacity
- notes

Future-safe optional fields:

- maintenance status
- availability state
- default driver pairing
- registration / plate details

Do not embed vehicle identity inside driver records long-term.

## Migration Strategy

Use the following migration order:

1. stabilize read adapters from DB model to current dashboard data shape
2. persist booking create/edit flows
3. persist transport assignment with driver and vehicle
4. persist pickup status event history
5. persist staffing assignments
6. persist payment / reconciliation data
7. persist attachment references
8. refactor heavy local state only after persistence is proven

This is safer than trying to rewrite all dashboards at once.

## Compatibility Rule

Preserve the current dashboard contract while replacing local state underneath.

That means:

- existing screens should continue to render predictable data structures
- transitional adapters are acceptable
- DB schema quality matters more than matching legacy mock field names exactly

## Cost-Conscious Scaling Guidance

For the current business stage, avoid unnecessary service sprawl.

Recommended default:

- one `PostgreSQL` database
- one `Prisma` schema
- app-layer adapters and API routes in the existing monorepo
- selective realtime only where live coordination truly needs it

Do not introduce microservices, event buses, or high-cost distributed patterns until the operational load proves the need.

## Query and Index Guidance

Likely important index dimensions:

- service date
- operational round
- booking status
- source channel
- source booking number
- driver
- vehicle
- staff

Filtering by day and round will be common, so those access paths should remain cheap.

## Audit and History Strategy

Use append-friendly history for important operational changes:

- status changes
- round moves
- transport reassignments
- vehicle changes
- staff reassignments
- payment / reconciliation edits

This supports both recovery and accountability.

## Current Repo Mapping

The existing schema already points in the right direction with models such as:

- `Booking`
- `TransportAssignment`
- `PickupStatusEvent`
- `StaffAssignment`
- `AuditLog`

However, the current target should still be extended to cover:

- raw source record capture
- vehicle resource modeling
- attachments / reference artifacts
- richer payment and reconciliation structure

## Success Test

This strategy is correct if future agents can:

- add DB persistence one feature at a time
- keep existing dashboards working during rollout
- add vehicle support without hacking driver records
- support real reporting later without replacing the schema again
