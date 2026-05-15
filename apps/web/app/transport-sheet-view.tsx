"use client";

import type { OrderRecord } from "../lib/ops-data";

type Props = {
  driverNames: string[];
  orders: OrderRecord[];
  transportDate: string;
  timeSlots: string[];
  selectedDriver: string;
  selectedSheetSlot: string;
  onSelectDriverAndSlot: (driver: string, slot: string) => void;
  onPrint: () => void;
};

export function TransportSheetView({
  driverNames,
  orders,
  transportDate,
  timeSlots,
  selectedDriver,
  selectedSheetSlot,
  onSelectDriverAndSlot,
  onPrint
}: Props) {
  const selectedDriverOrders = orders.filter(
    (order) =>
      order.date === transportDate &&
      order.driver === selectedDriver &&
      order.time === selectedSheetSlot
  );

  return (
    <>
      <div className="selector-grid">
        {driverNames.map((driver) => {
          const activeSlots = timeSlots.filter((slot) =>
            orders.some(
              (order) =>
                order.date === transportDate &&
                order.driver === driver &&
                order.time === slot
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
                      onClick={() => onSelectDriverAndSlot(driver, slot)}
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
              <button className="black-button no-print" type="button" onClick={onPrint}>Print A4</button>
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
  );
}