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
  { name: "Extra", detail: "Visitor + Luge", active: true },
  { name: "Fast Track", detail: "Zipline Only", active: true },
  { name: "Fast Track + Luge", detail: "Zipline + Luge", active: true },
  { name: "Luge", detail: "Luge Only", active: true },
  { name: "Visitor", detail: "Entrance + Lunch", active: true },
  { name: "Inspector", detail: "Site Inspection", active: true }
];

const employees = [
  { code: "G001", name: "Mana Khayanngan", nickname: "Mana", role: "STAFF", phone: "089-111-1001", phone2: "086-111-1001", startDate: new Date("2024-01-15"), photo: "https://i.pravatar.cc/150?img=1", active: true },
  { code: "G002", name: "Preecha Klaahan", nickname: "Pree", role: "STAFF", phone: "089-111-1002", phone2: "086-111-1002", startDate: new Date("2024-02-20"), photo: "https://i.pravatar.cc/150?img=2", active: true },
  { code: "G003", name: "Rattana Saisuay", nickname: "Sai", role: "STAFF", phone: "089-111-1003", phone2: "086-111-1003", startDate: new Date("2024-03-10"), photo: "https://i.pravatar.cc/150?img=3", active: true },
  { code: "G004", name: "Suree Klongtua", nickname: "Sui", role: "STAFF", phone: "089-111-1004", phone2: "086-111-1004", startDate: new Date("2024-04-05"), photo: "https://i.pravatar.cc/150?img=4", active: true },
  { code: "C001", name: "Wichai Rotsing", nickname: "Wick", role: "DRIVER", phone: "089-222-2001", phone2: "086-222-2001", startDate: new Date("2023-11-01"), photo: "https://i.pravatar.cc/150?img=5", active: true },
  { code: "C002", name: "Nipon Plodphai", nickname: "Nip", role: "DRIVER", phone: "089-222-2002", phone2: "086-222-2002", startDate: new Date("2023-12-15"), photo: "https://i.pravatar.cc/150?img=6", active: true },
  { code: "C003", name: "Somchai Robchao", nickname: "Chai", role: "DRIVER", phone: "089-222-2003", phone2: "086-222-2003", startDate: new Date("2024-01-08"), photo: "https://i.pravatar.cc/150?img=7", active: true }
];

const vehicles = [
  { code: "V001", type: "Van", capacity: 10, active: true, notes: "Primary morning shuttle" },
  { code: "V002", type: "Van", capacity: 10, active: true, notes: "Flexible backup van" },
  { code: "V003", type: "Car", capacity: 4, active: true, notes: "Light load / VIP fallback" }
];

const timeSlots = ["07:00", "08:00", "09:00", "11:00", "12:00", "13:00"];
const agents = ["Klook", "Trip.com", "CTrip", "TTD Global", "Direct"];

const guestNames = [
  "Sompong Srisuk",
  "Pimchanok Onwan",
  "Kenji Ito",
  "Mina Howard",
  "Arisa Vong",
  "Napat Shore",
  "Aiko West",
  "Parichat Rungreuang",
  "Theerapat Sailom",
  "Rin Moss",
  "Mali Carter",
  "Tawan Patel",
  "Jiraporn Wongsakul",
  "Supaporn Thongtham",
  "Chananta Boonmak",
  "Won Jun-ho",
  "Sung-Hee Kang",
  "Anucha Rattanachot",
  "Priya Mehta",
  "Ananya Singh",
  "Krit Jirasak",
  "Natthida Thongchai",
  "Somchai Jaidee",
  "Supranee Suwan",
  "Marco Vitti",
  "Elena Rossi",
  "Wei-Lin Chen",
  "Yuki Tanaka",
  "Lee Dae-jung",
  "Phattaraporn Ploy",
  "Chalit Kasemsuk",
  "Nont Fongmoon",
  "Phatranit Thititham",
  "Thomas Gruber",
  "Anna Schmidt",
  "Thanaphon Weerachai",
  "Fang Xiaoming",
  "Liu Yang",
  "Sanjay Gupta",
  "Narisra Charoenphon",
  "Siriporn Srisuk",
  "Jakkarin Pup",
  "Emma Thompson",
  "Oliver Brown",
  "Naphaporn Rotsakul",
  "Witthawat Sukkaew"
];

const hotels = [
  "Lagoon Suites",
  "River Crest",
  "Blue Reef",
  "Palm Studio",
  "Harbor Point",
  "Sea Frame",
  "Aurora View",
  "Hill Garden",
  "Monsoon Court",
  "Beach Loft",
  "Grand Mandarina",
  "Sky River Hotel",
  "Baywatch Resort",
  "The Sand Palace",
  "Northern Heritage",
  "Jungle Edge Lodge",
  "Valley View Inn",
  "Royal Garden Suite",
  "Coastal Breeze Hotel",
  "Mountain Crest Resort"
];

const adminNotesByStatus = {
  WAITING: [],
  BOARDED: [],
  NO_SHOW: [
    "Guest did not come to the lobby",
    "Waiting at hotel room",
    "Called but no answer",
    "Moved to a later round"
  ],
  CANCELLED: [
    "Cancelled due to weather",
    "Customer requested cancellation",
    "No round available"
  ],
  RESCHEDULED: [
    "Moved to next round",
    "Rescheduled because of schedule conflict"
  ]
};

const users = [
  {
    username: "superadmin",
    email: "superadmin@demo.local",
    displayName: "SuperAdmin Dev",
    role: "SUPERADMIN",
    password: "super123",
    moduleAccess: {
      overview: "edit",
      orderlist: "edit",
      transport: "edit",
      staffing: "edit",
      personnel: "edit",
      accounting: "edit",
      changelog: "edit",
      useraccess: "edit",
      master: "edit"
    }
  },
  {
    username: "manager",
    email: "manager@demo.local",
    displayName: "Manager Dev",
    role: "MANAGER",
    password: "manager123",
    moduleAccess: {
      overview: "edit",
      orderlist: "edit",
      transport: "edit",
      staffing: "edit",
      personnel: "edit",
      accounting: "edit",
      changelog: "edit",
      master: "edit"
    }
  },
  {
    username: "officer",
    email: "officer@demo.local",
    displayName: "Officer Dev",
    role: "MANAGER",
    password: "zipline123",
    moduleAccess: {
      overview: "edit",
      orderlist: "edit",
      transport: "edit",
      staffing: "edit",
      personnel: "edit",
      master: "edit"
    }
  },
  {
    username: "account",
    email: "account@demo.local",
    displayName: "Account Dev",
    role: "ACCOUNTING",
    password: "accounting123",
    moduleAccess: {
      overview: "edit",
      orderlist: "edit",
      transport: "edit",
      staffing: "edit",
      accounting: "edit",
      master: "edit"
    }
  },
  {
    username: "staff",
    email: "staff@demo.local",
    displayName: "Staff Dev",
    role: "STAFF",
    password: "staff123",
    moduleAccess: {
      overview: "view",
      transport: "edit",
      staffing: "edit"
    }
  },
  {
    username: "driver",
    email: "driver@demo.local",
    displayName: "Driver Dev",
    role: "DRIVER",
    password: "driver123",
    moduleAccess: {
      overview: "view",
      transport: "view"
    }
  }
];

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

function hashPassword(password) {
  return createHash("sha256").update(password + SESSION_SECRET).digest("hex");
}

function createOrderStatus(index) {
  if (index % 17 === 0) return "NO_SHOW";
  if (index % 13 === 0) return "RESCHEDULED";
  if (index % 11 === 0) return "CANCELLED";
  if (index % 5 === 0) return "WAITING";
  return "BOARDED";
}

function getDailyVolume(dayOfWeek, dayIndex) {
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return dayIndex % 3 === 0 ? 35 : dayIndex % 3 === 1 ? 32 : 28;
  }
  if (dayOfWeek === 1 || dayOfWeek === 5) {
    return dayIndex % 2 === 0 ? 22 : 20;
  }
  return dayIndex % 2 === 0 ? 18 : 19;
}

function generateBookings() {
  const driverCodes = employees.filter((employee) => employee.role === "DRIVER").map((employee) => employee.code);
  const staffCodes = employees.filter((employee) => employee.role === "STAFF").map((employee) => employee.code);
  const vehicleCodes = vehicles.map((vehicle) => vehicle.code);

  const startDate = new Date("2026-05-17T00:00:00+07:00");
  const endDate = new Date("2026-05-31T00:00:00+07:00");
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  const generated = [];
  let bookingCounter = 1001300;
  let globalIndex = 0;

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const dateObj = new Date(startDate);
    dateObj.setDate(dateObj.getDate() + dayIndex);
    const dayOfWeek = dateObj.getDay();
    const serviceDate = new Date(`${dateObj.toISOString().slice(0, 10)}T00:00:00.000Z`);
    const volume = getDailyVolume(dayOfWeek, dayIndex);

    for (let index = 0; index < volume; index += 1) {
      const idx = globalIndex;
      globalIndex += 1;

      const status = createOrderStatus(idx);
      const productPackage = productPackages[idx % productPackages.length];
      const timeSlot = timeSlots[idx % timeSlots.length];
      const agentName = agents[(idx + dayIndex) % agents.length];
      const customerName = guestNames[(idx + dayIndex * 3) % guestNames.length];
      const hotel = hotels[(idx + dayIndex * 7) % hotels.length];
      const joinCount = (idx % 4) + 1;
      const visitorCount = idx % 3 === 0 ? 1 : 0;
      const pickupPax = joinCount + visitorCount;
      const notePool = adminNotesByStatus[status];
      const adminNote = notePool.length > 0 ? notePool[idx % notePool.length] : "";
      const isAssigned = status !== "CANCELLED" && status !== "RESCHEDULED" && idx % 7 !== 4;
      const driverCode = isAssigned ? driverCodes[idx % driverCodes.length] : null;
      const vehicleCode = isAssigned ? vehicleCodes[idx % vehicleCodes.length] : null;
      const assignedStaffCodes =
        status === "NO_SHOW" || status === "CANCELLED" || !isAssigned
          ? []
          : [
              staffCodes[idx % staffCodes.length],
              staffCodes[(idx + 1) % staffCodes.length]
            ];

      generated.push({
        bookingNumber: `BK${bookingCounter}`,
        serviceDate,
        timeSlot,
        agentName,
        customerName,
        phone: `08${String(10000000 + idx).slice(0, 9)}`,
        hotel,
        room: `${(idx % 900) + 100}`,
        pickupPax,
        joinCount,
        status,
        adminNote,
        packageName: productPackage.name,
        driverCode,
        vehicleCode,
        assignedStaffCodes
      });

      bookingCounter += 1;
    }
  }

  return generated;
}

async function main() {
  const targetUsernames = users.map((user) => user.username);

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

  const bookings = generateBookings();

  for (const booking of bookings) {
    const productPackage = await prisma.productPackage.findFirstOrThrow({
      where: { name: booking.packageName }
    });
    const driver = booking.driverCode
      ? await prisma.employee.findUnique({ where: { code: booking.driverCode } })
      : null;
    const vehicle = booking.vehicleCode
      ? await prisma.vehicle.findUnique({ where: { code: booking.vehicleCode } })
      : null;

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
          vehicleId: vehicle?.id ?? null
        },
        create: {
          bookingId: createdBooking.id,
          driverId: driver.id,
          vehicleId: vehicle?.id ?? null
        }
      });
    } else {
      await prisma.transportAssignment.deleteMany({
        where: { bookingId: createdBooking.id }
      });
    }

    await prisma.pickupStatusEvent.deleteMany({
      where: { bookingId: createdBooking.id }
    });
    await prisma.pickupStatusEvent.create({
      data: {
        bookingId: createdBooking.id,
        status: booking.status,
        note: booking.adminNote
      }
    });

    await prisma.staffAssignment.deleteMany({
      where: { bookingId: createdBooking.id }
    });
    for (const staffCode of booking.assignedStaffCodes) {
      const staffMember = await prisma.employee.findUnique({
        where: { code: staffCode }
      });
      if (!staffMember) continue;
      await prisma.staffAssignment.create({
        data: {
          bookingId: createdBooking.id,
          employeeId: staffMember.id
        }
      });
    }
  }

  for (const user of users) {
    const passwordHash = hashPassword(user.password);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: user.email }, { username: user.username }]
      },
      select: { id: true }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          active: true,
          passwordHash,
          moduleAccessJson: JSON.stringify(user.moduleAccess)
        }
      });
    } else {
      await prisma.user.create({
        data: {
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          passwordHash,
          active: true,
          moduleAccessJson: JSON.stringify(user.moduleAccess)
        }
      });
    }
  }

  await prisma.user.deleteMany({
    where: {
      email: { endsWith: "@zipline.com" },
      username: { notIn: targetUsernames }
    }
  });
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
