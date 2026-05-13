"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

type RangeRole = "start" | "end";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  lang?: "th" | "en";
  rangeStart?: string;
  rangeEnd?: string;
  rangeRole?: RangeRole;
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

function parseISO(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function toISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  return cells;
}

export function DatePicker({
  value,
  onChange,
  className,
  style,
  lang = "th",
  rangeStart,
  rangeEnd,
  rangeRole = "start",
  onRangeChange
}: DatePickerProps) {
  const isRangeMode = Boolean(onRangeChange && rangeStart && rangeEnd);
  const selectedDate = useMemo(() => (value ? parseISO(value) : new Date()), [value]);
  const ref = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth());
  const [dragging, setDragging] = useState(false);
  const [dragAnchor, setDragAnchor] = useState<string | null>(null);
  const [previewStart, setPreviewStart] = useState<string | null>(null);
  const [previewEnd, setPreviewEnd] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setDragging(false);
        setDragAnchor(null);
        setPreviewStart(null);
        setPreviewEnd(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isRangeMode || !dragging || !dragAnchor) return;
    const handleMouseUp = () => {
      setDragging(false);
      setDragAnchor(null);
      setPreviewStart(null);
      setPreviewEnd(null);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dragging, dragAnchor, isRangeMode]);

  useEffect(() => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  function formatDisplay(date: Date) {
    if (lang === "th") {
      return `${date.getDate()} ${TH_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function isToday(iso: string) {
    return iso === toISO(new Date());
  }

  function normalizeRange(a: string, b: string) {
    return a <= b ? { start: a, end: b } : { start: b, end: a };
  }

  function pickSingle(iso: string) {
    if (isRangeMode && rangeStart && rangeEnd && onRangeChange) {
      if (rangeRole === "start") {
        onRangeChange(iso, iso > rangeEnd ? iso : rangeEnd);
      } else {
        onRangeChange(iso < rangeStart ? iso : rangeStart, iso);
      }
      onChange(iso);
      setOpen(false);
      return;
    }
    onChange(iso);
    setOpen(false);
  }

  function commitDrag(iso: string) {
    if (!isRangeMode || !dragAnchor || !onRangeChange) return;
    const n = normalizeRange(dragAnchor, iso);
    onRangeChange(n.start, n.end);
    onChange(rangeRole === "start" ? n.start : n.end);
    setDragging(false);
    setDragAnchor(null);
    setPreviewStart(null);
    setPreviewEnd(null);
    setOpen(false);
  }

  function handleMouseDownDay(iso: string, event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!isRangeMode) {
      pickSingle(iso);
      return;
    }
    setDragging(true);
    setDragAnchor(iso);
    setPreviewStart(iso);
    setPreviewEnd(iso);
  }

  function handleMouseEnterDay(iso: string) {
    if (!isRangeMode || !dragging || !dragAnchor) return;
    const n = normalizeRange(dragAnchor, iso);
    setPreviewStart(n.start);
    setPreviewEnd(n.end);
  }

  function handleMouseUpDay(iso: string) {
    if (!isRangeMode || !dragging) return;
    commitDrag(iso);
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
    const todayIso = toISO(new Date());
    const today = parseISO(todayIso);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    pickSingle(todayIso);
  }

  const months = lang === "th" ? TH_MONTHS : EN_MONTHS;
  const days = lang === "th" ? TH_DAYS : EN_DAYS;
  const secondMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const activeRangeStart = previewStart ?? rangeStart ?? "";
  const activeRangeEnd = previewEnd ?? rangeEnd ?? "";

  const renderMonth = (year: number, month: number, key: string) => {
    const cells = monthGrid(year, month);
    return (
      <div className="dp-month" key={key}>
        <div className="dp-month-title">
          {months[month]} {lang === "th" ? year + 543 : year}
        </div>
        <div className="dp-grid">
          {days.map((d) => (
            <span key={`${key}-${d}`} className="dp-day-label">{d}</span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={`${key}-empty-${i}`} />;
            const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const selected = iso === value;
            const inRange = isRangeMode && activeRangeStart && activeRangeEnd && iso >= activeRangeStart && iso <= activeRangeEnd;
            return (
              <button
                key={`${key}-${d}`}
                type="button"
                onMouseDown={(event) => handleMouseDownDay(iso, event)}
                onMouseEnter={() => handleMouseEnterDay(iso)}
                onMouseUp={() => handleMouseUpDay(iso)}
                onClick={() => (isRangeMode ? undefined : pickSingle(iso))}
                className={[
                  "dp-day",
                  selected ? "dp-day-selected" : "",
                  isToday(iso) ? "dp-day-today" : "",
                  inRange ? "dp-day-in-range" : ""
                ].join(" ").trim()}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

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
        {value ? formatDisplay(selectedDate) : "Select date"}
      </button>

      {open ? (
        <div className={`date-picker-popover ${isRangeMode ? "date-picker-range" : ""}`}>
          <div className="dp-header">
            <button type="button" onClick={prevMonth} className="dp-nav-btn">‹</button>
            <span className="dp-month-label">{isRangeMode ? "Select date range" : "Select date"}</span>
            <button type="button" onClick={nextMonth} className="dp-nav-btn">›</button>
          </div>
          <div className={`dp-months ${isRangeMode ? "double" : "single"}`}>
            {renderMonth(viewYear, viewMonth, "m1")}
            {isRangeMode ? renderMonth(secondYear, secondMonth, "m2") : null}
          </div>
          <button type="button" className="dp-today-btn" onClick={goToday}>
            {lang === "th" ? "วันนี้" : "Today"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
