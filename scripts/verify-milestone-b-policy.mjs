import { readFile } from "node:fs/promises";

const checks = [];

async function fileContains(path, needle) {
  const text = await readFile(path, "utf8");
  return text.includes(needle);
}

async function expectContains(path, needle, label) {
  const ok = await fileContains(path, needle);
  checks.push({ label, ok, detail: `${path} includes "${needle}"` });
}

async function expectNotContains(path, needle, label) {
  const ok = !(await fileContains(path, needle));
  checks.push({ label, ok, detail: `${path} does not include "${needle}"` });
}

async function run() {
  console.log("Milestone B policy verify started");

  await expectContains(
    "apps/web/app/api/employee/route.ts",
    'status: 503',
    "Employee API returns 503 when DB unavailable"
  );
  await expectContains(
    "apps/web/app/api/product-package/route.ts",
    'status: 503',
    "ProductPackage API returns 503 when DB unavailable"
  );
  await expectContains(
    "apps/web/app/operations-dashboard.tsx",
    "ฐานข้อมูลไม่พร้อมใช้งาน: ยังไม่สามารถบันทึกบุคลากรได้",
    "Personnel UI shows fail-fast message for DB unavailable"
  );
  await expectNotContains(
    "apps/web/app/operations-dashboard.tsx",
    "เฉพาะหน้าปัจจุบัน",
    "No local-only success message remains in Personnel flow"
  );
  await expectContains(
    "Zip/03_Build/Fallback Policy Matrix.md",
    "DB-required write",
    "Policy matrix document exists with DB-required category"
  );

  let failed = 0;
  for (const check of checks) {
    if (check.ok) {
      console.log(`[OK] ${check.label}`);
    } else {
      failed += 1;
      console.error(`[FAIL] ${check.label}`);
      console.error(`  ${check.detail}`);
    }
  }

  if (failed > 0) {
    console.error(`Milestone B policy verify failed with ${failed} issue(s).`);
    process.exit(1);
  }

  console.log("Milestone B policy verify completed successfully.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
