import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "crypto";

loadEnv({ path: ".env.local" });
loadEnv();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
});

const productPackages = [
  { name: "Extreme", detail: "Z38 + Luge + Swing + Transport", active: true },
  { name: "Express", detail: "Z38 + Swing + Transport", active: true },
  { name: "Exciting", detail: "Z19 + Swing + Luge", active: true },
  { name: "Gold Zipline", detail: "38 PF", active: true },
  { name: "Silver Zipline", detail: "16 PF", active: true },
  { name: "Fast Track", detail: "Zipline Only", active: true }
];

const employees = [
  { code: "C001", name: "วิชัย รถซิ่ง", nickname: "วิ๊ก", role: "DRIVER", phone: "089-222-2001", phone2: "086-222-2001", startDate: new Date("2023-11-01"), photo: "https://i.pravatar.cc/150?img=5", active: true },
  { code: "C002", name: "นิพนธ์ ปลอดภัย", nickname: "นิพ", role: "DRIVER", phone: "089-222-2002", phone2: "086-222-2002", startDate: new Date("2023-12-15"), photo: "https://i.pravatar.cc/150?img=6", active: true },
  { code: "C003", name: "สมชาย รอบเช้า", nickname: "ชาย", role: "DRIVER", phone: "089-222-2003", phone2: "086-222-2003", startDate: new Date("2024-01-08"), photo: "https://i.pravatar.cc/150?img=7", active: true },
  { code: "G001", name: "มานะ ขยันงาน", nickname: "มานะ", role: "STAFF", phone: "089-111-1001", phone2: "086-111-1001", startDate: new Date("2024-01-15"), photo: "https://i.pravatar.cc/150?img=1", active: true },
  { code: "G002", name: "ปรีชา กล้าหาญ", nickname: "ปรี้", role: "STAFF", phone: "089-111-1002", phone2: "086-111-1002", startDate: new Date("2024-02-20"), photo: "https://i.pravatar.cc/150?img=2", active: true },
  { code: "G003", name: "รัตนา สายสวย", nickname: "สาย", role: "STAFF", phone: "089-111-1003", phone2: "086-111-1003", startDate: new Date("2024-03-10"), photo: "https://i.pravatar.cc/150?img=3", active: true }
];

const vehicles = [
  { code: "V001", type: "Van", capacity: 10, active: true, notes: "Primary morning shuttle" },
  { code: "V002", type: "Van", capacity: 10, active: true, notes: "Flexible backup van" },
  { code: "V003", type: "Car", capacity: 4, active: true, notes: "Light load / VIP fallback" }
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
    driverCode: "C001",
    vehicleCode: "V001"
  },
  {
    bookingNumber: "BK1001282",
    serviceDate: new Date("2026-05-12T00:00:00.000Z"),
    timeSlot: "07:00",
    agentName: "Trip.com",
    customerName: "พิมพันชก อ่อนหวาน",
    phone: "0822211144",
    hotel: "Lagoon Suites",
    room: "112",
    pickupPax: 2,
    joinCount: 2,
    status: "WAITING",
    adminNote: "VIP pickup",
    packageName: "Express",
    driverCode: "C002",
    vehicleCode: "V002"
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
    driverCode: "C003",
    vehicleCode: "V003"
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
    driverCode: "C001",
    vehicleCode: "V001"
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
    driverCode: "C002",
    vehicleCode: "V002"
  }
];

const users = [
  { email: "superadmin@zipline.com", displayName: "SuperAdmin User", role: "SUPERADMIN", password: "super123" },
  { email: "officer@zipline.com", displayName: "Officer User", role: "MANAGER", password: "zipline123" },
  { email: "owner@zipline.com", displayName: "Owner User", role: "ADMIN", password: "owner123" },
  { email: "accounting@zipline.com", displayName: "Accounting User", role: "ACCOUNTING", password: "accounting123" },
  { email: "staff@zipline.com", displayName: "Staff User", role: "STAFF", password: "staff123" },
  { email: "driver@zipline.com", displayName: "Driver User", role: "DRIVER", password: "driver123" }
];

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

function hashPassword(password) {
  return createHash("sha256").update(password + SESSION_SECRET).digest("hex");
}

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

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { code: vehicle.code },
      update: vehicle,
      create: vehicle
    });
  }

  for (const booking of bookings) {
    const productPackage = await prisma.productPackage.findFirstOrThrow({
      where: { name: booking.packageName }
    });
    const driver = await prisma.employee.findUnique({
      where: { code: booking.driverCode }
    });
    const vehicle = await prisma.vehicle.findUnique({
      where: { code: booking.vehicleCode }
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
          driverId: driver.id,
          vehicleId: vehicle?.id
        },
        create: {
          bookingId: createdBooking.id,
          driverId: driver.id,
          vehicleId: vehicle?.id
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

  for (const user of users) {
    const passwordHash = hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { displayName: user.displayName, role: user.role, active: true, passwordHash },
      create: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
        active: true
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
