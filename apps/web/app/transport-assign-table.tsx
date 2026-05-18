"use client";

import type { EmployeeRecord, OrderRecord, VehicleRecord } from "../lib/ops-data";
import { DatePicker } from "./date-picker";

type Props = {
  orders: OrderRecord[];
  drivers: EmployeeRecord[];
  vehicles: VehicleRecord[];
  transportDate: string;
  onSetTransportDate: (value: string) => void;
  assignSortField: string;
  assignSortDir: "asc" | "desc";
  onToggleAssignSort: (field: "time" | "hotel" | "pax") => void;
  savingOrderId: number | null;
  onChangeLocalAdminNote: (orderId: number, value: string) => void;
  onSaveTransport: (order: OrderRecord, patch: { driverCode?: string; vehicleCode?: string; adminNote?: string }) => void;
};

export function TransportAssignTable({
  orders,
  drivers,
  vehicles,
  transportDate,
  onSetTransportDate,
  assignSortField,
  assignSortDir,
  onToggleAssignSort,
  savingOrderId,
  onChangeLocalAdminNote,
  onSaveTransport
}: Props) {
  function sortIcon(field: "time" | "hotel" | "pax") {
    if (assignSortField !== field) return null;
    return assignSortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <>
      <div className="toolbar muted">
        <label>
          <span>วันที่</span>
          <DatePicker value={transportDate} onChange={onSetTransportDate} style={{ fontSize: "13px", minWidth: "130px" }} />
        </label>
      </div>

      <div className="table-wrap">
        <table className="ops-table compact">
          <thead className="thead-indigo">
            <tr>
              <th className={`sortable${assignSortField === "time" ? " sort-active" : ""}`} onClick={() => onToggleAssignSort("time")}>
                รอบ{sortIcon("time")}
              </th>
              <th className={`sortable${assignSortField === "hotel" ? " sort-active" : ""}`} onClick={() => onToggleAssignSort("hotel")}>
                โรงแรม{sortIcon("hotel")}
              </th>
              <th className={`center sortable${assignSortField === "pax" ? " sort-active" : ""}`} onClick={() => onToggleAssignSort("pax")}>
                Pax{sortIcon("pax")}
              </th>
              <th>ลูกค้า</th>
              <th>คนขับ</th>
              <th>รถ</th>
              <th>Admin Note</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const disabled = savingOrderId === order.id;
              return (
                <tr key={order.id}>
                  <td className="slot">{order.time}</td>
                  <td>{order.hotel}</td>
                  <td className="center strong-blue">{order.join + order.visitor}</td>
                  <td>
                    {order.name}
                    {order.adminNote ? <span className="subtle-line">Note: {order.adminNote}</span> : null}
                  </td>
                  <td>
                    <select
                      disabled={disabled}
                      value={order.driverCode}
                      onChange={(event) =>
                        onSaveTransport(order, {
                          driverCode: event.target.value,
                          vehicleCode: event.target.value ? order.vehicleCode : "",
                          adminNote: order.adminNote
                        })
                      }
                    >
                      <option value="">ยังไม่จัด</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      disabled={disabled || !order.driverCode}
                      value={order.vehicleCode}
                      onChange={(event) =>
                        onSaveTransport(order, {
                          driverCode: order.driverCode,
                          vehicleCode: event.target.value,
                          adminNote: order.adminNote
                        })
                      }
                    >
                      <option value="">ยังไม่จัด</option>
                      {vehicles
                        .filter((vehicle) => vehicle.active)
                        .map((vehicle) => (
                          <option key={vehicle.code} value={vehicle.code}>
                            {vehicle.code}
                            {vehicle.type ? ` · ${vehicle.type}` : ""}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="table-input"
                      disabled={disabled}
                      placeholder="Note"
                      value={order.adminNote ?? ""}
                      onBlur={(event) =>
                        onSaveTransport(order, {
                          driverCode: order.driverCode,
                          vehicleCode: order.vehicleCode,
                          adminNote: event.target.value
                        })
                      }
                      onChange={(event) => onChangeLocalAdminNote(order.id, event.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
