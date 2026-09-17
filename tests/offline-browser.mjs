import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import * as XLSX from 'xlsx';

const browser = await chromium.launch({headless: true, channel: 'msedge'});
const context = await browser.newContext({acceptDownloads: true});
const page = await context.newPage();
const errors = [], network = [];

page.on('pageerror', e => errors.push(e.message));
page.on('request', r => {
  if (/^https?:/.test(r.url()) && !r.url().includes('fonts.google') && !r.url().includes('gstatic.com')) network.push(r.url());
});

try {
  console.log('1. Opening index.html...');
  await page.goto(pathToFileURL(path.resolve('index.html')).href, {waitUntil: 'load', timeout: 60000});
  await page.waitForSelector('.app', {timeout: 60000});

  // Check sidebar & dashboard
  console.log('2. Checking sidebar & stats...');
  assert.equal(await page.locator('.sidebar').count(), 1);
  assert.ok((await page.locator('.stats').innerText()).includes('Sản phẩm Lock&King'));

  // Go to 'Sản phẩm đối thủ'
  console.log('3. Navigating to rivals...');
  await page.locator('.sidebar nav button').filter({hasText: 'Sản phẩm đối thủ'}).click();
  await page.locator('.page-heading h1:has-text("Sản phẩm đối thủ")').waitFor();
  await page.locator('.filter-panel input[aria-label="Tìm sản phẩm"]').fill('HR-CD1208');
  await page.waitForTimeout(300);
  const hareCard = page.locator('.product-card').first();
  await hareCard.waitFor();
  assert.match(await hareCard.innerText(), /690.000/);
  assert.match(await hareCard.innerText(), /1.190.000/);
  await hareCard.locator('img').evaluate(img => img.decode());
  await hareCard.locator('.select-check').check();
  console.log('Selected HR-CD1208');

  // Go to 'Sản phẩm Lock&King'
  console.log('4. Navigating to own...');
  await page.getByRole('button', {name: 'Sản phẩm Lock&King', exact: true}).click();
  await page.locator('.page-heading h1:has-text("Sản phẩm Lock&King")').waitFor();
  await page.locator('.filter-panel input[aria-label="Tìm sản phẩm"]').fill('LK-668');
  await page.waitForTimeout(300);
  const ownCard = page.locator('.product-card').first();
  await ownCard.waitFor();
  await ownCard.locator('.select-check').check();
  console.log('Selected Lock&King product');

  // Check comparison (auto-navigated by Lock&King smart match or tray)
  console.log('5. Comparing...');
  if (await page.locator('.compare-tray button.primary').isVisible()) {
    await page.locator('.compare-tray button.primary').click();
  }
  await page.waitForSelector('.comparison-table');
  const priceRow = page.locator('tr').filter({has: page.locator('th').filter({hasText: /^Giá NPP \/ phân phối$/})}).first();
  assert.match(await priceRow.innerText(), /460.000/);
  assert.match(await priceRow.innerText(), /690.000/);
  await page.screenshot({path: 'tmp/offline-comparison.png', fullPage: false});
  console.log('Comparison verified.');

  // Go to 'Quản trị & Sao lưu' and test export
  console.log('6. Exporting all brands from admin page...');
  await page.locator('.sidebar nav button').filter({hasText: 'Quản trị & Sao lưu'}).click();
  await page.waitForSelector('.panels');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Xuất tất cả hãng (.xlsx)', exact: true}).click();
  const download = await downloadEvent;
  const wb = XLSX.read(fs.readFileSync(await download.path()));
  assert.ok(wb.SheetNames.includes('Hare'));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Hare);
  assert.equal(rows.find(p => p['Mã sản phẩm'] === 'HR-CD1208')['Giá NPP / phân phối (báo giá)'], 690000);
  console.log('Excel export verified.');

  // Add a product and test persistence
  console.log('7. Adding product...');
  await page.getByRole('button', {name: 'Thêm sản phẩm', exact: true}).click();
  await page.locator('label:has-text("Mã sản phẩm") input').fill('OFFLINE-TEST');
  await page.locator('label:has-text("Tên sản phẩm") input').fill('Kiểm thử lưu offline');
  await page.locator('label:has-text("Thương hiệu") input').fill('Test');
  await page.locator('label:has-text("Nhóm ngành hàng") input').fill('Test');
  await page.getByRole('button', {name: 'Lưu sản phẩm', exact: true}).click();
  await page.locator('.modal-backdrop').waitFor({state: 'hidden'});
  console.log('Product added.');

  // Reload and check
  console.log('8. Reloading and verifying persistence...');
  await page.reload({waitUntil: 'load', timeout: 60000});
  await page.waitForSelector('.app');
  await page.locator('.sidebar nav button').filter({hasText: 'Sản phẩm đối thủ'}).click();
  await page.waitForSelector('.product-grid');
  await page.getByLabel('Tìm sản phẩm').fill('OFFLINE-TEST');
  await page.waitForTimeout(300);
  const testCard = page.locator('.product-card').first();
  await testCard.waitFor();
  assert.equal(await page.locator('.product-card').count(), 1);
  // 9. Check 'Sản phẩm Lock&King chưa có'
  console.log('9. Navigating to missing products view...');
  await page.getByRole('button', {name: 'Sản phẩm Lock&King chưa có', exact: true}).click();
  await page.locator('.page-heading h1:has-text("Sản phẩm Lock&King chưa có")').waitFor();
  await page.waitForSelector('.missing-products-workspace');
  const missingCount = await page.locator('.missing-card').count();
  assert.ok(missingCount > 50, `Expected many missing products, got ${missingCount}`);
  console.log(`Verified ${missingCount} missing products on first view.`);

  assert.deepEqual(errors, []);
  console.log(JSON.stringify({products: 363, priceRow: 'Lock&King 460000 / Hare 690000', excelSheets: wb.SheetNames.length, persistence: 'passed', missingCount, errors}));
} finally {
  await context.close();
  await browser.close();
}
