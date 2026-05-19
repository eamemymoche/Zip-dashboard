"use client";

import type { OrderRecord } from "../lib/ops-data";

type Props = {
  orders: OrderRecord[];
  focusDate: string;
  lang?: "th" | "en";
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function estimateRevenue(order: OrderRecord) {
  return (order.join + order.visitor) * 950;
}

function agentBadge(agent: string) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    Klook: { bg: "#fff4e5", color: "#e07b00", label: "KL" },
    "Trip.com": { bg: "#e8f5e9", color: "#2e7d32", label: "TC" },
    CTrip: { bg: "#fce4ec", color: "#c62828", label: "CT" },
    "TTD Global": { bg: "#e3f2fd", color: "#1565c0", label: "TD" },
    Direct: { bg: "#f3e5f5", color: "#6a1b9a", label: "DR" }
  };
  const style = styles[agent] ?? { bg: "#f1f5f9", color: "#475569", label: agent.slice(0, 2).toUpperCase() };
  return (
    <span className="accounting-agent-cell">
      <span className="agent-badge" style={{ background: style.bg, color: style.color }} title={agent}>
        {style.label}
      </span>
      <span>{agent}</span>
    </span>
  );
}

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

export default function AccountingView({ orders, focusDate, lang = "th" }: Props) {
  const isEn = lang === "en";
  const dayOrders = orders.filter((order) => order.date === focusDate);
  const totalPax = dayOrders.reduce((sum, order) => sum + order.join + order.visitor, 0);
  const estimatedRevenue = dayOrders.reduce((sum, order) => sum + estimateRevenue(order), 0);
  const waitingOrders = dayOrders.filter((order) => order.boarding === "WAITING").length;
  const boardedOrders = dayOrders.filter((order) => order.boarding === "BOARDED").length;

  const agentSummary = Object.entries(
    dayOrders.reduce<Record<string, { bookings: number; pax: number; amount: number }>>((map, order) => {
      if (!map[order.agent]) {
        map[order.agent] = { bookings: 0, pax: 0, amount: 0 };
      }
      map[order.agent].bookings += 1;
      map[order.agent].pax += order.join + order.visitor;
      map[order.agent].amount += estimateRevenue(order);
      return map;
    }, {})
  )
    .map(([agent, summary]) => ({ agent, ...summary }))
    .sort((left, right) => right.amount - left.amount);

  const recentRows = [...dayOrders]
    .sort((left, right) => left.time.localeCompare(right.time) || left.booking.localeCompare(right.booking))
    .slice(0, 10);

  return (
    <section className="view-section">
      <div className="glass-card">
        <div className="section-header section-header-lg">
          <div>
            <h2>{isEn ? "Accounting" : "งานบัญชี"}</h2>
            <p>{isEn ? "Estimated revenue, review queue, and agency summary for the selected day." : "สรุปยอดประเมิน รายการรอเช็ก และภาพรวมแยกตามเอเจนต์ของวันปัจจุบัน"}</p>
          </div>
        </div>

        <div className="accounting-hero-grid">
          <div className="accounting-stat-card emerald">
            <span>{isEn ? "Today Orders" : "รายการวันนี้"}</span>
            <strong>{dayOrders.length}</strong>
            <em>{focusDate}</em>
          </div>
          <div className="accounting-stat-card blue">
            <span>{isEn ? "Total Pax" : "Pax รวม"}</span>
            <strong>{totalPax}</strong>
            <em>{isEn ? "Customers and companions" : "รวมลูกค้าและผู้ติดตาม"}</em>
          </div>
          <div className="accounting-stat-card amber">
            <span>Estimated Revenue</span>
            <strong>{formatAmount(estimatedRevenue)} THB</strong>
            <em>{isEn ? "Calculated from Pax x 950" : "คำนวณจาก Pax x 950"}</em>
          </div>
          <div className="accounting-stat-card slate">
            <span>{isEn ? "Waiting / Boarded" : "รอเช็ก / รับแล้ว"}</span>
            <strong>{waitingOrders} / {boardedOrders}</strong>
            <em>{isEn ? "Used for daily closing review" : "ใช้ดูสถานะพร้อมปิดยอด"}</em>
          </div>
        </div>

        <div className="accounting-grid">
          <div className="accounting-panel">
            <div className="accounting-panel-head">
              <h3>{isEn ? "Agent Summary" : "สรุปตาม Agent"}</h3>
              <span>{agentSummary.length} {isEn ? "agents" : "ราย"}</span>
            </div>
            <div className="table-wrap">
              <table className="ops-table accounting-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th className="center">Bookings</th>
                    <th className="center">Pax</th>
                    <th className="right">Estimated</th>
                  </tr>
                </thead>
                <tbody>
                  {agentSummary.map((row) => (
                    <tr key={row.agent}>
                      <td>{agentBadge(row.agent)}</td>
                      <td className="center">{row.bookings}</td>
                      <td className="center">{row.pax}</td>
                      <td className="right">{formatAmount(row.amount)} THB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="accounting-panel">
            <div className="accounting-panel-head">
              <h3>{isEn ? "Review Queue / Recent" : "รายการรอตรวจ / ล่าสุด"}</h3>
              <span>{recentRows.length} {isEn ? "items" : "รายการ"}</span>
            </div>
            <div className="table-wrap">
              <table className="ops-table accounting-table">
                <thead>
                  <tr>
                    <th>{isEn ? "Time" : "เวลา"}</th>
                    <th>Booking</th>
                    <th>{isEn ? "Customer" : "ลูกค้า"}</th>
                    <th>Agent</th>
                    <th className="center">Pax</th>
                    <th>{isEn ? "Status" : "สถานะ"}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((order) => (
                    <tr key={order.id}>
                      <td className="slot">{order.time}</td>
                      <td className="mono">{order.booking}</td>
                      <td>{order.name}</td>
                      <td>{agentBadge(order.agent)}</td>
                      <td className="center">{order.join + order.visitor}</td>
                      <td>
                        <span className={`status-badge ${statusClass(order.boarding)}`}>
                          {formatStatus(order.boarding)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
