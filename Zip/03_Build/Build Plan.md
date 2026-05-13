# Build Plan

## Current State

Vault is prepared for project planning. Source `.txt` files have been imported, and the current prototype is available at `05_Source/prototype.html`.

The current prototype is a single-page HTML/JavaScript app with Tailwind CDN, Font Awesome, mock arrays, and browser-only state. It is useful as a UX/reference prototype, not a production build.

A production scaffold has been prepared at `05_Source/production-scaffold`.

The active implementation workspace is now `C:\Users\Nuke\Desktop\Zip`, where the real repo scaffold has been created in `apps`, `packages`, `reference`, and `docs`.

Current verification status:

- Dependencies installed in the root workspace.
- `apps/web` production build passes.
- Dev server responds at `http://127.0.0.1:3000/`.
- Homepage now renders a prototype-derived Order List dashboard instead of a placeholder scaffold.
- `packages/db` now includes a Prisma seed script for baseline operational records.
- The main dashboard now ports the prototype's Thai UI, navigation, subviews, and modal structure across Order List, Transport, Staffing, Personnel, and Master Ops.
- Prisma 7 client generation works from the root repo through `prisma.config.ts`.
- **Phase 2 complete:** Google Sans font, Light/Dark/System theme toggle, TH/ENG language toggle, left sidebar nav (A-E), export dropdown (.xls/.pdf/.csv), sortable order table headers, click-to-expand order details, time-aware capacity cards (grey/green/yellow).
- **Phase 3 complete:** Overview (Z) dashboard with KPIs + alerts, live GMT+7 clock, i18n system for nav labels only, ⇅/↑/↓ sort indicators, CSV export download, Agent brand badges (Klook/Trip.com/CTrip/TTD/Direct), capacity card multi-select filter, Personnel fully redesigned (split Staff/Driver sections, circular avatars, nicknames, click-to-expand detail panel, full form with nickname/phone/phone2/startDate/photo).
- **Phase 4 complete:** Content area fitting fixed, top bar redesign, past capacity card opacity fixed, sort-active column headers styled, real Excel (.xlsx) export via xlsx@^0.18.5, real PDF export via jspdf@^4.2.1, agent badge in Order List table, personnel photo file input with FileReader + SVG placeholder, personnel edit button with pre-fill modal. Build passes clean.
- **Phase 5 complete:** Full-width content area, 3-state sort toggle (Default→Asc→Desc→Default), inline agent badge format `[KL] Klook`, custom DatePicker component replacing all 8 native date inputs, PDF/CSV character encoding fixed (UTF-8 BOM, A4 landscape), sidebar nav prefix removed + font size bumped, transport table sort added for Assignments and Live Feed. Build passes clean: `✓ Compiled in 2.6s`.
- **Phase 6 complete:** Strict layout fix (`.glass-card` width 100%), overview agent double removed, date range picker with quick filters (เมื่อวาน/วันนี้/พรุ่งนี้ + clear), PDF dynamic import fix, expanded row Edit/Delete buttons (บันทึก/ยกเลิก + ลบ red), comprehensive dark mode contrast fixes for all text elements. Build passes clean: `✓ Compiled in 1952ms`.

## Recommended Build Flow

1. Use `05_Source/prototype.html` as the UI and workflow reference.
2. Freeze the MVP workflow: booking create/list, transport assignment, pickup status, job sheet print.
3. Select stack and record tradeoffs in [[Decision Log]].
4. Use the root workspace scaffold as the production repo base.
5. Define database schema for bookings, employees, packages, transport assignments, status history, and audit logs.
6. Implement persisted MVP workflow.
7. Verify local dev server, production build, and basic tests.

## Stack Decision

Recommended default from source notes: Next.js frontend + NestJS backend + PostgreSQL.

Faster MVP option: Next.js full-stack + PostgreSQL. Use this if speed matters more than backend separation.

Current implementation assumption: start with Next.js full-stack style repo structure plus Prisma schema draft, and keep the door open to split the backend later if complexity grows.

## Local Commands

```powershell
# Static prototype reference
Start-Process 'C:\Users\Nuke\Desktop\Zip\Zip\05_Source\prototype.html'

# Root production scaffold
Set-Location 'C:\Users\Nuke\Desktop\Zip'
npm install
npm run dev
npm run build
```

## First Build Checklist

- [ ] Project source folder exists.
- [x] Prototype source exists.
- [x] Production scaffold exists.
- [x] Root repo scaffold exists.
- [x] Production source project dependencies are installed.
- [x] Dependencies are installable.
- [x] Development server starts.
- [x] Production build succeeds.
- [ ] README has setup and build instructions.
