import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_TRANSPORT_WRITE } from "../../../lib/auth/role-guards";
import { getRoleFromRequest, roleGuard } from "../../../lib/auth/server-session";
import { createPrismaClient } from "../../../lib/prisma";

async function getPrisma() {
  return createPrismaClient();
}

export async function POST(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_TRANSPORT_WRITE);
  if (denied) return denied;
  let prisma: Awaited<ReturnType<typeof getPrisma>> | null = null;
  try {
    prisma = await getPrisma();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { bookingNumber, driverCode, vehicleCode, adminNote, updatedAt } = body;

    if (!bookingNumber) {
      return NextResponse.json(
        { error: "bookingNumber is required" },
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

    const previous = await prisma.transportAssignment.findUnique({
      where: { bookingId: booking.id },
      include: {
        driver: true,
        vehicle: true
      }
    });

    const updatedBooking =
      typeof adminNote === "string"
        ? await prisma.booking.update({
            where: { id: booking.id },
            data: { adminNote }
          })
        : booking;

    if (!driverCode) {
      if (previous) {
        await prisma.transportAssignment.delete({
          where: { bookingId: booking.id }
        });
      }

      await prisma.auditLog.create({
        data: {
          entityType: "TransportAssignment",
          entityId: booking.id,
          action: previous ? "transport.unassigned" : "transport.note_only",
          beforeJson: JSON.stringify({
            driverCode: previous?.driver?.code ?? null,
            vehicleCode: previous?.vehicle?.code ?? null,
            adminNote: booking.adminNote ?? null
          }),
          afterJson: JSON.stringify({
            driverCode: null,
            vehicleCode: null,
            adminNote: updatedBooking.adminNote ?? null
          })
        }
      });

      const refreshedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {},
        select: { updatedAt: true }
      });

      return NextResponse.json(
        {
          transport: {
            driverName: "",
            driverCode: "",
            vehicleCode: "",
            adminNote: updatedBooking.adminNote ?? ""
          },
          updatedAt: refreshedBooking.updatedAt.getTime()
        },
        { status: 200 }
      );
    }

    const driver = await prisma.employee.findUnique({
      where: { code: driverCode }
    });

    if (!driver || driver.role !== "DRIVER") {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    let vehicle = null;
    if (vehicleCode) {
      vehicle = await prisma.vehicle.findUnique({
        where: { code: vehicleCode }
      });

      if (!vehicle) {
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
      }
    }

    await prisma.transportAssignment.upsert({
      where: { bookingId: booking.id },
      update: {
        driverId: driver.id,
        vehicleId: vehicle?.id ?? null
      },
      create: {
        bookingId: booking.id,
        driverId: driver.id,
        vehicleId: vehicle?.id ?? null
      },
      include: {
        driver: true,
        vehicle: true
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "TransportAssignment",
        entityId: booking.id,
        action: previous ? "transport.reassigned" : "transport.assigned",
        beforeJson: JSON.stringify({
          driverCode: previous?.driver?.code ?? null,
          vehicleCode: previous?.vehicle?.code ?? null,
          adminNote: booking.adminNote ?? null
        }),
        afterJson: JSON.stringify({
          driverCode: driver.code,
          vehicleCode: vehicle?.code ?? null,
          adminNote: updatedBooking.adminNote ?? null
        })
      }
    });

    const refreshedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {},
      select: { updatedAt: true }
    });

    return NextResponse.json({
      transport: {
        driverName: driver.name,
        driverCode: driver.code,
        vehicleCode: vehicle?.code ?? "",
        adminNote: updatedBooking.adminNote ?? ""
      },
      updatedAt: refreshedBooking.updatedAt.getTime()
    });
  } catch (error) {
    console.error("Transport assignment error:", error);
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

export async function DELETE(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_TRANSPORT_WRITE);
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
      return NextResponse.json(
        { error: "bookingNumber is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingNumber }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const previous = await prisma.transportAssignment.findUnique({
      where: { bookingId: booking.id },
      include: {
        driver: true,
        vehicle: true
      }
    });

    if (previous) {
      await prisma.transportAssignment.delete({
        where: { bookingId: booking.id }
      });

      await prisma.auditLog.create({
        data: {
          entityType: "TransportAssignment",
          entityId: booking.id,
          action: "transport.unassigned",
          beforeJson: JSON.stringify({
            driverCode: previous.driver.code,
            vehicleCode: previous.vehicle?.code ?? null
          }),
          afterJson: JSON.stringify({
            driverCode: null,
            vehicleCode: null
          })
        }
      });
    }

    const refreshedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {},
      select: { updatedAt: true }
    });

    return NextResponse.json({ success: true, updatedAt: refreshedBooking.updatedAt.getTime() }, { status: 200 });
  } catch (error) {
    console.error("Transport assignment delete error:", error);
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
