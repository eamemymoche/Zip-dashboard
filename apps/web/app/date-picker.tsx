"use client";

import { useEffect, useRef, useState } from "react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  lang?: "th" | "en";
  rangeStart?: string;
  rangeEnd?: string;
  rangeRole?: "start" | "end";
  onRangeChange?: (start: string, end: string) => void;
}

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const TH_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const EN_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function DatePicker({ value, onChange, className, style, lang = "th" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    value ? new Date(`${value}T00:00:00`).getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    value ? new Date(`${value}T00:00:00`).getMonth() : new Date().getMonth()
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) return;
    const d = new Date(`${value}T00:00:00`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  function parseValue() {
    if (!value) return new Date();
    return new Date(`${value}T00:00:00`);
  }

  function formatDisplay(date: Date) {
    if (lang === "th") {
      return `${date.getDate()} ${TH_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function handleSelect(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    const t = new Date();
    const iso = toISO(t);
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    onChange(iso);
    setOpen(false);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const selected = parseValue();
  const months = lang === "th" ? TH_MONTHS : EN_MONTHS;
  const days = lang === "th" ? TH_DAYS : EN_DAYS;
  const today = toISO(new Date());

  const isToday = (d: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return iso === today;
  };

  const isSelected = (d: number) =>
    d === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }} className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="date-picker-trigger"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          minWidth: "160px",
          ...style
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
        {value ? formatDisplay(parseValue()) : "เลือกวันที่"}
      </button>

      {open ? (
        <div className="date-picker-popover">
          <div className="dp-header">
            <button type="button" onClick={prevMonth} className="dp-nav-btn">‹</button>
            <span className="dp-month-label">{months[viewMonth]} {lang === "th" ? viewYear + 543 : viewYear}</span>
            <button type="button" onClick={nextMonth} className="dp-nav-btn">›</button>
          </div>
          <div className="dp-grid">
            {days.map((d) => <span key={d} className="dp-day-label">{d}</span>)}
            {cells.map((d, i) => (
              d === null ? <span key={`empty-${i}`} /> : (
                <button
                  key={`${viewYear}-${viewMonth}-${d}`}
                  type="button"
                  onClick={() => handleSelect(d)}
                  className={`dp-day ${isSelected(d) ? "dp-day-selected" : ""} ${isToday(d) ? "dp-day-today" : ""}`}
                >
                  {d}
                </button>
              )
            ))}
          </div>
          <button type="button" className="dp-today-btn" onClick={goToday}>
            {lang === "th" ? "วันนี้" : "Today"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
