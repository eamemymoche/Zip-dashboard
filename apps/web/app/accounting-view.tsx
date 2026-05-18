"use client";

import type { OrderRecord } from "../lib/ops-data";

type Props = {
  orders: OrderRecord[];
  focusDate: string;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function estimateRevenue(order: OrderRecord) {
  return (order.join + order.visitor) * 950;
}

export default function AccountingView({ orders, focusDate }: Props) {
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
            <h2>งานบัญชี</h2>
            <p>สรุปยอดประเมิน รายการรอเช็ก และภาพรวมแยกตามเอเจนต์ของวันปัจจุบัน</p>
          </div>
        </div>

        <div className="accounting-hero-grid">
          <div className="accounting-stat-card emerald">
            <span>รายการวันนี้</span>
            <strong>{dayOrders.length}</strong>
            <em>{focusDate}</em>
          </div>
          <div className="accounting-stat-card blue">
            <span>Pax รวม</span>
            <strong>{totalPax}</strong>
            <em>รวมลูกค้าและผู้ติดตาม</em>
          </div>
          <div className="accounting-stat-card amber">
            <span>Estimated Revenue</span>
            <strong>{formatAmount(estimatedRevenue)} THB</strong>
            <em>คำนวณจาก Pax x 950</em>
          </div>
          <div className="accounting-stat-card slate">
            <span>รอเช็ก / รับแล้ว</span>
            <strong>{waitingOrders} / {boardedOrders}</strong>
            <em>ใช้ดูสถานะพร้อมปิดยอด</em>
          </div>
        </div>

        <div className="accounting-grid">
          <div className="accounting-panel">
            <div className="accounting-panel-head">
              <h3>สรุปตาม Agent</h3>
              <span>{agentSummary.length} ราย</span>
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
                      <td>{row.agent}</td>
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
              <h3>รายการรอตรวจ / ล่าสุด</h3>
              <span>{recentRows.length} รายการ</span>
            </div>
            <div className="table-wrap">
              <table className="ops-table accounting-table">
                <thead>
                  <tr>
                    <th>เวลา</th>
                    <th>Booking</th>
                    <th>ลูกค้า</th>
                    <th>Agent</th>
                    <th className="center">Pax</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((order) => (
                    <tr key={order.id}>
                      <td className="slot">{order.time}</td>
                      <td className="mono">{order.booking}</td>
                      <td>{order.name}</td>
                      <td>{order.agent}</td>
                      <td className="center">{order.join + order.visitor}</td>
                      <td>{order.boarding}</td>
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
