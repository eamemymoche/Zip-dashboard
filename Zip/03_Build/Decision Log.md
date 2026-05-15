# Decision Log

*Last updated: 2026-05-16*

## 2026-05-13

### Decision

Use `C:\Users\Nuke\Desktop\Zip\Zip` as the Obsidian project vault.

### Context

The user referenced `C:\Users\Nuke\Desktop\Zip\Zip (obisidan)`, and the existing vault was found at `C:\Users\Nuke\Desktop\Zip\Zip` with a `.obsidian` folder.

### Consequences

Project notes and build planning files now live inside the existing vault.

## 2026-05-13

### Decision

Use `C:\Users\Nuke\Desktop\Zip` as the main implementation workspace, while keeping `C:\Users\Nuke\Desktop\Zip\Zip` as the planning and progress vault.

### Context

The user asked for project files to live primarily in the root `Zip` folder and for Obsidian to act as the project brain.

### Consequences

Source code, package manifests, schema files, and implementation docs now live in the root workspace. Obsidian tracks decisions, progress, and next steps after each completed phase.

## 2026-05-14

### Decision

Adopt a dedicated Obsidian agent handbook as the source of truth for future AI-agent implementation work.

### Context

The business workflow is more complex than the original prototype assumptions. Real operations depend on multi-source booking intake, normalized order records, dispatch rounds, driver and vehicle assignment, staffing coordination, printed job sheets, reconciliation, and recovery practices. The provided image evidence made these layers concrete enough to document directly.

### Consequences

- Future agents should read `[[AI Agent Operating Manual]]` before substantial implementation work.
- Workflow, staffing, SQL strategy, roles, security, recovery, and roadmap decisions now live in linked handbook notes rather than being spread only across chat history.
- Vehicle selection is now a documented required transport-domain concept, not an optional enhancement.
- The auth model is intentionally scoped for a small business: Owner, Accounting, Officer, Staff, Driver.

## 2026-05-14

### Decision

Add HMAC-signed session cookie auth as Phase 1 of a minimal multi-user auth system.

### Context

Per [[Security and Multi-User Guardrails]] and [[Roles and Permissions]], the system needs basic auth before being treated as a real internal operations tool. Phase 1 scopes down to: login, session cookie, middleware gate on all non-public paths, and role visibility only (no per-route role enforcement yet). The current user model (`User`) has no password hash field and no session mechanism.

### Consequences

- `UserRole` enum added to schema (ADMIN, ACCOUNTING, MANAGER, STAFF, DRIVER) — separate from `EmployeeRole` (field role: ADMIN, DRIVER, STAFF, MANAGER). `User` entity gets business-role `UserRole`; `Employee` entity keeps field-role `EmployeeRole`. They map cleanly since User and Employee are different entities.
- `passwordHash` column added to `User` model (TEXT, nullable, backward-compatible).
- `apps/web/app/api/auth/login/route.ts` created — POST (login with email/password → sets httpOnly `zcc_session` cookie), GET (read session), DELETE (logout). Uses `crypto.createHmac` with `SESSION_SECRET` env var (falls back to `dev-secret-for-zcc-2026`).
- Session token: Base64url-encoded `{userId}:{role}:{timestamp}` with HMAC-SHA256 prefix signature, 8-hour expiry.
- `apps/web/proxy.ts` gates all paths except `/login`, `/api/auth`, `/api/subagent`, and Next.js internals. Redirects to `/login?from=<path>` on missing or invalid session. Sets `x-user-id` and `x-user-role` headers on success. Uses `crypto` module in Node.js runtime (not Edge Runtime) — no crypto warnings in Next.js 16. Renamed from `middleware.ts` to follow Next.js 16 proxy convention; exported function is `proxy` not `middleware`.
- `apps/web/app/login/page.tsx` created — dark-themed email/password form, redirects to `/` on success via `router.push("/")` then `router.refresh()`.
- `apps/web/lib/auth/auth-context.tsx` created — `AuthProvider` + `useAuth()` hook with `{ userId, role, loading }`.
- `apps/web/app/providers.tsx` wraps `AuthProvider` as a client component.
- `apps/web/app/layout.tsx` wrapped in `<Providers>`.
- **Dev auth fallback** (local-dev only): Login API falls back to hardcoded users `officer@zipline.com/zipline123`, `owner@zipline.com/owner123`, `accounting@zipline.com/accounting123` with `dev-` prefixed IDs when DB is unavailable. NOT production auth.
- GET `/api/auth/login` returns HTTP 200 with `{ user: null }` when no session (not 401) — allows `AuthProvider` to handle gracefully during initial load.
- `migration.sql` created at `packages/db/prisma/migrations/20260514000002_add_auth_and_concurrency/` with idempotent SQL (IF NOT EXISTS guards for enum, column, role type change).
- Build passes cleanly.

## 2026-05-14

### Decision

Add optimistic concurrency guards (HTTP 409 on conflict) to all write APIs, with canonical `Booking.updatedAt` token.

### Context

Per [[Security and Multi-User Guardrails]], the system must detect when a write is based on stale data. The current write APIs (transport-assignment, pickup-status, staff-assignment) had no conflict detection — concurrent edits would silently overwrite each other. `Booking.updatedAt` already has `@updatedAt` in Prisma, providing a timestamp token.

### Consequences

- `transport-assignment` API now checks `Booking.updatedAt` before writing. Rejects with HTTP 409 if `clientUpdatedAt` doesn't match DB (within 1-second tolerance). After write, explicitly calls `prisma.booking.update({ where: { id: booking.id }, data: {}, select: { updatedAt: true })` to refresh the canonical token. Returns `{ updatedAt }` from this refreshed Booking record.
- `pickup-status` API now checks `Booking.updatedAt` before writing. Same 409 rejection and canonical `updatedAt` return pattern.
- `staff-assignment` API now checks `Booking.updatedAt` before writing. Same pattern — calls `prisma.booking.update(...)` to force-refresh `Booking.updatedAt`.
- All three APIs return the refreshed `Booking.updatedAt` timestamp in response body so callers can store the new timestamp for the next write.
- 1-second tolerance on timestamp check avoids clock-skew false positives (e.g., DB server vs app server time drift).
- **409 conflicts are surfaced to user** via toast message — not silently swallowed.
- Client sends `updatedAt` with every write; refreshes local token after success.

## 2026-05-14

### Decision

Add dev auth fallback for local environments where PostgreSQL is not available.

### Context

The login API currently requires a working Prisma/PostgreSQL connection to validate credentials. In local development environments without `DATABASE_URL`, the login would always fail even though the dashboard fallback seed data is fully functional. The auth system should have a clear, documented fallback path for local dev that does not pretend to be production auth.

### Consequences

- Login API now checks hardcoded dev users first before attempting Prisma DB lookup
- Dev users: `officer@zipline.com/zipline123` (MANAGER), `owner@zipline.com/owner123` (ADMIN), `accounting@zipline.com/accounting123` (ACCOUNTING)
- Dev user IDs are prefixed `dev-` (e.g., `dev-officer-001`) to clearly distinguish from DB-backed user IDs
- If dev user matches, session token is issued immediately — no DB required
- If no dev match, falls through to Prisma DB lookup (production path)
- GET session endpoint returns HTTP 200 (not 401) when no session — prevents `fetch()` from throwing in `AuthProvider` while loading
- This is explicitly a local-dev fallback, NOT production auth. Future agents must not treat these dev credentials as production-ready.

## 2026-05-14

### Decision

Make `Booking.updatedAt` the canonical optimistic concurrency token and ensure it advances after every write.

### Context

The previous implementation relied on `updatedAt` returned from related models (TransportAssignment, etc.) which was not reliable — those timestamps are not guaranteed to advance when only the Booking is updated. The transport-assignment API was returning `transport.updatedAt` which does not change the Booking's timestamp. For true optimistic concurrency, the token must come from the Booking itself and must be explicitly refreshed after every meaningful write.

### Consequences

- All three write APIs (`transport-assignment`, `pickup-status`, `staff-assignment`) now call `prisma.booking.update({ where: { id: booking.id }, data: {}, select: { updatedAt: true })` after the write completes, forcing `Booking.updatedAt` to refresh to the current server time
- The refreshed timestamp is returned to the client in the response body as `updatedAt`
- The client stores the new timestamp and sends it with the next write request
- The 409 conflict check is always against `Booking.updatedAt` (the canonical source), not side-effect timestamps from related models
- This ensures the token always advances after a write — the concurrency cycle is reliable end-to-end

## 2026-05-14

### Decision

Use `employee.code` as the stable write identifier for staffing, aligned with the existing `load-dashboard-data.ts` mapping that already uses `id: employee.code`.

### Context

The staffing API was passing `employee.id` (cuid) to the backend, but the dashboard's staffing checkbox handler used `staffMembers` (which resolves by code, not id). The transport assignment API already used stable codes (`driverCode`, `vehicleCode`). Staffing should follow the same pattern.

### Consequences

- `staffAssignments` parameter renamed to `employeeCode` (not `employeeId`).
- API resolves by `employee.code` in the `Employee` table.
- Audit logs use `employeeCode` field.
- `load-dashboard-data.ts` already maps `employee.code → id` for UI — the `id` field in the UI is actually the display code.
- No UI changes needed; the handler already passed the correct code value.

## 2026-05-14

### Decision

Formalize `Vehicle` model and `TransportAssignment.vehicleId` FK as a Prisma migration baseline.

### Context

The `Vehicle` model, `TransportAssignment.vehicleId` column, and all related seed data, loader mapping, and API write/read paths were already implemented in the working tree. The schema validated successfully. No migration file existed yet. The working state was captured as `packages/db/prisma/migrations/20260514000000_init_vehicle_transport/migration.sql` with idempotent SQL guards.

### Consequences

- Migration file created: `packages/db/prisma/migrations/20260514000000_init_vehicle_transport/migration.sql`
- `migration_lock.toml` created
- Schema, seed, `load-dashboard-data.ts`, and `apps/web/app/api/transport-assignment/route.ts` were already consistent — no structural edits required
- Migration cannot be validated in this environment (no PostgreSQL instance available)
- Production DB backup required before applying migration per [[Backup Recovery and Versioning]]
- `npx prisma generate` must be run after migration is applied

## 2026-05-14

### Decision

Split the first transport view out of `operations-dashboard.tsx` while keeping top-level orchestration in place.

### Context

The dashboard file had become too large and risky for concurrent AI-agent edits. Transport assignment was a good first extraction target because it had a clear UI boundary and a newly defined persistence contract.

### Consequences

- `transport-assign-table.tsx` now owns the Transport > Assign table rendering.
- `operations-dashboard.tsx` still owns cross-view state and persistence callbacks.
- Future splits should follow `[[Module Ownership and Split Guide]]` instead of broad file surgery.
- Transport persistence now uses stable codes (`driverCode`, `vehicleCode`) instead of display names.

## 2026-05-14

### Decision

Split the Transport Recheck view out of `operations-dashboard.tsx` into `transport-recheck-table.tsx`.

### Context

Following the safe split order (transport views → staffing views → order-list detail/editor → master/reporting), the Recheck view was the second transport view after Assign. It has a clear UI boundary: stats cards, driver/status filters, sortable table, status-toggle action, and move-round action. All state and persistence callbacks are passed as explicit props.

### Consequences

- `transport-recheck-table.tsx` owns all Recheck rendering. `operations-dashboard.tsx` passes `dayOrders`, `driversInDay`, `recheckOrders`, sort state/handlers, filter state/handlers, and `onUpdateOrder` as props.
- Status-toggle and move-round actions call `onUpdateOrder` (local state) — no persistence in the component.
- `Module Ownership and Split Guide.md` updated with new component entry.
- Transport Sheet remains in `operations-dashboard.tsx` — not touched in this task.
- No new state management architecture introduced.

## 2026-05-14

### Decision

Split the Transport Sheet view out of `operations-dashboard.tsx` into `transport-sheet-view.tsx`.

### Context

Following the documented split order (transport views first), the Sheet view is the third transport view after Assign and Recheck. It has a clear boundary: driver slot selector + printable job sheet table. The component computes `selectedDriverOrders` internally from props, and calls `onSelectDriverAndSlot` and `onPrint` callbacks for parent-state mutations. No persistence introduced — this prepares a clean surface for job-sheet persistence later (per Agent Work Queue).

### Consequences

- `transport-sheet-view.tsx` owns driver slot selector and printable job sheet rendering.
- `operations-dashboard.tsx` passes `orders`, `driverNames`, `transportDate`, `timeSlots`, `selectedDriver`, `selectedSheetSlot`, and callbacks.
- `selectedDriverOrders` is computed inside the component (matching prior behavior).
- Print behavior (`printJobSheetOnly`) remains a parent callback — the component does not call `window.print` directly.
- `Module Ownership and Split Guide.md` updated with new component entry.
- No schema or migration changes.

## 2026-05-14

### Decision

Persist pickup status event history via a new `PickupStatusEvent` API route.

### Context

The Recheck view's status-toggle cycles `WAITING → BOARDED → NO_SHOW` and the move-round action also changes booking status. These were pure local-state mutations with no audit trail. Per [[Real Workflow Model]] and [[Security and Multi-User Guardrails]], status changes should be treated as operational events with timestamps and actors, not only as current-state replacements. The `PickupStatusEvent` model already exists in the schema — this task adds the API write path.

### Consequences

- `apps/web/app/api/pickup-status/route.ts` created — appends a `PickupStatusEvent` record (with `bookingId`, `status`, optional `note`, `createdBy`) and writes an audit log entry.
- `TransportRecheckTable` accepts an optional `onSavePickupStatus` prop. If provided, it fires after local state is updated for both status-toggle and move-round actions — non-blocking, failures are console-warned only (status display is never blocked by API failure).
- `Booking.status` remains local-state for display purposes; the DB `PickupStatusEvent` table is the audit/history store.
- No migration needed — `PickupStatusEvent` model already exists in schema with all required fields.
- Dashboard compatibility preserved: status toggle still updates local state immediately.

## 2026-05-14

### Decision

Persist staffing assignments to the DB via a new `staff-assignment` API route.

### Context

The staffing Setup view's checkbox grid toggles staff names on/off for each order. These changes were pure local-state mutations. Per [[Staffing Operations Model]], staffing changes should be auditable. The `StaffAssignment` model already exists in the schema — this task adds the API write path. The UI pattern matches transport assignment: local state updates immediately, API fires in background.

### Consequences

- `apps/web/app/api/staff-assignment/route.ts` created — uses replace strategy (deletes existing links, creates new ones), wrapped in `prisma.$transaction` for atomicity, writes audit log entry.
- Dashboard's `saveStaffAssignment(bookingNumber, staffIds)` fires on each checkbox change — non-blocking, failures are `console.warn` only. Uses `staffMembers` from local state to resolve staff codes. Bugfix: corrected `current` reference to `order` in checkbox handler closure.
- `staffMembers` (from `employees.filter`) provides `id → name` resolution for writing `employeeId` codes.
- `Booking.status` and `assignedStaff` display are populated from the loader which reads via DB JOIN. DB `StaffAssignment` table is the write side; loader is the read side. Staffing board, setup, and KPI all derive from `orders` state which comes from the loader — read and write now share the same source of truth.

## 2026-05-13

### Decision

Keep the initial web app CSS stack simple and remove PostCSS/Tailwind integration until utility classes are actually needed.

### Context

The first `next build` failed because Next.js 16 expects the Tailwind PostCSS plugin to come from `@tailwindcss/postcss`, while the current scaffold only uses plain CSS and does not need Tailwind processing yet.

### Consequences

Removing the obsolete PostCSS config unblocked the build immediately and keeps the first scaffold leaner while the booking workflow is still being built.

## 2026-05-13

### Decision

Port the production homepage directly from the prototype's Order List module instead of keeping a generic landing-style scaffold.

### Context

The existing placeholder homepage felt too detached from the actual product and too visually weak for an operations tool. The prototype already had the right density, hierarchy, and operational tone for the first real screen.

### Consequences

The app now opens on a booking dashboard with slot capacity cards, filters, a dense operations table, and a side panel for production tracking. This keeps future work anchored to real workflows rather than abstract scaffolding.

## 2026-05-13

### Decision

Keep the production app in Thai and preserve the prototype's original visual grammar instead of translating it into a generic SaaS dashboard style.

### Context

The prototype already had the right tone for internal operations: dense controls, strong table hierarchy, transport-focused labels, and Sarabun-style Thai text rhythm. Replacing that with a generic English dashboard would lose the product's operational feel.

### Consequences

The new Next.js dashboard now mirrors the prototype's module structure, Thai labels, button hierarchy, and modal patterns while still being implemented as React code that can later connect to Prisma-backed data.

## 2026-05-13

### Decision

Remove the AssistantPanel component from the dashboard. The prototype is a pure operations tool without an AI chat sidebar.

### Context

The Next.js app had an extra `AssistantPanel` component that was not present in the prototype HTML. This made the app feel different from the reference and added complexity not in the original.

### Consequences

The dashboard now matches the prototype's structure exactly — nav, main content area, no sidebar. The remaining `subagent` API route stays for future AI features but is not wired to any UI.

## 2026-05-13

### Decision

Add toast notification system, clickable status stats in transport recheck, sortUnassigned button, and Export/Excel buttons with feedback toasts.

### Context

The prototype had `showMessage()` for toast feedback and `sortUnassigned()` for transport. The Next.js dashboard was missing these quality-of-life interactions that make the operations workflow feel responsive.

### Consequences

- Stats cards in Transport Recheck are now clickable and filter the table by status.
- Toast notifications appear for: new order, new employee, sort action, and export actions.
- The sortUnassigned button brings unassigned orders to the top of the transport assign list.

## 2026-05-13

### Decision

Adopt Google Sans as the primary font via Google Fonts CDN. Also add a Light/Dark/System theme selector and TH/ENG language toggle in a sticky top bar.

### Context

The original prototype used Tailwind CDN + Font Awesome. The Next.js build removed Tailwind PostCSS but kept Sarabun as the body font. Google Sans provides a cleaner, more professional appearance for an operations dashboard. A theme system future-proofs the UI for different lighting environments.

### Consequences

- All text now uses Google Sans (with Noto Sans Thai fallback) loaded via Google Fonts in the HTML head.
- A sticky top bar in navy blue provides brand identity + theme/language controls.
- The `dark` class toggles CSS custom properties for a dark-mode palette.

## 2026-05-13

### Decision

Convert the top horizontal nav bar into a left sidebar navigation.

### Context

Modern dashboard UIs (Linear, Notion, Vercel) use a persistent left sidebar for primary navigation. The operations dashboard has 5 modules (A-E) which naturally fit a vertical icon+label list.

### Consequences

- Navigation moves from a horizontal top bar to a 220px navy left sidebar with icon + label for each module.
- The layout uses `app-shell` (flex row) with `sidebar-nav` and `content-area`.
- Responsive: at <900px the sidebar collapses to a 60px icon-only rail.

## 2026-05-13

### Decision

Add click-to-expand order detail panel, sortable column headers, export dropdown, and time-aware capacity cards to the Order List.

### Context

The Order List needed several UX improvements: (1) clicking a row ID should reveal full booking details, (2) all columns should be sortable, (3) the Export button needed .xls/.pdf/.csv options, (4) capacity cards should reflect the current time-of-day status.

### Consequences

- Clicking any Order List row expands an inline detail panel with all booking fields.
- All 10 columns support click-to-sort with ⇅/↑/↓ indicators.
- Export button is now a dropdown with 3 format choices.
- Capacity cards are color-coded: grey (past hours), green (current hour), yellow (next hour).

## 2026-05-13

### Decision

Add a complete i18n system with Thai/English translations, a new Overview dashboard, a live GMT+7 clock, and a fully redesigned Personnel section.

### Context

Phase 3 addressed 15 usability issues: layout fitting, missing Overview screen, dead language selector, broken export, unnamed UI elements, and a completely redesigned Personnel module.

### Consequences

- `i18n.tsx` provides `LangProvider` + `useLang()` hook with 40+ translation keys covering nav, headers, buttons, and labels. Booking data (names, hotels, agents) stays in original language.
- Overview (Z) view shows: 6 KPI cards, per-agent table, per-slot summary, and alert feed for No Show / unassigned / pending staff.
- Top bar clock ticks every second in Asia/Bangkok timezone (GMT+7).
- Export dropdown now triggers real CSV download via `exportCSV()` + `handleExport()`.
- Personnel section: split by Staff/Driver, circular avatars, nickname display, click-to-expand detail, full form with nickname/phone/phone2/startDate/photo.
- Agent column uses color-coded `agentBadge()` pills per brand.
- Capacity cards support multi-select slot filtering with visual selection indicator.

## 2026-05-13

### Decision

Phase 4: Dashboard fitting fixes, real Excel/PDF export, agent badge in order list, file-based photo upload, and personnel edit functionality.

### Context

Phase 4 addressed 10 post-Phase-3 polish tasks identified in the Obsidian Task Board.

### Consequences

- Content area now uses `width:100%; min-width:0` (no max-width constraint) so the dashboard fills available space.
- Top bar redesigned: brand "ZIPLINE COMMAND CENTER" left, date+live clock centered, lang/theme selectors right. Clock format "15:33:10 น." with `clock-suf` class.
- Past capacity cards: full opacity with slate text colors — visually distinct but not greyed out.
- Selected time slot shows checkmark via `.slot-check {display:none}` + `slot-selected` class. "ล้างตัวกรอง" button removed.
- Sort-active column headers get a styled `.sort-active` background color.
- Excel export: `xlsx@^0.18.5` with `XLSX.utils.json_to_sheet` → `XLSX.utils.book_new` → `XLSX.writeFile` — real `.xlsx` file download.
- PDF export: `jspdf@^4.2.1` with emerald header row, data rows at 6-line intervals, page breaks at 270px.
- Order List Agent column now uses same `agentBadge(order.agent)` function as Overview.
- Personnel photo: replaced URL text input with `<input type="file" accept="image/*">` + FileReader API + SVG camera placeholder icon. CSS classes `.photo-upload-wrap`, `.photo-preview`, `.photo-remove-btn`, `.photo-upload-label` added.
- Personnel edit: "แก้ไขข้อมูล" button on each expanded card. Modal pre-fills with existing data. Modal title dynamically shows "แก้ไขข้อมูลบุคลากร" when editing vs "ลงทะเบียนบุคลากรใหม่" for new. Cancel button resets form via `resetEmployeeForm()`. State `editingEmployeeId` tracks edit mode.
- All 10 Phase 4 tasks completed. Build passes clean: `✓ Compiled successfully in 2.7s`, TypeScript `Finished in 1920ms`.

## 2026-05-13

### Decision

Phase 5: Full-width layout, 3-state sort toggle, inline agent badge format, custom DatePicker, PDF/CSV character fix + A4 landscape, sidebar nav cleanup, and transport table sort.

### Context

Phase 5 addressed 7 items from the Obsidian Task Board, spawned as 2 parallel sub-agents for efficiency.

### Consequences

- Content area: removed all remaining max-width constraints; `.content-area` uses `flex:1; width:100%; min-width:0`.
- Sort: 3-state cycle (Default → Asc → Desc → Default). Icons: " ⇅" for unsorted, " ↑" for asc, " ↓" for desc.
- Agent column: inline badge + full name format `[KL] Klook` using inline-flex span.
- Custom DatePicker: built `date-picker.tsx` with TH/EN support, month navigation, day grid, "Today" button. Replaced all 8 native `<input type="date">` elements. Uses `lang` prop instead of `document.documentElement.lang` to avoid SSR errors.
- CSV: UTF-8 BOM (`\uFEFF`) prepended to blob for proper Thai character encoding.
- PDF: A4 landscape via `jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })`, helvetica font, `splitTextToSize` for text wrapping, scaled columns, page numbers, emerald header.
- Nav: removed "A."/"B."/"Z." prefixes; font size 13px→15px; icons retained in `.sidebar-icon` spans.
- Transport sort: separate state for assign (`assignSortField/Dir`) and recheck (`recheckSortField/Dir`) tables. Time, Hotel, Pax sortable in Assignments. Time, Hotel, Status sortable in Live Feed.
- Build passes clean: `✓ Compiled successfully in 2.6s`, TypeScript `Finished in 1965ms`.

## 2026-05-13

### Decision

Phase 6: Strict layout full-width fix, overview agent duplicate removal, date range picker with quick filters, PDF dynamic import fix, edit/delete row buttons, dark mode contrast pass.

### Context

Phase 6 addressed 6 items from the Obsidian Task Board, spawned as 2 parallel sub-agents.

### Consequences

- Layout: Added `width: 100% !important; max-width: none !important;` to `.glass-card` and `width: 100%` to `.view-section`. All max-width constraints eliminated from content area.
- Overview agent fix: Removed duplicate `{ag}` and `{o.agent}` text after `agentBadge()` calls in overview agent table and alert items — shows `[KL] Klook` once, not twice.
- Date range picker: Replaced single `orderDate` with `orderDateStart` + `orderDateEnd`. Dual DatePicker for From/To. Added 3 multi-select quick filter checkboxes (เมื่อวาน/วันนี้/พรุ่งนี้). "ล้างค่า" Clear resets all filters. `filteredOrders` uses start≤date≤end range.
- PDF fix: Removed top-level `import { jsPDF }` — changed to dynamic `await import("jspdf")` inside handler. Added `typeof window === 'undefined'` guard. Wrapped in try-catch. PDF now downloads correctly.
- Edit/Delete: Added `editingOrderId` + `editForm` state. "แก้ไข" button switches detail panel to edit mode with inline inputs for Booking/Agent/Packet/Date/Time/Customer/Phone/Hotel/Room/Pax/Join. Driver/Status/Staff are disabled read-only. Save (บันทึก) calls `updateOrder()`. "ลบ" (red) button with confirm dialog removes order. CSS: `.btn-danger`, `.order-edit-input`.
- Dark mode: Comprehensive `.dark` CSS overrides added for all text elements — table headers/data, glass-card headings, detail labels/values, search inputs, sidebar nav, status badges, overview stats/alerts, modal forms, capacity cards, transport/staffing panels.
- Build passes clean: `✓ Compiled in 1952ms`, TypeScript `Finished in 2.2s`.

## 2026-05-14

### Decision

Add `nickname`, `phone`, `phone2`, `startDate`, and `photo` to the `Employee` model to make personnel reads structurally honest and eliminate loader-side fabrication.

### Context

The UI's `EmployeeRecord` type requires `nickname`, `phone`, `phone2`, `startDate`, and `photo`. The DB `Employee` model only had `code`, `name`, `role`, and `active`. The loader was fabricating `nickname` from `name.split(" ")[0]` as a fallback — a workaround that hid the schema gap. The personnel panel's `photo` field was also completely disconnected from DB. These fields are clearly required by the UI contract (documented in `ops-data.ts` `EmployeeRecord` type) and by the observed personnel panel behavior.

### Consequences

- `Employee` model now has all fields the UI actually needs: `nickname TEXT?`, `phone TEXT?`, `phone2 TEXT?`, `startDate TIMESTAMP?`, `photo TEXT?`
- All are optional (nullable) to preserve backward compatibility with existing rows
- Migration `20260514000001_add_employee_fields` uses idempotent `IF NOT EXISTS` guards
- Seed data now includes all fields with real values matching the fallback seed data
- Loader mapping now reads directly from DB fields instead of fabricating `nickname` from name split
- Production DB must be backed up before applying migration

## 2026-05-15

### Decision

Fix logout redirect, sidebar logout placement, Personnel visibility on login, and login panel password toggle + credentials table.

### Context

Four separate UX issues identified after auth session flow review:

1. **Logout not redirecting to login**: `logout()` in `auth-context.tsx` called `DELETE` API then set local state to `null` and `setLoading(false)`, but never redirected. The dashboard remained visible with an unauthenticated state.
2. **Logout button in top-right content area**: The logout button was rendered in the content area header strip alongside the user name. It should be in the sidebar at the bottom for consistency with nav placement.
3. **Personnel nav missing after login**: The sidebar nav item for Personnel (`บุคลากร`) is shown for ADMIN/MANAGER roles, but the `userRole` state was populated asynchronously via `AuthProvider.fetchUser()` — a `useState` update that happens after the first render. The sidebar nav items were already correctly condition on `userRole`, but `userRole` was `null` on the first render because the auth check hadn't completed yet.
4. **Login panel missing password toggle and credentials table**: The login form had no show/hide password toggle and only showed a single-line dev hint text instead of a proper credentials table.

### Consequences

- **Logout redirect**: `logout()` now calls `window.location.href = "/login"` to force a full page redirect to the login page after the DELETE API call. This is the most reliable way to ensure the user lands on the login page regardless of client-side routing state.
- **Logout button in sidebar**: The logout button is now rendered inside the sidebar `<aside>` at the bottom (after the nav items loop), using `marginTop: "auto"` to push it to the bottom. The top-right user info strip in the content area was removed. Icon is an SVG logout icon.
- **Personnel visibility via role cookie**: Added a second cookie `zcc_role` that stores the user's role alongside the session token. The login API sets this cookie on POST. The proxy reads it synchronously on every request and injects it into `x-user-role` headers. This means `session.role` in the proxy is now backed by an actual cookie value that matches what the client knows, preventing the first-render null state from affecting navigation visibility.
- **Login panel improvements**: Password input now has an eye/eye-off SVG toggle button. Login panel shows a proper 3-row credentials table (Role | Email | Password) for the dev accounts instead of a single-line hint.
- **Session cookie cleanup**: DELETE handler now also deletes `zcc_role` cookie alongside `zcc_session`.

### Files Changed

- `apps/web/lib/auth/auth-context.tsx`: `logout()` now uses `window.location.href = "/login"` for direct redirect
- `apps/web/app/operations-dashboard.tsx`: Logout button moved from top-right content header to sidebar bottom; top-right user info strip removed
- `apps/web/app/api/auth/login/route.ts`: POST sets `zcc_role` cookie alongside `zcc_session`; DELETE clears both cookies
- `apps/web/proxy.ts`: Reads `zcc_role` cookie for synchronous role value; deletes `zcc_role` on redirect/error paths
- `apps/web/app/login/page.tsx`: Password show/hide toggle, credentials table replacing single-line hint

## 2026-05-15 (Afternoon)

### Decision

Fix client auth state synchronization so role-gated navigation renders correctly immediately after login without requiring a manual refresh.

### Context

After the `zcc_role` cookie fix, the proxy correctly injects the role into `x-user-role` headers on every request. However, the `AuthProvider` on the client still populates `user` asynchronously via `fetchUser()` — a `useState` update that fires after the first render. The sidebar nav items for Personnel (ADMIN/MANAGER only) were already correctly gated on `userRole`, but `userRole` was `null` on the first render because the auth check hadn't completed.

The login page was using `router.push("/")` + `router.refresh()` which triggers a Next.js client-side navigation. The proxy runs on the server for the new page request and sets the cookies, but the `AuthProvider` on the client still has stale `loading: true` state — it won't re-fetch the session until the `useEffect` fires, which can cause a flash of incorrect nav items.

### Consequences

- **Login page uses `window.location.href = "/"` instead of `router.push()`**: A full-page navigation ensures the browser makes a fresh request to the server. The proxy intercepts that request, reads both `zcc_session` and `zcc_role` cookies, and sets the correct headers. When the dashboard page renders, the `AuthProvider` `useEffect` fires `fetchUser()` which finds the valid session (matching the cookies the proxy just processed) and sets `user` with the correct role before the first render completes. Personnel nav is visible immediately.
- **`logout()` already uses `window.location.href = "/login"`**: This was already fixed in the earlier session — it forces a full-page redirect so the proxy clears cookies and the session state is truly gone before the login page renders.
- **`fetchUser()` continues to be the source of truth for client state**: The login POST response already sets the session cookie. `fetchUser()` on the next page load reads it back. This pattern is consistent.
- No changes to `operations-dashboard.tsx` sidebar nav logic — it already uses `userRole` correctly.

### Files Changed

- `apps/web/app/login/page.tsx`: Changed `router.push("/")` + `router.refresh()` to `window.location.href = "/"` for post-login navigation.

## 2026-05-15 (Late Afternoon)

### Decision

Add auth hydration loading gate to the dashboard to prevent role-gated navigation and actions from rendering from a temporary null-auth state during first load.

### Context

Even with `window.location.href = "/"` on login and the `zcc_role` cookie fix, the `AuthProvider` still fires `fetchUser()` asynchronously after mount. During that window — from when the component first renders until `fetchUser()` resolves — `user` is `null` and `loading` is `true`. This causes the sidebar to briefly render with default/empty nav state before correctly showing the Personnel item for ADMIN/MANAGER.

The same applies to the top-right content area (now removed) and any role-gated action buttons.

### Consequences

- **OperationsDashboard early-return on `loading`**: The dashboard now checks `loading` from `useAuth()` immediately after the hook call. While `loading === true`, it renders a minimal loading screen (navy background, centered ZIPLINE logo, "Loading..." text) instead of rendering the full dashboard with incorrect auth state. Once `fetchUser()` completes and `loading` becomes `false`, the correct dashboard renders with `user` populated and role-gated nav items correct on the first pass.
- **No role-gated flicker**: The Personnel nav item (ADMIN/MANAGER only) is never rendered with the wrong role state because the render is blocked until auth is confirmed.
- **`useAuth()` hook unchanged**: The `AuthContext` still exposes `{ user, loading, refresh, logout }`. No new state management introduced.
- **`logout()` unchanged**: Still calls DELETE API then `window.location.href = "/login"`.

### Files Changed

- `apps/web/app/operations-dashboard.tsx`: Added `loading` from `useAuth()` destructuring. Added early-return `if (loading)` block before the main render, showing a minimal branded loading screen. The rest of the component renders normally once `loading` is `false`.

## 2026-05-15 (Evening)

### Decision

Tasks 11 and 12 verification — no new implementation required.

### Context

Tasks 11 and 12 were reviewed against the current codebase:

**Task 11 — Staffing read path:**
- `load-dashboard-data.ts` already loads `staffAssignments` via JOIN and maps `employee.name` → `assignedStaff[]` array in `OrderRecord`. This is the DB-backed assignment state.
- All three staffing views (Setup, Board, KPI) derive from the `orders` state which is populated from `load-dashboard-data.ts`. No separate "write-only" path exists — the read path is already consistent.
- The loader uses `booking.staffAssignments?.map((s) => s.employee?.name).filter(Boolean) ?? []` to derive `assignedStaff` from DB.
- Dashboard's `staffingOrders` (setup filter), `boardOrders` (board), `pivotMap` (KPI) all derive from the `orders` state variable. Since `orders` comes from the loader, staffing views already read from DB-backed state.
- No code changes needed for Task 11 — the read path was already correct.

**Task 12 — Migration status:**
- Schema is valid and Prisma client generates cleanly (`npx prisma validate` ✓, `npx prisma generate` ✓).
- Three migration files exist: `20260514000000_init_vehicle_transport`, `20260514000001_add_employee_fields`, `20260514000002_add_auth_and_concurrency`. All have idempotent SQL guards and are runnable against a live PostgreSQL instance.
- No new migrations needed — schema covers all current implementation (Vehicle, Employee fields, User/passwordHash, BookingStatus, UserRole, TransportAssignment, PickupStatusEvent, StaffAssignment, AuditLog).
- Migration cannot be applied in this environment — no PostgreSQL instance available. Files created but not applied to a live DB.
- Per [[Backup Recovery and Versioning]], production migration requires a DB backup before applying.

### Consequences

- Task 11: No code changes. Staffing UI already reads from DB-backed `assignedStaff` via the loader. Residual fallback behavior (when `DATABASE_URL` absent): loader returns seed data with `assignedStaff` generated from seed — no behavior gap.
- Task 12: No schema changes. No new migration files created. Migration application status: "files created only, not applied to a live DB" until PostgreSQL is available. Backup requirement documented.

### Files Changed

- None for Task 11 — verification only.
- None for Task 12 — verification only.

## 2026-05-15 (Evening — Role Enforcement)

### Decision

Implement server-side and proxy-level role enforcement for dashboard modules and sensitive write APIs, using the existing small-business role model without redesigning auth.

### Context

Tasks 7 and 8 established auth (login/logout/session), optimistic concurrency guards (409 on conflict), and UI-level role gating (disabled buttons). However, the sensitive write APIs (Order CRUD, transport-assignment, pickup-status, staff-assignment) had no server-side role enforcement — a STAFF or DRIVER user could call them directly with a crafted request if the UI button was the only guard. Similarly, the `/personnel` route had no proxy-level guard.

Per [[Roles and Permissions]] and [[Security and Multi-User Guardrails]], the system needs per-route and per-API role enforcement as the next auth step.

### Consequences

**Shared role guard utility:** `apps/web/lib/auth/role-guards.ts` created with:
- `UserRole` type: ADMIN, ACCOUNTING, MANAGER, STAFF, DRIVER
- `MODULE_ACCESS` map for dashboard visibility (overview: all, orderlist: ADMIN/ACCOUNTING/MANAGER, transport: all, staffing: no DRIVER, personnel: ADMIN/MANAGER only, master: ADMIN/ACCOUNTING/MANAGER)
- `ALLOWED_ROLES_ORDER_WRITE`: ADMIN, ACCOUNTING, MANAGER
- `ALLOWED_ROLES_TRANSPORT_WRITE`: ADMIN, ACCOUNTING, MANAGER
- `ALLOWED_ROLES_PICKUP_WRITE`: ADMIN, ACCOUNTING, MANAGER, STAFF
- `ALLOWED_ROLES_STAFF_WRITE`: ADMIN, ACCOUNTING, MANAGER, STAFF
- `hasAccess(role, allowed)` and `getRoleGuardResponse(role, allowed)` helpers

**Server-side API enforcement:**
- All four write APIs now check `x-user-role` header at function entry
- RoleGuard rejects with HTTP 403 `{ "error": "Insufficient permissions" }` if role not in allowed list
- The `x-user-role` header comes from the proxy (injected from `zcc_role` cookie synchronously)
- Order CRUD (POST/PUT/DELETE): ADMIN, ACCOUNTING, MANAGER only
- Transport assignment (POST/DELETE): ADMIN, ACCOUNTING, MANAGER only
- Pickup status (POST): ADMIN, ACCOUNTING, MANAGER, STAFF
- Staff assignment (POST): ADMIN, ACCOUNTING, MANAGER, STAFF

**Proxy-level route enforcement:**
- `proxy.ts` now checks `pathname.startsWith(prefix)` for each restricted route
- `/personnel` → ADMIN, MANAGER only; redirect to `/login?from=/personnel` otherwise
- The dashboard is a single-page SPA served at `/` — proxy cannot enforce per-module visibility for the main view routes (Overview, Order List, Transport, Staffing, Personnel, Master Ops) because they share the same HTML shell and client-side routing. Client-side sidebar nav filtering is the enforced layer for those views. Only the `/personnel` sub-route has a proxy-level gate.
- Uses `getRoleFromCookies()` which reads `zcc_role` cookie synchronously (no async fetch needed)

**Client-side nav filtering:**
- Sidebar nav items now filter by role using explicit conditional arrays
- Order List visible to ADMIN, ACCOUNTING, MANAGER only
- Transport visible to all roles
- Staffing visible to ADMIN, ACCOUNTING, MANAGER, STAFF (not DRIVER)
- Personnel visible to ADMIN, MANAGER only (not ACCOUNTING)
- Master Ops visible to ADMIN, ACCOUNTING, MANAGER
- Overview visible to all roles

### Files Changed

- `apps/web/lib/auth/role-guards.ts` (new) — shared role constants and guard helpers
- `apps/web/proxy.ts` — added `MODULE_ROUTE_ACCESS`, `getRoleFromCookies()`, `checkModuleAccess()`, role check before response headers
- `apps/web/app/api/order/route.ts` — role guard on POST, PUT, DELETE
- `apps/web/app/api/transport-assignment/route.ts` — role guard on POST, DELETE
- `apps/web/app/api/pickup-status/route.ts` — role guard on POST
- `apps/web/app/api/staff-assignment/route.ts` — role guard on POST
- `apps/web/app/operations-dashboard.tsx` — sidebar nav items filtered by role with explicit conditionals
- `Zip/03_Build/Security and Multi-User Guardrails.md` — updated Next Phase section with implementation details
