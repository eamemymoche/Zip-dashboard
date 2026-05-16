import process from "node:process";
import { Client } from "pg";
import { loadAppEnv } from "./db-env.mjs";

const bookingNumber = process.argv[2];
if (!bookingNumber) {
  process.stderr.write("Usage: node ./scripts/task29-audit-log-by-booking.mjs <BOOKING_NUMBER>\n");
  process.exit(1);
}

const env = loadAppEnv();
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  process.stderr.write("DATABASE_URL is not set. Define it in .env.local or environment.\n");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

try {
  const sql = `
    WITH target_booking AS (
      SELECT id, "bookingNumber"
      FROM "Booking"
      WHERE "bookingNumber" = $1
      LIMIT 1
    )
    SELECT *
    FROM (
      SELECT
        al."createdAt",
        al."entityType",
        al."action",
        al."beforeJson",
        al."afterJson"
      FROM "AuditLog" al
      JOIN target_booking b ON al."entityId" = b.id
      WHERE al."entityType" IN ('Booking', 'TransportAssignment', 'StaffAssignment')

      UNION ALL

      SELECT
        al."createdAt",
        al."entityType",
        al."action",
        al."beforeJson",
        al."afterJson"
      FROM "AuditLog" al
      JOIN "PickupStatusEvent" pse ON pse.id = al."entityId"
      JOIN target_booking b ON pse."bookingId" = b.id
      WHERE al."entityType" = 'PickupStatusEvent'
    ) logs
    ORDER BY "createdAt" DESC;
  `;

  const result = await client.query(sql, [bookingNumber]);
  process.stdout.write(`Audit trace for booking ${bookingNumber}: ${result.rowCount} row(s)\n`);

  for (const row of result.rows) {
    const ts = new Date(row.createdAt).toISOString();
    process.stdout.write(`[${ts}] ${row.entityType} | ${row.action}\n`);
    if (row.beforeJson) process.stdout.write(`  before: ${row.beforeJson}\n`);
    if (row.afterJson) process.stdout.write(`  after : ${row.afterJson}\n`);
  }
} finally {
  await client.end();
}
