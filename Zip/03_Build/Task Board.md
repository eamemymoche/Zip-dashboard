# Task Board

## 2026-05-19 status refresh

- Obsidian notes now reflect the current code shape instead of the older milestone-only story.
- The biggest new reality is personnel/account convergence: employee English-name fields now drive default usernames and user creation/sync behavior.
- Transport and staffing are still the busiest moving parts in UI terms, but the recent changes were simplification and usability work, not a new subsystem.

## In progress

- [ ] keep active Obsidian notes truthful after parallel agent edits
- [ ] decide whether to add direct `employeeId` linking on `User`
- [ ] review/remove non-runtime recovery artifacts once no longer needed

## Recently completed and now reflected in docs

- [x] username-first auth is the active login model
- [x] employee records now include English first/last/nickname plus generated `defaultUsername`
- [x] employee create/edit path now saves employee first and treats account sync as best-effort
- [x] shared `employee-account-sync.ts` now owns the employee -> user reconciliation rules
- [x] explicit User Access sync now reports `synced / skipped / errors`
- [x] vehicle records now carry `licensePlate` and `adminNote`
- [x] transport assign dropdown now shows vehicle code + plate + type
- [x] transport job sheet/export now includes `Time Slot`
- [x] staffing setup now supports add/remove guide rows instead of fixed checkbox-only assignment
- [x] personnel board now shows English name and username details inline
- [x] added current architecture note for future agents: `Current Code Structure Map.md`
- [x] restored corrupted Thai employee/user/customer names in the local DB
- [x] fixed Personnel card expansion layout so other cards do not stretch open as empty panels
- [x] updated verification scripts to match username-first auth and current session rules
- [x] completed focused verification pass:
  - `npm run build`
  - `npm run verify:task24`
  - `npm run verify:task26`
  - `npm run verify:task27`
  - `npm run verify:frontend:access`
  - `npm run verify:milestoneC`

## Open follow-ups

- [ ] review whether role labels should stay as current business wording (`ADMIN` shown as `Officer` in UI labels)
- [ ] decide whether `User` should gain an explicit `employeeId` link later instead of relying on username-only identity sync
- [ ] review accounting board against the newer auth/module-access model
- [ ] keep backup board documented as status/control only until real restore execution exists

## Parking lot

- [ ] split more dashboard helpers only if `operations-dashboard.tsx` starts blocking safe edits again
