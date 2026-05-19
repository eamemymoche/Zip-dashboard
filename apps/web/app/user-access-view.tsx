"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth/auth-context";
import type { BoardKey, BoardPermission, ModuleAccessMap, UserRole } from "../lib/auth/role-guards";
import {
  ALL_BOARD_KEYS,
  ALL_ROLES,
  ROLE_LABELS,
  defaultBoardAccessForRole,
  defaultModuleAccessForRole,
  listAccessibleBoards,
  normalizeModuleAccess
} from "../lib/auth/role-guards";

export type UserRecord = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  moduleAccess?: ModuleAccessMap;
};

type Props = { initialUsers: UserRecord[]; lang?: "th" | "en" };

const DEMO_USERS: UserRecord[] = [
  { id: "demo-superadmin-001", username: "superadmin", email: "superadmin@demo.local", displayName: "SuperAdmin Dev", role: "SUPERADMIN", active: true, moduleAccess: defaultModuleAccessForRole("SUPERADMIN") },
  { id: "demo-manager-001", username: "manager", email: "manager@demo.local", displayName: "Manager Dev", role: "MANAGER", active: true, moduleAccess: { ...defaultModuleAccessForRole("SUPERADMIN"), useraccess: undefined } },
  { id: "demo-officer-001", username: "officer", email: "officer@demo.local", displayName: "Officer Dev", role: "MANAGER", active: true, moduleAccess: defaultModuleAccessForRole("MANAGER") },
  { id: "demo-account-001", username: "account", email: "account@demo.local", displayName: "Account Dev", role: "ACCOUNTING", active: true, moduleAccess: defaultModuleAccessForRole("ACCOUNTING") },
  { id: "demo-staff-001", username: "staff", email: "staff@demo.local", displayName: "Staff Dev", role: "STAFF", active: true, moduleAccess: defaultModuleAccessForRole("STAFF") },
  { id: "demo-driver-001", username: "driver", email: "driver@demo.local", displayName: "Driver Dev", role: "DRIVER", active: true, moduleAccess: defaultModuleAccessForRole("DRIVER") }
];

const BOARD_LABELS: Record<BoardKey, string> = {
  overview: "ภาพรวม",
  orderlist: "รายการออเดอร์",
  transport: "งานจัดรถ",
  staffing: "งาน Staff",
  personnel: "บุคลากร",
  accounting: "งานบัญชี",
  changelog: "บันทึกแก้ไข",
  useraccess: "ตั้งค่าผู้ใช้",
  master: "Master Ops",
  backup: "สำรองข้อมูล"
};

const BOARD_LABELS_EN: Record<BoardKey, string> = {
  overview: "Overview",
  orderlist: "Order List",
  transport: "Transport",
  staffing: "Staff",
  personnel: "Personnel",
  accounting: "Accounting",
  changelog: "Changelog",
  useraccess: "User Controls",
  master: "Master Ops",
  backup: "Backup"
};

const BOARD_HELP: Record<BoardKey, string> = {
  overview: "Dashboard and daily summaries",
  orderlist: "Bookings, updates, and customer records",
  transport: "Driver, vehicle, and job sheet operations",
  staffing: "Staff allocation, board, and KPI flow",
  personnel: "Employee records and contact information",
  accounting: "Accounting workspace placeholder",
  changelog: "System change history and audit timeline",
  useraccess: "Roles and access control settings",
  master: "Master data and package management",
  backup: "Backup, plugin recovery, and overlap safety controls"
};

const ROLE_ORDER: UserRole[] = ["SUPERADMIN", "MANAGER", "ADMIN", "ACCOUNTING", "STAFF", "DRIVER"];
const USER_TABS: Array<UserRole | "overview"> = ["overview", "ADMIN", "ACCOUNTING", "STAFF", "DRIVER"];
const ROLE_TONE: Record<UserRole, string> = {
  SUPERADMIN: "tier-1",
  MANAGER: "tier-2",
  ADMIN: "tier-3",
  ACCOUNTING: "tier-4",
  STAFF: "tier-5",
  DRIVER: "tier-6"
};
type SortField = "displayName" | "email" | "username" | "role";
type SortDir = "default" | "asc" | "desc";

type CreateDraft = {
  username: string;
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
};

const EMPTY_CREATE_DRAFT: CreateDraft = {
  username: "",
  email: "",
  displayName: "",
  password: "",
  role: "STAFF"
};

export function UserAccessView({ initialUsers, lang = "th" }: Props) {
  const isEn = lang === "en";
  const boardLabels = isEn ? BOARD_LABELS_EN : BOARD_LABELS;
  const { user: currentUser } = useAuth();
  const isSuperadmin = currentUser?.role === "SUPERADMIN";
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [draftRole, setDraftRole] = useState<UserRole>("STAFF");
  const [draftAccess, setDraftAccess] = useState<ModuleAccessMap>({});
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>(EMPTY_CREATE_DRAFT);
  const [createSaving, setCreateSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UserRole | "overview">("overview");
  const [sortField, setSortField] = useState<SortField | "">("");
  const [sortDir, setSortDir] = useState<SortDir>("default");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (initialUsers.length > 0 || !isSuperadmin) return;
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: UserRecord[]) => setUsers(data.length > 0 ? data : DEMO_USERS))
      .catch(() => setUsers(DEMO_USERS));
  }, [initialUsers.length, isSuperadmin]);

  async function syncEmployees() {
    if (!isSuperadmin) return;
    setSyncing(true);
    setSyncMessage("");
    try {
      const response = await fetch("/api/users/sync-from-employees", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSyncMessage(typeof payload.error === "string" ? payload.error : "Sync failed");
        return;
      }

      const listResponse = await fetch("/api/users");
      const list = listResponse.ok ? ((await listResponse.json()) as UserRecord[]) : [];
      setUsers(list.length > 0 ? list : DEMO_USERS);
      const synced = typeof payload.syncedCount === "number" ? payload.syncedCount : 0;
      const skipped = typeof payload.skippedCount === "number" ? payload.skippedCount : 0;
      const errored = typeof payload.errorCount === "number" ? payload.errorCount : 0;
      setSyncMessage(
        isEn
          ? `Synced ${synced}, skipped ${skipped}, errors ${errored}.`
          : `ซิงก์สำเร็จ ${synced}, ข้าม ${skipped}, error ${errored}`
      );
    } catch {
      setSyncMessage(isEn ? "Sync failed" : "ซิงก์ผู้ใช้ไม่สำเร็จ");
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(
    () => {
      const visible = users.filter((user) => {
        if (activeTab !== "overview" && user.role !== activeTab) return false;
        const query = search.trim().toLowerCase();
        const byText =
          !query ||
          user.displayName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query);
        const byRole = roleFilter === "ALL" || user.role === roleFilter;
        return byText && byRole;
      });
      const sorted = [...visible].sort((left, right) => {
        if (!sortField || sortDir === "default") return ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role);
        const leftValue = sortField === "role" ? ROLE_LABELS[left.role] : left[sortField];
        const rightValue = sortField === "role" ? ROLE_LABELS[right.role] : right[sortField];
        const cmp = leftValue.localeCompare(rightValue);
        return sortDir === "asc" ? cmp : -cmp;
      });
      return sorted;
    },
    [activeTab, roleFilter, search, sortDir, sortField, users]
  );

  function toggleUserSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField("");
      setSortDir("default");
    }
  }

  function userSortIcon(field: SortField) {
    if (sortField !== field || sortDir === "default") return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function startEdit(user: UserRecord) {
    setEditingUser(user);
    setDraftRole(user.role);
    setDraftAccess(normalizeModuleAccess(user.moduleAccess, user.role));
  }

  function applyRole(role: UserRole) {
    setDraftRole(role);
    setDraftAccess(normalizeModuleAccess(draftAccess, role));
  }

  function setBoardPermission(board: BoardKey, permission: BoardPermission | "none") {
    if (draftRole === "SUPERADMIN") return;
    const allowed = new Set(defaultBoardAccessForRole(draftRole));
    if (!allowed.has(board)) return;

    setDraftAccess((current) => {
      const next = { ...current };
      if (permission === "none") {
        delete next[board];
      } else {
        next[board] = permission;
      }
      return next;
    });
  }

  async function saveEdit() {
    if (!editingUser) return;
    setSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          role: draftRole,
          moduleAccess: draftRole === "SUPERADMIN" ? defaultModuleAccessForRole("SUPERADMIN") : draftAccess
        })
      });
      if (!response.ok) return;
      const updated: UserRecord = await response.json();
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setEditingUser(null);
    } finally {
      setSaving(false);
    }
  }

  async function createUser() {
    if (!isSuperadmin) return;
    setCreateSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createDraft,
          username: createDraft.username.trim().toLowerCase(),
          email: createDraft.email.trim().toLowerCase(),
          moduleAccess: createDraft.role === "SUPERADMIN" ? defaultModuleAccessForRole("SUPERADMIN") : defaultModuleAccessForRole(createDraft.role)
        })
      });
      if (!response.ok) return;
      const created: UserRecord = await response.json();
      setUsers((current) => [...current, created]);
      setCreateDraft(EMPTY_CREATE_DRAFT);
      setShowCreateModal(false);
    } finally {
      setCreateSaving(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!isSuperadmin) return;
    const confirmDelete = window.confirm(isEn ? "Confirm user deletion?" : "ยืนยันการลบผู้ใช้งาน?");
    if (!confirmDelete) return;
    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (!response.ok) return;
      setUsers((current) => current.filter((user) => user.id !== userId));
      if (editingUser?.id === userId) setEditingUser(null);
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <section className="view-section">
      <div className="glass-card user-access-card">
        <div className="section-header">
          <div>
            <h2>{isEn ? "User Controls" : "ตั้งค่าผู้ใช้"}</h2>
            <p>{isEn ? "Manage roles, board access, and edit permissions." : "จัดการบทบาท สิทธิ์การเข้าถึง และสิทธิ์แก้ไขรายบอร์ด"}</p>
          </div>
          {isSuperadmin ? (
            <button className="primary-button order-add-button" type="button" onClick={() => setShowCreateModal(true)}>
              {isEn ? "+ Add User" : "+ เพิ่มผู้ใช้งาน"}
            </button>
          ) : null}
        </div>

        <div className="user-access-toolbar">
          <input
            className="user-access-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isEn ? "Search username, display name, or email" : "ค้นหาชื่อผู้ใช้ ชื่อแสดงผล หรืออีเมล"}
          />
          <select className="user-access-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "ALL")}>
            <option value="ALL">{isEn ? "All roles" : "ทุกสิทธิ์"}</option>
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {isSuperadmin ? (
            <button className="indigo-button user-access-edit-button" type="button" onClick={syncEmployees} disabled={syncing}>
              {syncing ? (isEn ? "Syncing..." : "กำลังซิงก์...") : (isEn ? "Sync Staff/Driver" : "ซิงก์ Staff/Driver")}
            </button>
          ) : null}
        </div>
        {syncMessage ? <p className="subtle-line" style={{ marginTop: "10px" }}>{syncMessage}</p> : null}
        <div className="user-access-tabs">
          {USER_TABS.map((tab) => (
            <button key={tab} className={activeTab === tab ? "user-access-tab active" : "user-access-tab"} onClick={() => setActiveTab(tab)} type="button">
              {tab === "overview" ? (isEn ? "Overview" : "Overview") : ROLE_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="user-access-table-shell">
          <table className="user-access-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleUserSort("displayName")}>{isEn ? "User" : "ผู้ใช้"}{userSortIcon("displayName")}</th>
                <th className="sortable" onClick={() => toggleUserSort("email")}>อีเมล{userSortIcon("email")}</th>
                <th className="sortable" onClick={() => toggleUserSort("username")}>{isEn ? "Username" : "ชื่อผู้ใช้งาน"}{userSortIcon("username")}</th>
                <th className="sortable" onClick={() => toggleUserSort("role")}>{isEn ? "Role" : "บทบาท"}{userSortIcon("role")}</th>
                <th>{isEn ? "Board Access" : "สิทธิ์บอร์ด"}</th>
                <th>{isEn ? "Actions" : "จัดการ"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="user-access-empty">{isEn ? "No users found" : "ไม่พบผู้ใช้"}</td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const boards = listAccessibleBoards(user.moduleAccess);
                  return (
                    <tr key={user.id} className="user-access-row">
                      <td>
                        <div className="user-access-usercell">
                          <span className="user-access-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
                          <div>
                            <strong>{user.displayName}</strong>
                            <span>{user.active ? "Active" : "Inactive"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="user-access-email">{user.email}</td>
                      <td><code className="user-access-username">{user.username}</code></td>
                      <td>
                        <span className={`user-access-role-pill ${ROLE_TONE[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                      </td>
                      <td>
                        <div className="user-access-boardlist">
                          {boards.slice(0, 4).map((board) => (
                            <span key={board} className="user-access-boardpill">
                              {boardLabels[board]}
                            </span>
                          ))}
                          {boards.length > 4 ? <span className="user-access-boardpill muted">+{boards.length - 4}</span> : null}
                        </div>
                      </td>
                      <td>
                        <div className="user-access-actions">
                          <button className="indigo-button user-access-edit-button" type="button" onClick={() => startEdit(user)}>
                            {isEn ? "Edit Access" : "แก้ไขสิทธิ์"}
                          </button>
                          {isSuperadmin ? (
                            <button className="danger-button user-access-delete-button" type="button" onClick={() => deleteUser(user.id)} disabled={deletingUserId === user.id}>
                              {deletingUserId === user.id ? (isEn ? "Deleting..." : "กำลังลบ...") : (isEn ? "Delete User" : "ลบผู้ใช้งาน")}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal ? (
        <div className="modal-backdrop">
          <div className="modal-card user-access-create-modal">
            <h3>{isEn ? "Add New User" : "เพิ่มผู้ใช้งานใหม่"}</h3>
            <div className="modal-grid user-access-create-grid">
              <label>
                <span>{isEn ? "Username" : "ชื่อผู้ใช้งาน"}</span>
                <input value={createDraft.username} onChange={(event) => setCreateDraft((current) => ({ ...current, username: event.target.value }))} placeholder="supervisor01" />
              </label>
              <label>
                <span>{isEn ? "Email" : "อีเมล"}</span>
                <input value={createDraft.email} onChange={(event) => setCreateDraft((current) => ({ ...current, email: event.target.value }))} placeholder="manager@demo.local" />
              </label>
              <label>
                <span>{isEn ? "Display Name" : "ชื่อแสดงผล"}</span>
                <input value={createDraft.displayName} onChange={(event) => setCreateDraft((current) => ({ ...current, displayName: event.target.value }))} placeholder="Manager Dev" />
              </label>
              <label>
                <span>{isEn ? "Password" : "รหัสผ่าน"}</span>
                <input value={createDraft.password} onChange={(event) => setCreateDraft((current) => ({ ...current, password: event.target.value }))} type="password" />
              </label>
              <label className="user-access-role-field">
                <span>{isEn ? "Role" : "บทบาท"}</span>
                <select className="user-access-select" value={createDraft.role} onChange={(event) => setCreateDraft((current) => ({ ...current, role: event.target.value as UserRole }))}>
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowCreateModal(false)}>{isEn ? "Cancel" : "ยกเลิก"}</button>
              <button type="button" className="primary-button" onClick={createUser} disabled={createSaving}>
                {createSaving ? (isEn ? "Saving..." : "กำลังบันทึก...") : (isEn ? "Create User" : "สร้างผู้ใช้งาน")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingUser ? (
        <div className="modal-backdrop">
          <div className="modal-card large user-access-modal">
            <div className="user-access-modal-head">
              <div>
                <h3>{isEn ? "Edit User Access" : "แก้ไขสิทธิ์ผู้ใช้"}</h3>
                <p>{editingUser.displayName} · {editingUser.username}</p>
              </div>
              <span className="user-access-role-badge">{ROLE_LABELS[draftRole]}</span>
            </div>

            <label className="user-access-role-field">
              <span>{isEn ? "Role" : "บทบาท"}</span>
              <select className="user-access-select" value={draftRole} onChange={(event) => applyRole(event.target.value as UserRole)}>
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>

            <div className="user-access-permission-grid">
              {ALL_BOARD_KEYS.map((board) => {
                const allowed = draftRole === "SUPERADMIN" || defaultBoardAccessForRole(draftRole).includes(board);
                const permission = draftRole === "SUPERADMIN" ? "edit" : draftAccess[board] ?? "none";
                return (
                  <div key={board} className={`user-access-permission-card${allowed ? "" : " disabled"}`}>
                    <div className="user-access-permission-copy">
                      <strong>{boardLabels[board]}</strong>
                      <span>{BOARD_HELP[board]}</span>
                    </div>
                    <div className="user-access-permission-toggle">
                      <button
                        type="button"
                        className={`permission-segment${permission === "none" ? " active none" : ""}`}
                        disabled={!allowed || draftRole === "SUPERADMIN"}
                        onClick={() => setBoardPermission(board, "none")}
                      >
                        No Access
                      </button>
                      <button
                        type="button"
                        className={`permission-segment${permission === "view" ? " active" : ""}`}
                        disabled={!allowed || draftRole === "SUPERADMIN"}
                        onClick={() => setBoardPermission(board, "view")}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className={`permission-segment${permission === "edit" ? " active edit" : ""}`}
                        disabled={!allowed}
                        onClick={() => setBoardPermission(board, "edit")}
                      >
                        View + Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setEditingUser(null)}>
                {isEn ? "Cancel" : "ยกเลิก"}
              </button>
              <button type="button" className="primary-button" onClick={saveEdit} disabled={saving}>
                {saving ? (isEn ? "Saving..." : "กำลังบันทึก...") : (isEn ? "Save" : "บันทึก")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
