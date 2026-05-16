import { createDashboardSeed, type DashboardSeed } from "./ops-data";
import { createPrismaClient } from "./prisma";

export async function loadDashboardData(): Promise<DashboardSeed> {
  const fallback = createDashboardSeed();

  if (!process.env.DATABASE_URL) {
    return fallback;
  }

  try {
    const prisma = createPrismaClient();

    const [bookings, employees, productPackages, vehicles] = await Promise.all([
      prisma.booking.findMany({
        include: {
          productPackage: true,
          transportAssignment: {
            include: {
              driver: true,
              vehicle: true
            }
          },
          staffAssignments: {
            include: { employee: true }
          }
        },
        orderBy: [{ serviceDate: "asc" }, { timeSlot: "asc" }]
      }),
      prisma.employee.findMany({ orderBy: { code: "asc" } }),
      prisma.productPackage.findMany({ orderBy: { name: "asc" } }),
      prisma.vehicle.findMany({ orderBy: { code: "asc" } })
    ]);

    await prisma.$disconnect();

    return {
      timeSlots: fallback.timeSlots,
      employees: employees.length
        ? employees.map((employee: any) => ({
            id: employee.code,
            name: employee.name,
            nickname: employee.nickname ?? employee.name.split(" ")[0],
            role: employee.role === "DRIVER" ? "Driver" : "Staff",
            phone: employee.phone ?? "",
            phone2: employee.phone2 ?? "",
            startDate: employee.startDate ? new Date(employee.startDate).toISOString().slice(0, 10) : "",
            photo: employee.photo ?? ""
          }))
        : fallback.employees,
      vehicles: vehicles.length
        ? vehicles.map((vehicle: any) => ({
            code: vehicle.code,
            type: vehicle.type ?? "",
            capacity: vehicle.capacity ?? null,
            active: vehicle.active,
            notes: vehicle.notes ?? ""
          }))
        : fallback.vehicles,
      productPackets: productPackages.length
        ? productPackages.map((packet: any) => ({
            name: packet.name,
            detail: packet.detail,
            active: packet.active
          }))
        : fallback.productPackets,
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
        driverCode: booking.transportAssignment?.driver?.code ?? "",
        vehicle: booking.transportAssignment?.vehicle?.code ?? "",
        vehicleCode: booking.transportAssignment?.vehicle?.code ?? "",
        boarding: booking.status,
        assignedStaff: booking.staffAssignments?.map((s: any) => s.employee?.name).filter(Boolean) ?? [],
        adminNote: booking.adminNote ?? "",
        updatedAt: booking.updatedAt ? new Date(booking.updatedAt).getTime() : undefined
      }))
    };
  } catch {
    return fallback;
  }
}
