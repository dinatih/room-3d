const { createServer } = require('vite');
const launch = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
const checkConsole = process.argv.includes('--console');

(async () => {
  const server = await createServer({
    server: { host: '127.0.0.1', port: 5210, strictPort: true },
    plugins: [{
      name: 'wall-plan-check', enforce: 'pre',
      // Isoler le plan architectural du store et des dépendances du mobilier.
      load(id) {
        if (id.endsWith('/floorFurniture.ts')) return 'export function drawFurniture() {}';
        if (checkConsole) {
          const stubs = { Minimap: 'Minimap', DevToolsOverlay: 'DevToolsGroups', ProfileButton: 'ProfileButton', PresetButton: 'PresetButton' };
          for (const [file, name] of Object.entries(stubs)) {
            if (id.endsWith(`/${file}.tsx`)) return `export function ${name}() { return null; }`;
          }
        }
      },
      configureServer(server) {
        server.middlewares.use('/__wall-plan', async (_request, response) => {
          response.setHeader('Content-Type', 'text/html');
          if (checkConsole) {
            response.end(await server.transformIndexHtml('/__wall-plan', `<!doctype html><html><body><div id="root"></div><script type="module">
              import '/scss/app.scss'; import '/src/index.css'; import '/src/features/scene/ViewControlBar.scss';
              import RefreshRuntime from '/@react-refresh';
              RefreshRuntime.injectIntoGlobalHook(window);
              window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
              window.__vite_plugin_react_preamble_installed__ = true;
              const React = await import('react'), { createRoot } = await import('react-dom/client');
              const { AppConsole, appLog } = await import('/src/features/ui/AppConsole.tsx');
              for (let i = 0; i < 100; i++) appLog('system', 'Message de navigation très long, position et cible détaillées. '.repeat(30) + i, { action: 'verification_console' });
              createRoot(document.getElementById('root')).render(React.createElement(AppConsole));
            </script></body></html>`));
            return;
          }
          response.end(await server.transformIndexHtml('/__wall-plan', `<!doctype html><html><body style="margin:0;background:#e5e7eb"><canvas id="plan" width="800" height="1500"></canvas>
            <script type="module">
              import { drawFloorPlan } from '/src/features/scene/floorDraw.ts';
              const canvas = document.querySelector('canvas');
              drawFloorPlan(canvas.getContext('2d'), canvas.width, canvas.height, { showEquipment: false, showFurniture: false });
              window.planReady = true;
            </script></body></html>`));
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
    await page.goto('http://127.0.0.1:5210/__wall-plan');
    if (checkConsole) {
      for (const viewport of [{ width: 1400, height: 900 }, { width: 390, height: 844 }]) {
        await page.setViewport(viewport);
        await page.waitForSelector('button[title="Ouvrir la console (B)"]');
        const arrowVisible = await page.$eval('button[aria-label="Ouvrir la console"]', el => {
          const r = el.getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth && r.height > 0 && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        });
        assert(arrowVisible, `Flèche de console masquée avec un long message : ${viewport.width}px`);
        await page.click('button[title="Ouvrir la console (B)"]');
        await page.waitForSelector('button[title="Fermer la console (B)"]');
        const controls = await page.$$eval('[aria-label="Console applicative"] button, [aria-label="Console applicative"] select', elements => elements.map(el => {
          const r = el.getBoundingClientRect();
          return { label: el.getAttribute('aria-label') || el.getAttribute('title'), visible: r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
        }));
        assert(controls.every(c => c.visible), JSON.stringify({ viewport, controls }));
        await page.waitForSelector('button[aria-label="Reprendre le défilement"]');
        await page.click('button[aria-label="Reprendre le défilement"]');
        await page.click('button[aria-label="Mettre le défilement en pause"]');
        await page.waitForSelector('button[aria-label="Reprendre le défilement"]');
        await page.click('button[title="Fermer la console (B)"]');
      }
      if (errors.length) throw Error(errors.join('\n'));
      console.log('Boutons de console accessibles sur ordinateur et mobile.');
      return;
    }
    await page.waitForFunction(() => window.planReady, { timeout: 60000 });
    if (errors.length) throw Error(errors.join('\n'));
    await page.screenshot({ path: '/tmp/room-wall-plan.png' });
    console.log('Plan rendu sans erreur : /tmp/room-wall-plan.png');
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
