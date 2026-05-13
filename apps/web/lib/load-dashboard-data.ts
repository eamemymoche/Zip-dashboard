import { createDashboardSeed, type DashboardSeed } from "./ops-data";

export async function loadDashboardData(): Promise<DashboardSeed> {
  const fallback = createDashboardSeed();

  if (!process.env.DATABASE_URL) {
    return fallback;
  }

  try {
    const prismaImport = await import("@prisma/client");
    const PrismaClientCtor =
      (prismaImport as { PrismaClient?: new () => any }).PrismaClient ??
      (prismaImport as { default?: { PrismaClient?: new () => any } }).default?.PrismaClient;

    if (!PrismaClientCtor) {
      return fallback;
    }

    const prisma = new PrismaClientCtor();

    const [bookings, employees, productPackages] = await Promise.all([
      prisma.booking.findMany({
        include: {
          productPackage: true,
          transportAssignment: {
            include: {
              driver: true
            }
          }
        },
        orderBy: [{ serviceDate: "asc" }, { timeSlot: "asc" }]
      }),
      prisma.employee.findMany({ orderBy: { code: "asc" } }),
      prisma.productPackage.findMany({ orderBy: { name: "asc" } })
    ]);

    await prisma.$disconnect();

    if (!bookings.length) {
      return fallback;
    }

    return {
      timeSlots: fallback.timeSlots,
      employees: employees.map((employee: any) => ({
        id: employee.code,
        name: employee.name,
        nickname: employee.nickname ?? employee.name.split(" ")[0],
        role: employee.role === "DRIVER" ? "Driver" : "Staff",
        phone: employee.phone ?? "",
        phone2: employee.phone2 ?? "",
        startDate: employee.startDate ?? "",
        photo: employee.photo ?? ""
      })),
      productPackets: productPackages.map((packet: any) => ({
        name: packet.name,
        detail: packet.detail
      })),
      orders: bookings.map((booking: any, index: number) => ({
        id: index + 1,
        date: booking.serviceDate.toISOString().slice(0, 10),
        time: booking.timeSlot,
        agent: booking.agentName,
        booking: booking.bookingNumber,
        packet: booking.productPackage?.name ?? "Direct",
        name: booking.customerName,
        phone: booking.phone,
        hotel: booking.hotel,
        room: booking.room ?? "-",
        join: booking.joinCount,
        visitor: Math.max(booking.pickupPax - booking.joinCount, 0),
        driver: booking.transportAssignment?.driver?.name ?? "",
        boarding: booking.status,
        assignedStaff: [],
        adminNote: booking.adminNote ?? ""
      }))
    };
  } catch {
    return fallback;
  }
}
