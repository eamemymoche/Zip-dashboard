import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_PICKUP_WRITE } from "../../../lib/auth/role-guards";
import { getRoleFromRequest, roleGuard } from "../../../lib/auth/server-session";
import { createPrismaClient } from "../../../lib/prisma";

async function getPrisma() {
  return createPrismaClient();
}

export async function POST(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_PICKUP_WRITE);
  if (denied) return denied;
  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { bookingNumber, status, note, updatedAt } = body;

    if (!bookingNumber || !status) {
      return NextResponse.json(
        { error: "bookingNumber and status are required" },
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

    const previousEvents = await prisma.pickupStatusEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "desc" },
      take: 1
    });
    const previousStatus = previousEvents[0]?.status ?? null;

    const event = await prisma.pickupStatusEvent.create({
      data: {
        bookingId: booking.id,
        status,
        note: note ?? null,
        createdBy: null
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "PickupStatusEvent",
        entityId: event.id,
        action: "pickup.status_changed",
        beforeJson: JSON.stringify({ status: previousStatus }),
        afterJson: JSON.stringify({ status })
      }
    });

    const refreshedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {},
      select: { updatedAt: true }
    });

    return NextResponse.json({ id: event.id, status: event.status, updatedAt: refreshedBooking.updatedAt.getTime() }, { status: 201 });
  } catch (error) {
    console.error("Pickup status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
