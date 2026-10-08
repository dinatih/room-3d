const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.hostname !== 'loading.test') return request.abort();
      if (url.pathname === '/') {
        const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8')
          .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
        return request.respond({ contentType: 'text/html', body: html });
      }
      const file = path.join(__dirname, '../public', url.pathname);
      if (!fs.existsSync(file)) return request.abort();
      return request.respond({ contentType: url.pathname.endsWith('.webp') ? 'image/webp' : 'image/jpeg', body: fs.readFileSync(file) });
    });
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewport(viewport);
      await page.goto('http://loading.test/');
      await page.evaluate(() => document.getAnimations().forEach(animation => animation.pause()));
      const sample = async time => page.evaluate(time => {
        document.getAnimations().forEach(animation => { animation.currentTime = time; });
        const card = document.querySelector('#loading-card');
        const envelope = document.querySelector('#loading-envelope');
        const cardStyle = getComputedStyle(card);
        return {
          cardTop: card.getBoundingClientRect().top,
          envelopeBottom: envelope.getBoundingClientRect().bottom,
          translateY: new DOMMatrixReadOnly(cardStyle.transform).m42,
          opacity: cardStyle.opacity,
          filter: cardStyle.filter,
          slitScale: new DOMMatrixReadOnly(getComputedStyle(envelope, '::after').transform).m11,
        };
      }, time);
      const start = await sample(0);
      assert(start.cardTop >= start.envelopeBottom, 'Card must begin below the slit');
      assert.equal(start.slitScale, 0);
      const opened = await sample(540);
      assert.equal(opened.slitScale, 1, 'Slit must open before the card rises');
      const middle = await sample(800);
      assert(middle.translateY > 0 && middle.translateY < start.translateY);
      assert.equal(middle.opacity, '1');
      assert.equal(middle.filter, 'none');
      await page.screenshot({ path: `/tmp/loading-envelope-${viewport.width}.png` });
      const end = await sample(1800);
      assert.equal(end.translateY, 0);
      await page.$eval('#loading-card', card => card.classList.add('exiting'));
      assert.equal(await page.$eval('#loading-card', card => getComputedStyle(card).animationName), 'none');
    }
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto('http://loading.test/');
    assert.equal(await page.$eval('#loading-card', card => getComputedStyle(card).animationName), 'none');
    console.log('OK: desktop/mobile slit opening, masked upward slide without fade/blur, exit and reduced motion.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
