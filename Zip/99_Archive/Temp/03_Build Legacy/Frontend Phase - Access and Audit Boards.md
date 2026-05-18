# Frontend Phase - Access and Audit Boards

Status: Active  
Last updated: 2026-05-17  
Owner: Frontend-first execution

## Goal

Add 2 new frontend boards with clear visibility rules:

1. **User Access Board** (ตั้งค่า/เพิ่ม/แก้ไขสิทธิ์ user)
2. **Change Log Board** (ดูประวัติการแก้ไข แยกตามโดเมน)

This phase is UI-first. Keep backend changes minimal and scoped only when needed to support UI.

## Requested Roles (UI model)

- `SUPERADMIN`
- `ADMIN`
- `OFFICER`
- `ACCOUNT`
- `STAFF`
- `DRIVER`

Visibility for both new boards (phase baseline):

- visible: `SUPERADMIN`, `ADMIN`
- hidden: `OFFICER`, `ACCOUNT`, `STAFF`, `DRIVER`

## Board 1: User Access Board

### UI scope

- list users with: display name, email/login id, current role, active status
- add user (minimum fields)
- edit user role
- enable/disable user
- role filter and search

### v1 behavior rules

- role change requires confirmation dialog
- if save fails, keep previous UI state and show clear error
- do not show fake success

### v1 non-goals

- advanced policy builder
- org hierarchy
- batch import/export

## Board 2: Change Log Board

### UI scope

- one board with clear sub-tabs/sections by change domain:
  - Orders
  - Transport/Driver
  - Staffing
  - Personnel
  - Users
- each row shows: timestamp, actor, action, entity, before/after summary
- search by booking/user/entity id and date range

### v1 behavior rules

- read-only board
- pagination/incremental load
- when data unavailable, show explicit empty/error state

### v1 non-goals

- deep diff visualizer
- realtime stream
- external SIEM integrations

## Execution Plan (UI-first)

1. Add nav entry + route/view shell for both boards (visibility gated to `SUPERADMIN`/`ADMIN`).
2. Build board layout/state/filters with mock-contract adapter first (no backend blocking).
3. Wire data fetch and loading/error/empty states.
4. Wire create/edit/role-change actions in User Access Board.
5. Add smoke checks for board visibility and main interactions.
6. Update docs and queue.

## Definition of Done

- both boards visible only to `SUPERADMIN`/`ADMIN`
- core workflows usable:
  - User Access: list/add/edit role/enable-disable
  - Change Log: list/filter/search/domain tabs
- no misleading success states on failed saves
- Obsidian notes updated

---

## Agent Prompts (Copy-Paste)

### Prompt A - Agent: User Access Board

```text
Read first:
- C:\Users\Nuke\Desktop\Zip\Zip\01_Project\AI Agent Operating Manual.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\Roles and Permissions.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Module Ownership and Split Guide.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Frontend Phase - Access and Audit Boards.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Task Board.md

Task:
Implement Board 1 (User Access Board) in frontend.

Scope:
- Add nav/view for User Access Board.
- Visible only for SUPERADMIN/ADMIN.
- Build list + search/filter + add user + edit role + enable/disable actions.
- Keep UI-first; backend wiring can use existing APIs or temporary adapter if needed.
- Do not refactor unrelated modules.

Must report:
1) files changed
2) visibility logic used
3) what actions really persist vs mocked
4) test/verify steps run
5) remaining gaps
```

### Prompt B - Agent: Change Log Board

```text
Read first:
- C:\Users\Nuke\Desktop\Zip\Zip\01_Project\AI Agent Operating Manual.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Security and Multi-User Guardrails.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Frontend Phase - Access and Audit Boards.md

Task:
Implement Board 2 (Change Log Board) in frontend.

Scope:
- Add board with domain tabs: Orders, Transport/Driver, Staffing, Personnel, Users.
- Add list view with timestamp/actor/action/entity/before-after summary.
- Add filters: date range + keyword search + domain.
- Visible only for SUPERADMIN/ADMIN.
- Read-only board.
- Keep UX dense and scan-friendly (operations dashboard style, not marketing layout).

Data contract (minimum):
- log item: id, timestamp, actorDisplay, actorRole, domain, action, entityType, entityId, beforeSummary, afterSummary
- query params: domain, q, fromDate, toDate, page, pageSize
- fallback: if API unavailable, show error banner + empty table state (no fake data persistence claim)

Acceptance criteria:
- tab switch updates domain filter and active tab state
- filters are combinable (domain + date range + keyword)
- clear loading, empty, error states
- table column widths do not jump between states
- mobile still readable (stacked row summary is acceptable)

Must report:
1) files changed
2) tab/filter behavior
3) data source and fallback behavior
4) verify steps run
5) unresolved limitations
6) screenshot or textual proof of each tab rendering
```

### Prompt C - Agent: Integration + Guardrails

```text
Read first:
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Frontend Phase - Access and Audit Boards.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Task Board.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Decision Log.md

Task:
Integrate both new boards into dashboard navigation and finalize frontend guardrails.

Scope:
- Ensure role visibility gating is enforced consistently.
- Ensure save failures do not produce fake success.
- Add/update minimal verification script(s) for:
  - board visibility by role
  - key action success/failure states
- Update Task Board and Decision Log.
- Keep changes narrow: do not refactor unrelated dashboards.

Mandatory checks:
- SUPERADMIN and ADMIN can open both new boards
- OFFICER/ACCOUNT/STAFF/DRIVER cannot see nav entry and cannot access board view via direct state switch
- User Access API calls return actionable error toasts (403/409/503 paths)
- Change Log board handles API error without white screen

Deliverables:
- integration code changes
- verification command(s) and output sample
- Obsidian updates (Task Board + Decision Log + this phase note if scope changed)

Must report:
1) integration points touched
2) guardrail checks added
3) regression risk notes
4) docs updated
5) exact residual risk list (max 5 bullets)
```

### Prompt D - Aggregator (Combined Report)

```text
You are the aggregator agent.

Input:
- outputs from Agent A, B, C
- current git diff/status
- updated Obsidian notes

Produce one consolidated report with this exact structure:

1) Scope completed
- User Access Board:
- Change Log Board:
- Integration:

2) Role visibility matrix (actual)
- SUPERADMIN:
- ADMIN:
- OFFICER:
- ACCOUNT:
- STAFF:
- DRIVER:

3) Persistence truth table
- feature/action | persisted | endpoint/source | fallback behavior

4) Verification evidence
- commands run
- key pass/fail outputs
- what is not yet verified

5) Risks and follow-ups
- P0/P1 issues
- recommended next task (single best next step)

6) Obsidian sync
- files updated
- summary of what changed in each

7) Release readiness quick verdict
- Ready for internal demo? (Yes/No + reason)
- Blockers to merge? (list)
- Suggested owner for each blocker
```
