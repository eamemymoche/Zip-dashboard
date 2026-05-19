import process from "node:process";
import { loadAppEnv } from "./db-env.mjs";

const env = loadAppEnv();
const baseUrl = env.ZIPLINE_BASE_URL ?? process.env.ZIPLINE_BASE_URL ?? "http://127.0.0.1:3000";

async function login(username, password) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/zcc_session=([^;]+)/);
  if (!match) {
    throw new Error(`Session cookie missing for ${username}`);
  }
  return `zcc_session=${match[1]}`;
}

async function hit(path, cookie) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { cookie }
  });
  return res.status;
}

function ok(label) {
  process.stdout.write(`[OK] ${label}\n`);
}

function fail(label, expected, actual) {
  throw new Error(`${label} expected ${expected} but got ${actual}`);
}

async function run() {
  process.stdout.write(`Frontend access guardrails verify started against ${baseUrl}\n`);

  const driverCookie = await login("driver", "driver123");
  const adminCookie = await login("superadmin", "super123");

  const usersDriver = await hit("/api/users", driverCookie);
  if (usersDriver !== 403) fail("DRIVER blocked from /api/users", 403, usersDriver);
  ok("DRIVER blocked from /api/users");

  const logsDriver = await hit("/api/audit-log", driverCookie);
  if (logsDriver !== 403) fail("DRIVER blocked from /api/audit-log", 403, logsDriver);
  ok("DRIVER blocked from /api/audit-log");

  const usersAdmin = await hit("/api/users", adminCookie);
  if (usersAdmin !== 200 && usersAdmin !== 503) fail("ADMIN allowed for /api/users (or DB unavailable)", "200/503", usersAdmin);
  ok("ADMIN access for /api/users verified");

  const logsAdmin = await hit("/api/audit-log", adminCookie);
  if (logsAdmin !== 200 && logsAdmin !== 503) fail("ADMIN allowed for /api/audit-log (or DB unavailable)", "200/503", logsAdmin);
  ok("ADMIN access for /api/audit-log verified");

  process.stdout.write("Frontend access guardrails verify completed successfully.\n");
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
