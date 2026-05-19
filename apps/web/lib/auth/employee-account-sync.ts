import type { PrismaClient, UserRole } from "@prisma/client";
import { defaultModuleAccessForRole, normalizeModuleAccess } from "./role-guards";
import { hashPassword } from "./server-session";

type EmployeeAccountSource = {
  code: string;
  name: string;
  role: string;
  englishFirstName?: string | null;
  englishLastName?: string | null;
  defaultUsername?: string | null;
  active: boolean;
};

export type EmployeeAccountSyncResult =
  | {
      status: "synced";
      action: "created" | "updated";
      username: string;
      role: UserRole;
      backfilledEmployee: boolean;
    }
  | {
      status: "skipped";
      reason: "role_not_syncable" | "username_unavailable" | "conflicting_user";
      username?: string;
      role?: UserRole;
    }
  | {
      status: "error";
      reason: string;
      username?: string;
      role?: UserRole;
    };

function splitNameParts(name?: string | null) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : ""
  };
}

function buildUsername(firstName?: string | null, lastName?: string | null) {
  const first = String(firstName ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const last = String(lastName ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 3);
  return first && last ? `${first}.${last}` : "";
}

export function mapUserRoleFromEmployee(role: string): UserRole {
  if (role === "DRIVER" || role === "Driver") return "DRIVER";
  if (role === "ADMIN" || role === "Accounting") return "ACCOUNTING";
  if (role === "MANAGER" || role === "Officer") return "ADMIN";
  return "STAFF";
}

export function shouldCreateAccountForRole(role: UserRole) {
  return role === "STAFF" || role === "DRIVER";
}

export function buildUsernameFromEmployee(employee: Pick<EmployeeAccountSource, "code" | "name" | "englishFirstName" | "englishLastName" | "defaultUsername">) {
  const direct = String(employee.defaultUsername ?? "").trim().toLowerCase();
  if (direct) {
    return {
      username: direct,
      englishFirstName: String(employee.englishFirstName ?? "").trim(),
      englishLastName: String(employee.englishLastName ?? "").trim()
    };
  }

  const englishFirstName = String(employee.englishFirstName ?? "").trim();
  const englishLastName = String(employee.englishLastName ?? "").trim();
  const fromEnglish = buildUsername(englishFirstName, englishLastName);
  if (fromEnglish) {
    return { username: fromEnglish, englishFirstName, englishLastName };
  }

  const fallbackName = splitNameParts(employee.name);
  const fromDisplayName = buildUsername(fallbackName.firstName, fallbackName.lastName);
  if (fromDisplayName) {
    return {
      username: fromDisplayName,
      englishFirstName: fallbackName.firstName,
      englishLastName: fallbackName.lastName
    };
  }

  const fallbackCode = String(employee.code ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    username: fallbackCode,
    englishFirstName: englishFirstName || fallbackName.firstName,
    englishLastName: englishLastName || fallbackName.lastName
  };
}

export async function syncEmployeeAccount(
  prisma: PrismaClient,
  employee: EmployeeAccountSource,
  options?: { backfillEmployee?: boolean }
): Promise<EmployeeAccountSyncResult> {
  const role = mapUserRoleFromEmployee(employee.role);
  if (!shouldCreateAccountForRole(role)) {
    return { status: "skipped", reason: "role_not_syncable", role };
  }

  const derived = buildUsernameFromEmployee(employee);
  const username = derived.username;
  if (!username) {
    return { status: "skipped", reason: "username_unavailable", role };
  }

  const email = `${username}@zipline.local`;
  const moduleAccessJson = JSON.stringify(normalizeModuleAccess(defaultModuleAccessForRole(role), role));

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true, username: true }
    });

    if (existingUser && existingUser.username !== username) {
      return { status: "skipped", reason: "conflicting_user", username, role };
    }

    const action = existingUser ? "updated" : "created";
    await prisma.user.upsert({
      where: { username },
      update: {
        displayName: employee.name,
        role,
        active: employee.active,
        moduleAccessJson
      },
      create: {
        username,
        email,
        displayName: employee.name,
        role,
        passwordHash: hashPassword("sjl123"),
        active: employee.active,
        moduleAccessJson
      }
    });

    let backfilledEmployee = false;
    if (options?.backfillEmployee) {
      const needsEmployeeBackfill =
        employee.defaultUsername !== username ||
        !String(employee.englishFirstName ?? "").trim() ||
        !String(employee.englishLastName ?? "").trim();

      if (needsEmployeeBackfill) {
        await prisma.employee.update({
          where: { code: employee.code },
          data: {
            defaultUsername: username,
            englishFirstName: String(employee.englishFirstName ?? "").trim() || derived.englishFirstName || null,
            englishLastName: String(employee.englishLastName ?? "").trim() || derived.englishLastName || null
          }
        });
        backfilledEmployee = true;
      }
    }

    return { status: "synced", action, username, role, backfilledEmployee };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown sync error";
    return { status: "error", reason, username, role };
  }
}
