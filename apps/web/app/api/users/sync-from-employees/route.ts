import { NextRequest, NextResponse } from "next/server";
import { createPrismaClient } from "../../../../lib/prisma";
import { ALLOWED_ROLES_USER_ACCESS } from "../../../../lib/auth/role-guards";
import { auditData, requireRole } from "../../../../lib/auth/server-session";
import { syncEmployeeAccount } from "../../../../lib/auth/employee-account-sync";

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_USER_ACCESS);
  if ("response" in auth) return auth.response;
  if (auth.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Only SUPERADMIN can create users" }, { status: 403 });
  }

  let prisma;
  try {
    prisma = createPrismaClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const employees = await prisma.employee.findMany({
      where: {
        role: { in: ["STAFF", "DRIVER"] }
      },
      select: {
        code: true,
        name: true,
        role: true,
        englishFirstName: true,
        englishLastName: true,
        defaultUsername: true,
        active: true
      }
    });

    const synced = [];
    const skipped = [];
    const errors = [];
    for (const employee of employees) {
      const result = await syncEmployeeAccount(prisma, employee, { backfillEmployee: true });
      if (result.status === "synced") {
        synced.push({
          code: employee.code,
          username: result.username,
          role: result.role,
          action: result.action,
          backfilledEmployee: result.backfilledEmployee
        });
      } else if (result.status === "skipped") {
        skipped.push({
          code: employee.code,
          reason: result.reason,
          username: result.username ?? null,
          role: result.role ?? null
        });
      } else {
        errors.push({
          code: employee.code,
          reason: result.reason,
          username: result.username ?? null,
          role: result.role ?? null
        });
      }
    }

    if (synced.length > 0 || skipped.length > 0 || errors.length > 0) {
      await prisma.auditLog.create({
        data: auditData(auth.userId, {
          entityType: "User",
          entityId: "employee-sync",
          action: "user.synced_from_employees",
          afterJson: JSON.stringify({
            syncedCount: synced.length,
            skippedCount: skipped.length,
            errorCount: errors.length,
            synced,
            skipped,
            errors
          })
        })
      });
    }

    return NextResponse.json({
      syncedCount: synced.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
      synced,
      skipped,
      errors
    });
  } catch (error) {
    console.error("Employee sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
