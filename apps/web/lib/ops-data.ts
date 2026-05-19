export type BookingStatus =
  | "WAITING"
  | "BOARDED"
  | "NO_SHOW"
  | "CANCELLED"
  | "RESCHEDULED";

export type EmployeeRole = "Staff" | "Driver" | "Officer" | "Accounting";

export type EmployeeRecord = {
  id: string;
  name: string;
  englishFirstName?: string;
  englishLastName?: string;
  englishNickname?: string;
  username?: string;
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
  active: boolean;
};

export type VehicleRecord = {
  code: string;
  licensePlate: string;
  type: string;
  adminNote?: string;
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
  { id: "F001", name: "อรอนงค์ ประสานงาน", englishFirstName: "Onanong", englishLastName: "Prasanngan", englishNickname: "On", username: "onanong.pra", nickname: "อร", role: "Officer", phone: "089-000-0101", phone2: "086-000-0101", startDate: "2023-09-01", photo: "https://i.pravatar.cc/150?img=8" },
  { id: "A001", name: "กิตติยา บัญชีดี", englishFirstName: "Kittiya", englishLastName: "Bancheedee", englishNickname: "Kit", username: "kittiya.ban", nickname: "กิ๊บ", role: "Accounting", phone: "089-000-0201", phone2: "086-000-0201", startDate: "2023-10-01", photo: "https://i.pravatar.cc/150?img=9" },
  { id: "S001", name: "มานะ ขยันงาน", englishFirstName: "Mana", englishLastName: "Khayanngan", englishNickname: "Mana", username: "mana.kha", nickname: "มานะ", role: "Staff", phone: "089-111-1001", phone2: "086-111-1001", startDate: "2024-01-15", photo: "https://i.pravatar.cc/150?img=1" },
  { id: "S002", name: "ปรีชา กล้าหาญ", englishFirstName: "Preecha", englishLastName: "Klaahan", englishNickname: "Pree", username: "preecha.kla", nickname: "ปรี้", role: "Staff", phone: "089-111-1002", phone2: "086-111-1002", startDate: "2024-02-20", photo: "https://i.pravatar.cc/150?img=2" },
  { id: "S003", name: "รัตนา สายสวย", englishFirstName: "Rattana", englishLastName: "Saisuay", englishNickname: "Sai", username: "rattana.sai", nickname: "สาย", role: "Staff", phone: "089-111-1003", phone2: "086-111-1003", startDate: "2024-03-10", photo: "https://i.pravatar.cc/150?img=3" },
  { id: "S004", name: "สุรีย์ คล่องตัว", englishFirstName: "Suree", englishLastName: "Klongtua", englishNickname: "Sui", username: "suree.klo", nickname: "สุ๊ย", role: "Staff", phone: "089-111-1004", phone2: "086-111-1004", startDate: "2024-04-05", photo: "https://i.pravatar.cc/150?img=4" },
  { id: "D001", name: "วิชัย รถซิ่ง", englishFirstName: "Wichai", englishLastName: "Rotsing", englishNickname: "Wick", username: "wichai.rot", nickname: "วิ๊ก", role: "Driver", phone: "089-222-2001", phone2: "086-222-2001", startDate: "2023-11-01", photo: "https://i.pravatar.cc/150?img=5" },
  { id: "D002", name: "นิพนธ์ ปลอดภัย", englishFirstName: "Nipon", englishLastName: "Plodphai", englishNickname: "Nip", username: "nipon.plo", nickname: "นิพ", role: "Driver", phone: "089-222-2002", phone2: "086-222-2002", startDate: "2023-12-15", photo: "https://i.pravatar.cc/150?img=6" },
  { id: "D003", name: "สมชาย รอบเช้า", englishFirstName: "Somchai", englishLastName: "Robchao", englishNickname: "Chai", username: "somchai.rob", nickname: "ชาย", role: "Driver", phone: "089-222-2003", phone2: "086-222-2003", startDate: "2024-01-08", photo: "https://i.pravatar.cc/150?img=7" }
];

export const productPacketsSeed: ProductPacket[] = [
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

export const vehiclesSeed: VehicleRecord[] = [
  { code: "V001", licensePlate: "30-1234 ภูเก็ต", type: "Van", adminNote: "Morning shuttle", capacity: 10, active: true, notes: "Primary morning shuttle" },
  { code: "V002", licensePlate: "30-5678 ภูเก็ต", type: "Van", adminNote: "Backup van", capacity: 10, active: true, notes: "Flexible backup van" },
  { code: "V003", licensePlate: "กข-4321 ภูเก็ต", type: "Car", adminNote: "VIP fallback", capacity: 4, active: true, notes: "Light load / VIP fallback" }
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
  "Tawan Patel",
  "จิราพร วงศ์สกุล",
  "สุภาพร ทองธรรม",
  "ชนันธา บุญมาก",
  "Won Jun-ho",
  "Sung-Hee Kang",
  "อนุชา รัตนโชติ",
  "Priya Mehta",
  "Ananya Singh",
  "กฤษฎิ์ จีรศักดิ์",
  "ณัฐธิดา ทองชัย",
  "สมชาย ใจดี",
  "สุปราณี สุวรรณ",
  "Marco Vitti",
  "Elena Rossi",
  "Wei-Lin Chen",
  "Yuki Tanaka",
  "Lee Dae-jung",
  "ภัทราพร พลอย",
  "ชลิต เกษมสุข",
  "นนท์ ฟองมูล",
  "ภัทรานิษฐ์ ฐิติธรรม",
  "Thomas Gruber",
  "Anna Schmidt",
  "ธนพล วีระชัย",
  "Fang Xiaoming",
  "Liu Yang",
  "Sanjay Gupta",
  "นริศรา เจริญผล",
  "ศิริพร ศรีสุข",
  "จักรินทร์ ภูผา",
  "Emma Thompson",
  "Oliver Brown",
  "นภาพร รอดสกุล",
  "วิทวัส สุขแก้ว"
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

const adminNotesByStatus: Record<BookingStatus, string[]> = {
  WAITING: [],
  BOARDED: [],
  NO_SHOW: [
    "ลูกค้ายังไม่ลงมาที่ล็อบบี้",
    "รอลูกค้าที่ห้องพัก",
    "โทรแล้วไม่รับ",
    "เลื่อนไปรอบถัดไป"
  ],
  CANCELLED: [
    "ยกเลิกเนื่องจากอากาศ",
    "ลูกค้าขอยกเลิก",
    "ไม่มีรอบว่าง"
  ],
  RESCHEDULED: [
    "ขอเลื่อนไปรอบถัดไป",
    "เปลี่ยนรอบเนื่องจากติดธุระ"
  ]
};

function createOrderStatus(index: number): BookingStatus {
  if (index % 17 === 0) return "NO_SHOW";
  if (index % 13 === 0) return "RESCHEDULED";
  if (index % 11 === 0) return "CANCELLED";
  if (index % 5 === 0) return "WAITING";
  return "BOARDED";
}

function getDailyVolume(dayOfWeek: number, dayIndex: number): number {
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return dayIndex % 3 === 0 ? 35 : dayIndex % 3 === 1 ? 32 : 28;
  }
  if (dayOfWeek === 1 || dayOfWeek === 5) {
    return dayIndex % 2 === 0 ? 22 : 20;
  }
  return dayIndex % 2 === 0 ? 18 : 19;
}

export function generateMay2026Seed(): DashboardSeed {
  const driverNames = employeesSeed
    .filter((e) => e.role === "Driver")
    .map((e) => e.name);
  const staffNames = employeesSeed
    .filter((e) => e.role === "Staff")
    .map((e) => e.name);
  const vehicleCodes = vehiclesSeed.map((v) => v.code);

  const startDate = new Date("2026-05-17T00:00:00+07:00");
  const endDate = new Date("2026-05-31T00:00:00+07:00");
  const totalDays =
    Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  const orders: OrderRecord[] = [];
  let bookingCounter = 1001300;
  let globalIndex = 0;

  for (let d = 0; d < totalDays; d += 1) {
    const dateObj = new Date(startDate);
    dateObj.setDate(dateObj.getDate() + d);
    const dayOfWeek = dateObj.getDay();
    const formattedDate = dateObj.toISOString().slice(0, 10);

    const volume = getDailyVolume(dayOfWeek, d);

    for (let i = 0; i < volume; i += 1) {
      const idx = globalIndex;
      globalIndex += 1;

      const status = createOrderStatus(idx);
      const packet = productPacketsSeed[idx % productPacketsSeed.length];
      const slotIdx = idx % timeSlots.length;
      const agentIdx = (idx + d) % agents.length;
      const guestIdx = (idx + d * 3) % guestNames.length;
      const hotelIdx = (idx + d * 7) % hotels.length;
      const driverIdx = idx % driverNames.length;
      const staffIdx = idx % staffNames.length;
      const vehicleIdx = idx % vehicleCodes.length;

      const join = (idx % 4) + 1;
      const visitor = idx % 3 === 0 ? 1 : 0;

      const adminNotePool = adminNotesByStatus[status];
      const adminNote =
        adminNotePool.length > 0
          ? adminNotePool[idx % adminNotePool.length]
          : "";

      const isAssigned =
        status !== "CANCELLED" && status !== "RESCHEDULED" && idx % 7 !== 4;
      const driver = isAssigned ? driverNames[driverIdx] : "";
      const driverCode = isAssigned
        ? employeesSeed.find((e) => e.name === driver)?.id ?? ""
        : "";
      const vehicle = isAssigned ? vehicleCodes[vehicleIdx] : "";
      const vehicleCode = vehicle;

      const assignedStaff =
        status === "NO_SHOW" || status === "CANCELLED" || !isAssigned
          ? []
          : [
              staffNames[staffIdx],
              staffNames[(staffIdx + 1) % staffNames.length]
            ];

      orders.push({
        id: idx + 1,
        date: formattedDate,
        time: timeSlots[slotIdx],
        agent: agents[agentIdx],
        booking: `BK${bookingCounter}`,
        packet: packet.name,
        name: guestNames[guestIdx],
        phone: `08${String(10000000 + idx).slice(0, 9)}`,
        hotel: hotels[hotelIdx],
        room: `${(idx % 900) + 100}`,
        join,
        visitor,
        driver,
        driverCode,
        vehicle,
        vehicleCode,
        boarding: status,
        assignedStaff,
        adminNote
      });

      bookingCounter += 1;
    }
  }

  return {
    orders,
    employees: employeesSeed,
    vehicles: vehiclesSeed,
    productPackets: productPacketsSeed,
    timeSlots
  };
}

export function createDashboardSeed(): DashboardSeed {
  return generateMay2026Seed();
}
