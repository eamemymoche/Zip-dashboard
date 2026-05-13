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

- [ ] Turn dashboard seed state into real Prisma reads and writes.

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
