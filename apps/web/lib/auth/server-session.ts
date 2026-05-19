import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "./role-guards";

const SESSION_COOKIE = "zcc_session";
const DEV_SESSION_SECRET = "dev-secret-change-in-production";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const PASSWORD_PREFIX = "scrypt";

type ParsedSession = {
  userId: string;
  role: UserRole;
  ts: number;
};

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  const unsafe = !secret || secret === DEV_SESSION_SECRET || secret === "replace-me" || secret.length < 32;
  if (isProduction() && unsafe) {
    console.error("SESSION_SECRET is missing, default, or too short in production. Falling back to the built-in secret. Set a long custom SESSION_SECRET as soon as possible.");
  }
  return secret && !unsafe ? secret : DEV_SESSION_SECRET;
}

export function isDevAuthFallbackEnabled() {
  return !isProduction() && process.env.DISABLE_DEV_AUTH_FALLBACK !== "1";
}

export function isDemoAuthEnabled() {
  return process.env.DISABLE_DEMO_AUTH !== "1";
}

function hashUserAgent(userAgent: string | null): string {
  return createHash("sha256")
    .update((userAgent ?? "unknown") + getSessionSecret())
    .digest("hex")
    .slice(0, 12);
}

export function parseSignedSessionToken(token: string, userAgent: string | null): ParsedSession | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expectedSig = createHash("sha256")
      .update(payload + getSessionSecret())
      .digest("hex")
      .slice(0, 16);
    if (sig !== expectedSig) return null;

    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [userId, role, ts, uaHash] = decoded.split(":");
    if (!userId || !role || !ts || !uaHash) return null;
    if (uaHash !== hashUserAgent(userAgent)) return null;

    const parsed = Number(ts);
    if (!Number.isFinite(parsed)) return null;
    if (Date.now() - parsed > SESSION_MAX_AGE_MS) return null;

    return { userId, role: role as UserRole, ts: parsed };
  } catch {
    return null;
  }
}

export function makeSessionToken(userId: string, role: string, userAgent: string | null): string {
  const payload = Buffer.from(`${userId}:${role}:${Date.now()}:${hashUserAgent(userAgent)}`).toString("base64url");
  const sig = createHash("sha256").update(payload + getSessionSecret()).digest("hex").slice(0, 16);
  return `${payload}.${sig}`;
}

export function getSessionFromRequest(request: NextRequest): ParsedSession | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSignedSessionToken(token, request.headers.get("user-agent"));
}

export function getRoleFromRequest(request: NextRequest): UserRole | null {
  return getSessionFromRequest(request)?.role ?? null;
}

export function hasTrustedOrigin(request: NextRequest): boolean {
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

export function originGuard(request: NextRequest): NextResponse | null {
  if (!hasTrustedOrigin(request)) {
    return new NextResponse(JSON.stringify({ error: "Untrusted origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

export function roleGuard(role: string | null, allowed: string[]): NextResponse | null {
  if (!role || !allowed.includes(role)) {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

export function requireRole(request: NextRequest, allowed: string[]): { userId: string; role: UserRole; response?: never } | { response: NextResponse } {
  const session = getSessionFromRequest(request);
  if (!session || !allowed.includes(session.role)) {
    return { response: roleGuard(session?.role ?? null, allowed) ?? new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) };
  }
  const originDenied = originGuard(request);
  if (originDenied) return { response: originDenied };
  return { userId: session.userId, role: session.role };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, 64).toString("base64url");
  return `${PASSWORD_PREFIX}$${salt}$${derived}`;
}

function legacyHashPassword(password: string): string {
  return createHash("sha256").update(password + getSessionSecret()).digest("hex");
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  if (!storedHash.startsWith(`${PASSWORD_PREFIX}$`)) {
    return legacyHashPassword(password) === storedHash;
  }

  const [, salt, expected] = storedHash.split("$");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("base64url");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function passwordNeedsRehash(storedHash: string | null | undefined): boolean {
  return !storedHash?.startsWith(`${PASSWORD_PREFIX}$`);
}

export function auditData(actorId: string | null, data: { entityType: string; entityId: string; action: string; beforeJson?: string | null; afterJson?: string | null }) {
  return {
    actorId: actorId?.startsWith("dev-") ? null : actorId,
    ...data
  };
}
