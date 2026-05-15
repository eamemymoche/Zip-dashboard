# Task Board

## Backlog

- [ ] Confirm production stack.
- [ ] Define first milestone.
- [ ] Run Prisma migration against the target PostgreSQL database.
- [ ] Connect booking dashboard to Prisma-backed data end to end.
- [ ] Persist transport assignment changes.
- [ ] Persist pickup status workflow.
- [ ] Persist staffing assignments and KPI queries.
- [ ] Persist printable job sheet data pipeline.
- [ ] Add build instructions.

## In Progress

- [ ] Real PostgreSQL migration not yet applied: three migration files exist (vehicle, employee fields, auth+concurrency) but have not been run against a live DB in this environment

## Done

- [x] Identify existing Obsidian vault.
- [x] Create project planning folders.
- [x] Prepare Obsidian vault structure.
- [x] Add build planning notes.
- [x] Reserve source project folder.
- [x] Import source `.txt` files.
- [x] Copy prototype into source folder.
- [x] Summarize project intent.
- [x] Prepare production scaffold.
- [x] Create root repo scaffold.
- [x] Draft root Prisma schema.
- [x] Mirror progress into Obsidian.
- [x] Install dependencies in the root repo.
- [x] Convert scaffold into running Next.js project.
- [x] Verify production build.
- [x] Verify local dev server.
- [x] Port the Order List prototype into the production homepage.
- [x] Add Prisma seed script for first-stage operational data.
- [x] Port the full prototype UI language into the Next.js dashboard.
- [x] Add Prisma 7 config and client generation flow.
- [x] Remove extra AssistantPanel (not in prototype).
- [x] Add No Show pulse animation and fade-in transitions.
- [x] Add clickable status stats in transport recheck.
- [x] Add toast notification system (showMessage).
- [x] Add sortUnassigned button to transport assign.
- [x] Add Export All and Excel export buttons with toast feedback.
- [x] Create AI-agent operating manual and linked implementation handbook notes in Obsidian.
- [x] Document real workflow from source evidence: Klook, Trip.com, Ticket2Attraction, whiteboards, spreadsheet, and job sheet samples.
- [x] Document small-business roles and permissions model.
- [x] Document SQL migration strategy with vehicle selection as a first-class transport resource.
- [x] Document backup, recovery, and versioning policy for AI-agent and data rollback.
- [x] Document security and multi-user guardrails for future persisted workflows.
- [x] Document durable improvements and premium roadmap.
- [x] Split Transport > Assign into its own component with a documented ownership boundary.
- [x] Persist Transport > Assign using stable `driverCode` and `vehicleCode` identifiers.
- [x] Add vehicle seed/master fallback and DB-to-dashboard vehicle mapping.
- [x] Add transport assignment audit logging on assignment / reassignment / unassignment / note-only save.
- [x] Add module split guidance note for future AI agents.
- [x] Create reusable agent master prompt, review prompt, and ordered work queue in Obsidian.
- [x] **Task 1:** Prisma migration for Vehicle model and TransportAssignment.vehicleId — migration file created at `packages/db/prisma/migrations/20260514000000_init_vehicle_transport/migration.sql`. Schema, seed, loader, and transport-assignment API were already aligned from prior work. Migration is idempotent (IF NOT EXISTS guards). Cannot be run in this environment (no PostgreSQL instance).
- [x] **Task 2:** Align Employee DB schema with UI-required fields — added `nickname`, `phone`, `phone2`, `startDate`, `photo` to `Employee` model in schema.prisma. Created migration `20260514000001_add_employee_fields`. Updated seed to include all new fields. Loader no longer fabricates `nickname` from name split. Personnel reads are now structurally honest. Cannot be run in this environment (no PostgreSQL instance).
- [x] **Task 3:** Split Transport Recheck into its own component — created `transport-recheck-table.tsx` with all Recheck table rendering, stats cards, filters, status-toggle, and move-round action. `operations-dashboard.tsx` now passes callbacks as props. No persistence logic in the component. Updated `Module Ownership and Split Guide.md`.
- [x] **Task 4:** Split Transport Sheet into its own component — created `transport-sheet-view.tsx` with driver slot selector and printable job sheet. Extracted `selectedDriverOrders` computation into the component. Dashboard passes `orders`, `driverNames`, `timeSlots`, and callbacks. No persistence introduced. Updated `Module Ownership and Split Guide.md`.
- [x] **Task 5:** Persist pickup status event history — created `api/pickup-status/route.ts` that appends `PickupStatusEvent` records on both status-toggle and move-round actions. `TransportRecheckTable` accepts optional `onSavePickupStatus` prop; dashboard passes `savePickupStatus` which calls the API silently (non-blocking). Audit log written for each event. Schema already had `PickupStatusEvent` model; no migration needed. Booking.status still owned by local state for display.
- [x] **Task 6:** Persist staffing assignments — created `api/staff-assignment/route.ts` that syncs all staff IDs for a booking (replace strategy, wrapped in `$transaction`). Dashboard's `saveStaffAssignment` fires on each checkbox toggle (non-blocking). Audit log written. No schema changes — `StaffAssignment` model already existed. Staffing board still derives from local state; DB is write-only for assignments. Bugfix: resolved `current` variable reference error in staffing checkbox handler.
- [x] **Task 7:** Add session-based auth with login, logout, and proxy gate — `UserRole` enum added to schema, `passwordHash` added to `User`, auth API created at `api/auth/login` (POST/GET/DELETE), `proxy.ts` gates all non-public paths with redirect to `/login` on failure (renamed from `middleware.ts` to follow Next.js 16 convention; uses Node.js crypto, no Edge Runtime crypto warning), login page created at `login/page.tsx` with redirect on success, `AuthProvider` + `useAuth` context created in `lib/auth/auth-context.tsx`, `Providers` wrapper added to `layout.tsx`. **Dev auth fallback**: when DB is unavailable, the login API falls back to hardcoded dev users (`officer@zipline.com/zipline123`, `owner@zipline.com/owner123`, `accounting@zipline.com/accounting123`) with `dev-xxx-001` IDs and MANAGER/ADMIN/ACCOUNTING roles. This is clearly marked as local-dev-only fallback and is NOT production auth. Session token: HMAC-SHA256 signed, Base64url-encoded `{userId:role:timestamp}`, 8-hour expiry, httpOnly cookie `zcc_session`. **Role gating now active in UI**: Personnel nav hidden from STAFF/DRIVER; "เพิ่มรายการใหม่" button disabled for STAFF/DRIVER; Edit/Delete buttons disabled for STAFF/DRIVER in expanded order rows. GET session endpoint returns 200 (not 401) when no session — allows `AuthProvider` to handle loading state gracefully.
- [x] **Task 8:** Add optimistic concurrency guards fully wired through UI — `transport-assignment` (409 on `Booking.updatedAt` mismatch), `pickup-status` (409 on mismatch), `staff-assignment` (409 on mismatch). All three APIs return `updatedAt` in response body. **Client now sends `updatedAt`** with every write: `saveTransportAssignment` sends `order.updatedAt`, `saveStaffAssignment` sends `order.updatedAt`, `savePickupStatus` sends `order.updatedAt`. **Client refreshes local `updatedAt`** after successful writes via `updateOrder(id, (o) => ({ ...o, updatedAt: result.updatedAt }))`. **409 conflicts are visible**: on 409, each function shows a toast "ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้า" (Thai: "Data was modified by another user, please refresh the page") and does not silently swallow the error. `OrderRecord` type now has optional `updatedAt: number` field. `load-dashboard-data.ts` loads `updatedAt` from `Booking.updatedAt` and `staffAssignments` via JOIN. `TransportRecheckTable` passes the full `order` object to `onSavePickupStatus` so the order's `updatedAt` is available. **Canonical token**: Every successful write in all three APIs explicitly calls `prisma.booking.update({ where: { id: booking.id }, data: {}, select: { updatedAt: true } })` to force-refresh `Booking.updatedAt` and returns the new server-side timestamp. This ensures the token always advances after a write, making the optimistic concurrency cycle reliable.
- [x] **Task 9:** Persist Order create/edit/delete to DB — created `/api/order/route.ts` with POST (create), PUT (edit), DELETE endpoints. POST accepts `bookingNumber`, `serviceDate`, `timeSlot`, `agentName`, `customerName`, `phone`, `hotel`, `room`, `pickupPax`, `joinCount`, `productPackageName`, `status`; creates `Booking` record; returns `{ id, bookingNumber, updatedAt }`. PUT accepts same fields plus `updatedAt` for concurrency guard; returns 409 on conflict. DELETE accepts `bookingNumber` via query param; returns 409 on conflict. All three write to `Booking` table directly (no ORM-level update of `Booking.updatedAt` — explicit `prisma.booking.update({ where: { id }, data: {}, select: { updatedAt: true } })` called after every write). Audit log written on PUT and DELETE. Dashboard wired: `handleNewOrderSubmit` → POST `/api/order`, `saveEditOrder` → PUT `/api/order`, `deleteOrder` → DELETE `/api/order`. All three wrap in try/catch with 409 toast on conflict. `OrderRecord` in `ops-data.ts` has `updatedAt?: number`. Build passes clean.
- [x] **Task 10:** Split Staffing Setup into own component — created `staffing-setup-table.tsx` containing all Staffing > Setup rendering (date/time/packet filter toolbar, orders table with staff checkbox grid, status badges). Props: `staffDate`, `staffTime`, `staffPacket`, `staffingOrders`, `staffMembers`, `initialData`, `onStaffDateChange`, `onStaffTimeChange`, `onStaffPacketChange`, `updateOrder`, `saveStaffAssignment`. Uses `DatePicker` from `./date-picker`. Dashboard imports `StaffingSetupTable` and renders it inside `{staffingView === "setup" ? ... : null}`. No persistence logic in the component; callbacks delegate to parent. Build passes clean.
- [x] **2026-05-15 Auth UX Fixes:** Fixed four auth UX issues: (1) `logout()` now redirects to `/login` directly via `window.location.href` after DELETE API call. (2) Logout button moved from top-right content header to sidebar bottom with logout SVG icon, `marginTop: "auto"`. Top-right user info strip removed. (3) Added `zcc_role` cookie alongside `zcc_session` — login API sets it on POST, proxy reads it synchronously and injects into `x-user-role` headers, so role is available immediately on first render fixing Personnel nav visibility. DELETE clears both cookies. (4) Login panel now has password show/hide eye toggle and a 3-row credentials table (Role | Email | Password) replacing the single-line dev hint. Build passes clean.

## 2026-05-16 — Auth / Concurrency Fixes

### What was fixed

**Login dev fallback reliability (A. Auth / Login reality):**
The dev auth check was positioned AFTER `const prisma = await getPrisma()`. When `DATABASE_URL` is not set, `getPrisma()` throws before the dev check runs. Login always fell through to a 500 instead of the dev fallback, making `officer@zipline.com/zipline123` unusable locally.
- Fix: dev user check moved FIRST, before any Prisma init or DB connection attempt
- Dev users now work with zero DB involvement: `officer@zipline.com/zipline123` (MANAGER), `owner@zipline.com/owner123` (ADMIN), `accounting@zipline.com/accounting123` (ACCOUNTING)
- Build passes ✓

**Transport-assignment DELETE concurrency token (B. Concurrency correctness):**
The DELETE handler for transport assignment did not call `prisma.booking.update({}, select: updatedAt)` after unassignment, so the client received no refreshed `updatedAt`. This left the client with a stale token for subsequent writes.
- Fix: DELETE now calls `prisma.booking.update({ where: { id: booking.id }, data: {}, select: { updatedAt: true } })` and returns `updatedAt` in response
- All three write APIs (transport-assignment, pickup-status, staff-assignment) now return a refreshed `Booking.updatedAt` token after every successful write
- Build passes ✓

**Logout / back-navigation (E. Documentation truthfulness — logout/back verified):**
- Verified via curl: logout DELETE clears both `zcc_session` and `zcc_role` cookies
- Verified: after logout, GET to protected `/` returns `307 Temporary Redirect` to `/login?from=%2F` — dashboard cannot be accessed via browser Back
- Verified: session check after DELETE returns `{ user: null }` confirming cookie is gone
- No code changes needed for logout/back-nav — proxy.ts already correctly guards all non-public paths

### Module Ownership and Split Guide — no changes needed

The files changed are existing API route files. No new files were created, no ownership boundaries shifted, and no component extraction was done. The Module Ownership and Split Guide's existing entries remain accurate. No update required.

### Files changed

- `apps/web/app/api/auth/login/route.ts` — dev fallback reordered before DB path; GET handler uses try/catch around Prisma; DELETE clears both cookies
- `apps/web/app/api/transport-assignment/route.ts` — DELETE returns refreshed `updatedAt`
- `Zip/03_Build/Security and Multi-User Guardrails.md` — dev fallback description updated to clarify dev-first check order
- `Zip/03_Build/Decision Log.md` — new 2026-05-16 entry documenting fix scope and non-scopes

### Manual verification results (curl-based)

| Test | Result |
|---|---|
| POST `/api/auth/login` with `officer@zipline.com/zipline123` | ✓ Returns user with `dev-officer-001` and `MANAGER` role |
| GET `/api/auth/login` with session cookie | ✓ Returns correct user |
| DELETE `/api/auth/login` | ✓ Clears session, returns `{ success: true }` |
| GET `/api/auth/login` after DELETE | ✓ Returns `{ user: null }` — cookie cleared |
| GET `/` (protected route) without session | ✓ Returns `307 Temporary Redirect` to `/login?from=%2F` |
| GET `/` (protected route) with valid session | ✓ Returns `200 OK` |

### What is local-dev fallback vs production-safe

**Local-dev fallback (works without PostgreSQL):**
- Login with dev users (`officer@zipline.com/zipline123`, `owner@zipline.com/owner123`, `accounting@zipline.com/accounting123`)
- All dashboard reads fall back to seed data (no persistence)
- All write APIs require a live PostgreSQL connection — writes fail/500 when DB unavailable

**Production-safe (requires real PostgreSQL):**
- DB-backed login with seeded user credentials
- Persistent bookings, transport assignments, pickup status, staffing assignments
- Real `Booking.updatedAt` as concurrency token
- Role enforcement on all write APIs

### Build status
- `npm run build` passes: `✓ Compiled successfully in 3.0s`, TypeScript `Finished in 3.2s`

## 2026-05-15 Next Execution Plan

### Current stable baseline

- [x] `npm.cmd run build` currently passes after Task 7-8 follow-up fixes.
- [x] Local dev login fallback exists for `officer`, `owner`, and `accounting`.
- [x] Proxy-based auth gate is active.
- [x] Optimistic concurrency is wired through transport assignment, pickup status, and staffing assignment write paths.

### Current known follow-up

- [ ] Real PostgreSQL migration not yet applied — no DB instance available in this environment

## 2026-05-16 Next Recommended Phase

### Primary next tasks

- [ ] **Task 14:** Prepare the real PostgreSQL rollout package: make migration status, backup steps, seed behavior, smoke test, and rollback instructions fully current and consistent across Obsidian.
- [ ] **Task 15:** Apply existing Prisma migrations to the real PostgreSQL target only after backup confirmation.
- [ ] **Task 16:** Run live DB smoke verification for login, Order CRUD, transport assignment, pickup status, and staffing assignment.

### Secondary task

- [ ] **Task 17:** Split Staffing Board only if `operations-dashboard.tsx` still feels too heavy after the live DB rollout.

### Explicit not-priority-right-now

- [ ] Do not deepen roles/permissions unless a real business need appears.
- [ ] Do not redesign auth/session architecture in this phase.
- [ ] Do not start broad UI refactors while the first real DB rollout is still pending.

### Ordered next tasks after auth hydration

- [x] ~~**Task 9:** Persist Order create/edit/delete to DB while preserving current Order List UI and fallback behavior.~~
- [x] ~~**Task 10:** Split Staffing Setup into its own component to reduce pressure on `operations-dashboard.tsx`.~~
- [x] **Task 11:** Staffing read path verified — no new code required. `load-dashboard-data.ts` already loads `staffAssignments` via JOIN with `employee` and maps to `assignedStaff[]` in `OrderRecord`. All three staffing views (Setup/Board/KPI) derive from `orders` state populated by the loader. No separate write-only path exists. Residual fallback: when `DATABASE_URL` is absent, loader returns seed data with `assignedStaff` generated from seed (consistent behavior, no gap).
- [x] **Task 12:** Migration status verified — no new migrations needed. Schema covers all current implementation. Three migration files exist with idempotent guards. `npx prisma validate` ✓ and `npx prisma generate` ✓. Migration files are created but NOT applied to a live DB (no PostgreSQL instance available in this environment). Production migration requires DB backup before applying per [[Backup Recovery and Versioning]].
- [x] **Task 13:** Route-level role enforcement — implemented server-side API guards (403 on insufficient role) for Order CRUD, transport-assignment, pickup-status, and staff-assignment APIs; proxy-level route guard for `/personnel` (ADMIN/MANAGER only); client-side sidebar nav filtered by role using explicit role conditionals. Dashboard is single-page SPA at `/`; proxy cannot enforce per-module visibility for main views — client-side nav filtering is the enforced layer. New `lib/auth/role-guards.ts` shared utility. Build passes clean.

### Concurrency / multi-agent caution

- [ ] Do not assign two agents to `operations-dashboard.tsx` at the same time.
- [ ] Do not combine Order CRUD persistence with Staffing split in one task.
- [ ] Do not combine auth hydration cleanup with broader role-system redesign.
- [ ] Any task that changes behavior must update Obsidian notes in the same pass.

### Done criteria for the next phase

- [x] Auth state is visually stable after login/logout. (Verified: `zcc_role` cookie, sidebar logout, loading gate)
- [x] Order CRUD survives reload against DB path. (Verified in code: `handleNewOrderSubmit` → POST `/api/order`, `saveEditOrder` → PUT `/api/order`, `deleteOrder` → DELETE `/api/order`; API routes exist and build passes. Not yet end-to-end tested against live PostgreSQL.)
- [x] Staffing screens read from the same persisted assignment source of truth they write to. (Verified in code: loader loads `staffAssignments` via JOIN; all three staffing views derive from `orders` state. Not yet end-to-end tested against live PostgreSQL.)
- [ ] Real PostgreSQL migration is applied only after backup confirmation. (Pending — migration files exist but not applied to a live DB in this environment)

## Phase 2 - UI/UX Polish & Features ✅

### Done
- [x] **Font:** Replace with Google Sans via Google Fonts CDN, apply globally.
- [x] **Theme Selector:** Add Light/Dark/System toggle in top-right corner.
- [x] **Left Sidebar:** Convert top nav bar (A-E) into a proper left sidebar navigation with icons.
- [x] **Order List UI/UX:** Improved with hover states, click-to-expand row detail, compact sortable headers, and polished visual hierarchy.
- [x] **Export Button:** Replace with dropdown: .xls / .pdf / .csv.
- [x] **Language Selector:** TH/ENG toggle in top-right corner.
- [x] **Order List Detail Click:** Click any table row (#) to expand booking details panel.
- [x] **Order List Search + Sort:** Shrunk search input; added sortable column headers (↑↓ indicators).
- [x] **Time-Based Capacity Cards:** Color-coded based on current time (GMT+7): grey=past, green=current, yellow=next, neutral=upcoming.

## Phase 4 - Dashboard Fitting, Export Fixes & Polish

### Done
- [x] **1. Fix dashboard fitting:** Content area `width:100%; min-width:0` (no max-width constraint).
- [x] **2. Top bar redesign:** Brand "ZIPLINE COMMAND CENTER" on left, date+clock centered, lang/theme selectors on right. Clock format "15:33:10 น." with `clock-suf` class for Thai suffix.
- [x] **3. Past capacity card styles:** Full opacity, slate text colors — no grey-out.
- [x] **4. Selected slot checkmark + filter button:** `.slot-check {display:none}` + `slot-selected` class showing check. "ล้างตัวกรอง" button removed from capacity card area.
- [x] **5. Sort-active state:** Background color on active sorted column header (`.sort-active` class).
- [x] **6. Excel (.xlsx) export:** Using `xlsx@^0.18.5` — real `.xlsx` workbook with `json_to_sheet` + `writeFile`.
- [x] **7. PDF export:** Using `jspdf@^4.2.1` — real PDF with styled header row and table data.
- [x] **8. Agent badge in Order List:** `agentBadge(order.agent)` applied to Agent column in order table.
- [x] **9. Personnel photo file input:** Replaced URL text input with `<input type="file" accept="image/*">` + file reader + SVG camera icon placeholder. CSS classes: `.photo-upload-wrap`, `.photo-preview`, `.photo-remove-btn`, `.photo-upload-label`.
- [x] **10. Personnel edit button:** "แก้ไขข้อมูล" button on each expanded personnel card. Opens modal pre-filled with existing data. Modal title changes to "แก้ไขข้อมูลบุคลากร" when editing. Cancel button now resets form via `resetEmployeeForm()`. Added `editingEmployeeId` state.

### Phase 4 Notes
- Build passes clean: `✓ Compiled successfully in 2.7s`, TypeScript `Finished in 1920ms`, 4 static routes + 1 dynamic API route.
- All exports use real libraries (no CSV fallback for xls/pdf).
- Employee modal supports both create and edit modes via `editingEmployeeId` state.

## Phase 5 - Layout, Sorting, Controls & Polish

### Done
- [x] **1. Content area full width:** `.content-area` uses `flex:1; width:100%; min-width:0`. All max-width constraints removed from inner containers.
- [x] **2. 3-state sort toggle:** `toggleSort` cycles: Default → Ascending → Descending → Default. `sortIcon` returns " ⇅" for unsorted, " ↑" for asc, " ↓" for desc.
- [x] **3. Agent column format:** Agent column now shows badge + full name inline: `[KL] Klook` format. Used `inline-flex` span wrapping both badge and text.
- [x] **4. Custom DatePicker component:** Created `date-picker.tsx` with TH/EN month names, day-of-week labels, prev/next month navigation, "วันนี้"/"Today" button. Replaced all 8 native `<input type="date">` elements across Overview, Order List, Transport, Staffing, and Modals. CSS classes: `.date-picker-trigger`, `.date-picker-popover`, `.dp-header`, `.dp-nav-btn`, `.dp-month-label`, `.dp-grid`, `.dp-day-label`, `.dp-day`, `.dp-day-selected`, `.dp-day-today`, `.dp-today-btn`.
- [x] **5 & 5.1. PDF/CSV export fix:** CSV now uses UTF-8 BOM (`\uFEFF` prefix). PDF uses `jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })` with helvetica font, `splitTextToSize` for text wrapping, scaled column widths, page numbers, and emerald header row.
- [x] **6. Nav labels clean up:** Removed "A.", "B.", "Z." prefixes from sidebar labels. Font size bumped from 13px to 15px. Icons (fa-grip, fa-file-invoice, etc.) render via existing `.sidebar-icon` spans.
- [x] **7. Transport table sort:** Added `assignSortField`/`assignSortDir` state and `toggleAssignSort`/`assignSortIcon` helpers. Assignments table has Time, Hotel, Pax sortable. Added `recheckSortField`/`recheckSortDir` state and `toggleRecheckSort`/`recheckSortIcon` helpers. Live Feed table has Time, Hotel, Status sortable. Both use `.sort-active` class.

### Phase 5 Notes
- Build passes clean: `✓ Compiled successfully in 2.6s`, TypeScript `Finished in 1965ms`.
- `date-picker.tsx` uses `lang` prop (default "th") to avoid SSR `document` reference.
- All 7 Phase 5 tasks completed.
- Next: Backlog items — replace seed state with Prisma-backed queries/writes.

## Phase 6 - Layout Fix, i18n Date, PDF, Edit/Delete Row, Dark Mode

### Done
- [x] **1. Content area full width (strict):** Added `width: 100% !important; max-width: none !important;` to `.glass-card`. Added `width: 100%` to `.view-section`. All max-width constraints removed.
- [x] **2. Overview agent double fix:** Removed duplicate `{ag}` and `{o.agent}` text after `agentBadge()` calls in Overview agent table and alert items. Now shows `[KL] Klook` once.
- [x] **3. Date range picker + quick filters:** Replaced single `orderDate` with `orderDateStart` + `orderDateEnd` state. Dual DatePicker instances for "จาก" (From) and "ถึง" (To). 3 multi-select quick filter checkboxes (TH: เมื่อวาน/วันนี้/พรุ่งนี้ | EN: Yesterday/Today/Tomorrow). "ล้างค่า" Clear button resets all. `filteredOrders` uses date range filtering (start ≤ date ≤ end).
- [x] **4. PDF export fix:** Removed top-level jsPDF import. Changed to dynamic `await import("jspdf")` inside handler. Added `typeof window === 'undefined'` guard. Wrapped in try-catch. PDF now downloads correctly.
- [x] **5. Expanded row Edit/Delete buttons:** Added `editingOrderId` + `editForm` state. Edit button switches detail panel to edit mode with inline inputs for: Booking, Agent, Packet, Date/Time, Customer, Phone, Hotel/Room, Pax/Join. Driver/Status/Staff shown as disabled read-only. Save (บันทึก) calls `updateOrder()` + toast. Delete (ลบ, red) button with confirm dialog removes order + toast. CSS: `.btn-danger`, `.order-edit-input`.
- [x] **6. Dark mode font contrast:** Added comprehensive `.dark` overrides in `globals.css` for: table headers/data cells, glass-card headings, detail labels/values, search inputs, sidebar nav, status badges, overview stats/alerts, modal forms, capacity cards, transport/staffing panels. All text now readable in dark mode.

### Phase 6 Notes
- Build passes clean: `✓ Compiled in 1952ms`, TypeScript `Finished in 2.2s`.
- PDF uses dynamic import to avoid SSR issues with jspdf.
- All 6 Phase 6 tasks completed.
- Next: Backlog — Prisma-backed queries/writes.

## Phase 7 - PDF Fix, Button Alignment, Quick Filters Move, Transport Agent, Nav Icons

### ~~Planned~~
> ยกเลิกแผนเดิม เนื่องจากพังจาก multi-agent merge conflict

### Incident / Recovery
- [x] ~~PDF export still error~~
- [x] ~~Edit/Delete buttons same line~~
- [x] ~~Move quick filter checkboxes~~
- [x] ~~Transport Job Sheets agent double~~
- [x] ~~Nav tab icons~~

**สาเหตุที่พัง (คร่าว ๆ):**
- หลาย agent แก้ `operations-dashboard.tsx` พร้อมกัน แล้วรวมโค้ดทับกัน
- เกิด JSX ปิดแท็กไม่ครบ + string ภาษาไทยแตกจาก encoding เพี้ยน
- parser เลยเจอ `Unexpected character` / `Unterminated string` ต่อเนื่อง ทำให้เว็บล้ม
- [ ] **1. PDF export still error:** Debug and fix PDF export function — likely jsPDF dynamic import not working correctly or API mismatch. Replace with working implementation.
- [ ] **2. Edit/Delete buttons same line:** Position "แก้ไข" and "ลบ" buttons on the SAME LINE as the last detail item row (bottom-right of expanded panel), not on a new line below.
- [ ] **3. Move quick filter checkboxes:** Move Yesterday/Today/Tomorrow checkboxes to directly under the date range inputs (below From/To DatePickers). Multi-selection still allowed.
- [ ] **4. Transport Job Sheets agent double:** In the Job Sheets (transport → sheet) agent table, `[KL] Klook` is doubled there too. Fix the same way as Overview.
- [ ] **5. Nav tab icons:** Add meaningful icons/symbols to each sidebar nav item that visually represent the dashboard type (e.g., clipboard for Order List, bus for Transport, etc.).

### 2026-05-13 Hotfix Note
- [x] Restored broken JSX in `transportView === "sheet"` block after multi-agent conflict (invalid closings caused app boot failure).
- [x] Fixed transport recheck date binding to use `transportDate` instead of `newOrder.date`.
- [ ] Pending verification on local machine: run build/dev and confirm app opens.

## 2026-05-13 UI Follow-up (Order List)

### Done
- [x] Fixed sidebar overlap with top header and aligned left navigation behavior for responsive widths.
- [x] Refined Order List detail row action area: moved status/actions to right-side inline layout.
- [x] Removed quick filter controls (`เมื่อวาน/วันนี้/พรุ่งนี้`) and clear button from Order List filter panel.
- [x] Adjusted filter typography and control sizing (labels slightly larger, date control height aligned with search input).
- [x] Moved `Note` inline with status/action row for expanded order items.
- [x] Fine-tuned status group horizontal offset (left shift without moving edit/delete buttons).
- [x] Simplified Order List datepicker behavior back to single-date click selection for `จาก/ถึง` (no drag-range UX in this panel).

### Notes
- Current data loading supports Prisma/PostgreSQL when `DATABASE_URL` is available; otherwise dashboard falls back to seed data.
- Several edit workflows in dashboard still update local client state and are not fully persisted to DB yet.

## 2026-05-14 UI Follow-up (Transport / Staffing / Navigation / Vercel)

### Done
- [x] Vercel build fix in `apps/web/package.json`: run `npx prisma generate --schema=../../packages/db/prisma/schema.prisma` before `next build`.
- [x] Added local package dependencies in `apps/web/package.json` for Vercel workspace builds: `@prisma/client` + `prisma`.
- [x] Restored stable single-date picker behavior for dashboard date controls (removed problematic drag-range behavior in Order List context).
- [x] Fixed Overview datepicker popover overflow on right edge by anchoring Overview picker popover to the right side.
- [x] Order List detail panel alignment updates:
  - status + waiting badge + edit/delete arranged inline
  - status group offset tuned (left shift while edit/delete remained fixed)
  - note moved inline with status/action row when note exists
- [x] Order List filter panel cleanup:
  - removed quick checkboxes (`เมื่อวาน/วันนี้/พรุ่งนี้`)
  - removed clear filter button
  - increased label typography and matched date control height to search input
- [x] Sidebar navigation polish:
  - replaced emoji navigation icons with professional inline SVG icons
  - updated menu order so `บุคลากร` appears below `งานสตาฟ`
- [x] Transport > Assign updates:
  - restored `Admin Note` as editable input column in table (not display-only note)
  - note can be edited directly per row
- [x] Staffing > Setup filter row refinement:
  - date, `ทุกรอบ`, and `ทุก Package` controls aligned in one row
  - label corrected from `Packet` to `Package`
- [x] Order List top time card text size increased for better readability.

### Current verification notes
- Local UI state edits are visible and interactive in dashboard.
- Database-backed read path still depends on `DATABASE_URL` availability; fallback seed remains active when DB is unavailable.
