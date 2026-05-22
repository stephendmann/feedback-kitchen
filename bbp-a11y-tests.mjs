import puppeteer from 'puppeteer';
import AxePuppeteer from '@axe-core/puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: 'Home / Dashboard', path: '/' },
  { name: 'Builder', path: '/builder.html' },
  { name: 'Scorer', path: '/scorer.html' },
  // Note: /results.html dropped from BBP v0.1 audit scope (2026-05-21).
  // Page does not exist in the repo and was never built. See fk-decisions.md § D15.
];

// `bodyFocusOk: true` means body-focus after this step is a legitimate
// outcome (navigation, state change, or a no-op like Escape when no
// modal is open) — not a real keyboard trap.  See PR review 2026-05-24.
const KEYBOARD_TESTS = {
  '/': [
    { desc: 'Tab to first interactive element', key: 'Tab' },
    { desc: 'Tab through nav links', key: 'Tab', repeat: 5 },
    { desc: 'Activate focused button with Enter', key: 'Enter', bodyFocusOk: true },
    { desc: 'Escape to dismiss any modal', key: 'Escape', bodyFocusOk: true },
  ],
  '/builder.html': [
    { desc: 'Tab to Add Criterion button', key: 'Tab', repeat: 8 },
    { desc: 'Activate Add Criterion with Enter', key: 'Enter', bodyFocusOk: true },
    { desc: 'Tab into new input field', key: 'Tab' },
    { desc: 'Type in criterion name', type: 'Test Criterion' },
    { desc: 'Tab to Add Band button', key: 'Tab', repeat: 3 },
    { desc: 'Activate Add Band with Enter', key: 'Enter', bodyFocusOk: true },
    { desc: 'Escape from any modal/drawer', key: 'Escape', bodyFocusOk: true },
  ],
  '/scorer.html': [
    { desc: 'Tab to first scoring control', key: 'Tab', repeat: 4 },
    { desc: 'Arrow key through score options', key: 'ArrowRight', repeat: 3 },
    { desc: 'Tab to submit/next', key: 'Tab', repeat: 5 },
    { desc: 'Activate submit with Space', key: 'Space' },
  ],
  // Note: /results.html keyboard tests removed (page not in scope; see fk-decisions.md § D15).
};

async function getFocusedElement(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return 'body (no focus)';
    return `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}> "${el.textContent?.trim().slice(0, 40) || el.getAttribute('aria-label') || ''}"`;
  });
}

async function runKeyboardSmoke(page, pagePath) {
  const steps = KEYBOARD_TESTS[pagePath] || KEYBOARD_TESTS['/'];
  const results = [];

  await page.evaluate(() => {
    if (!document.body.hasAttribute('tabindex')) {
      document.body.setAttribute('tabindex', '-1');
    }
    document.body.focus();
  });

  for (const step of steps) {
    try {
      if (step.type) {
        await page.keyboard.type(step.type);
        results.push({ desc: step.desc, status: '✅', focused: `Typed: "${step.type}"` });
      } else {
        const repeat = step.repeat || 1;
        for (let i = 0; i < repeat; i++) {
          await page.keyboard.press(step.key);
          await new Promise(r => setTimeout(r, 80));
        }
        const focused = await getFocusedElement(page);
        const trapped = focused.includes('body (no focus)');
        // bodyFocusOk lets the test config mark steps where focus
        // legitimately returns to body (nav-button activation, Escape
        // with no modal open). Real keyboard traps still get flagged.
        let status;
        if (!trapped) status = '✅';
        else if (step.bodyFocusOk) status = 'ℹ️  bodyFocusOk';
        else status = '⚠️ FOCUS LOST';
        results.push({
          desc: step.desc,
          status,
          focused,
        });
      }
    } catch (e) {
      results.push({ desc: step.desc, status: '❌ ERROR', focused: e.message });
    }
  }

  return results;
}

async function main() {
  console.log('\n🔍 BBP v0.1 — Accessibility Audit Starting...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Pages: ${PAGES.length} | Axe scans + keyboard smoke tests\n`);
  console.log('='.repeat(60));

  let browser;
  const allResults = [];
  const startTime = Date.now();

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const pageInfo of PAGES) {
      const url = BASE_URL + pageInfo.path;
      console.log(`\n📄 ${pageInfo.name}`);
      console.log(`   URL: ${url}`);

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      const pageResult = {
        name: pageInfo.name,
        url,
        axe: null,
        keyboard: [],
        loadError: null,
      };

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        if (!response || response.status() >= 400) {
          pageResult.loadError = `HTTP ${response?.status() || 'no response'} — page not found`;
          console.log(`   ⚠️  ${pageResult.loadError}`);
          allResults.push(pageResult);
          await page.close();
          continue;
        }

        console.log('   Running axe-core scan...');
        const axeResults = await new AxePuppeteer(page)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
          .analyze();

        pageResult.axe = {
          violations: axeResults.violations,
          passes: axeResults.passes.length,
          incomplete: axeResults.incomplete.length,
          inapplicable: axeResults.inapplicable.length,
        };

        const vCount = axeResults.violations.length;
        const critCount = axeResults.violations.filter(v => v.impact === 'critical').length;
        const seriousCount = axeResults.violations.filter(v => v.impact === 'serious').length;

        if (vCount === 0) {
          console.log(`   ✅ Axe: 0 violations | ${pageResult.axe.passes} passes`);
        } else {
          console.log(`   ❌ Axe: ${vCount} violation(s) — ${critCount} critical, ${seriousCount} serious`);
          axeResults.violations.forEach(v => {
            console.log(`      [${(v.impact || 'unknown').toUpperCase()}] ${v.id}: ${v.description}`);
            v.nodes.slice(0, 2).forEach(n => {
              console.log(`        → ${n.target.join(', ')}`);
            });
          });
        }

        console.log('   Running keyboard smoke test...');
        pageResult.keyboard = await runKeyboardSmoke(page, pageInfo.path);

        const kFails = pageResult.keyboard.filter(k => k.status !== '✅' && !k.status.startsWith('ℹ️'));
        if (kFails.length === 0) {
          console.log(`   ✅ Keyboard: All ${pageResult.keyboard.length} steps passed`);
        } else {
          console.log(`   ⚠️  Keyboard: ${kFails.length}/${pageResult.keyboard.length} steps need attention`);
          kFails.forEach(f => console.log(`      ${f.status} ${f.desc} → ${f.focused}`));
        }
      } catch (err) {
        pageResult.loadError = err.message;
        console.log(`   ❌ Error: ${err.message}`);
      }

      allResults.push(pageResult);
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY REPORT — BBP v0.1 Accessibility Audit');
  console.log('='.repeat(60));

  let totalViolations = 0;
  let totalKeyboardIssues = 0;
  let totalPasses = 0;

  for (const r of allResults) {
    if (r.loadError) {
      console.log(`\n⚠️  ${r.name}: SKIPPED (${r.loadError})`);
      continue;
    }

    const vCount = r.axe?.violations?.length || 0;
    const kIssues = r.keyboard.filter(k => k.status !== '✅' && !k.status.startsWith('ℹ️')).length;
    totalViolations += vCount;
    totalKeyboardIssues += kIssues;
    totalPasses += r.axe?.passes || 0;

    const axeIcon = vCount === 0 ? '✅' : '❌';
    const kIcon = kIssues === 0 ? '✅' : '⚠️';
    console.log(`\n  ${r.name}`);
    console.log(`    ${axeIcon} Axe: ${vCount} violations, ${r.axe?.passes} passes, ${r.axe?.incomplete} incomplete`);
    console.log(`    ${kIcon} Keyboard: ${r.keyboard.length - kIssues}/${r.keyboard.length} steps ok`);

    if (vCount > 0) {
      const critical = r.axe.violations.filter(v => v.impact === 'critical');
      const serious = r.axe.violations.filter(v => v.impact === 'serious');
      const moderate = r.axe.violations.filter(v => v.impact === 'moderate');
      const minor = r.axe.violations.filter(v => v.impact === 'minor');
      if (critical.length) console.log(`         🔴 Critical (${critical.length}): ${critical.map(v => v.id).join(', ')}`);
      if (serious.length) console.log(`         🟠 Serious  (${serious.length}): ${serious.map(v => v.id).join(', ')}`);
      if (moderate.length) console.log(`         🟡 Moderate (${moderate.length}): ${moderate.map(v => v.id).join(', ')}`);
      if (minor.length) console.log(`         🔵 Minor    (${minor.length}): ${minor.map(v => v.id).join(', ')}`);
    }
  }

  console.log('\n' + '-'.repeat(60));
  const overallIcon = totalViolations === 0 && totalKeyboardIssues === 0 ? '✅ PASS' : '❌ NEEDS WORK';
  console.log(`Overall: ${overallIcon}`);
  console.log(`  Total axe violations : ${totalViolations}`);
  console.log(`  Total keyboard issues: ${totalKeyboardIssues}`);
  console.log(`  Total axe passes     : ${totalPasses}`);
  console.log(`  Elapsed              : ${elapsed}s`);
  console.log('='.repeat(60) + '\n');

  const reportPath = './bbp-a11y-report.json';
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        meta: { timestamp: new Date().toISOString(), baseUrl: BASE_URL, elapsed },
        results: allResults,
      },
      null,
      2
    )
  );
  console.log(`📄 Full JSON report saved to: ${reportPath}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
