# Zipline Command Center Production Scaffold

This folder is the starting point for the production build.

The existing prototype is kept at:

`../prototype.html`

## Recommended Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma or Drizzle
- Realtime: SSE or WebSocket after MVP
- Queue/cache: Redis after MVP

## MVP Modules

- Bookings
- Transport assignments
- Pickup status history
- Employees
- Product packages
- Printable job sheets
- Audit logs

## Planned Commands

```powershell
npm install
npm run dev
npm run build
npm run test
```

## Scaffold Notes

No dependencies are installed yet. This scaffold records the intended project shape so the real implementation can start cleanly once the stack is confirmed.

