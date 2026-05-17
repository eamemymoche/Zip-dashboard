import type { EmployeeRecord, OrderRecord } from "./ops-data";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseDateAtBangkok(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+07:00`);
}

export function formatJobOrderDate(isoDate: string): string {
  const date = parseDateAtBangkok(isoDate);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok"
  });
}

export function formatPrintedAt(date: Date): string {
  const bangkok = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  return `${pad(bangkok.getDate())}/${pad(bangkok.getMonth() + 1)}/${bangkok.getFullYear()} ${pad(bangkok.getHours())}:${pad(bangkok.getMinutes())}:${pad(bangkok.getSeconds())}`;
}

function formatTimeLabel(hours: number, minutes: number): string {
  const suffix = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(h12)}.${pad(minutes)} ${suffix}`;
}

export function buildPickupWindow(orders: OrderRecord[]): string {
  if (orders.length === 0) return "-";
  const sorted = [...new Set(orders.map((order) => order.time))].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const [startHour, startMinute] = first.split(":").map(Number);
  const [endHour, endMinute] = last.split(":").map(Number);
  const endDate = new Date(Date.UTC(2026, 0, 1, endHour, endMinute + 30));
  return `${formatTimeLabel(startHour, startMinute)} - ${formatTimeLabel(endDate.getUTCHours(), endDate.getUTCMinutes())}`;
}

export function buildJobNumber(allOrdersForDate: OrderRecord[], selectedDriver: string, transportDate: string): string {
  const activeDrivers = [...new Set(
    allOrdersForDate
      .filter((order) => order.driver)
      .sort((left, right) => left.time.localeCompare(right.time) || left.driver.localeCompare(right.driver))
      .map((order) => order.driver)
  )];
  const sequence = Math.max(activeDrivers.indexOf(selectedDriver) + 1, 1);
  const slotCount = Math.max(new Set(
    allOrdersForDate
      .filter((order) => order.driver === selectedDriver)
      .map((order) => order.time)
  ).size, 1);
  const compactDate = transportDate.slice(2).replaceAll("-", "");
  return `JOB-${compactDate}${sequence}/${slotCount}`;
}

export function getDriverMeta(drivers: EmployeeRecord[], selectedDriver: string) {
  return drivers.find((driver) => driver.name === selectedDriver) ?? null;
}
