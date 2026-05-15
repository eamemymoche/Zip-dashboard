# Agent Command Template

Status: Active  
Last updated: 2026-05-14 (master prompt upgraded)

## Purpose

This note gives copy-paste prompts for future AI agents so they work inside the Zipline rules instead of improvising architecture or workflow.

Use these prompts as the default command layer before assigning implementation work.

## Master Implementation Prompt

Use this as the default prompt for implementation agents. You should only need to change the `Task:` section.

```text
Before doing anything, read and follow these files as the source of truth:

- C:\Users\Nuke\Desktop\Zip\Zip\01_Project\AI Agent Operating Manual.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\Real Workflow Model.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\Staffing Operations Model.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\SQL Architecture Strategy.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\Roles and Permissions.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Backup Recovery and Versioning.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Security and Multi-User Guardrails.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Durable Improvements and Premium Roadmap.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Module Ownership and Split Guide.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Agent Command Template.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Agent Work Queue.md

Inspect the current code before editing:
- C:\Users\Nuke\Desktop\Zip\apps\web\app\operations-dashboard.tsx
- C:\Users\Nuke\Desktop\Zip\apps\web\app\transport-assign-table.tsx
- C:\Users\Nuke\Desktop\Zip\apps\web\lib\load-dashboard-data.ts
- C:\Users\Nuke\Desktop\Zip\apps\web\lib\ops-data.ts
- C:\Users\Nuke\Desktop\Zip\packages\db\prisma\schema.prisma
- C:\Users\Nuke\Desktop\Zip\packages\db\prisma\seed.mjs

Obsidian vault path is confirmed and must be treated as live:
- C:\Users\Nuke\Desktop\Zip\Zip
- C:\Users\Nuke\Desktop\Zip\Zip\.obsidian exists

When asked to update Obsidian, do not claim the vault is missing unless you verified these exact paths and can prove they are unavailable.

Task:
[PUT TASK HERE]

Constraints:
- Do not guess if the docs already define the workflow or rule
- Keep changes small and reversible
- Preserve current UI behavior unless the task explicitly changes it
- Do not refactor unrelated areas
- Use the small-business role model, not enterprise RBAC
- Treat driver and vehicle as separate resources
- Do not collapse supplier booking time, pickup window, and dispatch round into one field
- Do not replace stable identifiers with display names
- Preserve dashboard compatibility during DB migration
- Do not expand scope to nearby modules without saying so first
- Respect backup/recovery/versioning guidance
- If the task is risky, create a recoverable checkpoint first
- If the task touches schema or persistence, explain migration impact before editing
- If the handbook conflicts with current code, prefer the handbook and explain the conflict

Mandatory Obsidian update rule:
- If the task affects architecture, migration, module ownership, implementation workflow, persistence status, or agent operating guidance, you must update these notes unless explicitly told not to:
  - C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Task Board.md
  - C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Decision Log.md
  - C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Module Ownership and Split Guide.md

Migration safety rule:
- Do not switch the Prisma provider away from PostgreSQL to work around missing local DB
- If no PostgreSQL instance is available, create migration files only
- Do not claim a migration was validated against a live DB unless it was actually run

Multi-agent safety rule:
- Do not edit the same primary file ownership area as another agent if that can be avoided
- Do not broadly rewrite `operations-dashboard.tsx`
- Follow `Module Ownership and Split Guide.md` for split boundaries

Before coding, first summarize:
1. your understanding of the workflow impact
2. files you will change
3. risks

Then implement.

Finally report:
- what changed
- what was verified
- what remains not yet persisted / not yet production-safe
- which Obsidian notes were updated
- whether build/typecheck was run successfully
- whether migration files were only created or actually applied to a DB
```

## Multi-Agent Split Prompt

Use this when two agents work in parallel.

```text
Both agents must read the Obsidian handbook first.
Both agents must respect Module Ownership and Split Guide.md.
Both agents must not overwrite each other’s files.
Both agents must update Obsidian if their task changes architecture, persistence status, migration baseline, or ownership boundaries.

Agent 1 ownership:
[PUT FILES / DOMAIN HERE]

Agent 2 ownership:
[PUT FILES / DOMAIN HERE]

Shared rules:
- If the handbook conflicts with current code, prefer the handbook and explain the conflict
- Do not rewrite large files unless required
- Stop and report before broad structural changes
- Update Obsidian as part of done criteria
- Do not edit the same primary file in parallel unless explicitly approved
```

## Strict Review Prompt

Use this after another AI agent claims the work is done.

```text
Review this implementation against the Obsidian handbook and current codebase.

Read first:
- C:\Users\Nuke\Desktop\Zip\Zip\01_Project\AI Agent Operating Manual.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\Real Workflow Model.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\SQL Architecture Strategy.md
- C:\Users\Nuke\Desktop\Zip\Zip\02_Specs\Roles and Permissions.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Backup Recovery and Versioning.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Security and Multi-User Guardrails.md
- C:\Users\Nuke\Desktop\Zip\Zip\03_Build\Module Ownership and Split Guide.md

Review target:
[PUT TASK / FILES HERE]

Required output:
1. Findings first, ordered by severity
2. Exact files affected
3. What is good and safe
4. What is still partial / local-state-only / not production-safe
5. Suggested next task
6. Whether Obsidian was updated correctly
```

## Master Review Checklist

An implementation is not complete unless the reviewer can answer yes to all of these:

- Did the agent read the handbook notes first?
- Did the task stay within its requested scope?
- Did it preserve stable identifiers where required?
- Did it preserve dashboard compatibility?
- Did it avoid unrelated refactors?
- Did it state residual risk honestly?
- Did it update Obsidian when required?
- Did it clearly distinguish file-only migration creation from real DB application?

## Simple Stop Rules

Add these lines when you want stricter control:

```text
Do not invent workflow rules not present in the handbook.
If the task touches schema or persistence, explain the migration impact before editing.
Do not expand scope to nearby modules.
Do not replace stable identifiers with display names.
Do not claim Obsidian was unavailable unless you verified C:\Users\Nuke\Desktop\Zip\Zip and C:\Users\Nuke\Desktop\Zip\Zip\.obsidian directly.
```
