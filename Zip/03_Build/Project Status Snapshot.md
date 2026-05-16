# Project Status Snapshot

Status: Active  
Last updated: 2026-05-16  
Owner: Implementation queue (AI-agent handoff note)

## 1) Executive Summary

Project is in **late alpha** and has passed the first real persistence loop for core operations.  
**Milestone A is complete.**

- auth/session + role gating
- Order CRUD persistence
- transport assignment persistence
- pickup status persistence
- staffing assignment persistence
- employee create/update persistence
- product package create/edit/activate/deactivate persistence
- optimistic concurrency (`409`) on major write paths
- FK-linked delete hardening and rollback/guard validation

This is no longer a UI prototype. It is now an app with a meaningful DB-backed operational core.

## 2) What Is Stable Now (Verified)

### Core write flows

- `POST/PUT/DELETE /api/order`
- `POST/DELETE /api/transport-assignment`
- `POST /api/pickup-status`
- `POST /api/staff-assignment`
- `POST/PUT /api/employee`
- `POST /api/product-package`

### Auth/guards

- session login/logout (`/api/auth/login`)
- protected route redirect via proxy
- role guard checks for key write APIs (`403`)

### Concurrency & integrity

- stale token conflict checks (`409`) on key write endpoints
- delete hardening validated for linked transport/pickup/staff rows

### Verification commands

- `npm run verify:task24` (runtime smoke loop)
- `npm run verify:task26` (role + conflict guard checks)
- `npm run verify:task27` (browser UI click pass: Personnel + Master)
- `npm run verify:task29` (audit helper verification)
- `npm run verify:task30` (delete hardening verification)

## 3) What Is Not Fully Complete Yet

1. **Product Package domain is partial**  
   - create exists, but no edit/deactivate lifecycle yet.

2. **Some app behavior is still mixed-mode by design**  
   - fallback paths still exist for DB-unavailable mode.
   - this is intentional for resilience, but needs explicit policy boundaries.

3. **End-to-end “full business day” scenario is not yet codified as one deterministic script**  
   - component tests exist as slices; full operational chain test is still manual composition.

4. **Roadmap format drifted from outcome-based milestones to many micro tasks**  
   - clarity risk for future execution.

## 4) Current Risk Posture

### Low risk

- breaking core persisted CRUD for orders/transport/staffing/pickup
- session/login regressions (covered by existing checks)

### Medium risk

- domain drift in Master Product DB because lifecycle is incomplete
- confusion between fallback-mode behavior vs DB-mode behavior if not documented in each feature

### High risk (if not addressed next)

- adding new features without milestone-level acceptance criteria
- parallel edits in `operations-dashboard.tsx` without scoped ownership

## 5) Recommended Direction (Do Not Skip)

Use **milestone-first execution**, not ad-hoc task numbering.

### Milestone A - Domain Completion (Product Package lifecycle) ✅ Done

Completed:
- ProductPackage create/edit/deactivate/activate
- role-aligned write guards
- dedicated lifecycle verifier command (`npm run verify:milestoneA`)

Done when:
- create/edit/deactivate all persist
- product list clearly reflects active/inactive status
- regression scripts still pass

### Milestone B - Fallback Policy Lock

Goal:
- codify when fallback is allowed and when write must fail fast
- remove ambiguous behavior in user-facing flows

Done when:
- per-feature policy table exists (DB required vs fallback allowed)
- all relevant API/UI messages match policy

### Milestone C - Full Operational E2E

Goal:
- one repeatable scenario covering: login -> create booking -> assign transport -> assign staff -> pickup update -> verify audit -> delete cleanup

Done when:
- one deterministic script/command runs full chain
- outputs are captured in log format suitable for handoff

## 6) Immediate Next Sprint (Recommended 3 Steps)

1. Lock Milestone B fallback policy table and enforce matching API/UI behavior.  
2. Build one integrated E2E verifier command from existing task24/26/29/30 blocks.  
3. Promote baseline verifier bundle as pre-merge checklist.

## 7) Guardrails For Future Work

- Keep `operations-dashboard.tsx` as orchestration layer unless a planned container refactor is approved.
- Do not mix schema/auth/refactor changes in one pass.
- Any behavior change must update Obsidian notes in the same pass.
- Prefer adding verification command coverage before expanding feature surface.
