# Agent Review Template

Status: Active  
Last updated: 2026-05-14

## Purpose

Use this note when you want a second-pass AI agent or a human reviewer to check another agent’s work strictly against the project rules.

## Review Prompt

```text
Review this implementation against the current Zipline handbook and codebase.

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
```

## Review Checklist

- Does it follow the handbook workflow model?
- Does it preserve supplier booking time vs pickup window vs dispatch round?
- Does it use stable identifiers instead of display names?
- Does it preserve dashboard compatibility?
- Does it avoid unrelated refactors?
- Does it update Obsidian?
- Does it state residual risk honestly?
