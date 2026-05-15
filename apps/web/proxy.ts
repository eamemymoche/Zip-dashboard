import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "zcc_session";
const SESSION_ROLE_COOKIE = "zcc_role";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

function parseSessionToken(token: string): { userId: string; role: string; ts: number } | null {
  try {
    const [payload, sig] = token.split(".");
    const sigInput = payload + SESSION_SECRET;
    const expectedSig = createHash("sha256").update(sigInput).digest("hex").slice(0, 16);
    if (sig !== expectedSig) return null;
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [userId, role, ts] = decoded.split(":");
    return { userId, role, ts: parseInt(ts, 10) };
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/subagent"];

const MODULE_ROUTE_ACCESS: Record<string, string[]> = {
  "/personnel": ["ADMIN", "MANAGER"],
};

function getRoleFromCookies(request: NextRequest): string | null {
  const roleCookie = request.cookies.get("zcc_role")?.value;
  return roleCookie ?? null;
}

function checkModuleAccess(pathname: string, role: string | null, requestUrl: string): NextResponse | null {
  for (const [prefix, allowed] of Object.entries(MODULE_ROUTE_ACCESS)) {
    if (pathname.startsWith(prefix)) {
      if (!role || !allowed.includes(role)) {
        const loginUrl = new URL("/login", requestUrl);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = parseSessionToken(token);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(SESSION_ROLE_COOKIE);
    return response;
  }

  const ageMs = Date.now() - session.ts;
  if (ageMs > 8 * 60 * 60 * 1000) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(SESSION_ROLE_COOKIE);
    return response;
  }

  const role = request.cookies.get(SESSION_ROLE_COOKIE)?.value ?? session.role;

  const moduleDenied = checkModuleAccess(pathname, role, request.url.toString());
  if (moduleDenied) return moduleDenied;

  const response = NextResponse.next();
  response.headers.set("x-user-id", session.userId);
  response.headers.set("x-user-role", role);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};