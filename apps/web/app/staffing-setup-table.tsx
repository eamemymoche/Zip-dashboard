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
  lang?: "th" | "en";
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
  saveStaffAssignment,
  lang = "th"
}: Props) {
  const isEn = lang === "en";
  const packetsInDay = [...new Set(staffingOrders.map((order) => order.packet))];
  const [guideSlotCounts, setGuideSlotCounts] = React.useState<Record<number, number>>({});

  function getSlotCount(order: OrderRecord) {
    return Math.max(2, guideSlotCounts[order.id] ?? order.assignedStaff.length);
  }

  function visibleGuides(order: OrderRecord) {
    return Array.from({ length: getSlotCount(order) }, (_, index) => order.assignedStaff[index] ?? "");
  }

  function updateSlot(order: OrderRecord, slotIndex: number, staffName: string) {
    const next = [...order.assignedStaff];
    if (staffName) {
      next[slotIndex] = staffName;
    } else {
      next.splice(slotIndex, 1);
    }
    const compacted = next.filter(Boolean);
    updateOrder(order.id, (o) => ({ ...o, assignedStaff: compacted }));
    saveStaffAssignment(order.id, compacted);
  }

  function addGuideSlot(order: OrderRecord) {
    setGuideSlotCounts((current) => ({ ...current, [order.id]: getSlotCount(order) + 1 }));
  }

  function removeGuideSlot(order: OrderRecord, slotIndex: number) {
    const nextVisible = visibleGuides(order).filter((_, index) => index !== slotIndex);
    const nextCount = Math.max(2, nextVisible.length);
    const next = nextVisible.filter(Boolean);
    setGuideSlotCounts((current) => ({ ...current, [order.id]: nextCount }));
    updateOrder(order.id, (o) => ({ ...o, assignedStaff: next }));
    saveStaffAssignment(order.id, next);
  }

  return (
    <>
      <div className="toolbar warning staff-assign-toolbar">
        <DatePicker
          value={staffDate}
          onChange={onStaffDateChange}
          style={{ fontSize: "13px" }}
        />
        <select onChange={(e) => onStaffTimeChange(e.target.value)} value={staffTime}>
          <option value="ALL">{isEn ? "All slots" : "ทุกรอบ"}</option>
          {initialData.timeSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
        <select onChange={(e) => onStaffPacketChange(e.target.value)} value={staffPacket}>
          <option value="ALL">{isEn ? "All packages" : "ทุก Package"}</option>
          {packetsInDay.map((packet) => (
            <option key={packet} value={packet}>
              {packet}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap staff-assign-table-wrap">
        <table className="ops-table compact">
          <thead className="thead-orange">
            <tr>
              <th>{isEn ? "Slot" : "รอบ"}</th>
              <th>Packet / Booking</th>
              <th>{isEn ? "Customer" : "ลูกค้า"}</th>
              <th className="center">{isEn ? "Join" : "Join (คนเล่น)"}</th>
              <th>{isEn ? "Assign Guides" : "เลือกไกด์ (Assign)"}</th>
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
                  <div className="guide-table-card">
                    <table className="guide-inline-table">
                      <tbody>
                        {visibleGuides(order).map((value, index) => (
                          <tr key={`${order.id}-guide-${index}`}>
                            <td className="guide-inline-label">{isEn ? `Guide ${index + 1}` : `ไกด์ ${index + 1}`}</td>
                            <td>
                              <select disabled={order.boarding === "NO_SHOW"} value={value} onChange={(event) => updateSlot(order, index, event.target.value)}>
                                <option value="">{isEn ? "Select staff" : "เลือกพนักงาน"}</option>
                                {staffMembers.map((staff) => (
                                  <option key={staff.id} value={staff.name}>{staff.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="guide-inline-action">
                              {index >= 2 ? (
                                <button className="guide-remove-button" disabled={order.boarding === "NO_SHOW"} type="button" onClick={() => removeGuideSlot(order, index)} aria-label="Remove guide">×</button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3}>
                            <button className="guide-add-button" disabled={order.boarding === "NO_SHOW"} type="button" onClick={() => addGuideSlot(order)}>
                              <span>+</span>
                              <small>{isEn ? "Add guide" : "เพิ่มไกด์"}</small>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
