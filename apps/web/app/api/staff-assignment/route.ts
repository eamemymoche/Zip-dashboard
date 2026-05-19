import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_STAFF_WRITE } from "../../../lib/auth/role-guards";
import { auditData, requireRole } from "../../../lib/auth/server-session";
import { createPrismaClient } from "../../../lib/prisma";

async function getPrisma() {
  return createPrismaClient();
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_STAFF_WRITE);
  if ("response" in auth) return auth.response;
  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { bookingNumber, staffAssignments, updatedAt } = body;

    if (!bookingNumber || !Array.isArray(staffAssignments)) {
      return NextResponse.json(
        { error: "bookingNumber and staffAssignments array are required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingNumber }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (updatedAt) {
      const bookingUpdatedAt = booking.updatedAt.getTime();
      if (Math.abs(bookingUpdatedAt - updatedAt) > 1000) {
        return NextResponse.json(
          { error: "Conflict: booking was modified by another user. Please refresh and try again." },
          { status: 409 }
        );
      }
    }

    const previousLinks = await prisma.staffAssignment.findMany({
      where: { bookingId: booking.id },
      include: { employee: true }
    });

    let created: { employeeCode: string; name: string }[] = [];
    await prisma.$transaction(async (tx: any) => {
      await tx.staffAssignment.deleteMany({ where: { bookingId: booking.id } });
      for (const staffCode of staffAssignments) {
        const employee = await tx.employee.findUnique({ where: { code: staffCode } });
        if (!employee) continue;
        await tx.staffAssignment.create({
          data: { bookingId: booking.id, employeeId: employee.id }
        });
        created.push({ employeeCode: employee.code, name: employee.name });
      }
    });

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "StaffAssignment",
        entityId: booking.id,
        action: "staff.assigned",
        beforeJson: JSON.stringify(
          previousLinks.map((l: any) => ({ employeeCode: l.employee.code, name: l.employee.name }))
        ),
        afterJson: JSON.stringify(created)
      })
    });

    const refreshedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {},
      select: { updatedAt: true }
    });

    return NextResponse.json({
      staffAssignments: created,
      updatedAt: refreshedBooking.updatedAt.getTime()
    });
  } catch (error) {
    console.error("Staff assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
