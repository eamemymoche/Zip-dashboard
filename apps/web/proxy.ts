import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "./lib/auth/server-session";

const SESSION_COOKIE = "zcc_session";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/subagent"];

const MODULE_ROUTE_ACCESS: Record<string, string[]> = {
  "/personnel": ["ADMIN", "MANAGER"],
};

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

  const session = getSessionFromRequest(request);
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  const role = session.role;

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
