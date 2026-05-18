# Next Step Plan

## UX / frontend polish

1. review live browser output for dark mode edge cases
2. tune `JOB ORDER` print layout against real PDF output on the target machine
3. finish accounting board details against real accounting workflow reference
4. keep reducing inline emoji remnants in personnel/login areas

## Security / backend improvement

1. replace any remaining client-trusted role paths with session-derived authorization only
2. add shared API response hardening helpers where useful
3. add explicit audit actor ids on more mutation endpoints
4. consider moving in-memory login throttling to Redis/store if the app leaves single-node local use

## Data / operations

1. confirm task 16 generated dataset behavior inside the live running app
2. add a documented reseed/reset workflow for local review sessions
3. decide whether accounting should remain placeholder or become a DB-backed workflow next

## Release / deployment

1. verify Vercel env + migrations before next production sync
2. decide whether demo fallback should stay enabled in production builds
