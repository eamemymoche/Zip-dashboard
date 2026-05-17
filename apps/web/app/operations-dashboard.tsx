"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { useLang } from "./i18n";
import { DatePicker } from "./date-picker";
import { TransportAssignTable } from "./transport-assign-table";
import { TransportRecheckTable } from "./transport-recheck-table";
import { TransportSheetView } from "./transport-sheet-view";
import StaffingSetupTable from "./staffing-setup-table";
import StaffingBoardView from "./staffing-board-view";
import PersonnelView from "./personnel-view";
import MasterView from "./master-view";
import OrderDetailRow from "./order-detail-row";
import {
  buildAssistantDriverLoads,
  buildAssistantPriorityBookings,
  buildBoardOrders,
  buildCapacityCards,
  buildDayOrders,
  buildDriversInDay,
  buildFilteredOrders,
  buildPacketsInDay,
  buildPivotMap,
  buildRecheckOrders,
  buildSelectedDriverOrders,
  buildSelectedStaffWork,
  buildSortedOrders,
  buildStaffingOrders,
  buildTransportOrders
} from "./dashboard-selectors";
import { useAuth } from "../lib/auth/auth-context";
import { defaultBoardAccessForRole } from "../lib/auth/role-guards";
import { UserAccessView } from "./user-access-view";
import { ChangeLogView } from "./change-log-view";
import * as XLSX from "xlsx";

import type {
  BookingStatus,
  DashboardSeed,
  EmployeeRecord,
  OrderRecord
} from "../lib/ops-data";

type MainView = "overview" | "orderlist" | "personnel" | "transport" | "staffing" | "master" | "useraccess" | "changelog";
type TransportView = "assign" | "recheck" | "sheet";
type StaffingView = "setup" | "board" | "kpi";
type MasterTab = "summary" | "pivot" | "products";

function statusClass(status: string) {
  if (status === "BOARDED") return "status-boarded";
  if (status === "NO_SHOW") return "status-noshow";
  if (status === "RESCHEDULED") return "status-rescheduled";
  if (status === "CANCELLED") return "status-cancelled";
  return "status-waiting";
}

function agentBadge(agent: string) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    Klook:       { bg: "#fff4e5", color: "#e07b00", label: "KL" },
    "Trip.com":  { bg: "#e8f5e9", color: "#2e7d32", label: "TC" },
    CTrip:      { bg: "#fce4ec", color: "#c62828", label: "CT" },
    "TTD Global": { bg: "#e3f2fd", color: "#1565c0", label: "TD" },
    Direct:     { bg: "#f3e5f5", color: "#6a1b9a", label: "DR" },
  };
  const style = styles[agent] ?? { bg: "#f1f5f9", color: "#475569", label: agent.slice(0, 2).toUpperCase() };
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:"6px"}}>
      <span
        className="agent-badge"
        style={{ background: style.bg, color: style.color }}
        title={agent}
      >
        {style.label}
      </span>
      <span>{agent}</span>
    </span>
  );
}

function formatStatus(status: string) {
  return status.replace("_", " ");
}

type OrderEditForm = {
  booking: string;
  agent: string;
  packet: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  hotel: string;
  room: string;
  join: string;
  visitor: string;
};

function navIcon(key: MainView) {
  const common = { viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (key === "overview") {
    return <svg {...common}><rect x="3" y="3" width="7" height="18" /><rect x="14" y="8" width="7" height="13" /></svg>;
  }
  if (key === "orderlist") {
    return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="13" y2="16" /></svg>;
  }
  if (key === "personnel") {
    return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c1.5-3 4-4 6-4s4.5 1 6 4" /><path d="M14 19c.8-1.7 2-2.6 3.5-2.9" /></svg>;
  }
  if (key === "transport") {
    return <svg {...common}><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8H5z" /><path d="M3 13h18" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /><path d="M9 9h6" /></svg>;
  }
  if (key === "staffing") {
    return <svg {...common}><path d="M4 21v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" /><circle cx="12" cy="7" r="4" /></svg>;
  }
  if (key === "master") {
    return <svg {...common}><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></svg>;
  }
  if (key === "useraccess") {
    return <svg {...common}><circle cx="10" cy="8" r="3" /><path d="M4 19c1.2-2.8 3.5-4 6-4" /><path d="M17 8h3" /><path d="M18.5 6.5v3" /><path d="M15.5 16.5h3" /><path d="M17 15v3" /></svg>;
  }
  if (key === "changelog") {
    return <svg {...common}><path d="M8 6h10" /><path d="M8 12h10" /><path d="M8 18h10" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1V9c0 .4.2.7.6.9H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" /></svg>;
}

export function OperationsDashboard({ initialData }: { initialData: DashboardSeed }) {
  const todayIso = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })).toISOString().slice(0, 10);
  const { t } = useLang();
  const { user, loading } = useAuth();
  const userRole = user?.role ?? null;
  const moduleAccess = user?.moduleAccess ?? defaultBoardAccessForRole(userRole);
  const hasModuleAccess = (board: MainView) => moduleAccess.includes(board);
  const [orders, setOrders] = useState(initialData.orders);
  const [employees, setEmployees] = useState(initialData.employees);
  const [productPackets, setProductPackets] = useState(initialData.productPackets);
  const [mainView, setMainView] = useState<MainView>("orderlist");
  const [transportView, setTransportView] = useState<TransportView>("assign");
  const [staffingView, setStaffingView] = useState<StaffingView>("setup");
  const [masterView, setMasterView] = useState<MasterTab>("summary");
  const [orderDateStart, setOrderDateStart] = useState(todayIso);
  const [orderDateEnd, setOrderDateEnd] = useState(todayIso);
  const [orderSearch, setOrderSearch] = useState("");
  const [transportDate, setTransportDate] = useState(todayIso);
  const [transportTime, setTransportTime] = useState("ALL");
  const [recheckDriverFilter, setRecheckDriverFilter] = useState("ALL");
  const [recheckStatusFilter, setRecheckStatusFilter] = useState("ALL");
  const [staffDate, setStaffDate] = useState(todayIso);
  const [staffTime, setStaffTime] = useState("ALL");
  const [staffPacket, setStaffPacket] = useState("ALL");
  const [boardDate, setBoardDate] = useState(todayIso);
  const [pivotGroupBy, setPivotGroupBy] = useState<"agent" | "packet">("agent");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedSheetSlot, setSelectedSheetSlot] = useState("ALL");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<OrderEditForm | null>(null);
  const [orderSortField, setOrderSortField] = useState<string>("");
  const [orderSortDir, setOrderSortDir] = useState<"asc" | "desc">("asc");
  const [assignSortField, setAssignSortField] = useState<string>("");
  const [assignSortDir, setAssignSortDir] = useState<"asc" | "desc">("asc");
  const [recheckSortField, setRecheckSortField] = useState<string>("");
  const [recheckSortDir, setRecheckSortDir] = useState<"asc" | "desc">("asc");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [transportSavingOrderId, setTransportSavingOrderId] = useState<number | null>(null);
  const [currentHour, setCurrentHour] = useState(() => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })).getHours();
  });

  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      setCurrentHour(new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })).getHours());
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace("/login?from=/");
    }
  }, [loading, user]);

  useEffect(() => {
    if (!hasModuleAccess(mainView)) {
      const firstAccessible = (["overview", "orderlist", "transport", "staffing", "personnel", "master", "useraccess", "changelog"] as MainView[])
        .find((board) => hasModuleAccess(board));
      if (firstAccessible) {
        setMainView(firstAccessible);
      }
    }
  }, [mainView, moduleAccess]);

  const [newOrder, setNewOrder] = useState({
    date: todayIso,
    time: "07:00",
    agent: "",
    booking: "",
    packet: productPackets[0]?.name ?? "Extreme",
    name: "",
    phone: "",
    hotel: "",
    room: "",
    join: "1",
    visitor: "0"
  });
  const [newEmployee, setNewEmployee] = useState({
    id: "",
    name: "",
    nickname: "",
    role: "Staff" as "Staff" | "Driver",
    phone: "",
    phone2: "",
    startDate: "",
    photo: ""
  });

  const drivers = employees.filter((employee) => employee.role === "Driver");
  const driverNames = drivers.map((employee) => employee.name);
  const staffMembers = employees.filter((employee) => employee.role === "Staff");
  const activeProductPackets = productPackets.filter((packet) => packet.active);
  const vehicles = initialData.vehicles;

  const filteredOrders = buildFilteredOrders(
    orders,
    orderDateStart,
    orderDateEnd,
    orderSearch,
    selectedTimeSlots
  );

  const sortedOrders = buildSortedOrders(filteredOrders, orderSortField, orderSortDir);

  function exportCSV(data: Record<string, string>[], filename: string) {
    const headers = Object.keys(data[0] ?? {});
    const rows = data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport(format: string) {
    setShowExportMenu(false);
    const cols: Record<string, keyof OrderRecord> = {
      id: "id",
      date: "date",
      time: "time",
      agent: "agent",
      booking: "booking",
      packet: "packet",
      name: "name",
      phone: "phone",
      hotel: "hotel",
      room: "room",
      join: "join",
      visitor: "visitor",
      driver: "driver",
      boarding: "boarding",
    };
    const rows = sortedOrders.map((o) =>
      Object.fromEntries(Object.entries(cols).map(([, v]) => [v, String(o[v])]))
    );
    if (format === "csv") {
      exportCSV(rows as Record<string, string>[], "OrderList");
      showToast("ส่งออก CSV สำเร็จ", "slate");
    } else if (format === "xls") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, `OrderList_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast("ส่งออก Excel สำเร็จ", "slate");
    } else if (format === "pdf") {
      if (typeof window === "undefined") {
        showToast("PDF export ไม่รองรับในโหมดนี้", "slate");
        return;
      }
      try {
        const rowsHtml = sortedOrders.map((o) => `
          <tr>
            <td>${o.id}</td>
            <td>${o.date}</td>
            <td>${o.time}</td>
            <td>${o.agent}</td>
            <td>${o.booking}</td>
            <td>${o.packet}</td>
            <td>${o.name}</td>
            <td>${o.join + o.visitor}</td>
            <td>${o.join}</td>
            <td>${o.hotel}</td>
          </tr>
        `).join("");

        const html = `
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>OrderList PDF</title>
              <style>
                body { font-family: "Noto Sans Thai", "Sarabun", Arial, sans-serif; margin: 16px; color: #0f172a; }
                h1 { margin: 0 0 10px; font-size: 20px; }
                .meta { margin: 0 0 14px; color: #475569; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
                th { background: #0f766e; color: #fff; }
                @media print { body { margin: 10mm; } }
              </style>
            </head>
            <body>
              <h1>Order List Export</h1>
              <p class="meta">Generated: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>วันที่</th><th>รอบ</th><th>Agent</th><th>Booking</th>
                    <th>Packet</th><th>ลูกค้า</th><th>Pax</th><th>Join</th><th>โรงแรม</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            </body>
          </html>
        `;

        const w = window.open("", "_blank", "width=1200,height=800");
        if (!w) {
          showToast("ไม่สามารถเปิดหน้าต่างพิมพ์ PDF ได้", "red");
          return;
        }
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
        showToast("เปิดหน้าพิมพ์แล้ว (เลือก Save as PDF)", "slate");
      } catch (err) {
        const e = err as Error;
        showToast("เกิดข้อผิดพลาดในการส่งออก PDF: " + e.message, "red");
      }
    }
  }

  function toggleSort(field: string) {
    if (orderSortField !== field) {
      setOrderSortField(field);
      setOrderSortDir("asc");
    } else if (orderSortDir === "asc") {
      setOrderSortDir("desc");
    } else {
      setOrderSortField("");
      setOrderSortDir("asc");
    }
  }

  function sortIcon(field: string) {
    if (orderSortField !== field) return " ↕";
    return orderSortDir === "asc" ? " ↑" : " ↓";
  }

  function toggleAssignSort(field: string) {
    if (assignSortField !== field) {
      setAssignSortField(field);
      setAssignSortDir("asc");
    } else if (assignSortDir === "asc") {
      setAssignSortDir("desc");
    } else {
      setAssignSortField("");
      setAssignSortDir("asc");
    }
  }

  function assignSortIcon(field: string) {
    if (assignSortField !== field) return " ↕";
    return assignSortDir === "asc" ? " ↑" : " ↓";
  }

  function toggleRecheckSort(field: string) {
    if (recheckSortField !== field) {
      setRecheckSortField(field);
      setRecheckSortDir("asc");
    } else if (recheckSortDir === "asc") {
      setRecheckSortDir("desc");
    } else {
      setRecheckSortField("");
      setRecheckSortDir("asc");
    }
  }

  function recheckSortIcon(field: string) {
    if (recheckSortField !== field) return " ↕";
    return recheckSortDir === "asc" ? " ↑" : " ↓";
  }

  const capacityCards = buildCapacityCards(orders, initialData.timeSlots, orderDateStart, currentHour);
  const transportOrders = buildTransportOrders(orders, transportDate, transportTime, assignSortField, assignSortDir);
  const dayOrders = buildDayOrders(orders, transportDate);
  const driversInDay = buildDriversInDay(dayOrders);
  const recheckOrders = buildRecheckOrders(
    dayOrders,
    recheckDriverFilter,
    recheckStatusFilter,
    recheckSortField,
    recheckSortDir
  );
  const packetsInDay = buildPacketsInDay(orders, staffDate);
  const staffingOrders = buildStaffingOrders(orders, staffDate, staffTime, staffPacket);
  const boardOrders = buildBoardOrders(orders, boardDate);
  const selectedDriverOrders = buildSelectedDriverOrders(
    orders,
    transportDate,
    selectedDriver,
    selectedSheetSlot
  );

  const pivotMap = buildPivotMap(orders, pivotGroupBy);

  const selectedStaffName = staffMembers[0]?.name ?? "";
  const selectedStaffWork = buildSelectedStaffWork(orders, selectedStaffName);
  const assistantFocusDate =
    mainView === "transport"
      ? transportDate
      : mainView === "staffing"
        ? staffDate
: mainView === "orderlist"
           ? orderDateStart
          : boardDate;
  const assistantVisibleOrders =
    mainView === "orderlist"
      ? filteredOrders
      : mainView === "transport"
        ? transportOrders
        : mainView === "staffing"
          ? staffingOrders
          : orders.filter((order) => order.date === assistantFocusDate);
  const assistantActiveModule =
    mainView === "transport"
      ? transportView === "assign"
        ? "งานจัดรถ"
        : transportView === "recheck"
          ? "ติดตามการรับ"
          : "ใบงานคนขับ"
      : mainView === "staffing"
        ? staffingView === "setup"
          ? "จัดสตาฟ"
          : staffingView === "board"
            ? "กระดานสตาฟ"
            : "KPI สตาฟ"
        : mainView === "master"
          ? masterView === "summary"
            ? "Operational Log"
            : masterView === "pivot"
              ? "Pivot Summary"
              : "Product Database"
          : mainView === "personnel"
            ? "ฐานข้อมูลบุคลากร"
            : "Order List";
  const assistantDriverLoads = buildAssistantDriverLoads(orders, employees, assistantFocusDate);
  const assistantPriorityBookings = buildAssistantPriorityBookings(
    orders,
    assistantFocusDate,
    mainView,
    formatStatus
  );
  const assistantContext = {
    activeModule: assistantActiveModule,
    focusDate: assistantFocusDate,
    totals: {
      visibleBookings: assistantVisibleOrders.length,
      totalPax: assistantVisibleOrders.reduce((sum, order) => sum + order.join + order.visitor, 0),
      waitingCount: assistantVisibleOrders.filter((order) => order.boarding === "WAITING").length,
      noShowCount: assistantVisibleOrders.filter((order) => order.boarding === "NO_SHOW").length,
      unassignedDrivers: assistantVisibleOrders.filter((order) => !order.driver).length
    },
    driverLoads: assistantDriverLoads,
    priorityBookings: assistantPriorityBookings
  };

  function updateOrder(id: number, updater: (order: OrderRecord) => OrderRecord) {
    setOrders((current) => current.map((order) => (order.id === id ? updater(order) : order)));
  }

  function updateOrderAdminNote(id: number, adminNote: string) {
    updateOrder(id, (current) => ({ ...current, adminNote }));
  }

async function saveTransportAssignment(
    order: OrderRecord,
    patch: { driverCode?: string; vehicleCode?: string; adminNote?: string }
  ) {
    const nextDriverCode = patch.driverCode ?? order.driverCode;
    const nextVehicleCode = patch.vehicleCode ?? order.vehicleCode;
    const nextAdminNote = patch.adminNote ?? order.adminNote;

    setTransportSavingOrderId(order.id);
    try {
      const response = await fetch("/api/transport-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookingNumber: order.booking,
          driverCode: nextDriverCode,
          vehicleCode: nextVehicleCode,
          adminNote: nextAdminNote,
          updatedAt: order.updatedAt
        })
      });

      if (response.status === 409) {
        showToast("ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้า", "red");
        setTransportSavingOrderId(null);
        return;
      }

      if (!response.ok) {
        throw new Error("save failed");
      }

      const result = await response.json();
      updateOrder(order.id, (current) => ({
        ...current,
        driver: result.transport.driverName,
        driverCode: result.transport.driverCode,
        vehicle: result.transport.vehicleCode,
        vehicleCode: result.transport.vehicleCode,
        adminNote: result.transport.adminNote,
        updatedAt: result.updatedAt ?? current.updatedAt
      }));
showToast(nextDriverCode ? "บันทึกการจัดรถสำเร็จ" : "ยกเลิกการจัดรถแล้ว", nextDriverCode ? "emerald" : "slate");
    } catch {
      showToast("บันทึกการจัดรถไม่สำเร็จ", "red");
    } finally {
      setTransportSavingOrderId(null);
    }
  }

  async function saveStaffAssignment(orderId: number, assignedStaff: string[]) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const staffIds = assignedStaff
      .map((name) => {
        const emp = staffMembers.find((s) => s.name === name);
        return emp?.id ?? "";
      })
      .filter(Boolean);
    try {
      const response = await fetch("/api/staff-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNumber: order.booking, staffAssignments: staffIds, updatedAt: order.updatedAt })
      });
      if (response.status === 409) {
        showToast("ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้า", "red");
        return;
      }
      if (!response.ok) {
        console.warn("Staff assignment persist failed:", await response.text());
        return;
      }
      const result = await response.json();
      updateOrder(orderId, (o) => ({ ...o, updatedAt: result.updatedAt ?? o.updatedAt }));
    } catch (err) {
      console.warn("Staff assignment API error:", err);
    }
  }

  async function savePickupStatus(bookingNumber: string, status: string, note?: string, order?: OrderRecord) {
    try {
      const response = await fetch("/api/pickup-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNumber, status, note, updatedAt: order?.updatedAt })
      });
      if (response.status === 409) {
        showToast("ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้า", "red");
        return;
      }
      if (!response.ok) {
        console.warn("Pickup status persist failed:", await response.text());
        return;
      }
      const result = await response.json();
      if (order && result.updatedAt) {
        updateOrder(order.id, (o) => ({ ...o, updatedAt: result.updatedAt }));
      }
    } catch (err) {
      console.warn("Pickup status API error:", err);
    }
  }

  function startEditOrder(order: OrderRecord) {
    setEditingOrderId(order.id);
    setEditForm({
      booking: order.booking,
      agent: order.agent,
      packet: order.packet,
      date: order.date,
      time: order.time,
      name: order.name,
      phone: order.phone,
      hotel: order.hotel,
      room: order.room,
      join: String(order.join),
      visitor: String(order.visitor)
    });
  }

async function saveEditOrder() {
    if (!editingOrderId || !editForm) return;
    const order = orders.find((o) => o.id === editingOrderId);
    if (!order) return;

    try {
      const response = await fetch("/api/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingNumber: order.booking,
          serviceDate: editForm.date,
          timeSlot: editForm.time,
          agentName: editForm.agent,
          customerName: editForm.name,
          phone: editForm.phone,
          hotel: editForm.hotel,
          room: editForm.room,
          pickupPax: Number(editForm.join),
          joinCount: Number(editForm.visitor),
          productPackageName: editForm.packet,
          updatedAt: order.updatedAt
        })
      });

      if (response.status === 409) {
        showToast("ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้า", "red");
        setEditingOrderId(null);
        setEditForm(null);
        return;
      }

      if (!response.ok) {
        throw new Error("update failed");
      }

      const result = await response.json();
      updateOrder(editingOrderId, (current) => ({
        ...current,
        booking: editForm.booking,
        agent: editForm.agent,
        packet: editForm.packet,
        date: editForm.date,
        time: editForm.time,
        name: editForm.name,
        phone: editForm.phone,
        hotel: editForm.hotel,
        room: editForm.room,
        join: Number(editForm.join),
        visitor: Number(editForm.visitor),
        updatedAt: result.updatedAt
      }));
      setEditingOrderId(null);
      setEditForm(null);
      showToast("แก้ไขออเดอร์สำเร็จ", "emerald");
    } catch {
      showToast("แก้ไขออเดอร์ไม่สำเร็จ", "red");
    }
  }

function cancelEditOrder() {
  setEditingOrderId(null);
  setEditForm(null);
}

function updateEditFormField(
  field: keyof OrderEditForm,
  value: string
) {
  setEditForm((current) => (current ? { ...current, [field]: value } : current));
}

async function deleteOrder(id: number) {
    if (!confirm("ยืนยันการลบ?")) return;
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    try {
      const url = `/api/order?bookingNumber=${encodeURIComponent(order.booking)}`;
      const response = await fetch(url, { method: "DELETE" });

      if (response.status === 409) {
        showToast("ข้อมูลถูกแก้ไขโดยผู้อื่นแล้ว กรุณารีเฟรชหน้า", "red");
        return;
      }

      if (!response.ok) {
        throw new Error("delete failed");
      }

      setOrders((current) => current.filter((o) => o.id !== id));
      if (expandedOrderId === id) setExpandedOrderId(null);
      showToast("ลบออเดอร์แล้ว", "red");
    } catch {
      showToast("ลบออเดอร์ไม่สำเร็จ", "red");
    }
  }

  function showToast(message: string, type: string = "emerald") {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  }

async function handleNewOrderSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedBooking = newOrder.booking || `BK${Date.now()}`;

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingNumber: submittedBooking,
          serviceDate: newOrder.date,
          timeSlot: newOrder.time || "00:00",
          agentName: newOrder.agent || "Direct",
          customerName: newOrder.name || "Guest",
          phone: newOrder.phone || "-",
          hotel: newOrder.hotel || "Hotel",
          room: newOrder.room || "-",
          pickupPax: Number(newOrder.join) || 1,
          joinCount: Number(newOrder.visitor) || 0,
          productPackageName: newOrder.packet,
          status: "WAITING"
        })
      });

      if (response.status === 409) {
        showToast("หมายเลขบุคคิดซ้ำ กรุณารีเฟรชหน้า", "red");
        return;
      }

      if (!response.ok) {
        throw new Error("create failed");
      }

      const result = await response.json();
      const createdOrder: OrderRecord = {
        id: orders.length + 1,
        date: newOrder.date,
        time: newOrder.time,
        agent: newOrder.agent || "Direct",
        booking: submittedBooking,
        packet: newOrder.packet,
        name: newOrder.name || "Guest",
        phone: newOrder.phone || "-",
        hotel: newOrder.hotel || "Hotel",
        room: newOrder.room || "-",
        join: Number(newOrder.join) || 1,
        visitor: Number(newOrder.visitor) || 0,
        driver: "",
        driverCode: "",
        vehicle: "",
        vehicleCode: "",
        boarding: "WAITING",
        assignedStaff: [],
        adminNote: "",
        updatedAt: result.updatedAt
      };

      setOrders((current) => [createdOrder, ...current]);
      setShowOrderModal(false);
      showToast("บันทึกออเดอร์สำเร็จ", "emerald");
    } catch {
      showToast("บันทึกออเดอร์ไม่สำเร็จ", "red");
    }
  }

  async function handleEmployeeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newEmployee.id || !newEmployee.name) {
      return;
    }

    const empData: EmployeeRecord = {
      id: newEmployee.id,
      name: newEmployee.name,
      nickname: newEmployee.nickname || newEmployee.name.split(" ")[0],
      role: newEmployee.role,
      phone: newEmployee.phone,
      phone2: newEmployee.phone2,
      startDate: newEmployee.startDate,
      photo: newEmployee.photo
    };

    try {
      const response = await fetch("/api/employee", {
        method: editingEmployeeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empData)
      });

      if (response.status === 409) {
        showToast("รหัสพนักงานนี้มีอยู่แล้ว", "red");
        return;
      }

      if (response.status === 403) {
        showToast("ไม่มีสิทธิ์แก้ไขข้อมูลบุคลากร", "red");
        return;
      }

      if (response.status === 503) {
        showToast("ฐานข้อมูลไม่พร้อมใช้งาน: ยังไม่สามารถบันทึกบุคลากรได้", "red");
        return;
      }

      if (!response.ok) {
        throw new Error("save employee failed");
      }

      const saved = await response.json();
      if (editingEmployeeId) {
        setEmployees((current) => current.map((e) => (e.id === editingEmployeeId ? saved : e)));
        setEditingEmployeeId(null);
        showToast("แก้ไขข้อมูลสำเร็จ", "indigo");
      } else {
        setEmployees((current) => [...current, saved]);
        showToast("เพิ่มพนักงานสำเร็จ", "indigo");
      }

      setShowEmployeeModal(false);
      resetEmployeeForm();
    } catch {
      showToast("บันทึกข้อมูลบุคลากรไม่สำเร็จ", "red");
    }
  }

  function openEditEmployeeModal(emp: EmployeeRecord) {
    setNewEmployee({
      id: emp.id,
      name: emp.name,
      nickname: emp.nickname,
      role: emp.role,
      phone: emp.phone,
      phone2: emp.phone2,
      startDate: emp.startDate,
      photo: emp.photo
    });
    setEditingEmployeeId(emp.id);
    setShowEmployeeModal(true);
  }

  function resetEmployeeForm() {
    setNewEmployee({ id: "", name: "", nickname: "", role: "Staff", phone: "", phone2: "", startDate: "", photo: "" });
    setEditingEmployeeId(null);
  }

  function onStartDateChange(nextStart: string) {
    setOrderDateStart(nextStart);
    if (!orderDateEnd || nextStart > orderDateEnd) {
      setOrderDateEnd(nextStart);
    }
  }

  function onEndDateChange(nextEnd: string) {
    setOrderDateEnd(nextEnd);
    if (!orderDateStart || nextEnd < orderDateStart) {
      setOrderDateStart(nextEnd);
    }
  }

  function printJobSheetOnly() {
    document.body.classList.add("print-job-sheet");
    window.print();
    setTimeout(() => document.body.classList.remove("print-job-sheet"), 300);
  }

  async function addProductPacket() {
    const nameInput = window.prompt("ชื่อแพ็กเกจใหม่");
    if (!nameInput) return;
    const detailInput = window.prompt("รายละเอียดแพ็กเกจ");
    if (!detailInput) return;

    const name = nameInput.trim();
    const detail = detailInput.trim();
    if (!name || !detail) {
      showToast("กรุณากรอกชื่อและรายละเอียดแพ็กเกจ", "red");
      return;
    }

    try {
      const response = await fetch("/api/product-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, detail })
      });

      if (response.status === 403) {
        showToast("ไม่มีสิทธิ์เพิ่มแพ็กเกจ", "red");
        return;
      }
      if (response.status === 409) {
        showToast("ชื่อแพ็กเกจนี้มีอยู่แล้ว", "red");
        return;
      }
      if (response.status === 503) {
        showToast("ฐานข้อมูลไม่พร้อมใช้งาน: ยังไม่สามารถเพิ่มแพ็กเกจได้", "red");
        return;
      }
      if (!response.ok) {
        throw new Error("save packet failed");
      }

      const created = await response.json();
      setProductPackets((current) => [...current, created]);
      showToast("เพิ่มแพ็กเกจสำเร็จ", "emerald");
    } catch {
      showToast("เพิ่มแพ็กเกจไม่สำเร็จ", "red");
    }
  }

  async function editProductPacket(packet: { name: string; detail: string; active: boolean }) {
    const nextNameRaw = window.prompt("แก้ชื่อแพ็กเกจ", packet.name);
    if (nextNameRaw === null) return;
    const nextDetailRaw = window.prompt("แก้รายละเอียดแพ็กเกจ", packet.detail);
    if (nextDetailRaw === null) return;

    const nextName = nextNameRaw.trim();
    const nextDetail = nextDetailRaw.trim();
    if (!nextName || !nextDetail) {
      showToast("กรุณากรอกชื่อและรายละเอียดแพ็กเกจ", "red");
      return;
    }

    try {
      const response = await fetch("/api/product-package", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalName: packet.name, name: nextName, detail: nextDetail })
      });

      if (response.status === 403) {
        showToast("ไม่มีสิทธิ์แก้ไขแพ็กเกจ", "red");
        return;
      }
      if (response.status === 404) {
        showToast("ไม่พบแพ็กเกจที่ต้องการแก้ไข", "red");
        return;
      }
      if (response.status === 409) {
        showToast("ชื่อแพ็กเกจซ้ำ", "red");
        return;
      }
      if (response.status === 503) {
        showToast("ฐานข้อมูลไม่พร้อมใช้งาน", "red");
        return;
      }
      if (!response.ok) {
        throw new Error("update packet failed");
      }

      const updated = await response.json();
      setProductPackets((current) =>
        current.map((p) => (p.name === packet.name ? updated : p))
      );
      showToast("แก้ไขแพ็กเกจสำเร็จ", "emerald");
    } catch {
      showToast("แก้ไขแพ็กเกจไม่สำเร็จ", "red");
    }
  }

  async function toggleProductPacketActive(packet: { name: string; detail: string; active: boolean }) {
    try {
      const response = await fetch("/api/product-package", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: packet.name, active: !packet.active })
      });

      if (response.status === 403) {
        showToast("ไม่มีสิทธิ์เปลี่ยนสถานะแพ็กเกจ", "red");
        return;
      }
      if (response.status === 404) {
        showToast("ไม่พบแพ็กเกจ", "red");
        return;
      }
      if (response.status === 503) {
        showToast("ฐานข้อมูลไม่พร้อมใช้งาน", "red");
        return;
      }
      if (!response.ok) {
        throw new Error("toggle packet failed");
      }

      const updated = await response.json();
      setProductPackets((current) =>
        current.map((p) => (p.name === packet.name ? updated : p))
      );
      showToast(updated.active ? "เปิดใช้งานแพ็กเกจแล้ว" : "ปิดใช้งานแพ็กเกจแล้ว", "emerald");
    } catch {
      showToast("เปลี่ยนสถานะแพ็กเกจไม่สำเร็จ", "red");
    }
  }

if (loading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0f172a", color: "#94a3b8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>ZIPLINE</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar-nav">
{([
          ["overview", t("nav.overview")],
          ["orderlist", t("nav.orderlist")],
          ["transport", t("nav.transport")],
          ["staffing", t("nav.staffing")],
          ["personnel", t("nav.personnel")],
          ["master", t("nav.master")],
          ["useraccess", "ตั้งค่าผู้ใช้"],
          ["changelog", "บันทึกแก้ไข"]
        ] as [MainView, string][])
          .filter(([key]) => hasModuleAccess(key))
          .map(([key, label]) => (
          <button
            className={`sidebar-item ${mainView === key ? "active" : ""}`}
            key={key}
            onClick={() => setMainView(key)}
            type="button"
          >
            <span className="sidebar-icon">{navIcon(key)}</span>
            <span>{label}</span>
          </button>
        ))}
      </aside>

      <div className="content-area">
      {mainView === "overview" ? (
        <section className="view-section">
          <div className="glass-card">
            <div className="section-header">
              <div>
                <h2>📊 {t("overview.title")}</h2>
                <p>{t("overview.todaySummary")} - {orderDateStart}</p>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"12px",fontWeight:700,color:"#64748b"}}>วันที่</span>
                <DatePicker
                  className="overview-date-picker"
                  value={orderDateStart}
                  onChange={(v) => setOrderDateStart(v)}
                  style={{padding:"6px 10px",fontSize:"13px"}}
                />
              </label>
            </div>

            <div className="overview-grid">
              <div className="overview-stat-card emerald">
                <div className="overview-stat-icon">📋</div>
                <div className="overview-stat-body">
                  <span>รายการวันนี้</span>
                  <strong>{orders.filter(o => o.date === orderDateStart).length}</strong>
                </div>
              </div>
              <div className="overview-stat-card blue">
                <div className="overview-stat-icon">👥</div>
                <div className="overview-stat-body">
                  <span>Pax วันนี้ (รับ)</span>
                  <strong>{orders.filter(o => o.date === orderDateStart && o.boarding !== "NO_SHOW").reduce((s, o) => s + o.join + o.visitor, 0)}</strong>
                </div>
              </div>
              <div className="overview-stat-card orange">
                <div className="overview-stat-icon">⚠️</div>
                <div className="overview-stat-body">
                  <span>No Show</span>
                  <strong>{orders.filter(o => o.date === orderDateStart && o.boarding === "NO_SHOW").length}</strong>
                </div>
              </div>
              <div className="overview-stat-card amber">
                <div className="overview-stat-icon">🚌</div>
                <div className="overview-stat-body">
                  <span>ยังไม่ได้จัดรถ</span>
                  <strong>{orders.filter(o => o.date === orderDateStart && !o.driver && o.boarding !== "CANCELLED").length}</strong>
                </div>
              </div>
              <div className="overview-stat-card purple">
                <div className="overview-stat-icon">🧑‍💼</div>
                <div className="overview-stat-body">
                  <span>รอ Staff จัด</span>
                  <strong>{orders.filter(o => o.date === orderDateStart && o.boarding !== "CANCELLED" && o.boarding !== "NO_SHOW" && o.assignedStaff.length < 2).length}</strong>
                </div>
              </div>
              <div className="overview-stat-card red">
                <div className="overview-stat-icon">⏰</div>
                <div className="overview-stat-body">
                  <span>ยังรอรับ (Waiting)</span>
                  <strong>{orders.filter(o => o.date === orderDateStart && o.boarding === "WAITING").length}</strong>
                </div>
              </div>
            </div>

            <div className="overview-two-col">
              <div>
                <h3 style={{margin:"0 0 12px",fontSize:"15px",fontWeight:800}}>📊 สรุปตาม Agent</h3>
                <div className="table-wrap">
                  <table className="ops-table compact">
                    <thead className="thead-navy">
                      <tr>
                        <th>Agent</th>
                        <th className="center">Bookings</th>
                        <th className="center">Pax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Klook","Trip.com","CTrip","TTD Global","Direct"].map(ag => {
                        const agOrders = orders.filter(o => o.date === orderDateStart && o.agent === ag);
                        return (
                          <tr key={ag}>
                            <td>{agentBadge(ag)}</td>
                            <td className="center">{agOrders.length}</td>
                            <td className="center strong-blue">{agOrders.reduce((s,o)=>s+o.join+o.visitor,0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 style={{margin:"0 0 12px",fontSize:"15px",fontWeight:800}}>⏰ รอบเวลาวันนี้</h3>
                <div className="overview-slot-list">
                  {initialData.timeSlots.map(slot => {
                    const slotOrders = orders.filter(o => o.date === orderDateStart && o.time === slot);
                    const pax = slotOrders.reduce((s,o)=>s+o.join+o.visitor,0);
                    const join = slotOrders.reduce((s,o)=>s+o.join,0);
                    const noShow = slotOrders.filter(o=>o.boarding==="NO_SHOW").length;
                    return (
                      <div className="overview-slot-row" key={slot}>
                        <div className="slot-time">{slot}</div>
                        <div className="slot-pax">Pax: <strong>{pax}</strong> / Join: <strong className="green">{join}</strong></div>
                        {noShow > 0 && <div className="slot-noshow">No Show: {noShow}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{marginTop:"20px"}}>
              <h3 style={{margin:"0 0 12px",fontSize:"15px",fontWeight:800}}>🚨 แจ้งเตือนวันนี้</h3>
              <div className="alert-list">
                {orders.filter(o => o.date === orderDateStart && o.boarding === "NO_SHOW").slice(0,5).map(o => (
                  <div className="alert-item danger" key={o.id}>
                    <span>⚠️ No Show:</span> <strong>{o.name}</strong> / {o.hotel} / {o.time} / <span className="agent-inline">{agentBadge(o.agent)}</span>
                  </div>
                ))}
                {orders.filter(o => o.date === orderDateStart && !o.driver && o.boarding !== "CANCELLED").slice(0,3).map(o => (
                  <div className="alert-item warning" key={o.id}>
                    <span>🚌 ยังไม่ได้จัดรถ:</span> <strong>{o.name}</strong> / {o.hotel} / {o.time}
                  </div>
                ))}
                {orders.filter(o => o.date === orderDateStart && o.boarding !== "CANCELLED" && o.boarding !== "NO_SHOW" && o.assignedStaff.length < 2).slice(0,3).map(o => (
                  <div className="alert-item info" key={o.id}>
                    <span>🧑‍💼 รอจัดสตาฟ:</span> <strong>{o.name}</strong> / {o.packet} / {o.time}
                  </div>
                ))}
                {orders.filter(o => o.date === orderDateStart).length === 0 && (
                  <div className="alert-item" style={{color:"#94a3b8"}}>ไม่มีรายการในวันที่เลือก</div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {mainView === "orderlist" ? (
        <section className="view-section">
          <div className="glass-card">
            <div className="capacity-dashboard">
              {capacityCards.map((card) => {
                const isSelected = selectedTimeSlots.includes(card.slot);
                return (
                  <div
                    className={`capacity-box ${card.state}${isSelected ? " slot-selected" : ""}`}
                    key={card.slot}
                    onClick={() => {
                      setSelectedTimeSlots((prev) =>
                        prev.includes(card.slot)
                          ? prev.filter((s) => s !== card.slot)
                          : [...prev, card.slot]
                      );
                    }}
                    style={{ cursor: "pointer" }}
                    title={isSelected ? "คลิกเพื่อยกเลิกกรอง" : "คลิกเพื่อกรองรอบนี้"}
                  >
                    <span>{card.slot}{isSelected ? " ✓" : ""}</span>
                    <strong>Pax (รับ): {card.pax}</strong>
                    <em>Join (เล่น): {card.join}</em>
                  </div>
                );
              })}
            </div>

            <div className="section-header">
              <div>
                <h2>Order List</h2>
                <p>History Log</p>
              </div>
              <div className="action-group">
<button className="primary-button" onClick={() => setShowOrderModal(true)} disabled={userRole === "STAFF" || userRole === "DRIVER"} title={userRole === "STAFF" || userRole === "DRIVER" ? "ไม่มีสิทธิ์เพิ่มรายการ" : ""} type="button">
                  เพิ่มรายการใหม่
                </button>
                <div className="export-dropdown-wrap">
                  <button
                    className="secondary-button export-trigger"
                    onClick={() => setShowExportMenu((v) => !v)}
                    type="button"
                  >
                    ส่งออก ▾
                  </button>
                  {showExportMenu ? (
                    <div className="export-menu">
                      <button
                        className="export-option"
                        onClick={() => handleExport("xls")}
                        type="button"
                      >
                        Excel (.xls)
                      </button>
                      <button
                        className="export-option"
                        onClick={() => handleExport("pdf")}
                        type="button"
                      >
                        PDF (.pdf)
                      </button>
                      <button
                        className="export-option"
                        onClick={() => handleExport("csv")}
                        type="button"
                      >
                        CSV (.csv)
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="filter-panel">
              <div className="filter-row">
                <label className="compact">
                    <span>จาก</span>
                  <DatePicker
                    value={orderDateStart}
                    onChange={onStartDateChange}
                    style={{fontSize:"13px", minWidth:"120px"}}
                  />
                </label>
                <label className="compact">
                    <span>ถึง</span>
                  <DatePicker
                    value={orderDateEnd}
                    onChange={onEndDateChange}
                    style={{fontSize:"13px", minWidth:"120px"}}
                  />
                </label>
                <label className="search-label">
                  <span>ค้นหาอัจฉริยะ</span>
                  <input
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder="ชื่อ/Booking/เบอร์/เอเจ้น"
                    type="text"
                    value={orderSearch}
                    className="search-input"
                  />
                </label>
              </div>
            </div>

            <div className="table-wrap">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th className={`sortable${orderSortField === "id" ? " sort-active" : ""}`} onClick={() => toggleSort("id")}>ID{sortIcon("id")}</th>
                    <th className={`sortable${orderSortField === "date" ? " sort-active" : ""}`} onClick={() => toggleSort("date")}>วันที่{sortIcon("date")}</th>
                    <th className={`sortable${orderSortField === "time" ? " sort-active" : ""}`} onClick={() => toggleSort("time")}>รอบ{sortIcon("time")}</th>
                    <th className={`sortable${orderSortField === "agent" ? " sort-active" : ""}`} onClick={() => toggleSort("agent")}>Agent{sortIcon("agent")}</th>
                    <th className={`sortable${orderSortField === "booking" ? " sort-active" : ""}`} onClick={() => toggleSort("booking")}>Booking No.{sortIcon("booking")}</th>
                    <th className={`sortable${orderSortField === "packet" ? " sort-active" : ""}`} onClick={() => toggleSort("packet")}>Packet{sortIcon("packet")}</th>
                    <th className={`sortable${orderSortField === "name" ? " sort-active" : ""}`} onClick={() => toggleSort("name")}>ลูกค้า{sortIcon("name")}</th>
                    <th className={`center sortable${orderSortField === "pax" ? " sort-active" : ""}`} onClick={() => toggleSort("pax")}>Pax (เพื่อรับ){sortIcon("pax")}</th>
                    <th className={`center sortable${orderSortField === "join" ? " sort-active" : ""}`} onClick={() => toggleSort("join")}>Join (คนเล่น){sortIcon("join")}</th>
                    <th className={`sortable${orderSortField === "hotel" ? " sort-active" : ""}`} onClick={() => toggleSort("hotel")}>โรงแรม{sortIcon("hotel")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => (
                    <Fragment key={order.id}>
                      <tr
                        className={`order-row ${expandedOrderId === order.id ? "expanded" : ""}`}
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      >
                        <td className="mono">{order.id}</td>
                        <td>{order.date}</td>
                        <td className="slot">{order.time}</td>
                        <td>{agentBadge(order.agent)}</td>
                        <td className="mono">{order.booking}</td>
                        <td className="tiny-strong">{order.packet}</td>
                        <td className="strong">{order.name}</td>
                        <td className="center strong-blue">{order.join + order.visitor}</td>
                        <td className="center strong-green">{order.join}</td>
                        <td>{order.hotel}</td>
                      </tr>
                      {expandedOrderId === order.id ? (
                        <OrderDetailRow
                          key={`${order.id}-detail`}
                          order={order}
                          isEditing={editingOrderId === order.id}
                          editForm={editForm}
                          userRole={userRole}
                          formatStatus={formatStatus}
                          statusClass={statusClass}
                          onEditFieldChange={updateEditFormField}
                          onCancelEdit={cancelEditOrder}
                          onSaveEdit={saveEditOrder}
                          onStartEdit={startEditOrder}
                          onDelete={deleteOrder}
                        />
                        ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                  </table>
                </div>
          </div>
        </section>
      ) : null}

      {mainView === "transport" ? (
        <section className="view-section">
          <div className="glass-card">
            <div className="subnav">
              {[
                ["assign", "1. จัดรถรับลูกค้า (Assign)"],
                ["recheck", "2. ติดตามสถานะรับ (Recheck)"],
                ["sheet", "3. ใบงานคนขับ (Sheet)"]
              ].map(([key, label]) => (
                <button
                  className={transportView === key ? "subnav-button active" : "subnav-button"}
                  key={key}
                  onClick={() => setTransportView(key as TransportView)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {transportView === "assign" ? (
              <TransportAssignTable
                orders={transportOrders}
                drivers={drivers}
                vehicles={vehicles}
                transportDate={transportDate}
                onSetTransportDate={setTransportDate}
                savingOrderId={transportSavingOrderId}
                onChangeLocalAdminNote={updateOrderAdminNote}
                onSaveTransport={saveTransportAssignment}
              />
            ) : null}

{transportView === "recheck" ? (
              <TransportRecheckTable
                dayOrders={dayOrders}
                driversInDay={driversInDay}
                recheckOrders={recheckOrders}
                recheckSortField={recheckSortField}
                recheckSortDir={recheckSortDir}
                recheckStatusFilter={recheckStatusFilter}
                recheckDriverFilter={recheckDriverFilter}
                transportDate={transportDate}
                drivers={drivers}
                timeSlots={initialData.timeSlots}
                onToggleRecheckSort={toggleRecheckSort}
                onRecheckSortIcon={recheckSortIcon}
                onSetRecheckStatusFilter={setRecheckStatusFilter}
                onSetRecheckDriverFilter={setRecheckDriverFilter}
                onSetTransportDate={setTransportDate}
                onUpdateOrder={updateOrder}
                onSavePickupStatus={savePickupStatus}
              />
            ) : null}

{transportView === "sheet" ? (
              <TransportSheetView
                driverNames={driverNames}
                drivers={drivers}
                orders={orders}
                transportDate={transportDate}
                timeSlots={initialData.timeSlots}
                selectedDriver={selectedDriver}
                selectedSheetSlot={selectedSheetSlot}
                onSelectDriverAndSlot={(driver, slot) => {
                  setSelectedDriver(driver);
                  setSelectedSheetSlot(slot || "ALL");
                }}
                onPrint={printJobSheetOnly}
                onSetTransportDate={setTransportDate}
                issuedBy={user?.displayName ?? "-"}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {mainView === "staffing" ? (
        <section className="view-section">
          <div className="glass-card">
            <div className="subnav">
              {[
                ["setup", "1. จัดไกด์สนาม (Setup)"],
                ["board", "2. หน้าบอร์ดสรุปงาน"],
                ["kpi", "3. สรุปผลงานสตาฟ (KPI)"]
              ].map(([key, label]) => (
                <button
                  className={staffingView === key ? "subnav-button active" : "subnav-button"}
                  key={key}
                  onClick={() => setStaffingView(key as StaffingView)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

{staffingView === "setup" ? (
              <StaffingSetupTable
                staffDate={staffDate}
                staffTime={staffTime}
                staffPacket={staffPacket}
                staffingOrders={staffingOrders}
                staffMembers={staffMembers}
                initialData={initialData}
                onStaffDateChange={setStaffDate}
                onStaffTimeChange={setStaffTime}
                onStaffPacketChange={setStaffPacket}
                updateOrder={updateOrder}
                saveStaffAssignment={saveStaffAssignment}
              />
            ) : null}

            {staffingView === "board" ? (
              <StaffingBoardView
                boardDate={boardDate}
                boardOrders={boardOrders}
                initialData={initialData}
                onBoardDateChange={setBoardDate}
              />
            ) : null}

            {staffingView === "kpi" ? (
              <>
                <div className="kpi-filter-shell">
                  <div className="kpi-card info">
                    <span>พนักงาน</span>
                    <strong>{selectedStaffName}</strong>
                  </div>
                  <div className="kpi-card">
                    <span>Trips Completed</span>
                    <strong>{selectedStaffWork.length}</strong>
                  </div>
                  <div className="kpi-card success">
                    <span>Total Join Handled</span>
                    <strong>{selectedStaffWork.reduce((sum, order) => sum + order.join, 0)}</strong>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {mainView === "personnel" ? (
        <PersonnelView
          employees={employees}
          expandedEmployeeId={expandedEmployeeId}
          onToggleEmployee={(employeeId) =>
            setExpandedEmployeeId(expandedEmployeeId === employeeId ? null : employeeId)
          }
          onOpenNewEmployee={() => setShowEmployeeModal(true)}
          onEditEmployee={openEditEmployeeModal}
        />
      ) : null}

      {mainView === "master" ? (
        <MasterView
          masterView={masterView}
          pivotGroupBy={pivotGroupBy}
          pivotMap={pivotMap}
          orders={orders}
          productPackets={productPackets}
          onMasterViewChange={setMasterView}
          onPivotGroupByChange={setPivotGroupBy}
          onExportAll={() => showToast("กำลังเตรียมไฟล์ Full_Master... สำเร็จ!", "slate")}
          onAddPacket={addProductPacket}
          onEditPacket={editProductPacket}
          onTogglePacketActive={toggleProductPacketActive}
          formatStatus={formatStatus}
          statusClass={statusClass}
/>
      ) : null}

      {mainView === "useraccess" && hasModuleAccess("useraccess") ? (
        <UserAccessView initialUsers={[]} />
      ) : null}

      {mainView === "changelog" && hasModuleAccess("changelog") ? (
        <ChangeLogView />
      ) : null}

      {showOrderModal ? (
        <div className="modal-backdrop">
          <form className="modal-card large" onSubmit={handleNewOrderSubmit}>
            <h3>คีย์ข้อมูลออเดอร์ใหม่</h3>
            <div className="modal-grid">
<label>
                    <span>วันที่</span>
                    <DatePicker
                      value={transportDate}
                      onChange={(v) => setTransportDate(v)}
                      style={{fontSize:"13px", minWidth:"130px"}}
                    />
                  </label>
              <label>
                <span>รอบ</span>
                <select
                  onChange={(event) => setNewOrder((current) => ({ ...current, time: event.target.value }))}
                  value={newOrder.time}
                >
                  {initialData.timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Agent</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, agent: event.target.value }))}
                  type="text"
                  value={newOrder.agent}
                />
              </label>
              <label>
                <span>Booking No.</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, booking: event.target.value }))}
                  type="text"
                  value={newOrder.booking}
                />
              </label>
              <label>
                <span>Packet</span>
                <select
                  onChange={(event) => setNewOrder((current) => ({ ...current, packet: event.target.value }))}
                  value={newOrder.packet}
                >
                  {activeProductPackets.map((packet) => (
                    <option key={packet.name} value={packet.name}>
                      {packet.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>ชื่อลูกค้า</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, name: event.target.value }))}
                  type="text"
                  value={newOrder.name}
                />
              </label>
              <label>
                <span>เบอร์โทร</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, phone: event.target.value }))}
                  type="text"
                  value={newOrder.phone}
                />
              </label>
              <label>
                <span>โรงแรม</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, hotel: event.target.value }))}
                  type="text"
                  value={newOrder.hotel}
                />
              </label>
              <label>
                <span>ห้อง</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, room: event.target.value }))}
                  type="text"
                  value={newOrder.room}
                />
              </label>
              <label>
                <span>Join (คนเล่น)</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, join: event.target.value }))}
                  type="number"
                  value={newOrder.join}
                />
              </label>
              <label>
                <span>Visitor (คนตาม)</span>
                <input
                  onChange={(event) => setNewOrder((current) => ({ ...current, visitor: event.target.value }))}
                  type="number"
                  value={newOrder.visitor}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowOrderModal(false)} type="button">
                ยกเลิก
              </button>
              <button className="primary-button" type="submit">
                บันทึกออเดอร์
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showEmployeeModal ? (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleEmployeeSubmit}>
            <h3>{editingEmployeeId ? "แก้ไขข้อมูลบุคลากร" : "ลงทะเบียนบุคลากรใหม่"}</h3>
            <div className="modal-grid">
              <label>
                <span>รหัสพนักงาน</span>
                <input
                  onChange={(event) => setNewEmployee((current) => ({ ...current, id: event.target.value }))}
                  placeholder="เช่น G001 / C001"
                  type="text"
                  value={newEmployee.id}
                />
              </label>
              <label>
                <span>ชื่อ-นามสกุล</span>
                <input
                  onChange={(event) => setNewEmployee((current) => ({ ...current, name: event.target.value }))}
                  placeholder="ชื่อ-นามสกุล"
                  type="text"
                  value={newEmployee.name}
                />
              </label>
              <label>
                <span>ชื่อเล่น (Nickname)</span>
                <input
                  onChange={(event) => setNewEmployee((current) => ({ ...current, nickname: event.target.value }))}
                  placeholder="เช่น มิน"
                  type="text"
                  value={newEmployee.nickname}
                />
              </label>
              <label>
                <span>ตำแหน่ง</span>
                <select
                  onChange={(event) =>
                    setNewEmployee((current) => ({
                      ...current,
                      role: event.target.value as "Staff" | "Driver"
                    }))
                  }
                  value={newEmployee.role}
                >
                  <option value="Staff">ไกด์สนาม (Staff)</option>
                  <option value="Driver">คนขับรถ (Driver)</option>
                </select>
              </label>
              <label>
                <span>เบอร์โทรศัพท์</span>
                <input
                  onChange={(event) => setNewEmployee((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="089-XXX-XXXX"
                  type="text"
                  value={newEmployee.phone}
                />
              </label>
              <label>
                <span>เบอร์สำรอง</span>
                <input
                  onChange={(event) => setNewEmployee((current) => ({ ...current, phone2: event.target.value }))}
                  placeholder="086-XXX-XXXX"
                  type="text"
                  value={newEmployee.phone2}
                />
              </label>
              <label>
                <span>วันเข้าทำงาน</span>
                <DatePicker
                  value={newEmployee.startDate}
                  onChange={(v) => setNewEmployee((current) => ({ ...current, startDate: v }))}
                  style={{fontSize:"13px"}}
                />
              </label>
              <label>
                <span>รูปถ่าย</span>
                <div className="photo-upload-wrap">
                  {newEmployee.photo ? (
                    <div className="photo-preview">
                      <img src={newEmployee.photo} alt="Preview" />
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => setNewEmployee((current) => ({ ...current, photo: "" }))}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="photo-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setNewEmployee((current) => ({ ...current, photo: e.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }}
                        style={{ display: "none" }}
                      />
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M3 9h2" />
                      </svg>
                      <span>เลือกรูป</span>
                    </label>
                  )}
                </div>
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => { setShowEmployeeModal(false); resetEmployeeForm(); }} type="button">
                ยกเลิก
              </button>
              <button className="indigo-button" type="submit">
                บันทึกข้อมูล
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {toastMessage ? (
        <div className={`toast-notification ${toastType}`}>
          {toastMessage}
        </div>
      ) : null}
      </div>
    </div>
  );
}

