import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createPrismaClient } from "../../../lib/prisma";
import { ALLOWED_ROLES_USER_ACCESS, ALL_BOARD_KEYS, defaultBoardAccessForRole, normalizeBoardAccess, type BoardKey, type UserRole } from "../../../lib/auth/role-guards";

async function getPrisma() {
  return createPrismaClient();
}

function getRole(request: NextRequest): string | null {
  return request.headers.get("x-user-role") ?? request.cookies.get("zcc_role")?.value ?? null;
}

function roleGuard(role: string | null, allowed: string[]): NextResponse | null {
  if (!role || !allowed.includes(role)) {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

function isUserSchemaMismatch(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("User.active") || message.includes("column") && message.includes("does not exist");
}

const DEMO_USERS_FALLBACK = [
  { id: "demo-superadmin-001", email: "superadmin@zipline.com", displayName: "SuperAdmin Dev", role: "SUPERADMIN", active: true, moduleAccess: ALL_BOARD_KEYS, createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-admin-001", email: "owner@zipline.com", displayName: "Owner Dev", role: "ADMIN", active: true, moduleAccess: defaultBoardAccessForRole("ADMIN"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-officer-001", email: "officer@zipline.com", displayName: "Officer Dev", role: "MANAGER", active: true, moduleAccess: defaultBoardAccessForRole("MANAGER"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-account-001", email: "accounting@zipline.com", displayName: "Account Dev", role: "ACCOUNTING", active: true, moduleAccess: defaultBoardAccessForRole("ACCOUNTING"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-staff-001", email: "staff@zipline.com", displayName: "Staff Dev", role: "STAFF", active: true, moduleAccess: defaultBoardAccessForRole("STAFF"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() },
  { id: "demo-driver-001", email: "driver@zipline.com", displayName: "Driver Dev", role: "DRIVER", active: true, moduleAccess: defaultBoardAccessForRole("DRIVER"), createdAt: new Date("2026-05-17T00:00:00.000Z").toISOString() }
];

function parseModuleAccess(raw: string | null | undefined, role: UserRole): BoardKey[] {
  if (!raw) return defaultBoardAccessForRole(role);
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeBoardAccess(parsed, role);
  } catch {
    return defaultBoardAccessForRole(role);
  }
}

function canAssignRole(actorRole: string | null, nextRole: string | undefined): boolean {
  if (!nextRole) return true;
  if (nextRole !== "SUPERADMIN") return true;
  return actorRole === "SUPERADMIN";
}

export async function GET(request: NextRequest) {
  const role = getRole(request);
  const denied = roleGuard(role, ALLOWED_ROLES_USER_ACCESS);
  if (denied) return denied;

  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
    const users = await prisma.user.findMany({
      select: {
        id: true,
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
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      active: user.active,
      moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole),
      createdAt: user.createdAt
    })));
  } catch (error) {
    if (!prisma) {
      return NextResponse.json(DEMO_USERS_FALLBACK, { status: 200 });
    }
    if (isUserSchemaMismatch(error)) {
      return NextResponse.json(DEMO_USERS_FALLBACK, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

export async function POST(request: NextRequest) {
  const role = getRole(request);
  const denied = roleGuard(role, ALLOWED_ROLES_USER_ACCESS);
  if (denied) return denied;

  const body = await request.json();
  const { email, displayName, role: userRole, password, moduleAccess } = body;

  if (!email || !displayName || !userRole || !password) {
    return NextResponse.json({ error: "email, displayName, role, and password are required" }, { status: 400 });
  }
  if (!canAssignRole(role, userRole)) {
    return NextResponse.json({ error: "Only SUPERADMIN can assign SUPERADMIN role" }, { status: 403 });
  }

  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
    const passwordHash = createHash("sha256").update(password + SESSION_SECRET).digest("hex");

    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        role: userRole as UserRole,
        passwordHash,
        active: true,
        moduleAccessJson: JSON.stringify(normalizeBoardAccess(moduleAccess, userRole as UserRole))
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        active: true,
        moduleAccessJson: true,
        createdAt: true
      }
    });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      active: user.active,
      moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole),
      createdAt: user.createdAt
    }, { status: 201 });
  } catch (error) {
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    if (isUserSchemaMismatch(error)) {
      return NextResponse.json({ error: "User schema is outdated. Apply latest migrations." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

export async function PUT(request: NextRequest) {
  const role = getRole(request);
  const denied = roleGuard(role, ALLOWED_ROLES_USER_ACCESS);
  if (denied) return denied;

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
      select: { id: true, role: true, active: true, moduleAccessJson: true }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: { role?: UserRole; active?: boolean; moduleAccessJson?: string } = {};
    if (userRole !== undefined) updateData.role = userRole as UserRole;
    if (active !== undefined) updateData.active = active;
    if (moduleAccess !== undefined) {
      const roleForAccess = (userRole ?? user.role) as UserRole;
      updateData.moduleAccessJson = JSON.stringify(normalizeBoardAccess(moduleAccess, roleForAccess));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        active: true,
        moduleAccessJson: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "User",
        entityId: id,
        action: "user.updated",
        beforeJson: JSON.stringify({ role: user.role, active: user.active, moduleAccessJson: user.moduleAccessJson }),
        afterJson: JSON.stringify({ role: updated.role, active: updated.active, moduleAccessJson: updated.moduleAccessJson })
      }
    });

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      role: updated.role,
      active: updated.active,
      moduleAccess: parseModuleAccess(updated.moduleAccessJson, updated.role as UserRole),
      createdAt: updated.createdAt
    });
  } catch (error) {
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    if (isUserSchemaMismatch(error)) {
      return NextResponse.json({ error: "User schema is outdated. Apply latest migrations." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
