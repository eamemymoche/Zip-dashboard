"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "th" | "en";

type TranslationKey =
  | "nav.orderlist"
  | "nav.personnel"
  | "nav.transport"
  | "nav.staffing"
  | "nav.master"
  | "nav.overview"
  | "orderlist.title"
  | "orderlist.subtitle"
  | "orderlist.newOrder"
  | "orderlist.export"
  | "orderlist.search"
  | "orderlist.date"
  | "orderlist.col.id"
  | "orderlist.col.date"
  | "orderlist.col.time"
  | "orderlist.col.agent"
  | "orderlist.col.booking"
  | "orderlist.col.packet"
  | "orderlist.col.customer"
  | "orderlist.col.pax"
  | "orderlist.col.join"
  | "orderlist.col.hotel"
  | "transport.title"
  | "transport.assign"
  | "transport.recheck"
  | "transport.sheet"
  | "staffing.title"
  | "staffing.setup"
  | "staffing.board"
  | "staffing.kpi"
  | "master.title"
  | "master.summary"
  | "master.pivot"
  | "master.products"
  | "personnel.title"
  | "personnel.newEmployee"
  | "common.boarding.waiting"
  | "common.boarding.boarding"
  | "common.boarding.noShow"
  | "common.boarding.rescheduled"
  | "common.boarding.cancelled"
  | "common.status.all"
  | "common.status.waiting"
  | "common.status.boarding"
  | "common.status.noShow"
  | "overview.title"
  | "overview.todaySummary"
  | "overview.quickStats"
  | "overview.noShowAlerts"
  | "overview.unassignedTransport"
  | "overview.pendingStaff";

const translations: Record<Language, Record<TranslationKey, string>> = {
  th: {
    "nav.orderlist": "รายการออเดอร์",
    "nav.personnel": "บุคลากร",
    "nav.transport": "งานจัดรถ",
    "nav.staffing": "งานสตาฟ",
    "nav.master": "Master Ops",
    "nav.overview": "ภาพรวม",
    "orderlist.title": "รายการออเดอร์",
    "orderlist.subtitle": "ประวัติการจอง",
    "orderlist.newOrder": "เพิ่มรายการใหม่",
    "orderlist.export": "ส่งออก",
    "orderlist.search": "ค้นหาอัจฉริยะ",
    "orderlist.date": "วันที่",
    "orderlist.col.id": "ID",
    "orderlist.col.date": "วันที่",
    "orderlist.col.time": "รอบ",
    "orderlist.col.agent": "Agent",
    "orderlist.col.booking": "Booking No.",
    "orderlist.col.packet": "แพ็กเกจ",
    "orderlist.col.customer": "ลูกค้า",
    "orderlist.col.pax": "Pax (รับ)",
    "orderlist.col.join": "Join (เล่น)",
    "orderlist.col.hotel": "โรงแรม",
    "transport.title": "งานจัดรถ",
    "transport.assign": "1. จัดคนขับ",
    "transport.recheck": "2. รีเช็คการรับ",
    "transport.sheet": "3. ใบงานรายคัน",
    "staffing.title": "งานสตาฟ",
    "staffing.setup": "1. จัดไกด์สนาม",
    "staffing.board": "2. หน้าบอร์ดสรุปงาน",
    "staffing.kpi": "3. สรุปผลงานสตาฟ",
    "master.title": "Master Ops",
    "master.summary": "1. ข้อมูลทั้งหมด",
    "master.pivot": "2. วิเคราะห์ข้อมูล",
    "master.products": "3. ตั้งค่าแพ็กเกจ",
    "personnel.title": "ฐานข้อมูลบุคลากร",
    "personnel.newEmployee": "+ เพิ่มพนักงานใหม่",
    "common.boarding.waiting": "รอรับ",
    "common.boarding.boarding": "รับแล้ว",
    "common.boarding.noShow": "ไม่มา",
    "common.boarding.rescheduled": "เลื่อน",
    "common.boarding.cancelled": "ยกเลิก",
    "common.status.all": "ทั้งหมด",
    "common.status.waiting": "รอรับ",
    "common.status.boarding": "รับแล้ว",
    "common.status.noShow": "No Show",
    "overview.title": "ภาพรวมประจำวัน",
    "overview.todaySummary": "สรุปวันนี้",
    "overview.quickStats": "สถิติฉับพลัน",
    "overview.noShowAlerts": "แจ้งเตือน No Show",
    "overview.unassignedTransport": "ยังไม่ได้จัดรถ",
    "overview.pendingStaff": "ยังไม่ได้จัดสตาฟ",
  },
  en: {
    "nav.orderlist": "Order List",
    "nav.personnel": "Personnel",
    "nav.transport": "Transport",
    "nav.staffing": "Staffing",
    "nav.master": "Master Ops",
    "nav.overview": "Overview",
    "orderlist.title": "Order List",
    "orderlist.subtitle": "Booking History",
    "orderlist.newOrder": "+ New Order",
    "orderlist.export": "Export",
    "orderlist.search": "Search",
    "orderlist.date": "Date",
    "orderlist.col.id": "ID",
    "orderlist.col.date": "Date",
    "orderlist.col.time": "Slot",
    "orderlist.col.agent": "Agent",
    "orderlist.col.booking": "Booking No.",
    "orderlist.col.packet": "Package",
    "orderlist.col.customer": "Customer",
    "orderlist.col.pax": "Pax (Pickup)",
    "orderlist.col.join": "Join",
    "orderlist.col.hotel": "Hotel",
    "transport.title": "Transport",
    "transport.assign": "1. Assign Driver",
    "transport.recheck": "2. Pickup Recheck",
    "transport.sheet": "3. Job Sheets",
    "staffing.title": "Staffing",
    "staffing.setup": "1. Guide Setup",
    "staffing.board": "2. Staff Board",
    "staffing.kpi": "3. Staff KPI",
    "master.title": "Master Ops",
    "master.summary": "1. All Data",
    "master.pivot": "2. Data Analysis",
    "master.products": "3. Package Setup",
    "personnel.title": "Personnel Database",
    "personnel.newEmployee": "+ Add Employee",
    "common.boarding.waiting": "Waiting",
    "common.boarding.boarding": "Boarded",
    "common.boarding.noShow": "No Show",
    "common.boarding.rescheduled": "Rescheduled",
    "common.boarding.cancelled": "Cancelled",
    "common.status.all": "All",
    "common.status.waiting": "Waiting",
    "common.status.boarding": "Boarded",
    "common.status.noShow": "No Show",
    "overview.title": "Today's Overview",
    "overview.todaySummary": "Today Summary",
    "overview.quickStats": "Quick Stats",
    "overview.noShowAlerts": "No Show Alerts",
    "overview.unassignedTransport": "Unassigned Transport",
    "overview.pendingStaff": "Pending Staff Assignment",
  },
};

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "th",
  setLang: () => {},
  t: (key) => key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("th");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language | null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang === "th" ? "th" : "en";
  }, [lang]);

  const t = (key: TranslationKey) => translations[lang][key] ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
