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

export function TransportSheetView({
  driverNames,
  drivers,
  orders,
  transportDate,
  selectedDriver,
  onSelectDriverAndSlot,
  onPrint,
  onSetTransportDate,
  issuedBy
}: Props) {
  const allOrdersForDate = orders.filter((order) => order.date === transportDate);
  const selectedDriverOrders = allOrdersForDate
    .filter((order) => order.driver === selectedDriver)
    .sort((left, right) => left.time.localeCompare(right.time) || left.hotel.localeCompare(right.hotel));
  const driverMeta = getDriverMeta(drivers, selectedDriver);
  const totalPax = selectedDriverOrders.reduce((sum, order) => sum + order.join + order.visitor, 0);
  const printedAt = formatPrintedAt(new Date());
  const pickupWindow = buildPickupWindow(selectedDriverOrders);
  const jobNumber = buildJobNumber(allOrdersForDate, selectedDriver, transportDate);
  const vehicleText = [...new Set(selectedDriverOrders.map((order) => order.vehicle).filter(Boolean))].join(", ") || "-";
  const driverLine = `ชื่อ(Driver) : Skyline นาย${driverMeta?.name ?? selectedDriver}${driverMeta?.nickname ? ` (${driverMeta.nickname})` : ""}${driverMeta?.phone ? ` ${driverMeta.phone}` : ""}${vehicleText !== "-" ? ` | รถ ${vehicleText}` : ""}`;
  const officeNotice = "ให้พนักงานขับรถเก็บข้อมูลบิลลูกค้าก่อนขึ้นรถทุกครั้ง และถ้ามีส่วนต่างให้เก็บส่วนต่างด้วย เบอร์ออฟฟิศ : 098-748-3779";

  function exportXls() {
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
              <button className="slot-button" type="button" onClick={() => onSelectDriverAndSlot(driver, "ALL")} style={{ marginTop: 8 }}>
                เปิดใบงาน
              </button>
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
            <img alt="Job order logo" className="job-sheet-logo" src="/job-order-logo.jpeg" />
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
            <button className="danger-button" onClick={onPrint} type="button">Export PDF</button>
            <button className="primary-button" onClick={exportXls} type="button">Export XLS</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
