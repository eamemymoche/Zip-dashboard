# Roadmap - Milestone Execution Plan

Status: Active  
Last updated: 2026-05-16  
Scope: Post-Task-30 execution direction

## Current Progress Marker

- Milestone A is complete.
- Milestone B is complete.
- Milestone C is complete.
- Milestone B.1/B.2/B.3 complete (Personnel fail-fast on `503` + policy matrix + verify command + DB-required write `503` normalization).

## Planning Principles

1. Execute by milestone outcomes, not isolated ticket count.
2. Every milestone must include:
   - clear success criteria
   - explicit non-goals
   - verification command set
3. No milestone closes without Obsidian sync.

## Milestone A - Product Package Lifecycle Completion

### Why now

Product Package flow is currently create-only. This is the most visible unfinished domain in Master Ops.

### Objectives

- add ProductPackage update flow (name/detail/active flag policy)
- add deactivate/activate behavior with safe UI state reflection
- keep role permissions strict (`ADMIN`/`ACCOUNTING`/`MANAGER`)

### In scope

- API: `PUT /api/product-package` (and optional status toggle endpoint)
- UI: Master products controls for edit + activate/deactivate
- validation: duplicate-name and empty-field handling

### Out of scope

- redesign Master view layout
- broad pivot/summary rewrites

### Done criteria

- package create/edit/deactivate actions persist and reload correctly
- role guard behavior validated
- baseline regression commands pass (`task24`, `task26`, `task27`, `task30`)

### Status

- Done on 2026-05-16
- Verification command: `npm run verify:milestoneA`

## Milestone B - Fallback Policy Lock

### Why now

System supports DB mode + fallback mode. This is useful but can create ambiguity if behavior is inconsistent.

### Objectives

- define per-feature policy:
  - DB-required write (fail fast if unavailable)
  - fallback-allowed behavior (explicit user notice)
- standardize UX messaging for DB unavailable paths

### In scope

- policy table note in Obsidian
- API response mapping (`503`/error to user-facing toast language)
- small code cleanup where policy and behavior mismatch

### Out of scope

- removing all fallback support
- introducing heavy feature flags/platform toggles

### Done criteria

- one policy table covers all major domains (Order/Transport/Staffing/Personnel/Product)
- observed behavior matches table
- no silent local-only writes in DB-required flows

## Milestone C - Integrated E2E Operational Verification

### Why now

Current verification is strong but split across multiple scripts. Team confidence improves with one integrated command.

### Objectives

- create one deterministic end-to-end verification command:
  - login
  - order create/edit/delete
  - transport assign
  - staffing assign
  - pickup status update
  - audit trace check
  - cleanup validation

### In scope

- script composition from existing verified scripts
- concise report output (`PASS/FAIL` sections)

### Out of scope

- full browser automation of every screen
- load/performance testing

### Done criteria

- one command returns non-zero on any failed subflow
- report is readable for daily pre-release checks

### Status

- Done on 2026-05-16
- Verifier command: `npm run verify:milestoneC`

## Recommended Execution Order

1. Milestone A
2. Milestone B
3. Milestone C

Rationale:
- complete domain behavior first,
- then lock policy clarity,
- then produce final integrated verifier over stable behavior.

## Control Checks Before Each Milestone Merge

1. `npm run build`
2. `npm run verify:task24`
3. `npm run verify:task26`
4. `npm run verify:task27`
5. `npm run verify:task30`

If any check fails, milestone remains open.
