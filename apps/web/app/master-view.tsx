"use client";

import type { OrderRecord, ProductPacket } from "../lib/ops-data";

type MasterViewKey = "summary" | "pivot" | "products";
type PivotGroupBy = "agent" | "packet";
type PivotRow = {
  bookings: number;
  pax: number;
  join: number;
};

type MasterViewProps = {
  masterView: MasterViewKey;
  pivotGroupBy: PivotGroupBy;
  pivotMap: Record<string, PivotRow>;
  orders: OrderRecord[];
  productPackets: ProductPacket[];
  onMasterViewChange: (view: MasterViewKey) => void;
  onPivotGroupByChange: (value: PivotGroupBy) => void;
  onExportAll: () => void;
  onAddPacket: () => void;
  onEditPacket: (packet: ProductPacket) => void;
  onTogglePacketActive: (packet: ProductPacket) => void;
  formatStatus: (status: string) => string;
  statusClass: (status: string) => string;
  lang?: "th" | "en";
};

export default function MasterView({
  masterView,
  pivotGroupBy,
  pivotMap,
  orders,
  productPackets,
  onMasterViewChange,
  onPivotGroupByChange,
  onExportAll,
  onAddPacket,
  onEditPacket,
  onTogglePacketActive,
  formatStatus,
  statusClass,
  lang = "th"
}: MasterViewProps) {
  const isEn = lang === "en";
  return (
    <section className="view-section">
      <div className="glass-card">
        <div className="subnav">
          {(isEn ? [
            ["summary", "1. All Data (Log)"],
            ["pivot", "2. Data Analysis (Pivot)"],
            ["products", "3. Package Setup (Product DB)"]
          ] : [
            ["summary", "1. ข้อมูลทั้งหมด (Log)"],
            ["pivot", "2. วิเคราะห์ข้อมูล (Pivot)"],
            ["products", "3. ตั้งค่าแพ็กเกจ (Product DB)"]
          ]).map(([key, label]) => (
            <button
              className={masterView === key ? "subnav-button active" : "subnav-button"}
              key={key}
              onClick={() => onMasterViewChange(key as MasterViewKey)}
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
              <button className="black-button" onClick={onExportAll} type="button">
                Export All
              </button>
            </div>
            <div className="table-wrap">
              <table className="ops-table compact">
                <thead className="thead-black">
                  <tr>
                    <th>ID / Booking</th>
                    <th>{isEn ? "Date / Slot" : "วันที่ / รอบ"}</th>
                    <th>Packet / Agent</th>
                    <th>{isEn ? "Hotel" : "โรงแรม"}</th>
                    <th className="center">Pax</th>
                    <th className="center">Join</th>
                    <th>{isEn ? "Driver" : "คนขับ"}</th>
                    <th className="center">Status</th>
                    <th>{isEn ? "Staff" : "สตาฟ"}</th>
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
                  onChange={(event) => onPivotGroupByChange(event.target.value as PivotGroupBy)}
                  value={pivotGroupBy}
                >
                  <option value="agent">{isEn ? "Agency" : "Agency (เอเจ้น)"}</option>
                  <option value="packet">{isEn ? "Packet" : "Packet (แพ็กเกจ)"}</option>
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
                <h2>{isEn ? "Package Database" : "ฐานข้อมูลแพ็กเกจ"}</h2>
              </div>
              <button className="primary-button" onClick={onAddPacket} type="button">
                {isEn ? "+ Add Package" : "+ เพิ่มแพ็กเกจ"}
              </button>
            </div>
            <div className="packet-grid">
              {productPackets.map((packet) => (
                <div className="packet-card" key={packet.name}>
                  <strong>
                    {packet.name} {!packet.active ? "(inactive)" : ""}
                  </strong>
                  <p>{packet.detail}</p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button className="black-button" onClick={() => onEditPacket(packet)} type="button">
                      Edit
                    </button>
                    <button className={packet.active ? "indigo-button" : "primary-button"} onClick={() => onTogglePacketActive(packet)} type="button">
                      {packet.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
