export type BookingStatus =
  | "WAITING"
  | "BOARDED"
  | "NO_SHOW"
  | "CANCELLED"
  | "RESCHEDULED";

export type EmployeeRole = "Staff" | "Driver";

export type EmployeeRecord = {
  id: string;
  name: string;
  nickname: string;
  role: EmployeeRole;
  phone: string;
  phone2: string;
  startDate: string;
  photo: string;
};

export type ProductPacket = {
  name: string;
  detail: string;
};

export type VehicleRecord = {
  code: string;
  type: string;
  capacity: number | null;
  active: boolean;
  notes: string;
};

export type OrderRecord = {
  id: number;
  date: string;
  time: string;
  agent: string;
  booking: string;
  packet: string;
  name: string;
  phone: string;
  hotel: string;
  room: string;
  join: number;
  visitor: number;
  driver: string;
  driverCode: string;
  vehicle: string;
  vehicleCode: string;
  boarding: BookingStatus;
  assignedStaff: string[];
  adminNote: string;
  updatedAt?: number;
};

export type DashboardSeed = {
  orders: OrderRecord[];
  employees: EmployeeRecord[];
  vehicles: VehicleRecord[];
  productPackets: ProductPacket[];
  timeSlots: string[];
};

export const employeesSeed: EmployeeRecord[] = [
  { id: "G001", name: "มานะ ขยันงาน", nickname: "มานะ", role: "Staff", phone: "089-111-1001", phone2: "086-111-1001", startDate: "2024-01-15", photo: "https://i.pravatar.cc/150?img=1" },
  { id: "G002", name: "ปรีชา กล้าหาญ", nickname: "ปรี้", role: "Staff", phone: "089-111-1002", phone2: "086-111-1002", startDate: "2024-02-20", photo: "https://i.pravatar.cc/150?img=2" },
  { id: "G003", name: "รัตนา สายสวย", nickname: "สาย", role: "Staff", phone: "089-111-1003", phone2: "086-111-1003", startDate: "2024-03-10", photo: "https://i.pravatar.cc/150?img=3" },
  { id: "G004", name: "สุรีย์ คล่องตัว", nickname: "สุ๊ย", role: "Staff", phone: "089-111-1004", phone2: "086-111-1004", startDate: "2024-04-05", photo: "https://i.pravatar.cc/150?img=4" },
  { id: "C001", name: "วิชัย รถซิ่ง", nickname: "วิ๊ก", role: "Driver", phone: "089-222-2001", phone2: "086-222-2001", startDate: "2023-11-01", photo: "https://i.pravatar.cc/150?img=5" },
  { id: "C002", name: "นิพนธ์ ปลอดภัย", nickname: "นิพ", role: "Driver", phone: "089-222-2002", phone2: "086-222-2002", startDate: "2023-12-15", photo: "https://i.pravatar.cc/150?img=6" },
  { id: "C003", name: "สมชาย รอบเช้า", nickname: "ชาย", role: "Driver", phone: "089-222-2003", phone2: "086-222-2003", startDate: "2024-01-08", photo: "https://i.pravatar.cc/150?img=7" }
];

export const productPacketsSeed: ProductPacket[] = [
  { name: "Extreme", detail: "Z38 + Luge + Swing + Transport" },
  { name: "Express", detail: "Z38 + Swing + Transport" },
  { name: "Exciting", detail: "Z19 + Swing + Luge" },
  { name: "Gold Zipline", detail: "38 PF" },
  { name: "Silver Zipline", detail: "16 PF" },
  { name: "Extra", detail: "Visitor + Luge" },
  { name: "Fast Track", detail: "Zipline Only" },
  { name: "Fast Track + Luge", detail: "Zipline + Luge" },
  { name: "Luge", detail: "Luge Only" },
  { name: "Visitor", detail: "Entrance + Lunch" },
  { name: "Inspector", detail: "Site Inspection" }
];

export const vehiclesSeed: VehicleRecord[] = [
  { code: "V001", type: "Van", capacity: 10, active: true, notes: "Primary morning shuttle" },
  { code: "V002", type: "Van", capacity: 10, active: true, notes: "Flexible backup van" },
  { code: "V003", type: "Car", capacity: 4, active: true, notes: "Light load / VIP fallback" }
];

export const timeSlots = ["07:00", "08:00", "09:00", "11:00", "12:00", "13:00"];

const agents = ["Klook", "Trip.com", "CTrip", "TTD Global", "Direct"];
const guestNames = [
  "สมปอง ศรีสุข",
  "พิมพ์ชนก อ่อนหวาน",
  "Kenji Ito",
  "Mina Howard",
  "Arisa Vong",
  "Napat Shore",
  "Aiko West",
  "ปาริฉัตร รุ่งเรือง",
  "ธีรภัทร์ สายลม",
  "Rin Moss",
  "Mali Carter",
  "Tawan Patel"
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
  "Beach Loft"
];

function createOrderStatus(index: number): BookingStatus {
  if (index % 17 === 0) {
    return "NO_SHOW";
  }
  if (index % 13 === 0) {
    return "RESCHEDULED";
  }
  if (index % 11 === 0) {
    return "CANCELLED";
  }
  if (index % 5 === 0) {
    return "WAITING";
  }
  return "BOARDED";
}

export function generatePrototypeOrders(): OrderRecord[] {
  const driverNames = employeesSeed
    .filter((employee) => employee.role === "Driver")
    .map((employee) => employee.name);
  const staffNames = employeesSeed
    .filter((employee) => employee.role === "Staff")
    .map((employee) => employee.name);

  const vehicleCodes = vehiclesSeed.map((vehicle) => vehicle.code);

  const orders: OrderRecord[] = [];
  let currentId = 1;

  for (let day = 11; day <= 15; day += 1) {
    const formattedDate = `2026-05-${String(day).padStart(2, "0")}`;

    for (let i = 0; i < 24; i += 1) {
      const join = (i % 4) + 1;
      const visitor = i % 3 === 0 ? 1 : 0;
      const status = createOrderStatus(currentId);
      const packet = productPacketsSeed[i % productPacketsSeed.length];
      const driver = status === "CANCELLED" ? "" : driverNames[i % driverNames.length];
      const vehicle = status === "CANCELLED" ? "" : vehicleCodes[i % vehicleCodes.length];
      const assignedStaff =
        status === "NO_SHOW"
          ? []
          : [staffNames[i % staffNames.length], staffNames[(i + 1) % staffNames.length]];

      orders.push({
        id: currentId,
        date: formattedDate,
        time: timeSlots[i % timeSlots.length],
        agent: agents[(day + i) % agents.length],
        booking: `BK${1000000 + currentId}`,
        packet: packet.name,
        name: guestNames[(day + i) % guestNames.length],
        phone: `08${String(10000000 + currentId).slice(0, 8)}`,
        hotel: hotels[(day + i) % hotels.length],
        room: `${100 + i}`,
        join,
        visitor,
        driver,
        driverCode: status === "CANCELLED" ? "" : employeesSeed.filter((employee) => employee.role === "Driver")[i % driverNames.length]?.id ?? "",
        vehicle,
        vehicleCode: vehicle,
        boarding: status,
        assignedStaff,
        adminNote:
          status === "NO_SHOW"
            ? "ลูกค้ายังไม่ลงมาที่ล็อบบี้"
            : status === "RESCHEDULED"
              ? "ขอเลื่อนไปรอบถัดไป"
              : ""
      });

      currentId += 1;
    }
  }

  return orders;
}

export function createDashboardSeed(): DashboardSeed {
  return {
    orders: generatePrototypeOrders(),
    employees: employeesSeed,
    vehicles: vehiclesSeed,
    productPackets: productPacketsSeed,
    timeSlots
  };
}
