# Zipline Command Center

แดชบอร์ดปฏิบัติการ (ภาษาไทย) สำหรับงานรายการออเดอร์, จัดรถ, ใบงานคนขับ, staffing และ master data

## Demo Live
https://zip-dashboard-web-eight.vercel.app/

## โครงสร้างหลัก

- `apps/web` - Next.js frontend
- `packages/db` - Prisma schema + database scripts
- `Zip` - Obsidian vault (project brain / task log)

## สถานะข้อมูล (สำคัญ)

- มี **Prisma + PostgreSQL schema** แล้ว (`packages/db/prisma/schema.prisma`)
- หน้าเว็บโหลดข้อมูลผ่าน `load-dashboard-data.ts`
  - ถ้ามี `DATABASE_URL` และ query ได้ -> ดึงจาก DB
  - ถ้าไม่มี/ต่อ DB ไม่ได้ -> ใช้ fallback seed ในหน่วยความจำ
- ตอนนี้การแก้ไขบนหน้า dashboard หลายจุดยังเป็น client state (ยังไม่ persist ทุก workflow)

## รันโปรเจกต์

```powershell
npm install
npm run dev
```

## คำสั่ง DB ที่ใช้บ่อย

```powershell
npm run db:generate
npm run db:seed
```

> ต้องตั้งค่า `DATABASE_URL` ก่อน seed/migrate

## Deploy demo (แนะนำ)

- ใช้ GitHub + Vercel
- push repo ขึ้น GitHub แล้ว import project ใน Vercel
- ตั้งค่า env (`DATABASE_URL`, อื่นๆที่ต้องใช้) แล้ว deploy
