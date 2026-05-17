import { NextRequest, NextResponse } from "next/server";
import { createPrismaClient } from "../../../lib/prisma";
import { ALLOWED_ROLES_USER_ACCESS } from "../../../lib/auth/role-guards";

async function getPrisma() {
  return createPrismaClient();
}

function getRole(request: NextRequest): string | null {
  return request.headers.get("x-user-role");
}

function roleGuard(role: string | null, allowed: string[]): NextResponse | null {
  if (!role || !allowed.includes(role)) {
    return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

const DOMAIN_ENTITY_MAP: Record<string, string[]> = {
  orders: ["Booking"],
  transport: ["TransportAssignment", "Booking"],
  staffing: ["StaffAssignment"],
  personnel: ["Employee"],
  users: ["User"],
};

export async function GET(request: NextRequest) {
  const role = getRole(request);
  const denied = roleGuard(role, ALLOWED_ROLES_USER_ACCESS);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const q = searchParams.get("q");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
    const where: any = {};

    if (domain && DOMAIN_ENTITY_MAP[domain]) {
      where.entityType = { in: DOMAIN_ENTITY_MAP[domain] };
    }

    if (q) {
      where.OR = [
        { entityId: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { beforeJson: { contains: q, mode: "insensitive" } },
        { afterJson: { contains: q, mode: "insensitive" } },
      ];
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, displayName: true, role: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = rows.map((row) => {
      let beforeSummary: string | null = null;
      let afterSummary: string | null = null;

      try {
        if (row.beforeJson) {
          const b = JSON.parse(row.beforeJson);
          beforeSummary = Object.entries(b)
            .filter(([, v]) => v != null)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(", ");
        }
      } catch { /* ignore */ }

      try {
        if (row.afterJson) {
          const a = JSON.parse(row.afterJson);
          afterSummary = Object.entries(a)
            .filter(([, v]) => v != null)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(", ");
        }
      } catch { /* ignore */ }

      let domainValue = "unknown";
      if (row.entityType === "Booking") domainValue = "orders";
      else if (row.entityType === "TransportAssignment") domainValue = "transport";
      else if (row.entityType === "StaffAssignment") domainValue = "staffing";
      else if (row.entityType === "Employee") domainValue = "personnel";
      else if (row.entityType === "User") domainValue = "users";

      return {
        id: row.id,
        timestamp: row.createdAt.toISOString(),
        actorDisplay: row.actor?.displayName ?? "—",
        actorRole: row.actor?.role ?? "—",
        domain: domainValue,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        beforeSummary,
        afterSummary,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch {
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
