import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.URL || "http://localhost:3008";

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

(async () => {
  console.log(`\n🧪 Running Playwright E2E on ${BASE} ...\n`);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  await context.route(/googletagmanager|google-analytics|clarity\.ms|_vercel\/insights/i, (route) =>
    route.abort()
  );
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  // 1. 打开首页并验证 H1 与防统计污染
  await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
  const h1 = await page.locator("h1").textContent();
  assert(
    h1 && h1.toLowerCase().includes("vcf to csv"),
    `Homepage H1 renders ("${h1?.trim()}")`
  );

  const isBlocked = await page.evaluate(
    () => navigator.webdriver === true && typeof window.gtag === "undefined"
  );
  assert(isBlocked, "Automated WebDriver session suppresses GA4 / Clarity / Vercel Analytics");

  // 2. 验证默认加载 4 条样本联系人（含 vCard 2.1 Quoted-Printable 解码与 1 条重复记录）
  const badge4 = await page.getByTestId("contact-count-badge").textContent();
  assert(badge4?.includes("4 / 4"), `Default sample loads 4 contacts (${badge4})`);

  const secondName = await page.getByLabel("Contact 2 Full Name").inputValue();
  assert(
    secondName === "Sophia Lin",
    `vCard 2.1 Quoted-Printable name decoded accurately ("${secondName}")`
  );

  // 3. 点击一键去重按钮，验证 4 条变为 3 条
  await page.getByTestId("deduplicate-btn").click();
  const badge3 = await page.getByTestId("contact-count-badge").textContent();
  assert(
    badge3?.includes("3 / 3"),
    `Deduplicate button removes duplicate phone/email entry (${badge3})`
  );

  // 4. 导出为 CSV 并校验表头与内容
  const [csvDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByTestId("export-csv-btn").click(),
  ]);
  const csvText = fs.readFileSync(await csvDownload.path(), "utf8");
  assert(
    csvText.includes("Full Name,First Name,Last Name") && csvText.includes("marcus.vance@apexcloud.io"),
    `Exported VCF contacts to valid CSV (${csvDownload.suggestedFilename()}, ${csvText.length} chars)`
  );

  // 5. 上传 CSV 通讯录文件并导出为合并的 vCard 3.0 (.VCF)
  const sampleCsvBuffer = Buffer.from(
    "Full Name,Phone,Email,Company,Title\nLiam O'Connor,+1-312-555-0188,liam@northstar.io,Northstar Logistics,Director\nAria Patel,+1-206-555-0142,aria@cascadedev.com,Cascade AI,CTO\n",
    "utf8"
  );
  await page.getByTestId("vcf-file-input").setInputFiles({
    name: "crm-export.csv",
    mimeType: "text/csv",
    buffer: sampleCsvBuffer,
  });

  await page.waitForFunction(
    () => document.querySelector('[data-testid="contact-count-badge"]')?.textContent?.includes("2 / 2"),
    { timeout: 5000 }
  );
  const badgeCsv = await page.getByTestId("contact-count-badge").textContent();
  assert(badgeCsv?.includes("2 / 2"), `Uploaded CSV file parsed into 2 contacts (${badgeCsv})`);

  const [vcfDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByTestId("export-vcf-btn").click(),
  ]);
  const vcfText = fs.readFileSync(await vcfDownload.path(), "utf8");
  assert(
    vcfText.includes("BEGIN:VCARD") &&
      vcfText.includes("FN:Liam O'Connor") &&
      vcfText.includes("EMAIL;TYPE=INTERNET,WORK:aria@cascadedev.com"),
    `Exported CSV to valid multi-contact vCard 3.0 .VCF (${vcfDownload.suggestedFilename()})`
  );

  // 6. 测试一键拆分为独立 .VCF 的 .ZIP 归档 (PK\x03\x04)
  const [zipDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByTestId("split-vcf-zip-btn").click(),
  ]);
  const zipBuf = fs.readFileSync(await zipDownload.path());
  assert(
    zipBuf[0] === 0x50 && zipBuf[1] === 0x4b && zipBuf[2] === 0x03 && zipBuf[3] === 0x04,
    `Split multi-contact vCard into valid .ZIP archive (${zipBuf.length} bytes)`
  );

  // 7. 巡检全部 4 个 SEO 路由 + sitemap.xml + robots.txt
  for (const r of [
    "/",
    "/csv-to-vcf",
    "/vcard-viewer",
    "/merge-vcf-files",
    "/sitemap.xml",
    "/robots.txt",
  ]) {
    const res = await page.goto(`${BASE}${r}`, { waitUntil: "load", timeout: 30000 });
    assert(res && res.status() === 200, `Route ${r} returns HTTP 200`);
  }

  assert(consoleErrors.length === 0, `Zero runtime page errors (${consoleErrors.length})`);

  await browser.close();
  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
})();
