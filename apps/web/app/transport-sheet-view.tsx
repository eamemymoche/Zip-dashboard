"use client";

import * as XLSX from "xlsx";
import { DatePicker } from "./date-picker";
import { buildJobNumber, buildPickupWindow, formatJobOrderDate, formatPrintedAt, getDriverMeta } from "../lib/job-order";
import type { EmployeeRecord, OrderRecord } from "../lib/ops-data";

type Props = {
  driverNames: string[];
  drivers: EmployeeRecord[];
  orders: OrderRecord[];
  transportDate: string;
  timeSlots: string[];
  selectedDriver: string;
  selectedSheetSlot: string;
  onSelectDriverAndSlot: (driver: string, slot: string) => void;
  onPrint: () => void;
  onSetTransportDate: (value: string) => void;
  issuedBy: string;
};

function JobOrderLogo() {
  return (
    <svg aria-hidden="true" className="job-sheet-logo" viewBox="0 0 140 88">
      <defs>
        <linearGradient id="jobLogoBg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="8" y="10" width="124" height="68" rx="18" fill="url(#jobLogoBg)" />
      <path d="M35 50c8-14 18-21 29-21 9 0 17 3 24 10l13-13 9 9-12 12c5 6 8 13 8 20H96c0-6-2-11-6-15-4-4-9-6-15-6-8 0-15 4-22 13l-18-9Z" fill="#f8fafc" />
      <path d="M33 31h24" stroke="#34d399" strokeLinecap="round" strokeWidth="5" />
      <path d="M30 62h44" stroke="#f59e0b" strokeLinecap="round" strokeWidth="5" />
      <circle cx="98" cy="58" r="9" fill="#f59e0b" />
      <circle cx="98" cy="58" r="4" fill="#0f172a" />
    </svg>
  );
}

export function TransportSheetView({
  driverNames,
  drivers,
  orders,
  transportDate,
  selectedDriver,
  selectedSheetSlot,
  onSelectDriverAndSlot,
  onPrint,
  onSetTransportDate,
  issuedBy
}: Props) {
  const allOrdersForDate = orders.filter((order) => order.date === transportDate);
  const selectedDriverOrders = allOrdersForDate
    .filter((order) => order.driver === selectedDriver && (selectedSheetSlot === "ALL" || order.time === selectedSheetSlot))
    .sort((left, right) => left.time.localeCompare(right.time) || left.hotel.localeCompare(right.hotel));

  const driverMeta = getDriverMeta(drivers, selectedDriver);
  const totalPax = selectedDriverOrders.reduce((sum, order) => sum + order.join + order.visitor, 0);
  const printedAt = formatPrintedAt(new Date());
  const pickupWindow = buildPickupWindow(selectedDriverOrders);
  const jobNumber = buildJobNumber(allOrdersForDate, selectedDriver, transportDate);
  const vehicleText = [...new Set(selectedDriverOrders.map((order) => order.vehicle).filter(Boolean))].join(", ") || "-";
  const driverLine = `ชื่อ(Driver) : Skyline นาย${driverMeta?.name ?? selectedDriver}${driverMeta?.nickname ? ` (${driverMeta.nickname})` : ""}${driverMeta?.phone ? ` ${driverMeta.phone}` : ""}${vehicleText !== "-" ? ` | รถ ${vehicleText}` : ""}`;
  const officeNotice = "ให้พนักงานขับรถเก็บข้อมูลบิลลูกค้าก่อนขึ้นรถทุกครั้ง และถ้ามีส่วนต่างให้เก็บส่วนต่างด้วย เบอร์ออฟฟิศ : 098-748-3779";

  function exportExcel() {
    const tableHeader = ["#", "Package", "Agent", "Invoice", "Hotel", "Room", "Pax", "Customer Name", "Customer Phone", "Balance", "Remark"];
    const rows = selectedDriverOrders.map((order, index) => [
      index + 1,
      order.packet,
      order.agent,
      order.booking,
      order.hotel,
      order.room || "-",
      order.join + order.visitor,
      order.name,
      order.phone,
      "",
      order.adminNote || ""
    ]);

    const sheetData = [
      [`เลขที่ ${jobNumber}`, "", "", "", "", "", "", "", `พิมพ์เมื่อ ${printedAt}`],
      [],
      ["JOB ORDER"],
      [driverLine],
      [`วันที่ : ${formatJobOrderDate(transportDate)}`, "", "", "", `เวลารับ : ${pickupWindow}`],
      [officeNotice],
      [],
      tableHeader,
      ...rows,
      [],
      [`ผู้ออก Job Order : ${issuedBy}`, "", "", "", "", "", "", "", `Pax Total : ${totalPax}`]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 18 },
      { wch: 20 },
      { wch: 28 },
      { wch: 10 },
      { wch: 8 },
      { wch: 24 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 }
    ];
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 0, c: 8 }, e: { r: 0, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 4, c: 10 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 10 } },
      { s: { r: rows.length + 9, c: 0 }, e: { r: rows.length + 9, c: 5 } },
      { s: { r: rows.length + 9, c: 8 }, e: { r: rows.length + 9, c: 10 } }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "JobOrder");
    XLSX.writeFile(workbook, `${jobNumber}.xlsx`);
  }

  return (
    <>
      <div className="toolbar muted">
        <label>
          <span>วันที่ใบงาน</span>
          <DatePicker value={transportDate} onChange={onSetTransportDate} style={{ fontSize: "13px", minWidth: "130px" }} />
        </label>
      </div>

      <div className="selector-grid">
        {driverNames.map((driver) => {
          const driverOrders = allOrdersForDate.filter((order) => order.driver === driver);
          const driverPax = driverOrders.reduce((sum, order) => sum + order.join + order.visitor, 0);
          const rounds = [...new Set(driverOrders.map((order) => order.time))];
          const assignedVehicles = [...new Set(driverOrders.map((order) => order.vehicle).filter(Boolean))];
          return (
            <div className="driver-card" key={driver} style={{ border: selectedDriver === driver ? "2px solid #0f766e" : undefined }}>
              <div className="driver-name">{driver}</div>
              <div className="subtle-line">รอบ: {rounds.join(", ") || "-"}</div>
              <div className="subtle-line">รถ: {assignedVehicles.join(", ") || "-"}</div>
              <div className="subtle-line">งานรวม: {driverOrders.length} รายการ</div>
              <div className="subtle-line">Pax รวมทั้งวัน: {driverPax}</div>
              <div className="slot-button-wrap">
                <button className={`slot-button slot-button-wide${selectedDriver === driver && selectedSheetSlot === "ALL" ? " active" : ""}`} type="button" onClick={() => onSelectDriverAndSlot(driver, "ALL")}>
                  เปิดใบงานทั้งวัน
                </button>
                {rounds.map((round) => (
                  <button
                    key={`${driver}-${round}`}
                    className={`slot-button${selectedDriver === driver && selectedSheetSlot === round ? " active" : ""}`}
                    type="button"
                    onClick={() => onSelectDriverAndSlot(driver, round)}
                  >
                    {round}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDriver ? (
        <div className="job-sheet job-sheet-print-target">
          <div className="job-sheet-topline">
            <div className="job-sheet-jobno">เลขที่ {jobNumber}</div>
            <div className="job-sheet-printed">พิมพ์เมื่อ {printedAt}</div>
          </div>

          <div className="job-sheet-brand">
            <JobOrderLogo />
            <h3>JOB ORDER</h3>
          </div>

          <div className="job-sheet-driverblock">
            <div className="job-sheet-driverline job-sheet-driverline-main">{driverLine}</div>
            <div className="job-sheet-driverline">วันที่ : {formatJobOrderDate(transportDate)}</div>
            <div className="job-sheet-driverline">เวลารับ : {pickupWindow}</div>
          </div>

          <div className="job-sheet-notice">{officeNotice}</div>

          <div className="table-wrap job-sheet-table">
            <table className="ops-table compact print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Package</th>
                  <th>Agent</th>
                  <th>Invoice</th>
                  <th>Hotel</th>
                  <th>Room</th>
                  <th className="center">Pax</th>
                  <th>Customer Name</th>
                  <th>Customer Phone</th>
                  <th>Balance</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {selectedDriverOrders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.packet}</td>
                    <td>{order.agent}</td>
                    <td className="mono">{order.booking}</td>
                    <td>{order.hotel}</td>
                    <td>{order.room || "-"}</td>
                    <td className="center"><strong>{order.join + order.visitor}</strong></td>
                    <td>{order.name}</td>
                    <td>{order.phone}</td>
                    <td />
                    <td>{order.adminNote || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="job-sheet-footer">
            <div>ผู้ออก Job Order : {issuedBy}</div>
            <div>Pax Total : {totalPax}</div>
          </div>

          <div className="job-sheet-actions no-print">
            <button className="danger-button job-export-button" onClick={onPrint} type="button">Export PDF</button>
            <button className="primary-button job-export-button" onClick={exportExcel} type="button">Export Excel</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
