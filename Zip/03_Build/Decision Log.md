# Decision Log

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
