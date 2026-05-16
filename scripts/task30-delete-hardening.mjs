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

function makeManagerCookie() {
  const payloadPlain = `task30-manager:MANAGER:${Date.now()}`;
  const payload = Buffer.from(payloadPlain, "utf8").toString("base64url");
  const sig = crypto.createHash("sha256").update(payload + sessionSecret).digest("hex").slice(0, 16);
  const token = `${payload}.${sig}`;
  return `zcc_session=${token}; zcc_role=MANAGER`;
}

const authCookie = makeManagerCookie();

async function api(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      cookie: authCookie
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function getCounts(client, bookingNumber) {
  const sql = `
    SELECT
      (SELECT COUNT(*)::int FROM "Booking" b WHERE b."bookingNumber" = $1) AS booking_count,
      (SELECT COUNT(*)::int FROM "TransportAssignment" ta JOIN "Booking" b ON b.id = ta."bookingId" WHERE b."bookingNumber" = $1) AS transport_count,
      (SELECT COUNT(*)::int FROM "PickupStatusEvent" pe JOIN "Booking" b ON b.id = pe."bookingId" WHERE b."bookingNumber" = $1) AS pickup_count,
      (SELECT COUNT(*)::int FROM "StaffAssignment" sa JOIN "Booking" b ON b.id = sa."bookingId" WHERE b."bookingNumber" = $1) AS staff_count;
  `;
  const rs = await client.query(sql, [bookingNumber]);
  return rs.rows[0];
}

const client = new Client({ connectionString });
await client.connect();

const bookingNumber = `T30-${Date.now()}`;
let updatedAt = null;
let shouldCleanup = false;

try {
  process.stdout.write(`Task30 hardening verify started against ${baseUrl}\n`);

  const create = await api("POST", "/api/order", {
    bookingNumber,
    serviceDate: "2026-05-16",
    timeSlot: "13:00",
    agentName: "Klook",
    customerName: "Task30 Delete",
    phone: "0800000000",
    hotel: "Delete Hotel",
    room: "301",
    pickupPax: 2,
    joinCount: 0,
    productPackageName: "ZIPLINE A",
    status: "WAITING"
  });
  if (create.status !== 201) throw new Error(`Create failed: ${create.status} ${create.text}`);
  updatedAt = create.json.updatedAt;
  shouldCleanup = true;
  process.stdout.write("[OK] Create booking\n");

  const transport = await api("POST", "/api/transport-assignment", {
    bookingNumber,
    driverCode: "C001",
    vehicleCode: "V001",
    adminNote: "task30 linked data",
    updatedAt
  });
  if (transport.status !== 200) throw new Error(`Transport write failed: ${transport.status}`);
  updatedAt = transport.json.updatedAt;
  process.stdout.write("[OK] Transport linked row\n");

  const pickup = await api("POST", "/api/pickup-status", {
    bookingNumber,
    status: "BOARDED",
    note: "task30 linked data",
    updatedAt
  });
  if (pickup.status !== 201) throw new Error(`Pickup write failed: ${pickup.status}`);
  updatedAt = pickup.json.updatedAt;
  process.stdout.write("[OK] Pickup linked row\n");

  const staff = await api("POST", "/api/staff-assignment", {
    bookingNumber,
    staffAssignments: ["G001", "G002"],
    updatedAt
  });
  if (staff.status !== 200) throw new Error(`Staff write failed: ${staff.status}`);
  updatedAt = staff.json.updatedAt;
  process.stdout.write("[OK] Staff linked row\n");

  const before = await getCounts(client, bookingNumber);
  if (before.booking_count < 1 || before.transport_count < 1 || before.pickup_count < 1 || before.staff_count < 1) {
    throw new Error(`Expected linked rows before delete, got ${JSON.stringify(before)}`);
  }
  process.stdout.write(`[OK] Linked rows present before delete: ${JSON.stringify(before)}\n`);

  // Rollback/guard behavior: stale token should fail and keep rows unchanged
  const staleDelete = await api("DELETE", `/api/order?bookingNumber=${encodeURIComponent(bookingNumber)}`, {
    updatedAt: updatedAt - 60000
  });
  if (staleDelete.status !== 409) throw new Error(`Expected 409 on stale delete, got ${staleDelete.status}`);
  const afterConflict = await getCounts(client, bookingNumber);
  if (JSON.stringify(afterConflict) !== JSON.stringify(before)) {
    throw new Error(`Rows changed after rejected delete (expected rollback/guard). before=${JSON.stringify(before)} after=${JSON.stringify(afterConflict)}`);
  }
  process.stdout.write("[OK] Stale delete rejected with 409 and rows unchanged\n");

  const deleteOk = await api("DELETE", `/api/order?bookingNumber=${encodeURIComponent(bookingNumber)}`, {
    updatedAt
  });
  if (deleteOk.status !== 200) throw new Error(`Delete failed: ${deleteOk.status} ${deleteOk.text}`);
  shouldCleanup = false;
  process.stdout.write("[OK] Delete with fresh token\n");

  const after = await getCounts(client, bookingNumber);
  if (after.booking_count !== 0 || after.transport_count !== 0 || after.pickup_count !== 0 || after.staff_count !== 0) {
    throw new Error(`Expected all linked rows removed after delete, got ${JSON.stringify(after)}`);
  }
  process.stdout.write(`[OK] Linked rows removed after delete: ${JSON.stringify(after)}\n`);
  process.stdout.write("Task30 hardening verification completed successfully.\n");
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
