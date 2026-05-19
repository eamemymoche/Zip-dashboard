import crypto from "node:crypto";
import process from "node:process";
import { Client } from "pg";
import { loadAppEnv } from "./db-env.mjs";

const env = loadAppEnv();
const baseUrl = env.ZIPLINE_BASE_URL ?? process.env.ZIPLINE_BASE_URL ?? "http://127.0.0.1:3000";
const sessionSecret = env.SESSION_SECRET ?? "dev-secret-change-in-production";
const connectionString = env.DATABASE_URL;

if (!connectionString) {
  process.stderr.write("DATABASE_URL is not set. Define it in .env.local or environment.\n");
  process.exit(1);
}

function managerCookie() {
  const payload = Buffer.from(`task29-manager:MANAGER:${Date.now()}:verify`, "utf8").toString("base64url");
  const sig = crypto.createHash("sha256").update(payload + sessionSecret).digest("hex").slice(0, 16);
  return `zcc_session=${payload}.${sig}`;
}

const cookie = managerCookie();
const bookingNumber = `T29-${Date.now()}`;
let updatedAt = null;

async function api(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json", cookie },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: res.status, json, text };
}

const client = new Client({ connectionString });
await client.connect();

try {
  process.stdout.write(`Task29 verify started against ${baseUrl}\n`);

  const create = await api("POST", "/api/order", {
    bookingNumber,
    serviceDate: "2026-05-16",
    timeSlot: "16:00",
    agentName: "Klook",
    customerName: "Task29 Verify",
    phone: "0800",
    hotel: "Task29 Hotel",
    room: "401",
    pickupPax: 1,
    joinCount: 0,
    productPackageName: "ZIPLINE A",
    status: "WAITING"
  });
  if (create.status !== 201) throw new Error(`Create failed: ${create.status}`);
  updatedAt = create.json.updatedAt;

  const edit = await api("PUT", "/api/order", {
    bookingNumber,
    customerName: "Task29 Verify Edit",
    updatedAt
  });
  if (edit.status !== 200) throw new Error(`Edit failed: ${edit.status}`);
  updatedAt = edit.json.updatedAt;
  process.stdout.write("[OK] Fixture create/edit done\n");

  const sql = `
    SELECT COUNT(*)::int AS log_count
    FROM "AuditLog" al
    JOIN "Booking" b ON b.id = al."entityId"
    WHERE b."bookingNumber" = $1
      AND al."entityType" = 'Booking'
      AND al."action" IN ('booking.updated', 'booking.deleted');
  `;
  const rs = await client.query(sql, [bookingNumber]);
  const logCount = rs.rows[0]?.log_count ?? 0;
  if (logCount < 1) {
    throw new Error(`Expected at least 1 booking audit log row, got ${logCount}`);
  }
  process.stdout.write(`[OK] Audit rows found for booking ${bookingNumber}: ${logCount}\n`);

  const del = await api("DELETE", `/api/order?bookingNumber=${encodeURIComponent(bookingNumber)}`, { updatedAt });
  if (del.status !== 200) throw new Error(`Delete failed: ${del.status}`);
  process.stdout.write("[OK] Cleanup delete\n");

  process.stdout.write("Task29 verify completed successfully.\n");
  await client.end();
  process.exit(0);
} catch (error) {
  process.stderr.write(`${String(error)}\n`);
  try {
    await api("DELETE", `/api/order?bookingNumber=${encodeURIComponent(bookingNumber)}`);
  } catch {}
  await client.end();
  process.exit(1);
}
