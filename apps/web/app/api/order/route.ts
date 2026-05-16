import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_ORDER_WRITE } from "../../../lib/auth/role-guards";
import { createPrismaClient } from "../../../lib/prisma";

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

export async function POST(request: NextRequest) {
  const role = getRole(request);
  const denied = roleGuard(role, ALLOWED_ROLES_ORDER_WRITE);
  if (denied) return denied;
  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const {
      bookingNumber,
      serviceDate,
      timeSlot,
      agentName,
      customerName,
      phone,
      hotel,
      room,
      pickupPax,
      joinCount,
      adminNote,
      status
    } = body;

    if (!bookingNumber || !serviceDate || !agentName || !customerName) {
      return NextResponse.json(
        { error: "bookingNumber, serviceDate, agentName, customerName are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.booking.findUnique({ where: { bookingNumber } });
    if (existing) {
      return NextResponse.json({ error: "Booking number already exists" }, { status: 409 });
    }

    let productPackageId: string | null = null;
    if (body.productPackageName) {
      const pkg = await prisma.productPackage.findFirst({
        where: { name: body.productPackageName }
      });
      productPackageId = pkg?.id ?? null;
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        serviceDate: new Date(serviceDate),
        timeSlot: timeSlot ?? "00:00",
        agentName,
        customerName,
        phone: phone ?? "",
        hotel: hotel ?? "",
        room: room ?? null,
        pickupPax: pickupPax ?? 1,
        joinCount: joinCount ?? 0,
        adminNote: adminNote ?? null,
        sourceChannel: body.sourceChannel ?? null,
        status: status ?? "WAITING",
        productPackageId
      }
    });

    const refreshed = await prisma.booking.update({
      where: { id: booking.id },
      data: {},
      select: { updatedAt: true }
    });

    return NextResponse.json(
      {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        updatedAt: refreshed.updatedAt.getTime()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

export async function PUT(request: NextRequest) {
  const role = getRole(request);
  const denied = roleGuard(role, ALLOWED_ROLES_ORDER_WRITE);
  if (denied) return denied;
  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const {
      bookingNumber,
      serviceDate,
      timeSlot,
      agentName,
      customerName,
      phone,
      hotel,
      room,
      pickupPax,
      joinCount,
      adminNote,
      status,
      updatedAt
    } = body;

    if (!bookingNumber) {
      return NextResponse.json({ error: "bookingNumber is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { bookingNumber } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (typeof updatedAt === "number") {
      const bookingUpdatedAt = booking.updatedAt.getTime();
      if (Math.abs(bookingUpdatedAt - updatedAt) > 1000) {
        return NextResponse.json(
          { error: "Conflict: booking was modified by another user. Please refresh and try again." },
          { status: 409 }
        );
      }
    }

    let productPackageId: string | undefined = undefined;
    if (body.productPackageName !== undefined) {
      if (body.productPackageName === null) {
        productPackageId = undefined;
      } else {
        const pkg = await prisma.productPackage.findFirst({
          where: { name: body.productPackageName as string }
        });
productPackageId = pkg?.id ?? undefined;
      }
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        ...(serviceDate !== undefined && { serviceDate: new Date(serviceDate) }),
        ...(timeSlot !== undefined && { timeSlot }),
        ...(agentName !== undefined && { agentName }),
        ...(customerName !== undefined && { customerName }),
        ...(phone !== undefined && { phone }),
        ...(hotel !== undefined && { hotel }),
        ...(room !== undefined && { room: room ?? null }),
        ...(pickupPax !== undefined && { pickupPax }),
        ...(joinCount !== undefined && { joinCount }),
        ...(adminNote !== undefined && { adminNote }),
        ...(status !== undefined && { status }),
        ...(productPackageId !== undefined && { productPackageId })
      }
    });

    const refreshed = await prisma.booking.update({
      where: { id: updated.id },
      data: {},
      select: { updatedAt: true }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "Booking",
        entityId: booking.id,
        action: "booking.updated",
        beforeJson: JSON.stringify({
          bookingNumber,
          agentName: booking.agentName,
          customerName: booking.customerName
        }),
        afterJson: JSON.stringify({
          bookingNumber,
          agentName: updated.agentName,
          customerName: updated.customerName
        })
      }
    });

    return NextResponse.json({
      bookingNumber: updated.bookingNumber,
      updatedAt: refreshed.updatedAt.getTime()
    });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

export async function DELETE(request: NextRequest) {
  const role = getRole(request);
  const denied = roleGuard(role, ALLOWED_ROLES_ORDER_WRITE);
  if (denied) return denied;
  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const bookingNumber = searchParams.get("bookingNumber");

    if (!bookingNumber) {
      return NextResponse.json({ error: "bookingNumber is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { bookingNumber } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.updatedAt !== undefined) {
      const bookingUpdatedAt = booking.updatedAt.getTime();
      if (Math.abs(bookingUpdatedAt - body.updatedAt) > 1000) {
        return NextResponse.json(
          { error: "Conflict: booking was modified by another user. Please refresh and try again." },
          { status: 409 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          entityType: "Booking",
          entityId: booking.id,
          action: "booking.deleted",
          beforeJson: JSON.stringify({ bookingNumber }),
          afterJson: JSON.stringify(null)
        }
      });

      await tx.transportAssignment.deleteMany({
        where: { bookingId: booking.id }
      });

      await tx.pickupStatusEvent.deleteMany({
        where: { bookingId: booking.id }
      });

      await tx.staffAssignment.deleteMany({
        where: { bookingId: booking.id }
      });

      await tx.booking.delete({ where: { id: booking.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
