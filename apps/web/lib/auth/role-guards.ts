import { NextResponse } from "next/server";

export type UserRole = "ADMIN" | "ACCOUNTING" | "MANAGER" | "STAFF" | "DRIVER";

export const ALLOWED_ROLES_WRITE: UserRole[] = ["ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_ORDER_WRITE: UserRole[] = ["ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_TRANSPORT_WRITE: UserRole[] = ["ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_PICKUP_WRITE: UserRole[] = ["ADMIN", "ACCOUNTING", "MANAGER", "STAFF"];
export const ALLOWED_ROLES_STAFF_WRITE: UserRole[] = ["ADMIN", "ACCOUNTING", "MANAGER", "STAFF"];
export const ALLOWED_ROLES_PERSONNEL_READ: UserRole[] = ["ADMIN", "MANAGER"];

export const MODULE_ACCESS: Record<string, UserRole[]> = {
  overview: ["ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"],
  orderlist: ["ADMIN", "ACCOUNTING", "MANAGER"],
  transport: ["ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"],
  staffing: ["ADMIN", "ACCOUNTING", "MANAGER", "STAFF"],
  personnel: ["ADMIN", "MANAGER"],
  master: ["ADMIN", "ACCOUNTING", "MANAGER"],
};

export function hasAccess(role: UserRole | null, allowed: UserRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export function getRoleGuardResponse(role: UserRole | null, allowed: UserRole[]): NextResponse | null {
  if (!hasAccess(role, allowed)) {
    return new NextResponse(JSON.stringify({ error: "Insufficient role for this action" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

export function getModuleGuardResponse(role: UserRole | null, module: string): NextResponse | null {
  const allowed = MODULE_ACCESS[module];
  if (!allowed || !hasAccess(role, allowed)) {
    return new NextResponse(JSON.stringify({ error: `Access denied to module: ${module}` }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}