import React from "react";
import { DatePicker } from "./date-picker";
import type { OrderRecord, EmployeeRecord } from "../lib/ops-data";

type Props = {
  staffDate: string;
  staffTime: string;
  staffPacket: string;
  staffingOrders: OrderRecord[];
  staffMembers: EmployeeRecord[];
  initialData: { timeSlots: string[] };
  onStaffDateChange: (v: string) => void;
  onStaffTimeChange: (v: string) => void;
  onStaffPacketChange: (v: string) => void;
  updateOrder: (id: number, updater: (order: OrderRecord) => OrderRecord) => void;
  saveStaffAssignment: (orderId: number, assignedStaff: string[]) => void;
};

export default function StaffingSetupTable({
  staffDate,
  staffTime,
  staffPacket,
  staffingOrders,
  staffMembers,
  initialData,
  onStaffDateChange,
  onStaffTimeChange,
  onStaffPacketChange,
  updateOrder,
  saveStaffAssignment
}: Props) {
  const packetsInDay = [...new Set(staffingOrders.map((order) => order.packet))];

  return (
    <>
      <div className="toolbar warning">
        <DatePicker
          value={staffDate}
          onChange={onStaffDateChange}
          style={{ fontSize: "13px" }}
        />
        <select onChange={(e) => onStaffTimeChange(e.target.value)} value={staffTime}>
          <option value="ALL">ทุกรอบ</option>
          {initialData.timeSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
        <select onChange={(e) => onStaffPacketChange(e.target.value)} value={staffPacket}>
          <option value="ALL">ทุก Package</option>
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
                            onChange={() => {
                              const next = checked
                                ? order.assignedStaff.filter((name) => name !== staff.name)
                                : [...order.assignedStaff, staff.name];
                              updateOrder(order.id, (o) => ({ ...o, assignedStaff: next }));
                              saveStaffAssignment(order.id, next);
                            }}
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
  );
}