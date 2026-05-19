# Security and Multi-User Guardrails

Status: Active  
Last updated: 2026-05-18

## Current Security Baseline

The root implementation repo is `C:\Users\Nuke\Desktop\Zip`. Future agents should treat this file as the active security note before editing auth, role, user, audit, or mutation APIs.

## Auth And Session Rules

- Session authority is the signed `zcc_session` cookie only.
- `zcc_role` is no longer set by login/logout and must not be reintroduced as a security authority.
- `SESSION_SECRET` is validated lazily at runtime. In production, missing/default/short values throw before session signing or verification.
- Local demo fallback users are allowed only when `NODE_ENV !== "production"` and `DISABLE_DEV_AUTH_FALLBACK !== "1"`.
- Dev users use `dev-` IDs and must not be persisted as real actors.

## Password Rules

- New password hashes use `scrypt$<salt>$<hash>` via `hashPassword()` in `apps/web/lib/auth/server-session.ts`.
- Legacy `SHA-256(password + SESSION_SECRET)` hashes are accepted only for compatibility.
- Successful legacy DB login rehashes the password to scrypt.
- New code must not create SHA-256 password hashes.

## API Guard Pattern

For any new write API, use this pattern:

```ts
const auth = requireRole(request, ALLOWED_ROLES_*);
if ("response" in auth) return auth.response;
```

`requireRole()` does three things:

- parses and verifies `zcc_session`
- checks the allowed role list
- rejects untrusted cross-origin write requests

Do not derive authority from request body, query string, local storage, client-provided role, or `zcc_role`.

## Audit Rules

Use `auditData(auth.userId, ...)` for audit writes. It stores real DB user IDs as `actorId` and maps local `dev-` users to `null` so fake demo actors are not persisted as real users.

Mutation routes currently using this pattern include:

- `apps/web/app/api/order/route.ts`
- `apps/web/app/api/transport-assignment/route.ts`
- `apps/web/app/api/pickup-status/route.ts`
- `apps/web/app/api/staff-assignment/route.ts`
- `apps/web/app/api/employee/route.ts`
- `apps/web/app/api/product-package/route.ts`
- `apps/web/app/api/users/route.ts`
- `apps/web/app/api/auth/profile/route.ts`

## Remaining Security Follow-Ups

- Replace custom signed session format with a standard session/JWT library if the app becomes externally exposed.
- Move login rate limiting from in-memory maps to Redis or another shared store before multi-node deployment.
- Keep reviewing field-level visibility for Driver and Staff views before production use.
- Add stronger request schema validation for every mutation body.
