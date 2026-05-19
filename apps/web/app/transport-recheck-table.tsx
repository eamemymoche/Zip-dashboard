"use client";

import type { OrderRecord, BookingStatus } from "../lib/ops-data";
import { DatePicker } from "./date-picker";

type Props = {
  dayOrders: OrderRecord[];
  driversInDay: string[];
  recheckOrders: OrderRecord[];
  recheckSortField: string;
  recheckSortDir: "asc" | "desc";
  recheckStatusFilter: string;
  recheckDriverFilter: string;
  transportDate: string;
  drivers: { id: string; name: string }[];
  timeSlots: string[];
  onToggleRecheckSort: (field: string) => void;
  onRecheckSortIcon: (field: string) => string;
  onSetRecheckStatusFilter: (status: string) => void;
  onSetRecheckDriverFilter: (driver: string) => void;
  onSetTransportDate: (date: string) => void;
  onUpdateOrder: (id: number, updater: (order: OrderRecord) => OrderRecord) => void;
  onSavePickupStatus?: (bookingNumber: string, status: string, note?: string, order?: OrderRecord) => Promise<void>;
  lang?: "th" | "en";
};

function statusClass(status: string) {
  if (status === "BOARDED") return "status-boarded";
  if (status === "NO_SHOW") return "status-noshow";
  if (status === "RESCHEDULED") return "status-rescheduled";
  if (status === "CANCELLED") return "status-cancelled";
  return "status-waiting";
}

function formatStatus(status: string) {
  return status.replace("_", " ");
}

export function TransportRecheckTable({
  dayOrders,
  driversInDay,
  recheckOrders,
  recheckSortField,
  recheckSortDir,
  recheckStatusFilter,
  recheckDriverFilter,
  transportDate,
  drivers,
  timeSlots,
  onToggleRecheckSort,
  onRecheckSortIcon,
  onSetRecheckStatusFilter,
  onSetRecheckDriverFilter,
  onSetTransportDate,
  onUpdateOrder,
  onSavePickupStatus,
  lang = "th"
}: Props) {
  const isEn = lang === "en";
  return (
    <>
      <div className="stats-grid">
          <div className="stats-card" onClick={() => onSetRecheckStatusFilter("ALL")} style={{cursor:"pointer"}}>
          <span>{isEn ? "All" : "ทั้งหมด"}</span>
          <strong>{dayOrders.length}</strong>
        </div>
          <div className="stats-card" onClick={() => onSetRecheckStatusFilter("WAITING")} style={{cursor:"pointer"}}>
          <span>Waiting</span>
          <strong>{dayOrders.filter((order) => order.boarding === "WAITING").length}</strong>
        </div>
          <div className="stats-card" onClick={() => onSetRecheckStatusFilter("BOARDED")} style={{cursor:"pointer"}}>
          <span>Boarded</span>
          <strong>{dayOrders.filter((order) => order.boarding === "BOARDED").length}</strong>
        </div>
          <div className="stats-card danger" onClick={() => onSetRecheckStatusFilter("NO_SHOW")} style={{cursor:"pointer"}}>
          <span>No Show</span>
          <strong>{dayOrders.filter((order) => order.boarding === "NO_SHOW").length}</strong>
        </div>
      </div>
      <div className="toolbar muted">
        <label>
          <span>{isEn ? "Date" : "วันที่"}</span>
          <DatePicker
            value={transportDate}
            onChange={(v) => onSetTransportDate(v)}
            style={{fontSize:"13px", minWidth:"130px"}}
          />
        </label>
        <label>
          <span>{isEn ? "Driver" : "คนขับ"}</span>
          <select
            onChange={(event) => onSetRecheckDriverFilter(event.target.value)}
            value={recheckDriverFilter}
          >
            <option value="ALL">{isEn ? "All" : "ทุกคน"}</option>
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
              <th className={`sortable${recheckSortField === "time" ? " sort-active" : ""}`} onClick={() => onToggleRecheckSort("time")}>{isEn ? "Slot / Driver" : "รอบ / คนขับ"}{onRecheckSortIcon("time")}</th>
              <th className={`sortable${recheckSortField === "hotel" ? " sort-active" : ""}`} onClick={() => onToggleRecheckSort("hotel")}>{isEn ? "Hotel" : "โรงแรม"}{onRecheckSortIcon("hotel")}</th>
              <th className="center">Pax</th>
              <th>{isEn ? "Customer" : "ลูกค้า"}</th>
              <th className={`center sortable${recheckSortField === "status" ? " sort-active" : ""}`} onClick={() => onToggleRecheckSort("status")}>{isEn ? "Status" : "สถานะ"}{onRecheckSortIcon("status")}</th>
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
                    onClick={() => {
                      const states: BookingStatus[] = ["WAITING", "BOARDED", "NO_SHOW"];
                      const index = states.indexOf(order.boarding);
                      const nextStatus = states[(index + 1) % states.length];
                      onUpdateOrder(order.id, (current) => ({
                        ...current,
                        boarding: nextStatus
                      }));
                      if (onSavePickupStatus) {
                        onSavePickupStatus(order.booking, nextStatus, undefined, order);
                      }
                    }}
                    type="button"
                  >
                    {formatStatus(order.boarding)}
                  </button>
                </td>
                <td>
                  <button
                    className="danger-button"
                    onClick={() => {
                      const currentIndex = timeSlots.indexOf(order.time);
                      if (currentIndex >= timeSlots.length - 1) return;
                      const nextTime = timeSlots[currentIndex + 1];
                      onUpdateOrder(order.id, (current) => ({
                        ...current,
                        time: nextTime,
                        boarding: "WAITING",
                        driver: "",
                        adminNote: "No Show รอบก่อน"
                      }));
                      if (onSavePickupStatus) {
                        onSavePickupStatus(order.booking, "WAITING", "ย้ายรอบรับใหม่", order);
                      }
                    }}
                    type="button"
                   >
                     {isEn ? "Move to next slot" : "ย้ายรอบรับใหม่"}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
