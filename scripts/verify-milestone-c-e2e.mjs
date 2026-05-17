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
  const payload = Buffer.from(`milestone-c:MANAGER:${Date.now()}`, "utf8").toString("base64url");
  const sig = crypto.createHash("sha256").update(payload + sessionSecret).digest("hex").slice(0, 16);
  return `zcc_session=${payload}.${sig}; zcc_role=MANAGER`;
}

const cookie = managerCookie();

async function api(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      cookie
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, text, json };
}

const client = new Client({ connectionString });
await client.connect();

const bookingNumber = `TMC-${Date.now()}`;
let updatedAt = null;
let shouldCleanup = false;

async function queryCounts() {
  const sql = `
    SELECT
      (SELECT COUNT(*)::int FROM "Booking" b WHERE b."bookingNumber" = $1) AS booking_count,
      (SELECT COUNT(*)::int FROM "TransportAssignment" ta JOIN "Booking" b ON b.id = ta."bookingId" WHERE b."bookingNumber" = $1) AS transport_count,
      (SELECT COUNT(*)::int FROM "PickupStatusEvent" pe JOIN "Booking" b ON b.id = pe."bookingId" WHERE b."bookingNumber" = $1) AS pickup_count,
      (SELECT COUNT(*)::int FROM "StaffAssignment" sa JOIN "Booking" b ON b.id = sa."bookingId" WHERE b."bookingNumber" = $1) AS staff_count
  `;
  const rs = await client.query(sql, [bookingNumber]);
  return rs.rows[0];
}

async function queryAuditCount() {
  const sql = `
    SELECT COUNT(*)::int AS log_count
    FROM "AuditLog" al
    JOIN "Booking" b ON b.id = al."entityId"
    WHERE b."bookingNumber" = $1
      AND al."entityType" = 'Booking'
      AND al."action" IN ('booking.updated', 'booking.deleted')
  `;
  const rs = await client.query(sql, [bookingNumber]);
  return rs.rows[0]?.log_count ?? 0;
}

try {
  process.stdout.write(`Milestone C integrated verify started against ${baseUrl}\n`);

  const create = await api("POST", "/api/order", {
    bookingNumber,
    serviceDate: "2026-05-16",
    timeSlot: "15:00",
    agentName: "Klook",
    customerName: "Milestone C Verify",
    phone: "0800000000",
    hotel: "Milestone Hotel",
    room: "501",
    pickupPax: 2,
    joinCount: 0,
    productPackageName: "ZIPLINE A",
    status: "WAITING"
  });
  if (create.status !== 201) throw new Error(`Create failed: ${create.status} ${create.text}`);
  updatedAt = create.json.updatedAt;
  shouldCleanup = true;
  process.stdout.write(`[OK] Order create (${bookingNumber})\n`);

  const edit = await api("PUT", "/api/order", {
    bookingNumber,
    customerName: "Milestone C Verify Edited",
    updatedAt
  });
  if (edit.status !== 200) throw new Error(`Edit failed: ${edit.status} ${edit.text}`);
  updatedAt = edit.json.updatedAt;
  process.stdout.write("[OK] Order edit\n");

  const transport = await api("POST", "/api/transport-assignment", {
    bookingNumber,
    driverCode: "C001",
    vehicleCode: "V001",
    adminNote: "milestone-c assignment",
    updatedAt
  });
  if (transport.status !== 200) throw new Error(`Transport failed: ${transport.status} ${transport.text}`);
  updatedAt = transport.json.updatedAt;
  process.stdout.write("[OK] Transport assignment\n");

  const pickup = await api("POST", "/api/pickup-status", {
    bookingNumber,
    status: "BOARDED",
    note: "milestone-c pickup",
    updatedAt
  });
  if (pickup.status !== 201) throw new Error(`Pickup failed: ${pickup.status} ${pickup.text}`);
  updatedAt = pickup.json.updatedAt;
  process.stdout.write("[OK] Pickup status update\n");

  const staffing = await api("POST", "/api/staff-assignment", {
    bookingNumber,
    staffAssignments: ["G001", "G002"],
    updatedAt
  });
  if (staffing.status !== 200) throw new Error(`Staffing failed: ${staffing.status} ${staffing.text}`);
  updatedAt = staffing.json.updatedAt;
  process.stdout.write("[OK] Staffing assignment\n");

  const countsBeforeDelete = await queryCounts();
  if (
    countsBeforeDelete.booking_count < 1 ||
    countsBeforeDelete.transport_count < 1 ||
    countsBeforeDelete.pickup_count < 1 ||
    countsBeforeDelete.staff_count < 1
  ) {
    throw new Error(`Linked rows missing before delete: ${JSON.stringify(countsBeforeDelete)}`);
  }
  process.stdout.write(`[OK] Linked rows present: ${JSON.stringify(countsBeforeDelete)}\n`);

  const auditCount = await queryAuditCount();
  if (auditCount < 1) {
    throw new Error(`Expected at least 1 booking audit row before delete, got ${auditCount}`);
  }
  process.stdout.write(`[OK] Audit rows found: ${auditCount}\n`);

  const staleDelete = await api("DELETE", `/api/order?bookingNumber=${encodeURIComponent(bookingNumber)}`, {
    updatedAt: updatedAt - 60000
  });
  if (staleDelete.status !== 409) {
    throw new Error(`Expected 409 on stale delete, got ${staleDelete.status}`);
  }
  const countsAfterConflict = await queryCounts();
  if (JSON.stringify(countsAfterConflict) !== JSON.stringify(countsBeforeDelete)) {
    throw new Error(`Rows changed after stale delete rejection: ${JSON.stringify(countsAfterConflict)}`);
  }
  process.stdout.write("[OK] Conflict guard on stale delete (409)\n");

  const deleteOk = await api("DELETE", `/api/order?bookingNumber=${encodeURIComponent(bookingNumber)}`, { updatedAt });
  if (deleteOk.status !== 200) throw new Error(`Delete failed: ${deleteOk.status} ${deleteOk.text}`);
  shouldCleanup = false;
  process.stdout.write("[OK] Order delete\n");

  const countsAfterDelete = await queryCounts();
  if (
    countsAfterDelete.booking_count !== 0 ||
    countsAfterDelete.transport_count !== 0 ||
    countsAfterDelete.pickup_count !== 0 ||
    countsAfterDelete.staff_count !== 0
  ) {
    throw new Error(`Expected linked rows removed after delete, got ${JSON.stringify(countsAfterDelete)}`);
  }
  process.stdout.write(`[OK] Linked rows removed: ${JSON.stringify(countsAfterDelete)}\n`);

  process.stdout.write("Milestone C integrated verify completed successfully.\n");
  await client.end();
  process.exit(0);
} catch (error) {
  process.stderr.write(`${String(error)}\n`);
  if (shouldCleanup) {
    try {
      await api("DELETE", `/api/order?bookingNumber=${encodeURIComponent(bookingNumber)}`);
      process.stderr.write(`[CLEANUP] Removed ${bookingNumber}\n`);
    } catch {
      process.stderr.write(`[CLEANUP] Failed to remove ${bookingNumber}\n`);
    }
  }
  await client.end();
  process.exit(1);
}
