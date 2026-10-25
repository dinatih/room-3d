const { createServer } = require('vite');
const launch = require('./browser-test-options.cjs');

(async () => {
  const server = await createServer({
    server: { host: '127.0.0.1', port: 5200, strictPort: true },
    plugins: [{
      name: 'wall-plan-check', enforce: 'pre',
      // Isoler le plan architectural du store et des dépendances du mobilier.
      load(id) { if (id.endsWith('/floorFurniture.ts')) return 'export function drawFurniture() {}'; },
      configureServer(server) {
        server.middlewares.use('/__wall-plan', (_request, response) => {
          response.setHeader('Content-Type', 'text/html');
          response.end(`<!doctype html><html><body style="margin:0;background:#e5e7eb"><canvas id="plan" width="800" height="1500"></canvas>
            <script type="module">
              import { drawFloorPlan } from '/src/features/scene/floorDraw.ts';
              const canvas = document.querySelector('canvas');
              drawFloorPlan(canvas.getContext('2d'), canvas.width, canvas.height, { showEquipment: false, showFurniture: false });
              window.planReady = true;
            </script></body></html>`);
        });
      },
    }],
  });
  let browser;
  try {
    await server.listen();
    browser = await launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    await page.setViewport({ width: 800, height: 1500 });
    await page.goto('http://127.0.0.1:5200/__wall-plan');
    await page.waitForFunction(() => window.planReady, { timeout: 60000 });
    if (errors.length) throw Error(errors.join('\n'));
    await page.screenshot({ path: '/tmp/room-wall-plan.png' });
    console.log('Plan rendu sans erreur : /tmp/room-wall-plan.png');
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
