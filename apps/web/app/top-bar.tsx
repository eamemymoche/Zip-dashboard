"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./i18n";
import { useAuth } from "../lib/auth/auth-context";
import { ROLE_LABELS, listAccessibleBoards } from "../lib/auth/role-guards";

type Theme = "light" | "dark" | "system";
type TimeMode = "24h" | "12h";

const TH_DAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัส", "วันศุกร์", "วันเสาร์"];
const TH_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function formatDateThai(d: Date) {
  return `${TH_DAYS[d.getDay()]}ที่ ${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateEN(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatClock(d: Date, mode: TimeMode) {
  if (mode === "24h") {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
      {crossed ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1V9c0 .4.2.7.6.9H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function TopBar() {
  const { lang, setLang } = useLang();
  const { user, logout, refresh } = useAuth();
  const [theme, setTheme] = useState<Theme>("system");
  const [timeMode, setTimeMode] = useState<TimeMode>("24h");
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState({ display: "", date: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedTimeMode = localStorage.getItem("time-mode") as TimeMode | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedTimeMode === "12h" || savedTimeMode === "24h") setTimeMode(savedTimeMode);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("time-mode", timeMode);
  }, [mounted, timeMode]);

  useEffect(() => {
    function updateClock() {
      const bangkok = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      setClock({
        display: formatClock(bangkok, timeMode),
        date: lang === "th" ? formatDateThai(bangkok) : formatDateEN(bangkok)
      });
    }
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, [lang, timeMode]);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    if (user?.id) {
      setProfilePhoto(localStorage.getItem(`zcc-profile-photo:${user.id}`) ?? "");
    } else {
      setProfilePhoto("");
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function saveProfile() {
    setMessage("");
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, currentPassword, newPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "ไม่สามารถอัปเดตบัญชีได้");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (user?.id) {
        localStorage.setItem(`zcc-profile-photo:${user.id}`, profilePhoto);
      }
      setMessage("บันทึกข้อมูลบัญชีเรียบร้อย");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-left">
          <span className="top-bar-brand">ZIPLINE COMMAND CENTER</span>
          <div className="top-bar-date-wrap">
            <span className="top-bar-date">{clock.date}</span>
            <span className="top-bar-sep" />
            <span className="top-bar-clock">
              {clock.display}
              {timeMode === "24h" ? <span className="clock-suf"> น.</span> : null}
            </span>
            <div className="selector-group time-mode-inline">
              <button className={`lang-btn ${timeMode === "12h" ? "active" : ""}`} onClick={() => setTimeMode("12h")} type="button">12h</button>
              <span className="selector-divider">|</span>
              <button className={`lang-btn ${timeMode === "24h" ? "active" : ""}`} onClick={() => setTimeMode("24h")} type="button">24h</button>
            </div>
          </div>
        </div>
        <div className="top-bar-right">
          <div className="selector-group">
            <span className="selector-label">TH</span>
            <button className={`lang-btn ${lang === "th" ? "active" : ""}`} onClick={() => setLang("th")} type="button">ไทย</button>
            <span className="selector-divider">|</span>
            <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")} type="button">EN</button>
          </div>
          <div className="selector-group theme-group">
            <button className={`theme-btn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")} type="button" title="Light">☀</button>
            <button className={`theme-btn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")} type="button" title="Dark">◐</button>
            <button className={`theme-btn ${theme === "system" ? "active" : ""}`} onClick={() => setTheme("system")} type="button" title="System">⌘</button>
          </div>
          {user ? (
            <div className="user-menu-shell" ref={menuRef}>
              <button className="user-menu-trigger" onClick={() => setMenuOpen((open) => !open)} type="button">
                <span className="user-menu-avatar">
                  {profilePhoto ? <img alt="Profile" className="user-menu-avatar-image" src={profilePhoto} /> : user.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="user-menu-copy">
                  <strong>{user.displayName}</strong>
                  <span>{ROLE_LABELS[user.role]}</span>
                </span>
              </button>
              {menuOpen ? (
                <div className="user-menu-panel">
                  <button className="user-menu-item" onClick={() => { setShowProfile(true); setMenuOpen(false); }} type="button">
                    <span className="user-menu-item-icon"><SettingsIcon /></span>
                    <span>ตั้งค่าบัญชี</span>
                  </button>
                  <button className="user-menu-item danger" onClick={() => logout()} type="button">
                    <span className="user-menu-item-icon"><LogoutIcon /></span>
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {showProfile ? (
        <div className="modal-backdrop">
          <div className="modal-card profile-modal-card">
            <div className="profile-modal-hero">
              <div className="profile-modal-avatar-shell">
                <div className="profile-modal-avatar">
                  {profilePhoto ? <img alt="Profile" className="profile-modal-avatar-image" src={profilePhoto} /> : user?.displayName?.slice(0, 1).toUpperCase() ?? "U"}
                </div>
                <label className="profile-avatar-edit-trigger">
                  <input
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setProfilePhoto(String(reader.result ?? ""));
                      reader.readAsDataURL(file);
                    }}
                    style={{ display: "none" }}
                    type="file"
                  />
                  <CameraIcon />
                </label>
              </div>
              <div>
                <h3>ตั้งค่าบัญชีผู้ใช้</h3>
                <p>อัปเดตชื่อที่แสดง รหัสผ่าน และข้อมูลส่วนตัวที่ใช้ในระบบ</p>
              </div>
            </div>

            <div className="profile-photo-actions">
              {profilePhoto ? (
                <button className="secondary-button" onClick={() => setProfilePhoto("")} type="button">ใช้ค่าเริ่มต้น</button>
              ) : null}
            </div>

            <div className="profile-meta-block">
              <div><span>อีเมล</span><strong>{user?.email ?? "-"}</strong></div>
              <div><span>บทบาท</span><strong>{user ? ROLE_LABELS[user.role] : "-"}</strong></div>
            </div>

            <label className="profile-field">
              <span>ชื่อที่แสดง</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} type="text" />
            </label>

            <label className="profile-field">
              <span>รหัสผ่านปัจจุบัน</span>
              <div className="profile-password-wrap">
                <input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type={showCurrentPassword ? "text" : "password"} />
                <button className="profile-eye-btn" onClick={() => setShowCurrentPassword((value) => !value)} type="button">
                  <EyeIcon crossed={showCurrentPassword} />
                </button>
              </div>
            </label>

            <label className="profile-field">
              <span>รหัสผ่านใหม่</span>
              <div className="profile-password-wrap">
                <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type={showNewPassword ? "text" : "password"} />
                <button className="profile-eye-btn" onClick={() => setShowNewPassword((value) => !value)} type="button">
                  <EyeIcon crossed={showNewPassword} />
                </button>
              </div>
            </label>

            <label className="profile-field">
              <span>ยืนยันรหัสผ่านใหม่</span>
              <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" />
            </label>

            {listAccessibleBoards(user?.moduleAccess).length ? (
              <div className="profile-access-block">
                <span>บอร์ดที่เข้าถึงได้</span>
                <div className="profile-access-list">{listAccessibleBoards(user?.moduleAccess).join(", ")}</div>
              </div>
            ) : null}

            {message ? <div className="profile-message">{message}</div> : null}

            <div className="modal-actions profile-modal-actions">
              <button onClick={() => setShowProfile(false)} type="button">ปิด</button>
              <button className="primary-button" disabled={saving} onClick={saveProfile} type="button">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
