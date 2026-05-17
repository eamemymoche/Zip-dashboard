import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createPrismaClient } from "../../../../lib/prisma";
import { ALL_BOARD_KEYS, defaultBoardAccessForRole, normalizeBoardAccess, type UserRole } from "../../../../lib/auth/role-guards";

async function getPrisma() {
  return createPrismaClient();
}

const SESSION_COOKIE = "zcc_session";
const SESSION_ROLE_COOKIE = "zcc_role";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

const DEV_AUTH_USERS = [
  { email: "superadmin@zipline.com", password: "super123", id: "dev-superadmin-001", role: "SUPERADMIN", displayName: "SuperAdmin Dev", moduleAccess: ALL_BOARD_KEYS },
  { email: "officer@zipline.com", password: "zipline123", id: "dev-officer-001", role: "MANAGER", displayName: "Officer Dev", moduleAccess: defaultBoardAccessForRole("MANAGER") },
  { email: "owner@zipline.com", password: "owner123", id: "dev-owner-001", role: "ADMIN", displayName: "Owner Dev", moduleAccess: defaultBoardAccessForRole("ADMIN") },
  { email: "accounting@zipline.com", password: "accounting123", id: "dev-accounting-001", role: "ACCOUNTING", displayName: "Accounting Dev", moduleAccess: defaultBoardAccessForRole("ACCOUNTING") },
  { email: "staff@zipline.com", password: "staff123", id: "dev-staff-001", role: "STAFF", displayName: "Staff Dev", moduleAccess: defaultBoardAccessForRole("STAFF") },
  { email: "driver@zipline.com", password: "driver123", id: "dev-driver-001", role: "DRIVER", displayName: "Driver Dev", moduleAccess: defaultBoardAccessForRole("DRIVER") }
];

function parseModuleAccess(raw: string | null | undefined, role: UserRole): string[] {
  if (!raw) return defaultBoardAccessForRole(role);
  try {
    return normalizeBoardAccess(JSON.parse(raw), role);
  } catch {
    return defaultBoardAccessForRole(role);
  }
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password + SESSION_SECRET).digest("hex");
}

function makeSessionToken(userId: string, role: string): string {
  const payload = Buffer.from(`${userId}:${role}:${Date.now()}`).toString("base64url");
  const sig = createHash("sha256").update(payload + SESSION_SECRET).digest("hex").slice(0, 16);
  return `${payload}.${sig}`;
}

function parseSessionToken(token: string): { userId: string; role: string; ts: number } | null {
  try {
    const [payload, sig] = token.split(".");
    const expectedSig = createHash("sha256").update(payload + SESSION_SECRET).digest("hex").slice(0, 16);
    if (sig !== expectedSig) return null;
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [userId, role, ts] = decoded.split(":");
    return { userId, role, ts: parseInt(ts, 10) };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, role: true, passwordHash: true, moduleAccessJson: true }
    });

    if (user && user.passwordHash) {
      const hash = hashPassword(password);
      if (hash === user.passwordHash) {
        const token = makeSessionToken(user.id, user.role);
        const response = NextResponse.json({
          user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole) }
        });
        response.cookies.set(SESSION_COOKIE, token, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 8
        });
        response.cookies.set(SESSION_ROLE_COOKIE, user.role, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 8
        });
        await prisma.$disconnect();
        return response;
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Login DB error:", error);
  }

  const devUser = DEV_AUTH_USERS.find(u => u.email === email && u.password === password);
  if (devUser) {
    const token = makeSessionToken(devUser.id, devUser.role);
    const response = NextResponse.json({
      user: { id: devUser.id, email: devUser.email, displayName: devUser.displayName, role: devUser.role, moduleAccess: devUser.moduleAccess }
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    response.cookies.set(SESSION_ROLE_COOKIE, devUser.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    return response;
  }

  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, role: true, passwordHash: true, moduleAccessJson: true }
    });

    if (!user || !user.passwordHash) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const hash = hashPassword(password);
    if (hash !== user.passwordHash) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = makeSessionToken(user.id, user.role);
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole) }
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    response.cookies.set(SESSION_ROLE_COOKIE, user.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    await prisma.$disconnect();
    return response;
  } catch (error) {
    console.error("Login DB error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const session = parseSessionToken(token);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const ageMs = Date.now() - session.ts;
  if (ageMs > 8 * 60 * 60 * 1000) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const devUser = DEV_AUTH_USERS.find(u => u.id === session.userId && u.role === session.role);
  if (devUser) {
    return NextResponse.json({ user: { id: devUser.id, email: devUser.email, displayName: devUser.displayName, role: devUser.role, moduleAccess: devUser.moduleAccess } });
  }

  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, displayName: true, role: true, moduleAccessJson: true }
    });
    await prisma.$disconnect();
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole)
      } : null
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(SESSION_ROLE_COOKIE);
  return response;
}
