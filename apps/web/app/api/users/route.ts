import { NextRequest, NextResponse } from "next/server";
import { createPrismaClient } from "../../../lib/prisma";
import { ALLOWED_ROLES_USER_ACCESS, defaultModuleAccessForRole, normalizeModuleAccess, type ModuleAccessMap, type UserRole } from "../../../lib/auth/role-guards";
import { auditData, getRoleFromRequest, hashPassword, requireRole, roleGuard } from "../../../lib/auth/server-session";

async function getPrisma() {
  return createPrismaClient();
}

function isUserSchemaMismatch(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("User.active") || message.includes("User.username") || (message.includes("column") && message.includes("does not exist"));
}

const DEMO_USERS_FALLBACK = [
  { id: "demo-superadmin-001", username: "superadmin", email: "superadmin@demo.local", displayName: "SuperAdmin Dev", role: "SUPERADMIN", active: true, moduleAccess: defaultModuleAccessForRole("SUPERADMIN"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-manager-001", username: "manager", email: "manager@demo.local", displayName: "Manager Dev", role: "MANAGER", active: true, moduleAccess: { ...defaultModuleAccessForRole("SUPERADMIN"), useraccess: undefined }, createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-officer-001", username: "officer", email: "officer@demo.local", displayName: "Officer Dev", role: "MANAGER", active: true, moduleAccess: defaultModuleAccessForRole("MANAGER"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-account-001", username: "account", email: "account@demo.local", displayName: "Account Dev", role: "ACCOUNTING", active: true, moduleAccess: defaultModuleAccessForRole("ACCOUNTING"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-staff-001", username: "staff", email: "staff@demo.local", displayName: "Staff Dev", role: "STAFF", active: true, moduleAccess: defaultModuleAccessForRole("STAFF"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-driver-001", username: "driver", email: "driver@demo.local", displayName: "Driver Dev", role: "DRIVER", active: true, moduleAccess: defaultModuleAccessForRole("DRIVER"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() }
];

function parseModuleAccess(raw: string | null | undefined, role: UserRole): ModuleAccessMap {
  if (!raw) return defaultModuleAccessForRole(role);
  try {
    return normalizeModuleAccess(JSON.parse(raw), role);
  } catch {
    return defaultModuleAccessForRole(role);
  }
}

function canAssignRole(actorRole: string | null, nextRole: string | undefined): boolean {
  if (!nextRole) return true;
  if (nextRole !== "SUPERADMIN") return true;
  return actorRole === "SUPERADMIN";
}

function canDeleteUser(actorRole: string | null): boolean {
  return actorRole === "SUPERADMIN";
}

function normalizeUsername(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function isValidUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 32) return false;
  return /^[a-z0-9._-]+$/.test(username);
}

export async function GET(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_USER_ACCESS);
  if (denied) return denied;

  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        active: true,
        moduleAccessJson: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      active: user.active,
      moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole),
      createdAt: user.createdAt
    })));
  } catch (error) {
    if (!prisma || isUserSchemaMismatch(error)) {
      return NextResponse.json(DEMO_USERS_FALLBACK, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_USER_ACCESS);
  if ("response" in auth) return auth.response;
  const role = auth.role;
  if (!canDeleteUser(role)) {
    return NextResponse.json({ error: "Only SUPERADMIN can create users" }, { status: 403 });
  }

  const body = await request.json();
  const username = normalizeUsername(body.username);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const userRole = body.role;
  const password = typeof body.password === "string" ? body.password : "";
  const moduleAccess = body.moduleAccess;

  if (!username || !email || !displayName || !userRole || !password) {
    return NextResponse.json({ error: "username, email, displayName, role, and password are required" }, { status: 400 });
  }
  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Username must be 3-32 chars using a-z, 0-9, dot, underscore, or dash" }, { status: 400 });
  }
  if (!canAssignRole(role, userRole)) {
    return NextResponse.json({ error: "Only SUPERADMIN can assign SUPERADMIN role" }, { status: 403 });
  }

  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        displayName,
        role: userRole as UserRole,
        passwordHash,
        active: true,
        moduleAccessJson: JSON.stringify(normalizeModuleAccess(moduleAccess, userRole as UserRole))
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        active: true,
        moduleAccessJson: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "User",
        entityId: user.id,
        action: "user.created",
        afterJson: JSON.stringify({ username: user.username, email: user.email, role: user.role })
      })
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      active: user.active,
      moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole),
      createdAt: user.createdAt
    }, { status: 201 });
  } catch (error) {
    if (!prisma || isUserSchemaMismatch(error)) {
      return NextResponse.json({ error: "User schema is outdated. Apply latest migrations." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_USER_ACCESS);
  if ("response" in auth) return auth.response;
  const role = auth.role;

  const body = await request.json();
  const { id, role: userRole, active, moduleAccess } = body;

  if (!id) {
    return NextResponse.json({ error: "user id is required" }, { status: 400 });
  }
  if (!canAssignRole(role, userRole)) {
    return NextResponse.json({ error: "Only SUPERADMIN can assign SUPERADMIN role" }, { status: 403 });
  }

  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, active: true, moduleAccessJson: true }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: { role?: UserRole; active?: boolean; moduleAccessJson?: string } = {};
    if (userRole !== undefined) updateData.role = userRole as UserRole;
    if (active !== undefined) updateData.active = active;
    if (moduleAccess !== undefined) {
      const roleForAccess = (userRole ?? user.role) as UserRole;
      updateData.moduleAccessJson = JSON.stringify(normalizeModuleAccess(moduleAccess, roleForAccess));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        active: true,
        moduleAccessJson: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "User",
        entityId: id,
        action: "user.updated",
        beforeJson: JSON.stringify({ username: user.username, role: user.role, active: user.active, moduleAccessJson: user.moduleAccessJson }),
        afterJson: JSON.stringify({ username: updated.username, role: updated.role, active: updated.active, moduleAccessJson: updated.moduleAccessJson })
      })
    });

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      displayName: updated.displayName,
      role: updated.role,
      active: updated.active,
      moduleAccess: parseModuleAccess(updated.moduleAccessJson, updated.role as UserRole),
      createdAt: updated.createdAt
    });
  } catch (error) {
    if (!prisma || isUserSchemaMismatch(error)) {
      return NextResponse.json({ error: "User schema is outdated. Apply latest migrations." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_USER_ACCESS);
  if ("response" in auth) return auth.response;
  const role = auth.role;
  if (!canDeleteUser(role)) {
    return NextResponse.json({ error: "Only SUPERADMIN can delete users" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "user id is required" }, { status: 400 });
  }

  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, role: true }
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "User",
        entityId: id,
        action: "user.deleted",
        beforeJson: JSON.stringify({ username: existing.username, email: existing.email, role: existing.role })
      })
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (!prisma || isUserSchemaMismatch(error)) {
      return NextResponse.json({ error: "User schema is outdated. Apply latest migrations." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
