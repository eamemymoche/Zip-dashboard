"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./i18n";
import { useAuth } from "../lib/auth/auth-context";
import { ROLE_LABELS } from "../lib/auth/role-guards";

type Theme = "light" | "dark" | "system";

const TH_DAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัส", "วันศุกร์", "วันเสาร์"];
const TH_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function formatDateThai(d: Date) {
  return `${TH_DAYS[d.getDay()]}ที่ ${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateEN(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
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

export function TopBar() {
  const { lang, setLang } = useLang();
  const { user, logout, refresh } = useAuth();
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState({ h: "", m: "", s: "", date: "" });
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
    if (savedTheme) setTheme(savedTheme);
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
    function updateClock() {
      const bangkok = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      setClock({
        h: String(bangkok.getHours()).padStart(2, "0"),
        m: String(bangkok.getMinutes()).padStart(2, "0"),
        s: String(bangkok.getSeconds()).padStart(2, "0"),
        date: lang === "th" ? formatDateThai(bangkok) : formatDateEN(bangkok)
      });
    }
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, [lang]);

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
              {clock.h}:{clock.m}:{clock.s} <span className="clock-suf">น.</span>
            </span>
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
                    <span className="user-menu-item-icon">⚙</span>
                    <span>ตั้งค่าบัญชี</span>
                  </button>
                  <button className="user-menu-item danger" onClick={() => logout()} type="button">
                    <span className="user-menu-item-icon">↪</span>
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
              <div className="profile-modal-avatar">
                {profilePhoto ? <img alt="Profile" className="profile-modal-avatar-image" src={profilePhoto} /> : user?.displayName?.slice(0, 1).toUpperCase() ?? "U"}
              </div>
              <div>
                <h3>ตั้งค่าบัญชีผู้ใช้</h3>
                <p>อัปเดตชื่อที่แสดงและข้อมูลเข้าสู่ระบบของคุณ</p>
              </div>
            </div>
            <div className="profile-photo-actions">
              <label className="secondary-button profile-photo-upload">
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
                เปลี่ยนรูป
              </label>
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
            {user?.moduleAccess?.length ? (
              <div className="profile-access-block">
                <span>บอร์ดที่เข้าถึงได้</span>
                <div className="profile-access-list">{user.moduleAccess.join(", ")}</div>
              </div>
            ) : null}
            {message ? <div className="profile-message">{message}</div> : null}
            <div className="modal-actions profile-modal-actions">
              <button onClick={() => setShowProfile(false)} type="button">ปิด</button>
              <button className="primary-button" disabled={saving} onClick={saveProfile} type="button">{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
