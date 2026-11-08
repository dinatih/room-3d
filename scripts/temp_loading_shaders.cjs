const fs = require('node:fs');
const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');
const background = process.argv.includes('--background');

(async () => {
  const server = await (await import('vite')).createServer({ server: { host: '127.0.0.1', port: 5176, strictPort: true, hmr: false } });
  await server.listen();
  let browser;
  try {
    browser = await launchBrowser({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      ignoreDefaultArgs: background ? ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] : [] });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    page.on('pageerror', error => console.error('PAGE ERROR', error.message));
    page.on('console', message => { if (message.text().startsWith('LOADING')) console.log(message.text()); });
    await page.evaluateOnNewDocument(background => {
      window.loadingSamples = [];
      let previous;
      const sample = () => {
        const text = document.getElementById('loading-item')?.textContent ?? 'removed';
        if (text !== previous) {
          window.loadingSamples.push({ ms: Math.round(performance.now()), text,
            hidden: document.hidden,
            shaders: document.getElementById('loading-shaders')?.textContent,
            programs: window.threeGl?.info.programs.length,
            animation: document.getElementById('loading-bar') && getComputedStyle(document.getElementById('loading-bar')).animationName });
          previous = text;
          console.log('LOADING', text);
        }
        if (!background) requestAnimationFrame(sample);
      };
      if (background) new MutationObserver(sample).observe(document, { subtree: true, childList: true, characterData: true });
      else requestAnimationFrame(sample);
    }, background);
    if (background) await browser.newPage();
    await page.goto('http://127.0.0.1:5176/?characterCount=7&skipIntro=1&preset=mid&target=studio&cameraMovement=fix', { waitUntil: 'domcontentloaded', timeout: 180000 });
    if (background) {
      assert(await page.evaluate(() => document.hidden), 'Le chargement doit être testé dans un onglet réellement caché');
      await page.waitForFunction(() => document.getElementById('loading-item')?.textContent === '✅ Scène 3D prête', { polling: 1000, timeout: 360000 });
      const prepared = await page.evaluate(() => ({ hidden: document.hidden, programs: window.threeGl.info.programs.length, calls: window.threeGl.info.render.calls }));
      console.log('BACKGROUND READY', JSON.stringify(prepared));
      assert(prepared.hidden && prepared.programs > 0 && prepared.calls > 0, 'Shaders et premier rendu prêts sans revenir dans l’onglet');
      await page.bringToFront();
    }
    await page.waitForFunction(() => window.threeGl && !document.getElementById('loading'), { timeout: 360000 });
    const result = await page.evaluate(() => {
      const template = document.createElement('template');
      template.innerHTML = '<div id="loading-item"></div><div id="loading-shaders"></div>';
      document.body.append(template.content);
      const properties = ['fontFamily', 'fontSize', 'fontWeight', 'color', 'textShadow'];
      const styles = ['loading-item', 'loading-shaders'].map(id => {
        const element = document.getElementById(id);
        const computed = getComputedStyle(element);
        const values = properties.map(property => computed[property]);
        element.remove();
        return values;
      });
      return { samples: window.loadingSamples, programs: window.threeGl.info.programs.length, styles };
    });
    fs.writeFileSync('/tmp/room-loading-shaders.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result.samples.filter(sample => /scène|shaders|Compilation|Rendu|removed/.test(sample.text)), null, 2));
    assert(result.samples.some(sample => /Shaders GPU : [1-9]\d*/.test(sample.shaders)), 'Le nombre de shaders doit être affiché avant la disparition du chargement');
    assert(background || result.samples.some(sample => /Préparation 3D \d+\/\d+ : .+/.test(sample.text)), 'Afficher le nom du matériau en préparation');
    assert.deepEqual(result.styles[0], result.styles[1], 'Les deux lignes doivent avoir le même style');
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
