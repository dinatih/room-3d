const launch = require('./browser-test-options.cjs');
(async () => {
  if (process.argv.includes('--inspect')) {
    const log = require('node:fs').readFileSync(process.env.RENDER_INSPECT_LOG || '/tmp/room-debug-studio-browser.log', 'utf8');
    const browser = await require('puppeteer').connect({ browserWSEndpoint: log.match(/ws:\/\/[^\s]+/)[0] });
    const page = (await browser.pages()).at(-1);
    console.log(await page.evaluate(() => ({ title: document.title, text: document.body.innerText.slice(-1500), images: [...document.images].map(image => image.src.slice(0, 90)) })));
    await page.screenshot({ path: '/tmp/room-raytracing-debug-loading.png' });
    browser.disconnect(); return;
  }
  const browser = await launch({ protocolTimeout: 0, userDataDir: require('node:path').resolve('renders/browser-debug-profile'), args: ['--enable-gpu'] });
  try {
    const page = await browser.newPage();
    const mobile = process.argv.includes('--mobile');
    await page.setViewport(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
    page.on('console', message => { if (message.text().includes('[Raytracing')) console.log(message.text()); });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    await page.goto('http://localhost:5173/?raytracing=debug&target=studio&projection=persp&cameraMovement=fix&skipIntro=1&characters=0&character=0&animals=0&robots=0&environment=0&bnfMarker=0&bermudaGrass=0&laraLife=0');
    await page.waitForFunction(() => document.querySelector('.raytracing-photo [role="status"]')?.textContent.includes('Prêt'), { timeout: 240000 });
    const screenshot = `renders/room-raytracing-debug-studio${mobile ? '-mobile' : ''}.png`;
    await page.screenshot({ path: screenshot });
    const image = await page.$('.raytracing-photo canvas');
    if (!image) throw new Error('Canvas de prévisualisation absent');
    await image.screenshot({ path: `renders/room-raytracing-debug-preview${mobile ? '-mobile' : ''}.png` });
    console.log('Studio réel capturé :', screenshot);
    if (process.argv.includes('--archive') || process.argv.includes('--submit')) {
      await page.evaluate(real => {
        window.submitRealJob = real;
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
          if (String(url) !== 'http://127.0.0.1:5174/api/render-jobs') return originalFetch(url, options);
          if (!(options.body instanceof Blob) || options.body.type !== 'application/octet-stream') throw new Error('Archive binaire attendue');
          window.archiveBytes = options.body.size;
          if (window.submitRealJob) {
            const response = await originalFetch(url, options);
            const body = await response.clone().text();
            if (!response.ok) throw new Error(body);
            window.submittedJob = JSON.parse(body).id;
            return response;
          }
          return new Response(JSON.stringify({ id: 'studio-archive-verification' }));
        };
        window.alert = () => {};
        [...document.querySelectorAll('button')].find(button => button.textContent === 'Lancer en arrière-plan').click();
      }, process.argv.includes('--submit'));
      await page.waitForFunction(() => window.archiveBytes > 0, { timeout: 180000 });
      console.log('Archive du studio réel générée :', await page.evaluate(() => window.archiveBytes), 'octets');
      if (process.argv.includes('--submit')) {
        await page.waitForFunction(() => window.submittedJob, { timeout: 180000 });
        console.log('Travail réel reçu :', await page.evaluate(() => window.submittedJob));
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
