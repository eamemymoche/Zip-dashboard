import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createPrismaClient } from "../../../../lib/prisma";
import { defaultModuleAccessForRole, normalizeModuleAccess, type ModuleAccessMap, type UserRole } from "../../../../lib/auth/role-guards";

async function getPrisma() {
  return createPrismaClient();
}

const SESSION_COOKIE = "zcc_session";
const SESSION_ROLE_COOKIE = "zcc_role";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
const LOGIN_RATE_LIMIT = 40;
const LOGIN_WINDOW_MS = 60_000;
const LOCK_LIMIT = 5;
const LOCK_WINDOW_MS = 10 * 60_000;

const rateBuckets = new Map<string, number[]>();
const failedAttempts = new Map<string, { count: number; firstAt: number; lockedUntil: number }>();

const DEV_AUTH_USERS = [
  { username: "superadmin", email: "superadmin@demo.local", password: "super123", id: "dev-superadmin-001", role: "SUPERADMIN", displayName: "SuperAdmin Dev", moduleAccess: defaultModuleAccessForRole("SUPERADMIN") },
  { username: "manager", email: "manager@demo.local", password: "manager123", id: "dev-manager-001", role: "MANAGER", displayName: "Manager Dev", moduleAccess: { ...defaultModuleAccessForRole("SUPERADMIN"), useraccess: undefined } },
  { username: "officer", email: "officer@demo.local", password: "zipline123", id: "dev-officer-001", role: "MANAGER", displayName: "Officer Dev", moduleAccess: defaultModuleAccessForRole("MANAGER") },
  { username: "account", email: "account@demo.local", password: "accounting123", id: "dev-accounting-001", role: "ACCOUNTING", displayName: "Account Dev", moduleAccess: defaultModuleAccessForRole("ACCOUNTING") },
  { username: "staff", email: "staff@demo.local", password: "staff123", id: "dev-staff-001", role: "STAFF", displayName: "Staff Dev", moduleAccess: defaultModuleAccessForRole("STAFF") },
  { username: "driver", email: "driver@demo.local", password: "driver123", id: "dev-driver-001", role: "DRIVER", displayName: "Driver Dev", moduleAccess: defaultModuleAccessForRole("DRIVER") }
];

function parseModuleAccess(raw: string | null | undefined, role: UserRole): ModuleAccessMap {
  if (!raw) return defaultModuleAccessForRole(role);
  try {
    return normalizeModuleAccess(JSON.parse(raw), role);
  } catch {
    return defaultModuleAccessForRole(role);
  }
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password + SESSION_SECRET).digest("hex");
}

function hashUserAgent(userAgent: string | null): string {
  return createHash("sha256").update((userAgent ?? "unknown") + SESSION_SECRET).digest("hex").slice(0, 12);
}

function makeSessionToken(userId: string, role: string, userAgent: string | null): string {
  const payload = Buffer.from(`${userId}:${role}:${Date.now()}:${hashUserAgent(userAgent)}`).toString("base64url");
  const sig = createHash("sha256").update(payload + SESSION_SECRET).digest("hex").slice(0, 16);
  return `${payload}.${sig}`;
}

function parseSessionToken(token: string, userAgent: string | null): { userId: string; role: string; ts: number } | null {
  try {
    const [payload, sig] = token.split(".");
    const expectedSig = createHash("sha256").update(payload + SESSION_SECRET).digest("hex").slice(0, 16);
    if (sig !== expectedSig) return null;
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [userId, role, ts, uaHash] = decoded.split(":");
    if (uaHash !== hashUserAgent(userAgent)) return null;
    return { userId, role, ts: parseInt(ts, 10) };
  } catch {
    return null;
  }
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function createSecureResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  return response;
}

function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    const parsed = new URL(origin);
    return parsed.host === host;
  } catch {
    return false;
  }
}

function sanitizeIdentifier(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function isSafeIdentifier(identifier: string): boolean {
  if (!identifier || identifier.length < 3 || identifier.length > 64) return false;
  if (!/^[a-z0-9._@-]+$/.test(identifier)) return false;
  if (/(select|union|drop|insert|delete|update|script|<|>|--|'|")/i.test(identifier)) return false;
  return true;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entries = (rateBuckets.get(ip) ?? []).filter((ts) => now - ts < LOGIN_WINDOW_MS);
  entries.push(now);
  rateBuckets.set(ip, entries);
  return entries.length <= LOGIN_RATE_LIMIT;
}

function getAttemptKey(ip: string, identifier: string) {
  return `${ip}:${identifier}`;
}

function getLockState(key: string) {
  const current = failedAttempts.get(key);
  if (!current) return null;
  if (current.lockedUntil > Date.now()) return current;
  if (Date.now() - current.firstAt > LOCK_WINDOW_MS) {
    failedAttempts.delete(key);
    return null;
  }
  return current;
}

function registerFailure(key: string) {
  const now = Date.now();
  const current = failedAttempts.get(key);
  if (!current || now - current.firstAt > LOCK_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }
  const nextCount = current.count + 1;
  failedAttempts.set(key, {
    count: nextCount,
    firstAt: current.firstAt,
    lockedUntil: nextCount >= LOCK_LIMIT ? now + LOCK_WINDOW_MS : 0
  });
}

function clearFailures(key: string) {
  failedAttempts.delete(key);
}

async function findDatabaseUser(identifier: string) {
  const prisma = await getPrisma();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }]
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      role: true,
      passwordHash: true,
      moduleAccessJson: true,
      active: true
    }
  });
  return { prisma, user };
}

function findDevUser(identifier: string, password: string) {
  return DEV_AUTH_USERS.find((user) => (user.username === identifier || user.email === identifier) && user.password === password);
}

function setAuthCookies(response: NextResponse, token: string, role: string) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  };
  response.cookies.set(SESSION_COOKIE, token, cookieOptions);
  response.cookies.set(SESSION_ROLE_COOKIE, role, cookieOptions);
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 8_192) {
    return createSecureResponse({ error: "Request body too large" }, { status: 413 });
  }
  if (!hasTrustedOrigin(request)) {
    return createSecureResponse({ error: "Untrusted origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const identifier = sanitizeIdentifier(body.username ?? body.email ?? body.identifier);
  const password = typeof body.password === "string" ? body.password : "";
  const clientIp = getClientIp(request);
  const attemptKey = getAttemptKey(clientIp, identifier || "unknown");

  if (!checkRateLimit(clientIp)) {
    return createSecureResponse({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const lockState = getLockState(attemptKey);
  if (lockState?.lockedUntil && lockState.lockedUntil > Date.now()) {
    return createSecureResponse({ error: "Too many failed attempts. Please wait 10 minutes and try again." }, { status: 429 });
  }

  if (!identifier || !password) {
    return createSecureResponse({ error: "username and password are required" }, { status: 400 });
  }

  if (!isSafeIdentifier(identifier)) {
    return createSecureResponse({ error: "Invalid username format" }, { status: 400 });
  }

  try {
    const { prisma, user } = await findDatabaseUser(identifier);
    try {
      if (user && user.active !== false && user.passwordHash && hashPassword(password) === user.passwordHash) {
        clearFailures(attemptKey);
        const token = makeSessionToken(user.id, user.role, request.headers.get("user-agent"));
        const response = createSecureResponse({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole)
          }
        });
        setAuthCookies(response, token, user.role);
        return response;
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Login DB error:", error);
  }

  const devUser = findDevUser(identifier, password);
  if (devUser) {
    clearFailures(attemptKey);
    const token = makeSessionToken(devUser.id, devUser.role, request.headers.get("user-agent"));
    const response = createSecureResponse({
      user: {
        id: devUser.id,
        username: devUser.username,
        email: devUser.email,
        displayName: devUser.displayName,
        role: devUser.role,
        moduleAccess: devUser.moduleAccess
      }
    });
    setAuthCookies(response, token, devUser.role);
    return response;
  }

  registerFailure(attemptKey);
  return createSecureResponse({ error: "Invalid credentials" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return createSecureResponse({ user: null }, { status: 200 });
  }

  const session = parseSessionToken(token, request.headers.get("user-agent"));
  if (!session) {
    return createSecureResponse({ user: null }, { status: 200 });
  }

  const ageMs = Date.now() - session.ts;
  if (ageMs > 8 * 60 * 60 * 1000) {
    return createSecureResponse({ user: null }, { status: 200 });
  }

  const devUser = DEV_AUTH_USERS.find((user) => user.id === session.userId && user.role === session.role);
  if (devUser) {
    return createSecureResponse({
      user: {
        id: devUser.id,
        username: devUser.username,
        email: devUser.email,
        displayName: devUser.displayName,
        role: devUser.role,
        moduleAccess: devUser.moduleAccess
      }
    });
  }

  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, email: true, displayName: true, role: true, moduleAccessJson: true, active: true }
    });
    await prisma.$disconnect();
    return createSecureResponse({
      user: user && user.active !== false
        ? {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            moduleAccess: parseModuleAccess(user.moduleAccessJson, user.role as UserRole)
          }
        : null
    });
  } catch {
    return createSecureResponse({ user: null }, { status: 200 });
  }
}

export async function DELETE() {
  const response = createSecureResponse({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(SESSION_ROLE_COOKIE);
  return response;
}
