# Agent Command Template

Use these as handoff prompts for other agents.

## A. UI review / patch

```text
Inspect the current Zipline Command Center UI in the local repo and fix only the targeted surface I name. Follow existing visual patterns in apps/web/app/globals.css and neighboring board components. Do not refactor unrelated modules. Report:
- files changed
- root cause
- concise summary of fixes
- build result if run
```

## B. Dark mode cleanup

```text
Audit the specified board in dark mode. Remove any light-theme surfaces, mismatched borders, unreadable text, or active states that look pasted from light mode. Preserve layout and behavior. Reuse existing theme variables/classes instead of scattering hardcoded colors.
```

## C. Data generation / import

```text
Generate or update deterministic demo data for the current Prisma schema without inventing new columns. Keep the dataset realistic, mixed Thai/English, and safe for dashboard review. If you touch seed logic, make it rerunnable and report exactly how to apply it.
```

## D. Verification / regression check

```text
Review the target change set in this repo and verify:
- permission behavior
- API contract compatibility
- build cleanliness
- obvious UI regressions
Lead with findings, then summarize risk and verification gaps.
```

## E. Current useful task prompt: May 17-31 data

```text
Verify that the local Prisma seed and the dashboard seed model are aligned for May 17-31, 2026. Confirm demo users, booking volume, staffing/transport coverage, and that the dataset can be reseeded without collisions. Report mismatches first, then exact files changed and verification steps.
```
