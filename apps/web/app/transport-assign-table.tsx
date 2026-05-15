"use client";

import type { EmployeeRecord, OrderRecord, VehicleRecord } from "../lib/ops-data";

type Props = {
  orders: OrderRecord[];
  drivers: EmployeeRecord[];
  vehicles: VehicleRecord[];
  savingOrderId: number | null;
  onChangeLocalAdminNote: (orderId: number, value: string) => void;
  onSaveTransport: (order: OrderRecord, patch: { driverCode?: string; vehicleCode?: string; adminNote?: string }) => void;
};

export function TransportAssignTable({
  orders,
  drivers,
  vehicles,
  savingOrderId,
  onChangeLocalAdminNote,
  onSaveTransport
}: Props) {
  return (
    <div className="table-wrap">
      <table className="ops-table compact">
        <thead className="thead-indigo">
          <tr>
            <th>รอบ</th>
            <th>โรงแรม</th>
            <th className="center">Pax</th>
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
  );
}
