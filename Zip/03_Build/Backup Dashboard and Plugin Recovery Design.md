# Backup Dashboard and Plugin Recovery Design

Status: Active  
Last updated: 2026-05-18

## Intent

Add a final dashboard module named `Backup & Recovery` that non-IT users can understand without reading infrastructure docs. This is the last safety layer of the operations system, not a generic settings page.

## User Model

The page is written for business operators:

- Owner wants to know if the business can recover tomorrow.
- Manager wants to know if today can be restored if a mistake happens.
- Accounting wants confidence that audit and financial context are preserved.
- Staff/Driver do not need this module.

## UI Placement

The module is appended as the last sidebar item:

- board key: `backup`
- label: `Backup` / `สำรองข้อมูล`
- component: `apps/web/app/backup-view.tsx`
- visible to: `SUPERADMIN`, `ADMIN`, `ACCOUNTING`, `MANAGER`

## Dashboard Concepts

The UI explains backup as four simple modes:

1. `Always-on Safety Net`
2. `Daily Snapshot`
3. `Plugin Vault`
4. `Overlap Recovery`

These are currently front-end planning states, not destructive backend actions. Future agents should not add a real restore button until the DB backup command, storage path, checksum verification, and rollback runbook are implemented.

## Current Backend Scaffold

Current status endpoint:

- `GET /api/backup/status`
- file: `apps/web/app/api/backup/status/route.ts`
- access: `SUPERADMIN`, `ADMIN`, `ACCOUNTING`, `MANAGER`
- behavior: read-only backup plan/status response

The endpoint intentionally returns a flexible plan object instead of a rigid backup schema. This keeps the system adaptable when future data-entry flows, tables, attachments, or imported source formats change.

Current response concepts:

- `status`
- `recoveryMode`
- `layers[]`
- `plugins[]`
- `guardrails[]`

Do not turn this endpoint into a restore executor. Real execution should be split into separate audited APIs after storage and checksum design is finalized.

## Plugin Backup Layer

The plugin model means future backup behavior should be modular and swappable:

- scheduler plugin for automatic snapshots
- offsite mirror plugin for cloud or external disk copy
- integrity plugin for checksum verification
- one-click restore plugin for guided recovery
- overlap compare plugin for comparing current data vs backup snapshot

Do not hardcode one storage provider into the UI. The dashboard should stay provider-neutral until deployment target is known.

## Overlap Recovery Model

Overlap means the system protects data with multiple recoverable layers:

- live database
- latest verified snapshot
- previous snapshot
- optional offsite mirror
- audit log and changelog trail

The restore path should compare and confirm before replacing live data. Non-IT users should see simple words such as `Backup`, `Verify`, `Overlap`, and `Restore`, while the technical runbook handles commands.

## Future Backend Work

Recommended implementation order:

1. Keep `GET /api/backup/status` provider-neutral and read-only.
2. Add `BackupJob` and `BackupArtifact` tables only after deciding what artifacts must be stored.
3. Add a plugin registry for storage targets before hardcoding local/cloud storage.
4. Add a server-side backup runner using PostgreSQL-native backup/export commands.
5. Add checksum verification.
6. Add restore dry-run/compare endpoint.
7. Add guarded restore execution for `SUPERADMIN` only.

## Guardrails

- Do not expose raw database credentials in the UI.
- Do not allow restore from the browser without server-side confirmation and audit logging.
- Do not make Staff or Driver see this dashboard.
- Do not imply backups are actually running until backend jobs exist.
- Do not remove existing export/fallback flows; backup is an overlap layer, not a replacement.
