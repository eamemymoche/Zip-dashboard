# Security and Multi-User Guardrails

Status: Active  
Last updated: 2026-05-14

## Intent

This note defines the minimum engineering safeguards required before the Zipline system is treated as a real internal operations tool.

It combines two concerns:

1. security and safe coding
2. multi-user editing and concurrency guardrails

## Security Priorities

### 1. Input Validation

All normalized booking fields must be validated at the server boundary.

Examples:

- dates and times
- booking ids
- phone values
- pax / join counts
- round values
- role values
- source channel values

Do not trust client-side validation alone.

### 2. Text Sanitization

The following fields may carry untrusted or messy source text:

- guest request
- admin note
- imported email text
- merchant notes
- attachment metadata

These should be stored safely and rendered safely. Avoid unsafe HTML rendering.

### 3. Least-Privilege Access

Not every internal user should see all data.

Protect at minimum:

- customer contact details
- payment and reconciliation information
- internal admin remarks
- role-management actions

### 4. Secrets Handling

Keep secrets out of source files and notes.

Examples:

- database credentials
- deployment tokens
- API keys
- provider credentials

Use environment variables and deployment secret management.

### 5. Attachment Handling

If attachments or uploads are added:

- validate file type
- validate file size
- control storage location
- prevent unsafe executable upload patterns
- avoid exposing raw private files publicly by default

### 6. Auditability

Security is not only access control. It is also traceability.

Important auditable actions:

- booking edits
- status changes
- driver changes
- vehicle changes
- staffing changes
- payment edits
- role changes

## Multi-User Editing Risks

The system should assume that multiple officers may work on the same day and round.

High-risk collision cases:

- two officers editing the same booking
- one officer moving a round while another assigns staff
- one officer changing driver/vehicle while another updates status
- finance editing closure fields while operations edits execution state

## Required Guardrails

### 1. No Silent Overwrite

Silent overwrite is not acceptable.

The system should either:

- detect version mismatch
- warn the user
- require refresh / retry
- or preserve both change attempts in a reviewable way

### 2. Optimistic Concurrency

Recommended default:

- record version field, updated timestamp, or equivalent conflict token
- reject or flag updates when the incoming edit is based on stale data

This is usually enough for the current business size.

### 3. Append-Friendly History

Important operational changes should leave history, not only replace current values.

Especially for:

- pickup status
- round moves
- transport reassignment
- vehicle reassignment
- staffing reassignment

### 4. Realtime Scope

Future realtime should focus on the views that benefit most:

- transport board
- staffing board
- live status updates

Not every page needs true realtime on day one.

### 5. Conflict Awareness In UX

If a record changed underneath the current user:

- show a clear message
- indicate what changed
- help the user retry safely

Avoid invisible refreshes that erase context.

## Current Codebase Concern

The current app still contains local-state-driven behaviors in parts of the dashboard. This increases the risk of divergence once multi-user persistence is introduced.

Future agents should migrate write paths carefully and make conflict handling explicit instead of assuming the current client-state patterns will scale automatically.

## 2026-05-14 — Implementation Status

### Auth (Phase 1)

- `UserRole` enum added to schema: ADMIN, ACCOUNTING, MANAGER, STAFF, DRIVER
- `passwordHash` added to `User` model
- Login API at `api/auth/login` (POST/GET/DELETE)
- Session cookie `zcc_session` with HMAC-SHA256 signed token (8-hour expiry)
- **Dev auth fallback**: When `DATABASE_URL` is not set or DB is unavailable, login API falls back to hardcoded dev users: `officer@zipline.com/zipline123` (MANAGER), `owner@zipline.com/owner123` (ADMIN), `accounting@zipline.com/accounting123` (ACCOUNTING). These dev users have IDs prefixed `dev-` (e.g., `dev-officer-001`). This is a local-dev-only fallback, clearly NOT production auth — production auth requires a real PostgreSQL database with seeded users.
- Middleware gates all non-public paths; redirects to `/login` on failure with `from` param
- Login page at `login/page.tsx` — redirects to `/` on success. Login form now has password show/hide toggle and a credentials table (Role | Email | Password).
- `AuthProvider` + `useAuth()` hook in `lib/auth/auth-context.tsx`
- `logout()` redirects to `/login` via `window.location.href` after DELETE API call — ensures direct redirect regardless of client routing state
- GET session endpoint returns HTTP 200 with `{ user: null }` when unauthenticated (not 401) — allows `AuthProvider` to manage loading state without causing HTTP-level errors in the fetch flow
- **`zcc_role` cookie**: Login API sets `zcc_role` cookie alongside `zcc_session` on POST. Proxy reads it synchronously for `x-user-role` header injection, making role available on first render and fixing Personnel nav visibility. DELETE clears both cookies.

### Concurrency Guards

- `transport-assignment` API: 409 on `Booking.updatedAt` mismatch (1-second tolerance)
- `pickup-status` API: 409 on `updatedAt` mismatch (1-second tolerance)
- `staff-assignment` API: 409 on `updatedAt` mismatch (1-second tolerance)
- **Canonical `updatedAt` token**: Every successful write in all three APIs explicitly calls `prisma.booking.update({ where: { id: booking.id }, data: {}, select: { updatedAt: true } })` to force-refresh `Booking.updatedAt` before returning. The token is guaranteed to advance after every write — the API does not rely on side-effect timestamps from related models.
- All three APIs return the refreshed `updatedAt` timestamp from the canonical `Booking.updatedAt` field
- **Client now sends `updatedAt`** with every write (from `OrderRecord.updatedAt`)
- **Client refreshes local `updatedAt`** after successful writes
- **409 conflicts are surfaced to user** via toast message in Thai: "ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้า" (Data was modified by another user, please refresh the page)
- **Proxy uses `crypto` module**: In Next.js 16, the middleware file convention was renamed to `proxy`. The auth proxy file (`apps/web/proxy.ts`) uses `crypto.createHash` for HMAC session parsing. This is the Node.js runtime, not Edge Runtime — build is clean with no crypto warnings. The file was renamed from `middleware.ts` to `proxy.ts` and the exported function renamed from `middleware` to `proxy` to match Next.js 16 conventions.

### Role Gating

- Personnel nav item hidden from STAFF and DRIVER roles (visible immediately on first render — role cookie is set synchronously by proxy on every request)
- "เพิ่มรายการใหม่" (New Order) button disabled for STAFF and DRIVER
- Edit and Delete buttons in expanded order rows disabled for STAFF and DRIVER
- Logout button displayed in sidebar bottom (not top-right content area)
- Per-role access per dashboard/view still partial — these minimal gates are the current practical baseline

### Next Phase

Remaining work before production-ready auth:
- Apply real PostgreSQL migrations (backup-first per [[Backup Recovery and Versioning]])
- Verify auth/loader against live DB with real seeded users

### Role Enforcement Implementation (2026-05-15 Evening)

Role enforcement is implemented at three levels:

**Server-side (API route guards):**
- `POST/PUT/DELETE /api/order` — ADMIN, ACCOUNTING, MANAGER only; 403 otherwise
- `POST/DELETE /api/transport-assignment` — ADMIN, ACCOUNTING, MANAGER only; 403 otherwise
- `POST /api/pickup-status` — ADMIN, ACCOUNTING, MANAGER, STAFF; 403 otherwise
- `POST /api/staff-assignment` — ADMIN, ACCOUNTING, MANAGER, STAFF; 403 otherwise
- All guards check `x-user-role` header (injected by proxy from `zcc_role` cookie)
- 403 response: `{ "error": "Insufficient permissions" }`

**Proxy-level route guard:**
- `/personnel` — ADMIN, MANAGER only; redirect to `/login?from=/personnel` otherwise
- No other proxy-level module guards — the dashboard is a single-page SPA at `/`; the proxy cannot enforce per-module access for `/` since all main-view routes share the same entry point. Client-side nav filtering is the enforced layer for module visibility.

**Client-side nav filtering (operations-dashboard.tsx):**
- Order List — visible to ADMIN, ACCOUNTING, MANAGER only
- Transport — visible to all roles
- Staffing — visible to ADMIN, ACCOUNTING, MANAGER, STAFF only (not DRIVER)
- Personnel — visible to ADMIN, MANAGER only (not ACCOUNTING, STAFF, DRIVER)
- Master Ops — visible to ADMIN, ACCOUNTING, MANAGER only
- Overview — visible to all roles

**New Order button:** disabled for STAFF and DRIVER (UI-only guard, secondary defense)

**Edit/Delete buttons:** disabled for STAFF and DRIVER in expanded order rows

## Success Test

This note is working if a future agent can explain:

- how input is validated
- how sensitive data access is limited
- how edits are audited
- how two officers editing the same booking will be handled safely
