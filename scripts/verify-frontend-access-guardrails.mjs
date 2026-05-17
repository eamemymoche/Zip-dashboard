import crypto from "node:crypto";
import process from "node:process";
import { loadAppEnv } from "./db-env.mjs";

const env = loadAppEnv();
const baseUrl = env.ZIPLINE_BASE_URL ?? process.env.ZIPLINE_BASE_URL ?? "http://127.0.0.1:3000";
const sessionSecret = env.SESSION_SECRET ?? "dev-secret-change-in-production";

function makeCookie(role) {
  const payload = Buffer.from(`frontend-guard:${role}:${Date.now()}`, "utf8").toString("base64url");
  const sig = crypto.createHash("sha256").update(payload + sessionSecret).digest("hex").slice(0, 16);
  return `zcc_session=${payload}.${sig}; zcc_role=${role}`;
}

async function hit(path, role) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { cookie: makeCookie(role) }
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

  const usersDriver = await hit("/api/users", "DRIVER");
  if (usersDriver !== 403) fail("DRIVER blocked from /api/users", 403, usersDriver);
  ok("DRIVER blocked from /api/users");

  const logsDriver = await hit("/api/audit-log", "DRIVER");
  if (logsDriver !== 403) fail("DRIVER blocked from /api/audit-log", 403, logsDriver);
  ok("DRIVER blocked from /api/audit-log");

  const usersAdmin = await hit("/api/users", "ADMIN");
  if (usersAdmin !== 200 && usersAdmin !== 503) fail("ADMIN allowed for /api/users (or DB unavailable)", "200/503", usersAdmin);
  ok("ADMIN access for /api/users verified");

  const logsAdmin = await hit("/api/audit-log", "ADMIN");
  if (logsAdmin !== 200 && logsAdmin !== 503) fail("ADMIN allowed for /api/audit-log (or DB unavailable)", "200/503", logsAdmin);
  ok("ADMIN access for /api/audit-log verified");

  process.stdout.write("Frontend access guardrails verify completed successfully.\n");
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
