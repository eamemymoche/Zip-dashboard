import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_EMPLOYEE_WRITE } from "../../../lib/auth/role-guards";
import { getRoleFromRequest, roleGuard } from "../../../lib/auth/server-session";
import { createPrismaClient } from "../../../lib/prisma";

function mapEmployeeRole(role: string): "STAFF" | "DRIVER" {
  return role === "Driver" ? "DRIVER" : "STAFF";
}

export async function POST(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_EMPLOYEE_WRITE);
  if (denied) return denied;

  let prisma;
  try {
    prisma = createPrismaClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const code = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const exists = await prisma.employee.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: "Employee code already exists" }, { status: 409 });
    }

    const created = await prisma.employee.create({
      data: {
        code,
        name,
        nickname: body.nickname ? String(body.nickname).trim() : null,
        role: mapEmployeeRole(String(body.role ?? "Staff")),
        phone: body.phone ? String(body.phone).trim() : null,
        phone2: body.phone2 ? String(body.phone2).trim() : null,
        startDate: body.startDate ? new Date(String(body.startDate)) : null,
        photo: body.photo ? String(body.photo) : null,
        active: true
      }
    });

    return NextResponse.json({
      id: created.code,
      name: created.name,
      nickname: created.nickname ?? created.name.split(" ")[0],
      role: created.role === "DRIVER" ? "Driver" : "Staff",
      phone: created.phone ?? "",
      phone2: created.phone2 ?? "",
      startDate: created.startDate ? created.startDate.toISOString().slice(0, 10) : "",
      photo: created.photo ?? ""
    }, { status: 201 });
  } catch (error) {
    console.error("Employee create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_EMPLOYEE_WRITE);
  if (denied) return denied;

  let prisma;
  try {
    prisma = createPrismaClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const code = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    if (!code || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({ where: { code } });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updated = await prisma.employee.update({
      where: { code },
      data: {
        name,
        nickname: body.nickname ? String(body.nickname).trim() : null,
        role: mapEmployeeRole(String(body.role ?? "Staff")),
        phone: body.phone ? String(body.phone).trim() : null,
        phone2: body.phone2 ? String(body.phone2).trim() : null,
        startDate: body.startDate ? new Date(String(body.startDate)) : null,
        photo: body.photo ? String(body.photo) : null
      }
    });

    return NextResponse.json({
      id: updated.code,
      name: updated.name,
      nickname: updated.nickname ?? updated.name.split(" ")[0],
      role: updated.role === "DRIVER" ? "Driver" : "Staff",
      phone: updated.phone ?? "",
      phone2: updated.phone2 ?? "",
      startDate: updated.startDate ? updated.startDate.toISOString().slice(0, 10) : "",
      photo: updated.photo ?? ""
    });
  } catch (error) {
    console.error("Employee update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
