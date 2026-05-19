import { NextResponse } from "next/server";

export type UserRole = "SUPERADMIN" | "ADMIN" | "ACCOUNTING" | "MANAGER" | "STAFF" | "DRIVER";
export type BoardKey = "overview" | "orderlist" | "transport" | "staffing" | "personnel" | "accounting" | "changelog" | "useraccess" | "master" | "backup";
export type BoardPermission = "view" | "edit";
export type ModuleAccessMap = Partial<Record<BoardKey, BoardPermission>>;

export const ALLOWED_ROLES_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_ORDER_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_TRANSPORT_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_PICKUP_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF"];
export const ALLOWED_ROLES_STAFF_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF"];
export const ALLOWED_ROLES_PERSONNEL_READ: UserRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"];
export const ALLOWED_ROLES_EMPLOYEE_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"];
export const ALLOWED_ROLES_PRODUCT_WRITE: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];
export const ALLOWED_ROLES_USER_ACCESS: UserRole[] = ["SUPERADMIN", "ADMIN"];
export const ALLOWED_ROLES_BACKUP_READ: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"];

export const MODULE_ACCESS: Record<string, UserRole[]> = {
  overview: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"],
  orderlist: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"],
  transport: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"],
  staffing: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF"],
  personnel: ["SUPERADMIN", "ADMIN", "MANAGER"],
  accounting: ["SUPERADMIN", "ADMIN", "ACCOUNTING"],
  changelog: ["SUPERADMIN", "ADMIN"],
  useraccess: ["SUPERADMIN", "ADMIN"],
  master: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"],
  backup: ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER"],
};

export const ALL_BOARD_KEYS: BoardKey[] = ["overview", "orderlist", "transport", "staffing", "personnel", "accounting", "changelog", "useraccess", "master", "backup"];

export const ALL_ROLES: UserRole[] = ["SUPERADMIN", "ADMIN", "ACCOUNTING", "MANAGER", "STAFF", "DRIVER"];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTING: "Account",
  MANAGER: "Manager",
  STAFF: "Staff",
  DRIVER: "Driver",
};

export function defaultBoardAccessForRole(role: UserRole | null): BoardKey[] {
  if (!role) return [];
  if (role === "SUPERADMIN") return [...ALL_BOARD_KEYS];
  return ALL_BOARD_KEYS.filter((board) => MODULE_ACCESS[board]?.includes(role));
}

export function defaultModuleAccessForRole(role: UserRole | null): ModuleAccessMap {
  return defaultBoardAccessForRole(role).reduce<ModuleAccessMap>((map, board) => {
    map[board] = "edit";
    return map;
  }, {});
}

export function normalizeBoardAccess(input: unknown, role: UserRole | null): BoardKey[] {
  return Object.keys(normalizeModuleAccess(input, role)) as BoardKey[];
}

export function normalizeModuleAccess(input: unknown, role: UserRole | null): ModuleAccessMap {
  const defaults = defaultModuleAccessForRole(role);
  if (role === "SUPERADMIN") {
    return { ...defaultModuleAccessForRole(role) };
  }

  if (!input) {
    return defaults;
  }

  const allowedBoards = new Set(
    role === "MANAGER"
      ? ALL_BOARD_KEYS.filter((board) => board !== "useraccess")
      : defaultBoardAccessForRole(role)
  );
  const next: ModuleAccessMap = {};

  if (Array.isArray(input)) {
    for (const value of input) {
      if (typeof value === "string" && allowedBoards.has(value as BoardKey)) {
        next[value as BoardKey] = "edit";
      }
    }
    return next;
  }

  if (typeof input === "object") {
    for (const [rawBoard, rawPermission] of Object.entries(input as Record<string, unknown>)) {
      if (!allowedBoards.has(rawBoard as BoardKey)) continue;
      if (rawPermission === "view" || rawPermission === "edit") {
        next[rawBoard as BoardKey] = rawPermission;
      }
    }
    return next;
  }

  return defaults;
}

export function listAccessibleBoards(access: ModuleAccessMap | null | undefined): BoardKey[] {
  if (!access) return [];
  return ALL_BOARD_KEYS.filter((board) => access[board] === "view" || access[board] === "edit");
}

export function canViewBoard(access: ModuleAccessMap | null | undefined, board: BoardKey): boolean {
  return access?.[board] === "view" || access?.[board] === "edit";
}

export function canEditBoard(access: ModuleAccessMap | null | undefined, board: BoardKey): boolean {
  return access?.[board] === "edit";
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
