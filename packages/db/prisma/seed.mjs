import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productPackages = [
  { name: "Extreme", detail: "Z38 + Luge + Swing + Transport", active: true },
  { name: "Express", detail: "Z38 + Swing + Transport", active: true },
  { name: "Exciting", detail: "Z19 + Swing + Luge", active: true },
  { name: "Gold Zipline", detail: "38 PF", active: true },
  { name: "Silver Zipline", detail: "16 PF", active: true },
  { name: "Fast Track", detail: "Zipline Only", active: true }
];

const employees = [
  { code: "C001", name: "วิชัย รถซิ่ง", role: "DRIVER", active: true },
  { code: "C002", name: "นิพนธ์ ปลอดภัย", role: "DRIVER", active: true },
  { code: "C003", name: "สมชาย รอบเช้า", role: "DRIVER", active: true },
  { code: "G001", name: "มานะ ขยันงาน", role: "STAFF", active: true },
  { code: "G002", name: "ปรีชา กล้าหาญ", role: "STAFF", active: true },
  { code: "G003", name: "รัตนา สายสวย", role: "STAFF", active: true }
];

const bookings = [
  {
    bookingNumber: "BK1001281",
    serviceDate: new Date("2026-05-12T00:00:00.000Z"),
    timeSlot: "07:00",
    agentName: "Klook",
    customerName: "สมปอง ศรีสุข",
    phone: "0811112233",
    hotel: "River Crest",
    room: "402",
    pickupPax: 3,
    joinCount: 2,
    status: "BOARDED",
    adminNote: "",
    packageName: "Extreme",
    driverCode: "C001"
  },
  {
    bookingNumber: "BK1001282",
    serviceDate: new Date("2026-05-12T00:00:00.000Z"),
    timeSlot: "07:00",
    agentName: "Trip.com",
    customerName: "พิมพ์ชนก อ่อนหวาน",
    phone: "0822211144",
    hotel: "Lagoon Suites",
    room: "112",
    pickupPax: 2,
    joinCount: 2,
    status: "WAITING",
    adminNote: "VIP pickup",
    packageName: "Express",
    driverCode: "C002"
  },
  {
    bookingNumber: "BK1001283",
    serviceDate: new Date("2026-05-12T00:00:00.000Z"),
    timeSlot: "08:00",
    agentName: "Direct",
    customerName: "Kenji Ito",
    phone: "0834455001",
    hotel: "Blue Reef",
    room: "305",
    pickupPax: 4,
    joinCount: 3,
    status: "BOARDED",
    adminNote: "",
    packageName: "Gold Zipline",
    driverCode: "C003"
  },
  {
    bookingNumber: "BK1001285",
    serviceDate: new Date("2026-05-12T00:00:00.000Z"),
    timeSlot: "09:00",
    agentName: "CTrip",
    customerName: "Mina Howard",
    phone: "0845543001",
    hotel: "Blue Reef",
    room: "510",
    pickupPax: 5,
    joinCount: 4,
    status: "WAITING",
    adminNote: "",
    packageName: "Silver Zipline",
    driverCode: "C001"
  },
  {
    bookingNumber: "BK1001286",
    serviceDate: new Date("2026-05-12T00:00:00.000Z"),
    timeSlot: "11:00",
    agentName: "TTD Global",
    customerName: "Arisa Vong",
    phone: "0867788990",
    hotel: "Palm Studio",
    room: "609",
    pickupPax: 2,
    joinCount: 1,
    status: "NO_SHOW",
    adminNote: "ลูกค้ายังไม่ลงมา",
    packageName: "Fast Track",
    driverCode: "C002"
  }
];

async function main() {
  for (const productPackage of productPackages) {
    await prisma.productPackage.upsert({
      where: { name: productPackage.name },
      update: productPackage,
      create: productPackage
    });
  }

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { code: employee.code },
      update: employee,
      create: employee
    });
  }

  for (const booking of bookings) {
    const productPackage = await prisma.productPackage.findFirstOrThrow({
      where: { name: booking.packageName }
    });
    const driver = await prisma.employee.findUnique({
      where: { code: booking.driverCode }
    });

    const createdBooking = await prisma.booking.upsert({
      where: { bookingNumber: booking.bookingNumber },
      update: {
        serviceDate: booking.serviceDate,
        timeSlot: booking.timeSlot,
        agentName: booking.agentName,
        customerName: booking.customerName,
        phone: booking.phone,
        hotel: booking.hotel,
        room: booking.room,
        pickupPax: booking.pickupPax,
        joinCount: booking.joinCount,
        status: booking.status,
        adminNote: booking.adminNote,
        productPackageId: productPackage.id
      },
      create: {
        bookingNumber: booking.bookingNumber,
        serviceDate: booking.serviceDate,
        timeSlot: booking.timeSlot,
        agentName: booking.agentName,
        customerName: booking.customerName,
        phone: booking.phone,
        hotel: booking.hotel,
        room: booking.room,
        pickupPax: booking.pickupPax,
        joinCount: booking.joinCount,
        status: booking.status,
        adminNote: booking.adminNote,
        productPackageId: productPackage.id
      }
    });

    if (driver) {
      await prisma.transportAssignment.upsert({
        where: { bookingId: createdBooking.id },
        update: {
          driverId: driver.id
        },
        create: {
          bookingId: createdBooking.id,
          driverId: driver.id
        }
      });
    }

    await prisma.pickupStatusEvent.create({
      data: {
        bookingId: createdBooking.id,
        status: booking.status,
        note: booking.adminNote
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
