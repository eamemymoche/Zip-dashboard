import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_EMPLOYEE_WRITE } from "../../../lib/auth/role-guards";
import { auditData, requireRole } from "../../../lib/auth/server-session";
import { syncEmployeeAccount } from "../../../lib/auth/employee-account-sync";
import { createPrismaClient } from "../../../lib/prisma";

function splitNameParts(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : ""
  };
}

function createDefaultUsername(firstName: string, lastName: string, fallbackName = "") {
  let firstCandidate = firstName.trim();
  let lastCandidate = lastName.trim();
  if (!firstCandidate || !lastCandidate) {
    const fallback = splitNameParts(fallbackName);
    firstCandidate ||= fallback.firstName;
    lastCandidate ||= fallback.lastName;
  }

  const first = firstCandidate.toLowerCase().replace(/[^a-z0-9]/g, "");
  const last = lastCandidate.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 3);
  return first && last ? `${first}.${last}` : null;
}

function mapEmployeeRole(role: string): "STAFF" | "DRIVER" | "MANAGER" | "ADMIN" {
  if (role === "Driver") return "DRIVER";
  if (role === "Officer") return "MANAGER";
  if (role === "Accounting") return "ADMIN";
  return "STAFF";
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_EMPLOYEE_WRITE);
  if ("response" in auth) return auth.response;

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

    const defaultUsername = createDefaultUsername(String(body.englishFirstName ?? ""), String(body.englishLastName ?? ""), name);
    const created = await prisma.employee.create({
      data: {
        code,
        name,
        englishFirstName: body.englishFirstName ? String(body.englishFirstName).trim() : null,
        englishLastName: body.englishLastName ? String(body.englishLastName).trim() : null,
        englishNickname: body.englishNickname ? String(body.englishNickname).trim() : null,
        defaultUsername,
        nickname: body.nickname ? String(body.nickname).trim() : null,
        role: mapEmployeeRole(String(body.role ?? "Staff")),
        phone: body.phone ? String(body.phone).trim() : null,
        phone2: body.phone2 ? String(body.phone2).trim() : null,
        startDate: body.startDate ? new Date(String(body.startDate)) : null,
        photo: body.photo ? String(body.photo) : null,
        active: true
      }
    });

    const accountSync = await syncEmployeeAccount(prisma, {
      code: created.code,
      name: created.name,
      role: created.role,
      englishFirstName: created.englishFirstName,
      englishLastName: created.englishLastName,
      defaultUsername: created.defaultUsername,
      active: created.active
    });

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "Employee",
        entityId: created.id,
        action: "employee.created",
        afterJson: JSON.stringify({ code: created.code, name: created.name, role: created.role })
      })
    });

    return NextResponse.json({
      id: created.code,
      name: created.name,
      englishFirstName: created.englishFirstName ?? "",
      englishLastName: created.englishLastName ?? "",
      englishNickname: created.englishNickname ?? "",
      username: created.defaultUsername ?? "",
      nickname: created.nickname ?? created.name.split(" ")[0],
      role: created.role === "DRIVER" ? "Driver" : created.role === "MANAGER" ? "Officer" : created.role === "ADMIN" ? "Accounting" : "Staff",
      phone: created.phone ?? "",
      phone2: created.phone2 ?? "",
      startDate: created.startDate ? created.startDate.toISOString().slice(0, 10) : "",
      photo: created.photo ?? "",
      accountSync,
      warning: accountSync.status === "error" ? "Employee saved, but user account sync failed." : null
    }, { status: 201 });
  } catch (error) {
    console.error("Employee create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_EMPLOYEE_WRITE);
  if ("response" in auth) return auth.response;

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

    const defaultUsername = createDefaultUsername(String(body.englishFirstName ?? ""), String(body.englishLastName ?? ""), name);
    const updated = await prisma.employee.update({
      where: { code },
      data: {
        name,
        englishFirstName: body.englishFirstName ? String(body.englishFirstName).trim() : null,
        englishLastName: body.englishLastName ? String(body.englishLastName).trim() : null,
        englishNickname: body.englishNickname ? String(body.englishNickname).trim() : null,
        defaultUsername,
        nickname: body.nickname ? String(body.nickname).trim() : null,
        role: mapEmployeeRole(String(body.role ?? "Staff")),
        phone: body.phone ? String(body.phone).trim() : null,
        phone2: body.phone2 ? String(body.phone2).trim() : null,
        startDate: body.startDate ? new Date(String(body.startDate)) : null,
        photo: body.photo ? String(body.photo) : null
      }
    });

    const accountSync = await syncEmployeeAccount(prisma, {
      code: updated.code,
      name: updated.name,
      role: updated.role,
      englishFirstName: updated.englishFirstName,
      englishLastName: updated.englishLastName,
      defaultUsername: updated.defaultUsername,
      active: updated.active
    });

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "Employee",
        entityId: updated.id,
        action: "employee.updated",
        beforeJson: JSON.stringify({ code: existing.code, name: existing.name, role: existing.role, active: existing.active }),
        afterJson: JSON.stringify({ code: updated.code, name: updated.name, role: updated.role, active: updated.active })
      })
    });

    return NextResponse.json({
      id: updated.code,
      name: updated.name,
      englishFirstName: updated.englishFirstName ?? "",
      englishLastName: updated.englishLastName ?? "",
      englishNickname: updated.englishNickname ?? "",
      username: updated.defaultUsername ?? "",
      nickname: updated.nickname ?? updated.name.split(" ")[0],
      role: updated.role === "DRIVER" ? "Driver" : updated.role === "MANAGER" ? "Officer" : updated.role === "ADMIN" ? "Accounting" : "Staff",
      phone: updated.phone ?? "",
      phone2: updated.phone2 ?? "",
      startDate: updated.startDate ? updated.startDate.toISOString().slice(0, 10) : "",
      photo: updated.photo ?? "",
      accountSync,
      warning: accountSync.status === "error" ? "Employee saved, but user account sync failed." : null
    });
  } catch (error) {
    console.error("Employee update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
