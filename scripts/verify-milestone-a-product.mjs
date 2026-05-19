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
  const payload = Buffer.from(`milestone-a-manager:MANAGER:${Date.now()}:verify`, "utf8").toString("base64url");
  const sig = crypto.createHash("sha256").update(payload + sessionSecret).digest("hex").slice(0, 16);
  return `zcc_session=${payload}.${sig}`;
}

const cookie = makeManagerCookie();

async function api(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      cookie
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: res.status, json, text };
}

const packageName = `PKT-MA2-${Date.now()}`;
const renamed = `${packageName}-EDIT`;

const client = new Client({ connectionString });
await client.connect();

try {
  process.stdout.write(`Milestone A product verify started against ${baseUrl}\n`);

  const create = await api("POST", "/api/product-package", { name: packageName, detail: "Milestone A create path" });
  if (create.status !== 201) throw new Error(`Create failed: ${create.status} ${create.text}`);
  process.stdout.write("[OK] Product create\n");

  const update = await api("PUT", "/api/product-package", {
    originalName: packageName,
    name: renamed,
    detail: "Milestone A update path"
  });
  if (update.status !== 200) throw new Error(`Update failed: ${update.status} ${update.text}`);
  process.stdout.write("[OK] Product edit\n");

  const deactivate = await api("PATCH", "/api/product-package", { name: renamed, active: false });
  if (deactivate.status !== 200) throw new Error(`Deactivate failed: ${deactivate.status} ${deactivate.text}`);
  process.stdout.write("[OK] Product deactivate\n");

  const activeAgain = await api("PATCH", "/api/product-package", { name: renamed, active: true });
  if (activeAgain.status !== 200) throw new Error(`Activate failed: ${activeAgain.status} ${activeAgain.text}`);
  process.stdout.write("[OK] Product activate\n");

  const rs = await client.query(
    `SELECT name, detail, active FROM "ProductPackage" WHERE name = $1 LIMIT 1`,
    [renamed]
  );
  if (rs.rowCount !== 1) throw new Error("DB row not found after lifecycle operations");
  if (!rs.rows[0].active) throw new Error("Expected package to be active at end of test");
  process.stdout.write("[OK] DB state verified\n");

  process.stdout.write("Milestone A product verify completed successfully.\n");
  await client.end();
  process.exit(0);
} catch (error) {
  process.stderr.write(`${String(error)}\n`);
  await client.end();
  process.exit(1);
}
