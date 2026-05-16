import { chromium } from "playwright";

const baseUrl = process.env.ZIPLINE_BASE_URL ?? "http://127.0.0.1:3000";

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function clickFirst(page, selectors, stepName) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      await locator.click();
      log(`[OK] ${stepName} => ${selector}`);
      return;
    }
  }
  throw new Error(`[FAIL] ${stepName} (no selector matched)`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  log(`Task27 UI verify started against ${baseUrl}`);

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: /email/i }).fill("officer@zipline.com");
  await page.locator('input[type="password"], input[type="text"]').first().fill("zipline123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(`${baseUrl}/`, { timeout: 15000 });
  await page.waitForTimeout(800);
  log("[OK] Login UI flow");

  // Task 27: Personnel expand/edit modal path
  await clickFirst(
    page,
    [
      'aside .sidebar-item:has-text("Personnel")',
      'aside .sidebar-item:has-text("บุคลากร")',
      'aside .sidebar-item:has-text("personnel")'
    ],
    "Open Personnel view"
  );

  await page.waitForSelector(".personnel-card-main", { timeout: 15000 });
  await page.locator(".personnel-card-main").first().click();
  await page.waitForSelector(".personnel-detail-panel", { timeout: 15000 });
  log("[OK] Personnel expand");

  await clickFirst(
    page,
    [
      '.personnel-detail-panel button:has-text("แก้ไขข้อมูล")',
      '.personnel-detail-panel button:has-text("Edit")',
      '.personnel-detail-panel .indigo-button'
    ],
    "Open Personnel edit modal"
  );
  await page.waitForSelector(".modal-card", { timeout: 15000 });
  log("[OK] Personnel edit modal opened");

  await clickFirst(
    page,
    [
      '.modal-actions button:has-text("ยกเลิก")',
      '.modal-actions button:has-text("Cancel")'
    ],
    "Close Personnel edit modal"
  );
  await page.waitForSelector(".modal-card", { state: "hidden", timeout: 15000 });
  log("[OK] Personnel edit modal close");

  // Task 27: Master view switching
  await clickFirst(
    page,
    [
      'aside .sidebar-item:has-text("Master Ops")',
      'aside .sidebar-item:has-text("Master")'
    ],
    "Open Master view"
  );
  await page.waitForSelector(".subnav", { timeout: 15000 });
  await page.waitForSelector("h2", { timeout: 15000 });
  log("[OK] Master summary rendered");

  await clickFirst(
    page,
    [
      '.subnav-button:has-text("Pivot")',
      '.subnav-button:has-text("วิเคราะห์ข้อมูล")'
    ],
    "Switch to Master pivot"
  );
  await page.waitForSelector('select option[value="agent"]', { state: "attached", timeout: 15000 });
  log("[OK] Master pivot rendered");

  await clickFirst(
    page,
    [
      '.subnav-button:has-text("Product")',
      '.subnav-button:has-text("แพ็กเกจ")'
    ],
    "Switch to Master products"
  );
  await page.waitForSelector(".packet-card", { timeout: 15000 });
  const packetCount = await page.locator(".packet-card").count();
  if (packetCount < 1) {
    throw new Error("[FAIL] Master products rendered but no packet cards found");
  }
  log(`[OK] Master products rendered => packet cards: ${packetCount}`);

  await page.screenshot({ path: "task27-ui-verify.png", fullPage: true });
  log("[OK] Screenshot saved: task27-ui-verify.png");
  log("Task27 UI verification completed successfully.");
  await browser.close();
  process.exit(0);
} catch (error) {
  log(String(error));
  await browser.close();
  process.exit(1);
}
