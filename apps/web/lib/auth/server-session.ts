import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "./role-guards";

const SESSION_COOKIE = "zcc_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

type ParsedSession = {
  userId: string;
  role: UserRole;
  ts: number;
};

function hashUserAgent(userAgent: string | null): string {
  return createHash("sha256")
    .update((userAgent ?? "unknown") + SESSION_SECRET)
    .digest("hex")
    .slice(0, 12);
}

export function parseSignedSessionToken(token: string, userAgent: string | null): ParsedSession | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expectedSig = createHash("sha256")
      .update(payload + SESSION_SECRET)
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

export function getSessionFromRequest(request: NextRequest): ParsedSession | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSignedSessionToken(token, request.headers.get("user-agent"));
}

export function getRoleFromRequest(request: NextRequest): UserRole | null {
  return getSessionFromRequest(request)?.role ?? null;
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
