# Next Step Plan

## UX / frontend polish

1. review live browser output for dark mode edge cases
2. tune `JOB ORDER` print layout against real PDF output on the target machine
3. finish accounting board details against real accounting workflow reference
4. keep reducing inline emoji remnants in personnel/login areas

## Security / backend improvement

1. verify production env uses a real `SESSION_SECRET` of 32+ chars; production runtime now rejects missing/default/short secrets
2. keep dev auth fallback local-only; production blocks fallback users via `isDevAuthFallbackEnabled()`
3. migrate any newly added write API through `requireRole()` plus `auditData()` from `apps/web/lib/auth/server-session.ts`
4. keep password writes on `hashPassword()`; legacy SHA-256 hashes are accepted only for login/change-password migration
5. consider moving in-memory login throttling to Redis/store if the app leaves single-node local use

## Data / operations

1. confirm task 16 generated dataset behavior inside the live running app
2. add a documented reseed/reset workflow for local review sessions
3. decide whether accounting should remain placeholder or become a DB-backed workflow next
4. keep `GET /api/backup/status` read-only while backup artifacts/storage target are still being designed
5. add checksum verification and dry-run compare for backup overlap recovery

## Release / deployment

1. verify Vercel env + migrations before next production sync
2. confirm no production deployment depends on `zcc_role`; role authority is now signed `zcc_session` only
