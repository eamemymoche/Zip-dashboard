"use client";

import { useState, useEffect } from "react";
import { useLang } from "./i18n";

type Theme = "light" | "dark" | "system";

const TH_DAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัส", "วันศุกร์", "วันเสาร์"];
const TH_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function formatDateThai(d: Date) {
  const day = TH_DAYS[d.getDay()];
  const date = d.getDate();
  const month = TH_MONTHS[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day}ที่ ${date} ${month} ${year}`;
}

function formatDateEN(d: Date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function TopBar() {
  const { lang, setLang } = useLang();
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState({ h: "", m: "", s: "", date: "" });

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
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
    }
  }, [theme, mounted]);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const bkk = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      setClock({
        h: String(bkk.getHours()).padStart(2, "0"),
        m: String(bkk.getMinutes()).padStart(2, "0"),
        s: String(bkk.getSeconds()).padStart(2, "0"),
        date: lang === "th" ? formatDateThai(bkk) : formatDateEN(bkk)
      });
    }
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, [lang]);

  if (!mounted) return null;

  return (
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
          <button
            className={`lang-btn ${lang === "th" ? "active" : ""}`}
            onClick={() => setLang("th")}
            type="button"
          >
            ไทย
          </button>
          <span className="selector-divider">|</span>
          <button
            className={`lang-btn ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
            type="button"
          >
            EN
          </button>
        </div>
        <div className="selector-group theme-group">
          <button
            className={`theme-btn ${theme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
            type="button"
            title="Light"
          >
            ☀
          </button>
          <button
            className={`theme-btn ${theme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
            type="button"
            title="Dark"
          >
            🌙
          </button>
          <button
            className={`theme-btn ${theme === "system" ? "active" : ""}`}
            onClick={() => setTheme("system")}
            type="button"
            title="System"
          >
            💻
          </button>
        </div>
      </div>
    </div>
  );
}
