# Project Brief

Zipline Command Center is an internal operations dashboard for handling:

- order intake and edits
- transport assignment and pickup tracking
- staff setup and KPI review
- personnel records
- accounting summary
- user permission management
- audit/changelog visibility

Working model:

- frontend-first dashboard UX
- PostgreSQL + Prisma for persistent operations
- username-based login with role/module access control
- local demo mode still supported through seeded users

Current implementation goal:

- make the system usable for day-to-day internal ops
- keep demo data realistic enough for UI review and agent work
- harden auth and mutation flows enough for baseline multi-user safety

Non-goals for the current stage:

- public-facing release
- final accounting workflow
- advanced reporting/export automation
- production-grade WAF / infra-level DDoS controls
