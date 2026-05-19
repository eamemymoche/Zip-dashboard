# Next Step Plan

## 1. Near-term hardening

1. consider adding an explicit `employeeId` link on `User` so sync no longer relies on username as the only identity join
2. decide whether current `ADMIN` -> `Officer` labeling is intentional business language or leftover mapping drift
3. isolate the remaining `apps/web/lib/prisma.ts` tracing warning if it starts affecting deploy confidence

## 2. Data / schema follow-up

1. keep seed, loader, migration state, and live schema in lockstep
2. write a short reseed/reset note once the current shape settles
3. add a tiny runbook note for restoring multilingual demo data safely if bulk text repair is needed again

## 3. Security / auth discipline

1. keep `SESSION_SECRET` production-safe
2. keep demo fallback local/demo only
3. continue using shared `requireRole()`, `auditData()`, `hashPassword()`, and `employee-account-sync.ts` helpers instead of duplicating auth/sync rules
4. keep smoke/guardrail scripts updated whenever auth/session contracts change

## 4. Product direction

1. review the Accounting board now that personnel/users/modules are more connected
2. keep Backup as read/status/control surface until restore execution is actually built
3. keep Personnel/User Access UX simple and operational instead of drifting into generic admin tooling
