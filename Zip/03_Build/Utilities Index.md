# Utilities Index

## Local commands

- `npm run dev`
- `npm run build`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`

## Verification commands

- `npm run verify:task24`
- `npm run verify:task26`
- `npm run verify:task27`
- `npm run verify:task29`
- `npm run verify:task30`
- `npm run verify:milestoneA`
- `npm run verify:milestoneB`
- `npm run verify:milestoneC`
- `npm run verify:frontend:access`

## Key local files

- env: `.env.local`
- schema: `packages/db/prisma/schema.prisma`
- seed: `packages/db/prisma/seed.mjs`
- dashboard shell: `apps/web/app/operations-dashboard.tsx`
- global styles: `apps/web/app/globals.css`

## Local runtime notes

- default app URL: `http://127.0.0.1:3000`
- fallback dev server may also run on `3001`
- local DB target from `.env.local`: PostgreSQL `zipline` on `localhost:5432`

## Update discipline

When a stage finishes:

1. update `Project Status Snapshot.md`
2. update `Next Step Plan.md`
3. update `Task Board.md` only with durable checkpoints
4. move superseded working notes into `99_Archive/Temp/`
