import { NextResponse } from "next/server";

export type UserRole = "SUPERADMIN" | "ADMIN" | "ACCOUNTING" | "MANAGER" | "STAFF" | "DRIVER";
export type BoardKey = "overview" | "orderlist" | "transport" | "staffing" | "personnel" | "master" | "useraccess" | "changelog";

export const ALLOWED_ROLES_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_ORDER_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_TRANSPORT_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_PICKUP_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF"];
export const ALLOWED_ROLES_STAFF_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF"];
export const ALLOWED_ROLES_PERSONNEL_READ: UserRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"];
export const ALLOWED_ROLES_EMPLOYEE_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"];
export const ALLOWED_ROLES_PRODUCT_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_USER_ACCESS: UserRole[] = ["SUPERADMIN", "ADMIN"];

export const MODULE_ACCESS: Record<string, UserRole[]> = {
  overview: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"],
  orderlist: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"],
  transport: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"],
  staffing: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF"],
  personnel: ["SUPERADMIN", "ADMIN", "MANAGER"],
  master: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"],
  useraccess: ["SUPERADMIN", "ADMIN"],
  changelog: ["SUPERADMIN", "ADMIN"],
};

export const ALL_BOARD_KEYS: BoardKey[] = ["overview", "orderlist", "transport", "staffing", "personnel", "master", "useraccess", "changelog"];

export const ALL_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTING: "Account",
  MANAGER: "Officer",
  STAFF: "Staff",
  DRIVER: "Driver",
};

export function defaultBoardAccessForRole(role: UserRole | null): BoardKey[] {
  if (!role) return [];
  if (role === "SUPERADMIN") return [...ALL_BOARD_KEYS];
  return ALL_BOARD_KEYS.filter((board) => MODULE_ACCESS[board]?.includes(role));
}

export function normalizeBoardAccess(input: unknown, role: UserRole | null): BoardKey[] {
  const defaultBoards = defaultBoardAccessForRole(role);
  if (role === "SUPERADMIN") {
    return [...ALL_BOARD_KEYS];
  }
  if (!Array.isArray(input)) {
    return defaultBoards;
  }
  const set = new Set(input.filter((value): value is BoardKey => typeof value === "string" && ALL_BOARD_KEYS.includes(value as BoardKey)));
  const allowedByRole = new Set(defaultBoards);
  return [...set].filter((board) => allowedByRole.has(board));
}

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
