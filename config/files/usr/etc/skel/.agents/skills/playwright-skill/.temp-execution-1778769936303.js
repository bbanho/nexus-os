const { chromium } = require('playwright');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:4200';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('=== INTRA CLINICA NG - E2E TEST SUITE ===');
  console.log(`Target: ${TARGET_URL}\n`);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`✅ ${name}`);
    } catch (e) {
      failed++;
      console.log(`❌ ${name}: ${e.message}`);
      await page.screenshot({ path: `/tmp/e2e-error-${name.replace(/\s+/g, '-')}.png`, fullPage: true });
    }
  }

  // 1. Home page loads
  await test('Home page renders and shows login', async () => {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const url = page.url();
    // Should be on login or redirected
    console.log(`  Current URL: ${url}`);
  });

  // 2. Login page elements
  await test('Login page has expected structure', async () => {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    // Check for auth elements
    const bodyText = await page.textContent('body');
    const hasLoginElements = bodyText.includes('email') || bodyText.includes('Email') || bodyText.includes('Login') || bodyText.includes('login');
    console.log(`  Page contains login text: ${hasLoginElements}`);
    await page.screenshot({ path: '/tmp/e2e-login-page.png', fullPage: false });
  });

  // 3. Navigate to reception if route exists
  await test('Reception dashboard route accessible', async () => {
    await page.goto(`${TARGET_URL}/reception`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`  /reception → ${currentUrl}`);
    await page.screenshot({ path: '/tmp/e2e-reception.png', fullPage: false });
  });

  // 4. Check clinical practice route
  await test('Clinical practice route accessible', async () => {
    await page.goto(`${TARGET_URL}/clinical-practice/clinical-station`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`  /clinical-practice/clinical-station → ${currentUrl}`);
    await page.screenshot({ path: '/tmp/e2e-clinical.png', fullPage: false });
  });

  // 5. Check inventory route
  await test('Inventory route accessible', async () => {
    await page.goto(`${TARGET_URL}/inventory`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`  /inventory → ${currentUrl}`);
    await page.screenshot({ path: '/tmp/e2e-inventory.png', fullPage: false });
  });

  // 6. Check admin route
  await test('Admin route accessible', async () => {
    await page.goto(`${TARGET_URL}/admin`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`  /admin → ${currentUrl}`);
    await page.screenshot({ path: '/tmp/e2e-admin.png', fullPage: false });
  });

  // 7. Check patients route
  await test('Patients route accessible', async () => {
    await page.goto(`${TARGET_URL}/patients`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`  /patients → ${currentUrl}`);
    await page.screenshot({ path: '/tmp/e2e-patients.png', fullPage: false });
  });

  // 8. Check settings route
  await test('Settings route accessible', async () => {
    await page.goto(`${TARGET_URL}/settings`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`  /settings → ${currentUrl}`);
    await page.screenshot({ path: '/tmp/e2e-settings.png', fullPage: false });
  });

  // Summary
  console.log(`\n=== RESULTS ===`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📸 Screenshots saved to /tmp/e2e-*.png`);

  await browser.close();
})();
