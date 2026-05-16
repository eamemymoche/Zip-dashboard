import React from "react";
import { DatePicker } from "./date-picker";
import type { DashboardSeed, OrderRecord } from "../lib/ops-data";

type Props = {
  boardDate: string;
  boardOrders: OrderRecord[];
  initialData: Pick<DashboardSeed, "timeSlots">;
  onBoardDateChange: (value: string) => void;
};

export default function StaffingBoardView({
  boardDate,
  boardOrders,
  initialData,
  onBoardDateChange
}: Props) {
  return (
    <>
      <div className="board-header-shell">
        <h3>SKYLINE STAFF WHITEBOARD</h3>
        <DatePicker
          value={boardDate}
          onChange={onBoardDateChange}
          style={{ fontSize: "13px" }}
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
  );
}
