const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:3010';
const OUT_DIR = '/tmp/biteblast_screenshots';

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Enable console message capture for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[CONSOLE ERROR]', msg.text());
  });

  const screenshots = [
    { url: '/', filename: '01_homepage.png', label: 'Homepage' },
    { url: '/restaurant/amber-oven', filename: '02_restaurant_detail.png', label: 'Restaurant Detail' },
    { url: '/cart', filename: '03_cart.png', label: 'Cart' },
    { url: '/checkout', filename: '04_checkout.png', label: 'Checkout' },
    { url: '/studio', filename: '05_studio.png', label: 'Studio Dashboard' },
  ];

  for (const shot of screenshots) {
    const fullUrl = BASE_URL + shot.url;
    console.log(`\nNavigating to ${shot.label}: ${fullUrl}`);
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
    // Small wait for animations to settle
    await page.waitForTimeout;

    const outPath = path.join(OUT_DIR, shot.filename);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`  Saved: ${outPath}`);

    // Gather visual details
    const details = await page.evaluate(() => {
      const getComputed = el => {
        if (!el) return {};
        const s = window.getComputedStyle(el);
        return {
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          color: s.color,
          backgroundColor: s.backgroundColor,
          borderRadius: s.borderRadius,
        };
      };

      // Color palette — collect distinct bg/text/border colors
      const allEls = document.querySelectorAll('*');
      const bgColors = new Set();
      const textColors = new Set();
      const borderColors = new Set();
      allEls.forEach(el => {
        const s = window.getComputedStyle(el);
        if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColors.add(s.backgroundColor);
        if (s.color && s.color !== 'rgba(0, 0, 0, 1)') textColors.add(s.color);
        if (s.borderColor && s.borderColor !== 'rgba(0, 0, 0, 0)' && s.borderColor !== 'rgba(0, 0, 0, 1)') borderColors.add(s.borderColor);
      });

      // Typography sampling
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 5).map(h => ({
        tag: h.tagName, text: h.innerText.trim().slice(0, 60), ...getComputed(h)
      }));

      const bodySample = document.querySelector('p, li, span:not([class*="icon"]):not([class*="fa"]):not([class*="bi"])');
      const bodyStyle = bodySample ? getComputed(bodySample) : null;

      // Animations
      const animEls = Array.from(document.querySelectorAll('[style*="animation"], [class*="animate"], [class*="transition"], [style*="transition"]')).slice(0, 10);
      const animationInfo = animEls.map(el => ({
        tag: el.tagName,
        class: el.className.slice(0, 60),
        style: el.getAttribute('style')?.slice(0, 120)
      }));

      // Page title
      const title = document.title;

      // Key elements visible
      const bodyText = document.body ? document.body.innerText.slice(0, 300) : '';

      return {
        title,
        bgColors: Array.from(bgColors).slice(0, 15),
        textColors: Array.from(textColors).slice(0, 15),
        borderColors: Array.from(borderColors).slice(0, 10),
        headings,
        bodyStyle,
        animationInfo,
        bodyTextSnippet: bodyText
      };
    });

    console.log(`  Page title: ${details.title}`);
    console.log(`  Bg colors (${details.bgColors.length}): ${details.bgColors.join(', ')}`);
    console.log(`  Text colors (${details.textColors.length}): ${details.textColors.join(', ')}`);
    console.log(`  Border colors (${details.borderColors.length}): ${details.borderColors.join(', ')}`);
    console.log(`  Headings:`);
    details.headings.forEach(h => console.log(`    <${h.tag}> "${h.text}" | font:${h.fontFamily} ${h.fontSize} ${h.fontWeight} color:${h.color}`));
    if (details.bodyStyle) {
      console.log(`  Body style: font:${details.bodyStyle.fontFamily} ${details.bodyStyle.fontSize} color:${details.bodyStyle.color}`);
    }
    console.log(`  Animations/transitions found: ${details.animationInfo.length}`);
    details.animationInfo.forEach(a => {
      if (a.style) console.log(`    ${a.tag}.${a.class} | ${a.style}`);
    });
    console.log(`  Body text snippet: "${details.bodyTextSnippet.replace(/\n/g,' ').slice(0,150)}"`);
  }

  await browser.close();
  console.log('\nAll screenshots captured.');
}

main().catch(err => { console.error('SCRIPT ERROR:', err); process.exit(1); });