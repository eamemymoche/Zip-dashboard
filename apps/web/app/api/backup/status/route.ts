import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_BACKUP_READ } from "../../../../lib/auth/role-guards";
import { requireRole } from "../../../../lib/auth/server-session";

const backupPlan = {
  version: 1,
  status: "ready-to-configure",
  recoveryMode: "overlap-safe",
  lastVerifiedAt: null,
  nextRecommendedCheck: "daily-close",
  layers: [
    { key: "database", label: "Database Snapshot", state: "planned", flexible: true },
    { key: "config", label: "App Config Pack", state: "ready", flexible: true },
    { key: "audit", label: "Audit Trail", state: "active", flexible: true },
    { key: "attachments", label: "Attachment Vault", state: "future-plugin", flexible: true }
  ],
  plugins: [
    { key: "scheduler", label: "Auto Snapshot Scheduler", state: "planned" },
    { key: "offsite", label: "Offsite Mirror", state: "provider-neutral" },
    { key: "checksum", label: "Integrity Check", state: "planned" },
    { key: "compare", label: "Overlap Compare", state: "planned" }
  ],
  guardrails: [
    "Restore must require server-side dry-run compare first.",
    "Storage provider must stay pluggable.",
    "Backup schema must support future data model changes.",
    "Real restore execution must be SUPERADMIN-only and audited."
  ]
};

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_BACKUP_READ);
  if ("response" in auth) return auth.response;

  return NextResponse.json({
    ...backupPlan,
    requestedBy: auth.userId,
    generatedAt: new Date().toISOString()
  });
}
