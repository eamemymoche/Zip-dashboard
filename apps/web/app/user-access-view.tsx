"use client";

import { useEffect, useState } from "react";
import type { BoardKey, UserRole } from "../lib/auth/role-guards";
import { ALL_BOARD_KEYS, ALL_ROLES, ROLE_LABELS, defaultBoardAccessForRole, normalizeBoardAccess } from "../lib/auth/role-guards";

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  moduleAccess?: BoardKey[];
};

type Props = { initialUsers: UserRecord[] };
const DEMO_USERS: UserRecord[] = [
  { id: "demo-superadmin-001", email: "superadmin@zipline.com", displayName: "SuperAdmin Dev", role: "SUPERADMIN", active: true, moduleAccess: ALL_BOARD_KEYS },
  { id: "demo-admin-001", email: "owner@zipline.com", displayName: "Owner Dev", role: "ADMIN", active: true, moduleAccess: defaultBoardAccessForRole("ADMIN") },
  { id: "demo-officer-001", email: "officer@zipline.com", displayName: "Officer Dev", role: "MANAGER", active: true, moduleAccess: defaultBoardAccessForRole("MANAGER") },
  { id: "demo-account-001", email: "accounting@zipline.com", displayName: "Account Dev", role: "ACCOUNTING", active: true, moduleAccess: defaultBoardAccessForRole("ACCOUNTING") },
  { id: "demo-staff-001", email: "staff@zipline.com", displayName: "Staff Dev", role: "STAFF", active: true, moduleAccess: defaultBoardAccessForRole("STAFF") },
  { id: "demo-driver-001", email: "driver@zipline.com", displayName: "Driver Dev", role: "DRIVER", active: true, moduleAccess: defaultBoardAccessForRole("DRIVER") }
];

const BOARD_LABELS: Record<BoardKey, string> = {
  overview: "ภาพรวม",
  orderlist: "ออเดอร์",
  transport: "งานจัดรถ",
  staffing: "งานสตาฟ",
  personnel: "บุคลากร",
  master: "มาสเตอร์",
  useraccess: "ตั้งค่าผู้ใช้",
  changelog: "บันทึกแก้ไข"
};

export function UserAccessView({ initialUsers }: Props) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [draftRole, setDraftRole] = useState<UserRole>("STAFF");
  const [draftBoards, setDraftBoards] = useState<BoardKey[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialUsers.length > 0) return;
    fetch("/api/users")
      .then((r) => r.ok ? r.json() : [])
      .then((data: UserRecord[]) => setUsers(data.length > 0 ? data : DEMO_USERS))
      .catch(() => setUsers(DEMO_USERS));
  }, [initialUsers.length]);

  const filtered = users.filter((u) => {
    const byText = u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const byRole = roleFilter === "ALL" || u.role === roleFilter;
    return byText && byRole;
  });

  function startEdit(user: UserRecord) {
    setEditingUser(user);
    setDraftRole(user.role);
    setDraftBoards(normalizeBoardAccess(user.moduleAccess, user.role));
  }

  function toggleBoard(board: BoardKey) {
    if (draftRole === "SUPERADMIN") return;
    const allowed = new Set(defaultBoardAccessForRole(draftRole));
    if (!allowed.has(board)) return;
    setDraftBoards((current) => current.includes(board) ? current.filter((b) => b !== board) : [...current, board]);
  }

  function applyRole(role: UserRole) {
    setDraftRole(role);
    setDraftBoards(normalizeBoardAccess(draftBoards, role));
  }

  async function saveEdit() {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingUser.id, role: draftRole, moduleAccess: draftRole === "SUPERADMIN" ? ALL_BOARD_KEYS : draftBoards })
      });
      if (!res.ok) return;
      const updated: UserRecord = await res.json();
      setUsers((current) => current.map((u) => u.id === updated.id ? updated : u));
      setEditingUser(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="view-section">
      <div className="glass-card user-access-card">
        <div className="section-header">
          <div>
            <h2>ตั้งค่าผู้ใช้</h2>
            <p>กำหนดบทบาทและสิทธิ์รายบอร์ด</p>
          </div>
        </div>
        <div className="user-access-toolbar">
          <input className="user-access-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" />
          <select className="user-access-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}>
            <option value="ALL">ทุกสิทธิ์</option>
            {ALL_ROLES.map((r) => <option value={r} key={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <table className="user-access-table">
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12 }}>ผู้ใช้</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12 }}>อีเมล</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12 }}>บทบาท</th>
              <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "16px 10px", color: "#64748b", textAlign: "center" }}>ไม่พบผู้ใช้</td>
              </tr>
            ) : filtered.map((user) => (
              <tr key={user.id} className="user-access-row">
                <td style={{ padding: "11px 10px", fontWeight: 600 }}>{user.displayName}</td>
                <td style={{ padding: "9px 10px", fontSize: 13 }}>{user.email}</td>
                <td style={{ padding: "9px 10px" }}>{ROLE_LABELS[user.role]}</td>
                <td style={{ padding: "9px 10px" }}>
                  <button className="indigo-button" type="button" onClick={() => startEdit(user)} style={{ borderRadius: 10, padding: "8px 14px", fontWeight: 700 }}>แก้ไขสิทธิ์</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser ? (
        <div className="modal-backdrop">
          <div className="modal-card large user-access-modal">
            <h3>สิทธิ์ผู้ใช้: {editingUser.displayName}</h3>
            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#64748b" }}>บทบาท</span>
              <select className="user-access-select" value={draftRole} onChange={(e) => applyRole(e.target.value as UserRole)} style={{ width: "100%" }}>
                {ALL_ROLES.map((role) => <option value={role} key={role}>{ROLE_LABELS[role]}</option>)}
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {ALL_BOARD_KEYS.map((board) => {
                const roleDefault = new Set(defaultBoardAccessForRole(draftRole));
                const enabledByRole = draftRole === "SUPERADMIN" || roleDefault.has(board);
                const checked = draftRole === "SUPERADMIN" ? true : draftBoards.includes(board);
                return (
                  <label key={board} className="user-access-checkcard" style={{ opacity: enabledByRole ? 1 : 0.45 }}>
                    <input type="checkbox" checked={checked} disabled={!enabledByRole} onChange={() => toggleBoard(board)} />
                    <span style={{ fontWeight: 600 }}>{BOARD_LABELS[board]}</span>
                  </label>
                );
              })}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setEditingUser(null)}>ยกเลิก</button>
              <button type="button" className="primary-button" onClick={saveEdit} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
