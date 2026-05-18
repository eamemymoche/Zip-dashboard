"use client";

import { useCallback, useEffect, useState } from "react";
import { DatePicker } from "./date-picker";

type Tab = "all" | "orders" | "transport" | "staffing" | "personnel" | "users";
type AuditLogItem = {
  id: string;
  timestamp: string;
  actorDisplay: string;
  actorRole: string;
  domain: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSummary: string | null;
  afterSummary: string | null;
};

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "orders", label: "ออเดอร์" },
  { key: "transport", label: "งานจัดรถ" },
  { key: "staffing", label: "งานสตาฟ" },
  { key: "personnel", label: "บุคลากร" },
  { key: "users", label: "ผู้ใช้" }
];

const DOMAIN_COLORS: Record<string, { bg: string; text: string }> = {
  orders: { bg: "#dbeafe", text: "#1d4ed8" },
  transport: { bg: "#dcfce7", text: "#166534" },
  staffing: { bg: "#f3e8ff", text: "#7e22ce" },
  personnel: { bg: "#fee2e2", text: "#b91c1c" },
  users: { bg: "#ffedd5", text: "#c2410c" }
};

const PAGE_SIZE = 20;

export function ChangeLogView() {
  const todayIso = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })).toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  const fetchLogs = useCallback((tab: Tab, q: string, from: string, to: string, nextPage: number) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("domain", tab);
    if (q) params.set("q", q);
    if (from) params.set("fromDate", from);
    if (to) params.set("toDate", to);
    params.set("page", String(nextPage));
    params.set("pageSize", String(PAGE_SIZE));
    fetch(`/api/audit-log?${params}`)
      .then((r) => r.ok ? r.json() : { items: [], pageCount: 0 })
      .then((data) => {
        setItems(data.items ?? []);
        setPageCount(data.pageCount ?? 0);
        setPage(nextPage);
      })
      .catch(() => {
        setItems([]);
        setPage(1);
        setPageCount(0);
      });
  }, []);

  useEffect(() => {
    fetchLogs(activeTab, search, fromDate, toDate, 1);
  }, [activeTab, search, fromDate, toDate, fetchLogs]);

  return (
    <section className="view-section">
      <div className="glass-card changelog-card">
        <div className="section-header" style={{ marginBottom: 12 }}>
          <div>
            <h2>บันทึกการเปลี่ยนแปลง</h2>
            <p>ตรวจสอบประวัติการแก้ไขแยกตามบอร์ด</p>
          </div>
        </div>

        <div className="changelog-tabs">
          {TABS.map((tab) => (
            <button
              className={`changelog-tab ${activeTab === tab.key ? "active" : ""}`}
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="changelog-toolbar">
          <input
            className="changelog-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา entityId / action / ก่อนแก้ไข / หลังแก้ไข"
          />
          <DatePicker value={fromDate} onChange={setFromDate} style={{ minWidth: 132 }} />
          <DatePicker value={toDate} onChange={setToDate} style={{ minWidth: 132 }} />
          <button type="button" className="primary-button" onClick={() => fetchLogs(activeTab, search, fromDate, toDate, 1)}>ค้นหา</button>
        </div>

        <div className="changelog-table-shell">
          <table className="changelog-table">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ผู้กระทำ</th>
                <th>โดเมน</th>
                <th>การกระทำ</th>
                <th>Entity</th>
                <th>ก่อนแก้ไข</th>
                <th>หลังแก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "24px 12px", textAlign: "center", color: "var(--muted)" }}>ไม่พบรายการ</td>
                </tr>
              ) : items.map((item, idx) => {
                const dc = DOMAIN_COLORS[item.domain] ?? { bg: "#e2e8f0", text: "#334155" };
                return (
                  <tr key={item.id} className={idx % 2 ? "alt" : ""}>
                    <td style={{ padding: "10px 12px", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(item.timestamp).toLocaleString("th-TH")}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600 }}>{item.actorDisplay}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: dc.bg, color: dc.text }}>
                        {item.domain}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12 }}>{item.action}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12 }}>{item.entityType}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.beforeSummary ?? "-"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.afterSummary ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => fetchLogs(activeTab, search, fromDate, toDate, Math.max(1, page - 1))}>ก่อนหน้า</button>
            <span style={{ color: "#334155", fontSize: 13, alignSelf: "center" }}>{page} / {pageCount}</span>
            <button type="button" onClick={() => fetchLogs(activeTab, search, fromDate, toDate, Math.min(pageCount, page + 1))}>ถัดไป</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
