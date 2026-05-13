"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { useLang } from "./i18n";
import { DatePicker } from "./date-picker";
import * as XLSX from "xlsx";

import type {
  BookingStatus,
  DashboardSeed,
  EmployeeRecord,
  OrderRecord,
  ProductPacket
} from "../lib/ops-data";

type MainView = "overview" | "orderlist" | "personnel" | "transport" | "staffing" | "master";
type TransportView = "assign" | "recheck" | "sheet";
type StaffingView = "setup" | "board" | "kpi";
type MasterView = "summary" | "pivot" | "products";

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

function countJoin(list: OrderRecord[]) {
  return list.reduce((sum, order) => sum + order.join, 0);
}

function countPax(list: OrderRecord[]) {
  return list.reduce((sum, order) => sum + order.join + order.visitor, 0);
}

export function OperationsDashboard({ initialData }: { initialData: DashboardSeed }) {
  const { t } = useLang();
  const [orders, setOrders] = useState(initialData.orders);
  const [employees, setEmployees] = useState(initialData.employees);
  const [productPackets] = useState(initialData.productPackets);
  const [mainView, setMainView] = useState<MainView>("orderlist");
  const [transportView, setTransportView] = useState<TransportView>("assign");
  const [staffingView, setStaffingView] = useState<StaffingView>("setup");
  const [masterView, setMasterView] = useState<MasterView>("summary");
  const [orderDateStart, setOrderDateStart] = useState("2026-05-12");
  const [orderDateEnd, setOrderDateEnd] = useState("2026-05-12");
  const [orderSearch, setOrderSearch] = useState("");
  const [transportDate, setTransportDate] = useState("2026-05-12");
  const [transportTime, setTransportTime] = useState("ALL");
  const [recheckDriverFilter, setRecheckDriverFilter] = useState("ALL");
  const [recheckStatusFilter, setRecheckStatusFilter] = useState("ALL");
  const [staffDate, setStaffDate] = useState("2026-05-12");
  const [staffTime, setStaffTime] = useState("ALL");
  const [staffPacket, setStaffPacket] = useState("ALL");
  const [boardDate, setBoardDate] = useState("2026-05-12");
  const [pivotGroupBy, setPivotGroupBy] = useState<"agent" | "packet">("agent");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedSheetSlot, setSelectedSheetSlot] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
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
  } | null>(null);
  const [orderSortField, setOrderSortField] = useState<string>("");
  const [orderSortDir, setOrderSortDir] = useState<"asc" | "desc">("asc");
  const [assignSortField, setAssignSortField] = useState<string>("");
  const [assignSortDir, setAssignSortDir] = useState<"asc" | "desc">("asc");
  const [recheckSortField, setRecheckSortField] = useState<string>("");
  const [recheckSortDir, setRecheckSortDir] = useState<"asc" | "desc">("asc");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
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

  const [newOrder, setNewOrder] = useState({
    date: "2026-05-12",
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

  const driverNames = employees
    .filter((employee) => employee.role === "Driver")
    .map((employee) => employee.name);
  const staffMembers = employees.filter((employee) => employee.role === "Staff");

  const filteredOrders = orders.filter((order) => {
    const query = orderSearch.trim().toLowerCase();
    const startOk = !orderDateStart || order.date >= orderDateStart;
    const endOk = !orderDateEnd || order.date <= orderDateEnd;
    const matchesDate = startOk && endOk;
    const matchesSlot = selectedTimeSlots.length === 0 || selectedTimeSlots.includes(order.time);
    const searchable = [
      order.name,
      order.booking,
      order.phone,
      order.agent,
      order.hotel,
      order.packet
    ]
      .join(" ")
      .toLowerCase();

    return matchesDate && matchesSlot && (!query || searchable.includes(query));
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let cmp = 0;
    switch (orderSortField) {
      case "id": cmp = a.id - b.id; break;
      case "date": cmp = a.date.localeCompare(b.date); break;
      case "time": cmp = a.time.localeCompare(b.time); break;
      case "agent": cmp = a.agent.localeCompare(b.agent); break;
      case "booking": cmp = a.booking.localeCompare(b.booking); break;
      case "packet": cmp = a.packet.localeCompare(b.packet); break;
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "pax": cmp = (a.join + a.visitor) - (b.join + b.visitor); break;
      case "join": cmp = a.join - b.join; break;
      case "hotel": cmp = a.hotel.localeCompare(b.hotel); break;
      default: cmp = a.id - b.id;
    }
    return orderSortDir === "asc" ? cmp : -cmp;
  });

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

  const getSlotState = (slot: string): "past" | "current" | "next" | "upcoming" => {
    const slotHour = parseInt(slot.split(":")[0]);
    if (currentHour > slotHour) return "past";
    if (currentHour === slotHour) return "current";
    if (currentHour === slotHour - 1) return "next";
    return "upcoming";
  };

  const capacityCards = initialData.timeSlots.map((slot) => {
    const list = orders.filter(
      (order) =>
        order.date === orderDateStart &&
        order.time === slot &&
        order.boarding !== "NO_SHOW" &&
        order.boarding !== "CANCELLED"
    );

    return {
      slot,
      pax: countPax(list),
      join: countJoin(list),
      state: getSlotState(slot)
    };
  });

  const baseTransportOrders = orders.filter(
    (order) =>
      order.date === transportDate && (transportTime === "ALL" || order.time === transportTime)
  );
  const sortedTransportOrders = [...baseTransportOrders].sort((a, b) => {
    let cmp = 0;
    switch (assignSortField) {
      case "time": cmp = a.time.localeCompare(b.time); break;
      case "hotel": cmp = a.hotel.localeCompare(b.hotel); break;
      case "pax": cmp = (a.join + a.visitor) - (b.join + b.visitor); break;
      default: cmp = a.time.localeCompare(b.time);
    }
    return assignSortDir === "asc" ? cmp : -cmp;
  });
  const transportOrders = sortedTransportOrders;
  const dayOrders = orders.filter((order) => order.date === transportDate);
  const driversInDay = [...new Set(dayOrders.filter((order) => order.driver).map((order) => order.driver))];
  const baseRecheckOrders = dayOrders.filter(
    (order) =>
      (recheckDriverFilter === "ALL" || order.driver === recheckDriverFilter) &&
      (recheckStatusFilter === "ALL" || order.boarding === recheckStatusFilter)
  );
  const sortedRecheckOrders = [...baseRecheckOrders].sort((a, b) => {
    let cmp = 0;
    switch (recheckSortField) {
      case "time": cmp = a.time.localeCompare(b.time); break;
      case "hotel": cmp = a.hotel.localeCompare(b.hotel); break;
      case "status": cmp = a.boarding.localeCompare(b.boarding); break;
      default: cmp = a.time.localeCompare(b.time);
    }
    return recheckSortDir === "asc" ? cmp : -cmp;
  });
  const recheckOrders = sortedRecheckOrders;
  const packetsInDay = [...new Set(orders.filter((order) => order.date === staffDate).map((order) => order.packet))];
  const staffingOrders = orders.filter((order) => {
    if (order.date !== staffDate) return false;
    if (staffTime !== "ALL" && order.time !== staffTime) return false;
    if (staffPacket !== "ALL" && order.packet !== staffPacket) return false;
    return true;
  });
  const boardOrders = orders.filter((order) => order.date === boardDate);
  const selectedDriverOrders = orders.filter(
    (order) => order.date === transportDate && order.driver === selectedDriver && order.time === selectedSheetSlot
  );

  const pivotMap = orders
    .filter((order) => order.boarding !== "NO_SHOW" && order.boarding !== "CANCELLED")
    .reduce<Record<string, { bookings: number; pax: number; join: number }>>((map, order) => {
      const key = pivotGroupBy === "agent" ? order.agent : order.packet;
      if (!map[key]) {
        map[key] = { bookings: 0, pax: 0, join: 0 };
      }
      map[key].bookings += 1;
      map[key].pax += order.join + order.visitor;
      map[key].join += order.join;
      return map;
    }, {});

  const selectedStaffName = staffMembers[0]?.name ?? "";
  const selectedStaffWork = orders.filter(
    (order) => order.assignedStaff.includes(selectedStaffName) && order.boarding === "BOARDED"
  );
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
  const assistantDriverLoads = employees
    .filter((employee) => employee.role === "Driver")
    .map((employee) => {
      const relatedOrders = orders.filter(
        (order) => order.date === assistantFocusDate && order.driver === employee.name
      );

      return {
        driver: employee.name,
        trips: relatedOrders.length,
        pax: relatedOrders.reduce((sum, order) => sum + order.join + order.visitor, 0)
      };
    })
    .filter((driver) => driver.trips > 0)
    .sort((left, right) => right.trips - left.trips)
    .slice(0, 5);
  const assistantPriorityBookings = orders
    .filter((order) => order.date === assistantFocusDate)
    .filter(
      (order) =>
        order.boarding === "NO_SHOW" ||
        order.boarding === "WAITING" ||
        (mainView === "transport" && !order.driver)
    )
    .slice(0, 6)
    .map((order) => ({
      booking: order.booking,
      customer: order.name,
      hotel: order.hotel,
      slot: order.time,
      status: formatStatus(order.boarding),
      note: order.adminNote
    }));
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

  function saveEditOrder() {
    if (!editingOrderId || !editForm) return;
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
      visitor: Number(editForm.visitor)
    }));
    setEditingOrderId(null);
    setEditForm(null);
    showToast("แก้ไขออเดอร์สำเร็จ", "emerald");
  }

  function cancelEditOrder() {
    setEditingOrderId(null);
    setEditForm(null);
  }

  function deleteOrder(id: number) {
    if (!confirm("ยืนยันการลบ?")) return;
    setOrders((current) => current.filter((order) => order.id !== id));
    if (expandedOrderId === id) setExpandedOrderId(null);
    showToast("ลบออเดอร์แล้ว", "red");
  }

  function showToast(message: string, type: string = "emerald") {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleNewOrderSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const createdOrder: OrderRecord = {
      id: orders.length + 1,
      date: newOrder.date,
      time: newOrder.time,
      agent: newOrder.agent || "Direct",
      booking: newOrder.booking || `BK${Date.now()}`,
      packet: newOrder.packet,
      name: newOrder.name || "Guest",
      phone: newOrder.phone || "-",
      hotel: newOrder.hotel || "Hotel",
      room: newOrder.room || "-",
      join: Number(newOrder.join) || 1,
      visitor: Number(newOrder.visitor) || 0,
      driver: "",
      boarding: "WAITING",
      assignedStaff: [],
      adminNote: ""
    };

    setOrders((current) => [createdOrder, ...current]);
    setShowOrderModal(false);
    showToast("บันทึกออเดอร์สำเร็จ", "emerald");
  }

  function handleEmployeeSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (editingEmployeeId) {
      setEmployees((current) => current.map((e) => (e.id === editingEmployeeId ? empData : e)));
      setEditingEmployeeId(null);
      showToast("แก้ไขข้อมูลสำเร็จ", "indigo");
    } else {
      setEmployees((current) => [...current, empData]);
      showToast("เพิ่มพนักงานสำเร็จ", "indigo");
    }
    setShowEmployeeModal(false);
    resetEmployeeForm();
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

  return (
    <div className="app-shell">
      <aside className="sidebar-nav">
        {[
          ["overview", t("nav.overview"), "📊"],
          ["orderlist", t("nav.orderlist"), "📋"],
          ["personnel", t("nav.personnel"), "👥"],
          ["transport", t("nav.transport"), "🚌"],
          ["staffing", t("nav.staffing"), "🧑‍💼"],
          ["master", t("nav.master"), "⚙️"]
        ].map(([key, label, icon]) => (
          <button
            className={`sidebar-item ${mainView === key ? "active" : ""}`}
            key={key}
            onClick={() => setMainView(key as MainView)}
            type="button"
          >
            <span className="sidebar-icon">{icon}</span>
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
                <button className="primary-button" onClick={() => setShowOrderModal(true)} type="button">
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
                        <tr className="order-detail-row" key={`${order.id}-detail`}>
                          <td colSpan={10}>
                            <div className="order-detail-panel">
                              {editingOrderId === order.id && editForm ? (
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <span className="detail-label">Booking No.</span>
                                    <input className="order-edit-input" value={editForm.booking} onChange={(e) => setEditForm(f => f ? ({ ...f, booking: e.target.value }) : f)} />
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Agent</span>
                                    <input className="order-edit-input" value={editForm.agent} onChange={(e) => setEditForm(f => f ? ({ ...f, agent: e.target.value }) : f)} />
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Packet</span>
                                    <input className="order-edit-input" value={editForm.packet} onChange={(e) => setEditForm(f => f ? ({ ...f, packet: e.target.value }) : f)} />
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">วันที่ / รอบ</span>
                                    <div style={{display:"flex", gap:"8px"}}>
                                      <input className="order-edit-input" style={{width:"110px"}} value={editForm.date} onChange={(e) => setEditForm(f => f ? ({ ...f, date: e.target.value }) : f)} />
                                      <input className="order-edit-input" style={{width:"70px"}} value={editForm.time} onChange={(e) => setEditForm(f => f ? ({ ...f, time: e.target.value }) : f)} />
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">ลูกค้า</span>
                                    <input className="order-edit-input" value={editForm.name} onChange={(e) => setEditForm(f => f ? ({ ...f, name: e.target.value }) : f)} />
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">เบอร์โทร</span>
                                    <input className="order-edit-input" value={editForm.phone} onChange={(e) => setEditForm(f => f ? ({ ...f, phone: e.target.value }) : f)} />
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">โรงแรม / ห้อง</span>
                                    <div style={{display:"flex", gap:"8px"}}>
                                      <input className="order-edit-input" style={{width:"100px"}} value={editForm.hotel} onChange={(e) => setEditForm(f => f ? ({ ...f, hotel: e.target.value }) : f)} />
                                      <input className="order-edit-input" style={{width:"60px"}} value={editForm.room} onChange={(e) => setEditForm(f => f ? ({ ...f, room: e.target.value }) : f)} />
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Pax / Join</span>
                                    <div style={{display:"flex", gap:"8px"}}>
                                      <input className="order-edit-input" style={{width:"50px"}} value={editForm.join} onChange={(e) => setEditForm(f => f ? ({ ...f, join: e.target.value }) : f)} />
                                      <input className="order-edit-input" style={{width:"50px"}} value={editForm.visitor} onChange={(e) => setEditForm(f => f ? ({ ...f, visitor: e.target.value }) : f)} />
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">คนขับ</span>
                                    <strong style={{color:"var(--muted)"}}>{order.driver || "ยังไม่จัด"}</strong>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">สถานะ</span>
                                    <span className={`status-badge ${statusClass(order.boarding)}`}>{formatStatus(order.boarding)}</span>
                                  </div>
                                  <div className="detail-item full">
                                    <span className="detail-label">Staff ที่จัด</span>
                                    <strong style={{color:"var(--muted)"}}>{order.assignedStaff.join(", ") || "ยังไม่จัด"}</strong>
                                  </div>
                                  {order.adminNote ? (
                                    <div className="detail-item full">
                                      <span className="detail-label">Note</span>
                                      <em className="note-text">{order.adminNote}</em>
                                    </div>
                                  ) : null}
                                  <div className="detail-item full" style={{display:"flex",justifyContent:"flex-end",gap:"10px",marginTop:"16px"}}>
                                    <button className="secondary-button" style={{padding:"9px 16px"}} onClick={cancelEditOrder} type="button">ยกเลิก</button>
                                    <button className="primary-button" style={{padding:"9px 16px"}} onClick={saveEditOrder} type="button">บันทึก</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="detail-grid">
                                  <div className="detail-item"><span className="detail-label">Booking No.</span><strong>{order.booking}</strong></div>
                                  <div className="detail-item"><span className="detail-label">Agent</span><strong>{order.agent}</strong></div>
                                  <div className="detail-item"><span className="detail-label">Packet</span><strong>{order.packet}</strong></div>
                                  <div className="detail-item"><span className="detail-label">วันที่ / รอบ</span><strong>{order.date} / {order.time}</strong></div>
                                  <div className="detail-item"><span className="detail-label">ลูกค้า</span><strong>{order.name}</strong></div>
                                  <div className="detail-item"><span className="detail-label">เบอร์โทร</span><strong>{order.phone}</strong></div>
                                  <div className="detail-item"><span className="detail-label">โรงแรม / ห้อง</span><strong>{order.hotel} ({order.room})</strong></div>
                                  <div className="detail-item"><span className="detail-label">Pax / Join</span><strong>{order.join + order.visitor} / {order.join}</strong></div>
                                  <div className="detail-item"><span className="detail-label">คนขับ</span><strong>{order.driver || "ยังไม่จัด"}</strong></div>
                                  <div className="detail-item"><span className="detail-label">Staff ที่จัด</span><strong style={{color:"var(--muted)"}}>{order.assignedStaff.join(", ") || "ยังไม่จัด"}</strong></div>
                                  <div className="detail-item full detail-item-status-inline">
                                    {order.adminNote ? (
                                      <div className="detail-note-inline">
                                        <span className="detail-label">Note</span>
                                        <em className="note-text">{order.adminNote}</em>
                                      </div>
                                    ) : null}
                                    <div className="detail-status-group">
                                      <span className="detail-status-title">สถานะ</span>
                                      <span className={`status-badge ${statusClass(order.boarding)}`}>{formatStatus(order.boarding)}</span>
                                    </div>
                                    <div className="detail-actions">
                                      <button className="indigo-button" onClick={() => startEditOrder(order)} type="button">แก้ไข</button>
                                      <button className="btn-danger" onClick={() => deleteOrder(order.id)} type="button">ลบ</button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          </tr>
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
              <div className="table-wrap">
                <table className="ops-table compact">
                  <thead className="thead-indigo">
                    <tr>
                      <th>รอบ</th>
                      <th>โรงแรม</th>
                      <th className="center">Pax</th>
                      <th>ลูกค้า</th>
                      <th>คนขับ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="slot">{order.time}</td>
                        <td>{order.hotel}</td>
                        <td className="center strong-blue">{order.join + order.visitor}</td>
                        <td>{order.name}</td>
                        <td>
                          <select
                            value={order.driver}
                            onChange={(event) =>
                              updateOrder(order.id, (current) => ({ ...current, driver: event.target.value }))
                            }
                          >
                            <option value="">ยังไม่จัด</option>
                            {driverNames.map((driver) => (
                              <option key={driver} value={driver}>
                                {driver}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {transportView === "recheck" ? (
              <>
                <div className="stats-grid">
                  <div className="stats-card" onClick={() => setRecheckStatusFilter("ALL")} style={{cursor:"pointer"}}>
                    <span>ทั้งหมด</span>
                    <strong>{dayOrders.length}</strong>
                  </div>
                  <div className="stats-card" onClick={() => setRecheckStatusFilter("WAITING")} style={{cursor:"pointer"}}>
                    <span>Waiting</span>
                    <strong>{dayOrders.filter((order) => order.boarding === "WAITING").length}</strong>
                  </div>
                  <div className="stats-card" onClick={() => setRecheckStatusFilter("BOARDED")} style={{cursor:"pointer"}}>
                    <span>Boarded</span>
                    <strong>{dayOrders.filter((order) => order.boarding === "BOARDED").length}</strong>
                  </div>
                  <div className="stats-card danger" onClick={() => setRecheckStatusFilter("NO_SHOW")} style={{cursor:"pointer"}}>
                    <span>No Show</span>
                    <strong>{dayOrders.filter((order) => order.boarding === "NO_SHOW").length}</strong>
                  </div>
                </div>
                <div className="toolbar muted">
<label>
                    <span>วันที่</span>
                    <DatePicker
                      value={transportDate}
                      onChange={(v) => setTransportDate(v)}
                      style={{fontSize:"13px", minWidth:"130px"}}
                    />
                  </label>
                  <label>
                    <span>คนขับ</span>
                    <select
                      onChange={(event) => setRecheckDriverFilter(event.target.value)}
                      value={recheckDriverFilter}
                    >
                      <option value="ALL">ทุกคน</option>
                      {driversInDay.map((driver) => (
                        <option key={driver} value={driver}>
                          {driver}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="table-wrap">
                  <table className="ops-table compact">
                    <thead className="thead-navy">
                      <tr>
                        <th className={`sortable${recheckSortField === "time" ? " sort-active" : ""}`} onClick={() => toggleRecheckSort("time")}>รอบ / คนขับ{recheckSortIcon("time")}</th>
                        <th className={`sortable${recheckSortField === "hotel" ? " sort-active" : ""}`} onClick={() => toggleRecheckSort("hotel")}>โรงแรม{recheckSortIcon("hotel")}</th>
                        <th className="center">Pax</th>
                        <th>ลูกค้า</th>
                        <th className={`center sortable${recheckSortField === "status" ? " sort-active" : ""}`} onClick={() => toggleRecheckSort("status")}>สถานะ{recheckSortIcon("status")}</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recheckOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.time}</strong>
                            <span className="subtle-line">{order.driver || "ยังไม่จัดรถ"}</span>
                          </td>
                          <td>{order.hotel}</td>
                          <td className="center strong-blue">{order.join + order.visitor}</td>
                          <td>{order.name}</td>
                          <td className="center">
                            <button
                              className={`status-toggle ${statusClass(order.boarding)}`}
                              onClick={() =>
                                updateOrder(order.id, (current) => {
                                  const states: BookingStatus[] = ["WAITING", "BOARDED", "NO_SHOW"];
                                  const index = states.indexOf(current.boarding);
                                  return {
                                    ...current,
                                    boarding: states[(index + 1) % states.length]
                                  };
                                })
                              }
                              type="button"
                            >
                              {formatStatus(order.boarding)}
                            </button>
                          </td>
                          <td>
                            <button
                              className="danger-button"
                              onClick={() =>
                                updateOrder(order.id, (current) => {
                                  const currentIndex = initialData.timeSlots.indexOf(current.time);
                                  if (currentIndex >= initialData.timeSlots.length - 1) {
                                    return current;
                                  }
                                  return {
                                    ...current,
                                    time: initialData.timeSlots[currentIndex + 1],
                                    boarding: "WAITING",
                                    driver: "",
                                    adminNote: "No Show รอบก่อน"
                                  };
                                })
                              }
                              type="button"
                            >
                              ย้ายรอบรับใหม่
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {transportView === "sheet" ? (
              <>
                <div className="selector-grid">
                  {driverNames.map((driver) => {
                    const activeSlots = initialData.timeSlots.filter((slot) =>
                      orders.some(
                        (order) => order.date === transportDate && order.driver === driver && order.time === slot
                      )
                    );

                    return (
                      <div className="driver-card" key={driver}>
                        <div className="driver-name">{driver}</div>
                        <div className="slot-button-wrap">
                          {activeSlots.length === 0 ? (
                            <span className="subtle-line">No assignments</span>
                          ) : (
                            activeSlots.map((slot) => (
                              <button
                                className="slot-button"
                                key={`${driver}-${slot}`}
                                onClick={() => {
                                  setSelectedDriver(driver);
                                  setSelectedSheetSlot(slot);
                                }}
                                type="button"
                              >
                                รอบ {slot}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedDriver && selectedSheetSlot ? (
                  <div className="job-sheet job-sheet-print-target">
                    <div className="job-sheet-header">
                      <div>
                        <h3>SKYLINE JOB ORDER</h3>
                        <p>DRIVER: {selectedDriver} | SHIFT: <span>{selectedSheetSlot}</span></p>
                      </div>
                      <div className="job-sheet-meta">
                        <p>DATE: {transportDate}</p>
                        <button className="black-button no-print" type="button" onClick={printJobSheetOnly}>Print A4</button>
                      </div>
                    </div>
                    <div className="table-wrap job-sheet-table">
                      <table className="ops-table compact print-table">
                        <thead>
                          <tr>
                            <th>Packet</th>
                            <th>Agent</th>
                            <th>Booking</th>
                            <th>Hotel (Room)</th>
                            <th className="center">Pax</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Balance</th>
                            <th>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDriverOrders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.packet}</td>
                              <td>{order.agent}</td>
                              <td className="mono">{order.booking}</td>
                              <td><strong>{order.hotel}</strong> (Rm:{order.room})</td>
                              <td className="center"><strong>{order.join + order.visitor}</strong></td>
                              <td>{order.name}</td>
                              <td>{order.phone}</td>
                              <td />
                              <td />
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </>
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
              <>
                <div className="toolbar warning">
                  <DatePicker
                    value={staffDate}
                    onChange={(v) => setStaffDate(v)}
                    style={{fontSize:"13px"}}
                  />
                  <select onChange={(event) => setStaffTime(event.target.value)} value={staffTime}>
                    <option value="ALL">ทุกรอบ</option>
                    {initialData.timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  <select onChange={(event) => setStaffPacket(event.target.value)} value={staffPacket}>
                    <option value="ALL">ทุก Packet</option>
                    {packetsInDay.map((packet) => (
                      <option key={packet} value={packet}>
                        {packet}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="table-wrap">
                  <table className="ops-table compact">
                    <thead className="thead-orange">
                      <tr>
                        <th>รอบ</th>
                        <th>Packet / Booking</th>
                        <th>ลูกค้า</th>
                        <th className="center">Join (คนเล่น)</th>
                        <th>เลือกไกด์ (&gt;= 2 คน)</th>
                        <th className="center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffingOrders.map((order) => (
                        <tr className={order.boarding === "NO_SHOW" ? "faded-row" : ""} key={order.id}>
                          <td className="slot warning-text">{order.time}</td>
                          <td>
                            <strong>{order.packet}</strong>
                            <span className="subtle-line">{order.booking}</span>
                          </td>
                          <td className="strong">{order.name}</td>
                          <td className="center strong-green">{order.join}</td>
                          <td>
                            <div className="checkbox-grid">
                              {staffMembers.map((staff) => {
                                const checked = order.assignedStaff.includes(staff.name);
                                return (
                                  <label className="check-pill" key={`${order.id}-${staff.id}`}>
                                    <input
                                      checked={checked}
                                      disabled={order.boarding === "NO_SHOW"}
                                      onChange={() =>
                                        updateOrder(order.id, (current) => ({
                                          ...current,
                                          assignedStaff: checked
                                            ? current.assignedStaff.filter((name) => name !== staff.name)
                                            : [...current.assignedStaff, staff.name]
                                        }))
                                      }
                                      type="checkbox"
                                    />
                                    <span>{staff.name.split(" ")[0]}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td className="center">
                            <span
                              className={
                                order.assignedStaff.length >= 2
                                  ? "assignment-badge ready"
                                  : "assignment-badge pending"
                              }
                            >
                              {order.assignedStaff.length >= 2
                                ? "READY"
                                : order.assignedStaff.length === 1
                                  ? "NEED +1"
                                  : "NEED 2 STAFF"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {staffingView === "board" ? (
              <>
                <div className="board-header-shell">
                  <h3>SKYLINE STAFF WHITEBOARD</h3>
                  <DatePicker
                    value={boardDate}
                    onChange={(v) => setBoardDate(v)}
                    style={{fontSize:"13px"}}
                  />
                </div>
                <div className="staff-board-grid">
                  {initialData.timeSlots.map((slot) => {
                    const slotOrders = boardOrders.filter((order) => order.time === slot);
                    return (
                      <div className="board-column" key={slot}>
                        <div className="board-column-header">{slot}</div>
                        <div className="board-column-body">
                          {slotOrders.map((order) => (
                            <div
                              className={
                                order.boarding === "NO_SHOW"
                                  ? "board-card no-show"
                                  : order.assignedStaff.length < 2
                                    ? "board-card warning"
                                    : "board-card"
                              }
                              key={order.id}
                            >
                              <div className="board-card-top">
                                <span>{order.name.split(" ").slice(-1)[0]}</span>
                                <span>{order.join} J</span>
                              </div>
                              {order.boarding === "NO_SHOW" ? (
                                <div className="board-alert">--- NO SHOW ---</div>
                              ) : (
                                <div className="board-staff-line">
                                  {order.assignedStaff.join(" / ") || "-- รอจัด --"}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="board-footer">
                          Total Join:{" "}
                          {slotOrders
                            .filter((order) => order.boarding !== "NO_SHOW")
                            .reduce((sum, order) => sum + order.join, 0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
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
        <section className="view-section">
          <div className="glass-card">
            <div className="section-header">
              <div>
                <h2>{t("personnel.title")}</h2>
                <p>{employees.length} คน ({employees.filter(e=>e.role==="Staff").length} ไกด์สนาม / {employees.filter(e=>e.role==="Driver").length} คนขับรถ)</p>
              </div>
              <button className="indigo-button" onClick={() => setShowEmployeeModal(true)} type="button">
                {t("personnel.newEmployee")}
              </button>
            </div>

            <div className="personnel-section">
              <div className="personnel-section-header">
                <span className="personnel-section-icon">🧑‍💼</span>
                <h3>ไกด์สนาม (Staff)</h3>
                <span className="personnel-count">{employees.filter(e=>e.role==="Staff").length}</span>
              </div>
              <div className="personnel-card-grid">
                {employees.filter(e=>e.role==="Staff").map(emp => (
                  <div key={emp.id} className="personnel-card">
                    <div className="personnel-card-main" onClick={() => setExpandedEmployeeId(expandedEmployeeId === emp.id ? null : emp.id)}>
                      <div className="personnel-avatar-wrap">
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} className="personnel-avatar" />
                        ) : (
                          <div className="personnel-avatar-placeholder">
                            {emp.name.charAt(0)}
                          </div>
                        )}
                        <span className="personnel-role-dot staff-dot" />
                      </div>
                      <div className="personnel-info">
                        <div className="personnel-name">{emp.name} <span className="personnel-nickname">({emp.nickname})</span></div>
                        <div className="personnel-id-code">{emp.id}</div>
                        <div className="personnel-quick-contact">
                          {emp.phone && <span>📞 {emp.phone}</span>}
                        </div>
                      </div>
                      <div className="personnel-expand-hint">{expandedEmployeeId === emp.id ? "−" : "+"}</div>
                    </div>
                    {expandedEmployeeId === emp.id && (
                      <div className="personnel-detail-panel">
                        <div className="personnel-detail-grid">
                          <div className="pd-item"><span className="pd-label">ชื่อเล่น</span><strong>{emp.nickname}</strong></div>
                          <div className="pd-item"><span className="pd-label">เบอร์หลัก</span><strong>{emp.phone || "-"}</strong></div>
                          <div className="pd-item"><span className="pd-label">เบอร์สำรอง</span><strong>{emp.phone2 || "-"}</strong></div>
                          <div className="pd-item"><span className="pd-label">วันเข้าทำงาน</span><strong>{emp.startDate || "-"}</strong></div>
                        </div>
                        <button
                          className="indigo-button"
                          style={{marginTop:"12px", width:"100%"}}
                          type="button"
                          onClick={() => openEditEmployeeModal(emp)}
                        >
                          แก้ไขข้อมูล
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="personnel-section" style={{marginTop:"24px"}}>
              <div className="personnel-section-header">
                <span className="personnel-section-icon">🚌</span>
                <h3>คนขับรถ (Driver)</h3>
                <span className="personnel-count">{employees.filter(e=>e.role==="Driver").length}</span>
              </div>
              <div className="personnel-card-grid">
                {employees.filter(e=>e.role==="Driver").map(emp => (
                  <div key={emp.id} className="personnel-card">
                    <div className="personnel-card-main" onClick={() => setExpandedEmployeeId(expandedEmployeeId === emp.id ? null : emp.id)}>
                      <div className="personnel-avatar-wrap">
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} className="personnel-avatar" />
                        ) : (
                          <div className="personnel-avatar-placeholder driver-color">
                            {emp.name.charAt(0)}
                          </div>
                        )}
                        <span className="personnel-role-dot driver-dot" />
                      </div>
                      <div className="personnel-info">
                        <div className="personnel-name">{emp.name} <span className="personnel-nickname">({emp.nickname})</span></div>
                        <div className="personnel-id-code">{emp.id}</div>
                        <div className="personnel-quick-contact">
                          {emp.phone && <span>📞 {emp.phone}</span>}
                        </div>
                      </div>
                      <div className="personnel-expand-hint">{expandedEmployeeId === emp.id ? "−" : "+"}</div>
                    </div>
                    {expandedEmployeeId === emp.id && (
                      <div className="personnel-detail-panel">
                        <div className="personnel-detail-grid">
                          <div className="pd-item"><span className="pd-label">ชื่อเล่น</span><strong>{emp.nickname}</strong></div>
                          <div className="pd-item"><span className="pd-label">เบอร์หลัก</span><strong>{emp.phone || "-"}</strong></div>
                          <div className="pd-item"><span className="pd-label">เบอร์สำรอง</span><strong>{emp.phone2 || "-"}</strong></div>
                          <div className="pd-item"><span className="pd-label">วันเข้าทำงาน</span><strong>{emp.startDate || "-"}</strong></div>
                        </div>
                        <button
                          className="indigo-button"
                          style={{marginTop:"12px", width:"100%"}}
                          type="button"
                          onClick={() => openEditEmployeeModal(emp)}
                        >
                          แก้ไขข้อมูล
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {mainView === "master" ? (
        <section className="view-section">
          <div className="glass-card">
            <div className="subnav">
              {[
                ["summary", "1. ข้อมูลทั้งหมด (Log)"],
                ["pivot", "2. วิเคราะห์ข้อมูล (Pivot)"],
                ["products", "3. ตั้งค่าแพ็กเกจ (Product DB)"]
              ].map(([key, label]) => (
                <button
                  className={masterView === key ? "subnav-button active" : "subnav-button"}
                  key={key}
                  onClick={() => setMasterView(key as MasterView)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {masterView === "summary" ? (
              <>
                <div className="section-header">
                  <div>
                    <h2>Operational Log</h2>
                  </div>
                  <button className="black-button" onClick={() => showToast("กำลังเตรียมไฟล์ Full_Master... สำเร็จ!", "slate")} type="button">
                    Export All
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="ops-table compact">
                    <thead className="thead-black">
                      <tr>
                        <th>ID / Booking</th>
                        <th>วันที่ / รอบ</th>
                        <th>Packet / Agent</th>
                        <th>โรงแรม</th>
                        <th className="center">Pax</th>
                        <th className="center">Join</th>
                        <th>คนขับ</th>
                        <th className="center">Status</th>
                        <th>สตาฟ</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 100).map((order) => (
                        <tr key={order.id}>
                          <td className="mono">
                            <strong>{order.id}</strong>
                            <span className="subtle-line">{order.booking}</span>
                          </td>
                          <td>
                            <strong>{order.date}</strong>
                            <span className="subtle-line">{order.time}</span>
                          </td>
                          <td>
                            <strong>{order.packet}</strong>
                            <span className="subtle-line">{order.agent}</span>
                          </td>
                          <td>{order.hotel}</td>
                          <td className="center strong-blue">{order.join + order.visitor}</td>
                          <td className="center strong-green">{order.join}</td>
                          <td>{order.driver || "-"}</td>
                          <td className="center">
                            <span className={`status-badge ${statusClass(order.boarding)}`}>
                              {formatStatus(order.boarding)}
                            </span>
                          </td>
                          <td>{order.assignedStaff.join(", ") || "-"}</td>
                          <td className="note-cell">{order.adminNote || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {masterView === "pivot" ? (
              <>
                <div className="toolbar muted">
                  <label>
                    <span>Group By</span>
                    <select
                      onChange={(event) => setPivotGroupBy(event.target.value as "agent" | "packet")}
                      value={pivotGroupBy}
                    >
                      <option value="agent">Agency (เอเจ้น)</option>
                      <option value="packet">Packet (แพ็กเกจ)</option>
                    </select>
                  </label>
                </div>
                <div className="table-wrap">
                  <table className="ops-table compact">
                    <thead className="thead-navy">
                      <tr>
                        <th>{pivotGroupBy === "agent" ? "AGENT" : "PACKET"}</th>
                        <th className="center">Bookings</th>
                        <th className="center">Total Pax</th>
                        <th className="center">Total Join</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(pivotMap).map(([key, value]) => (
                        <tr key={key}>
                          <td className="strong">{key}</td>
                          <td className="center">{value.bookings}</td>
                          <td className="center strong-blue">{value.pax}</td>
                          <td className="center strong-green">{value.join}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {masterView === "products" ? (
              <>
                <div className="section-header">
                  <div>
                    <h2>ฐานข้อมูลแพ็กเกจ</h2>
                  </div>
                  <button className="primary-button" onClick={() => showToast("เพิ่มแพ็กเกจใหม่ (coming soon)", "emerald")} type="button">
                    + เพิ่มแพ็กเกจ
                  </button>
                </div>
                <div className="packet-grid">
                  {productPackets.map((packet: ProductPacket) => (
                    <div className="packet-card" key={packet.name}>
                      <strong>{packet.name}</strong>
                      <p>{packet.detail}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
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
                  {productPackets.map((packet) => (
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

