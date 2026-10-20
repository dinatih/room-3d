const assert = require('node:assert/strict');
const launch = require('../scripts/browser-test-options.cjs');
(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    // These tests exercise navigation; rendering models is covered by the visual suite.
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/src/features/inventory/InventoryPreview.tsx') {
        return request.respond({ status: 200, contentType: 'application/javascript', body: 'export function InventoryPreview() { return null; }' });
      }
      return request.continue();
    });
    page.on('console', message => { if (message.type() === 'error') console.log(message.text()); });
    page.on('requestfailed', request => console.error('REQUEST FAILED', request.url(), request.failure()?.errorText));
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    async function mount(query, mobile = false) {
      console.log('Mount', query, mobile);
      await page.setViewport({ width: mobile ? 390 : 1440, height: 900 });
      await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
      await page.evaluate(async query => {
        window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        history.replaceState({}, '', '/studio.html' + query);
        const { default: React } = await import('/node_modules/.vite/deps/react.js');
        const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
        await import('/scss/app.scss'); await import('/src/index.css');
        const { Inventory } = await import('/src/features/inventory/Inventory.tsx');
        const { parseUrlInventory, updateUrlInventory } = await import('/src/features/inventory/inventoryUrlParams.ts');
        document.body.innerHTML = '<div id="test-root"></div>';
        function App() {
          const [navigation, setNavigation] = React.useState(0);
          const state = parseUrlInventory();
          React.useEffect(() => {
            const restore = () => setNavigation(value => value + 1);
            window.addEventListener('popstate', restore);
            return () => window.removeEventListener('popstate', restore);
          }, []);
          return state.open ? React.createElement(Inventory, { key: navigation, initialCategory: state.category, onClose: () => { updateUrlInventory(false); setNavigation(value => value + 1); } }) : null;
        }
        createRoot(document.getElementById('test-root')).render(React.createElement(App));
      }, query);
      await page.waitForSelector('.inventory-modal');
    }
    const item = id => page.waitForFunction(id => document.querySelector('.inventory-pane-detail h3, .modal-title')?.textContent || document.querySelector(`[data-item-id="${id}"].bg-danger`), {}, id);
    await mount('?inventory=tech&item=missing&debug=1');
    await page.waitForSelector('[role="alert"]');
    assert.match(await page.$eval('[role="alert"]', e => e.textContent), /Fiche introuvable/);
    assert.equal(new URL(page.url()).searchParams.get('item'), 'missing');
    await page.$eval('[role="alert"] button', e => e.click());
    await page.waitForSelector('[data-item-id]');
    await page.$eval('[data-category-id="characters"]', e => e.click());
    await page.waitForSelector('[data-item-id="native"]');
    await page.$eval('[data-item-id="native"]', e => e.click());
    await item('native');
    await page.waitForFunction(() => new URL(location.href).searchParams.get('item') === 'native');
    const nativeUrl = page.url();
    await page.$eval('[data-category-id="wigs"]', e => e.click());
    await page.waitForSelector('[data-item-id="hair_wolf_haircut"]');
    await page.$eval('[data-item-id="hair_wolf_haircut"]', e => e.click());
    await page.waitForFunction(() => new URL(location.href).searchParams.get('item') === 'hair_wolf_haircut');
    console.log('Back to previous wig, then PNJ');
    await page.goBack();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('item') !== 'hair_wolf_haircut');
    await page.goBack();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('item') === 'native');
    await page.waitForSelector('[data-item-id="native"].bg-danger');
    assert.equal(page.url(), nativeUrl);
    console.log('Forward to wig');
    await page.goForward();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('inventory') === 'wigs');
    await page.goForward();
    await page.waitForSelector('[data-item-id="hair_wolf_haircut"].bg-danger');
    await page.evaluate(() => { window.copiedLink = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedLink = value; } } }); });
    await page.$$eval('button', buttons => buttons.find(b => b.textContent === 'Copier le lien').click());
    await page.waitForFunction(() => window.copiedLink.includes('item=hair_wolf_haircut'));
    assert.equal(new URL(await page.evaluate(() => window.copiedLink)).searchParams.get('debug'), '1');
    await page.$eval('.inventory-modal .btn-close', e => e.click());
    await page.waitForFunction(() => !document.querySelector('.inventory-modal'));
    assert.equal(new URL(page.url()).searchParams.has('inventory'), false);
    await page.goBack();
    await page.waitForSelector('[data-item-id="hair_wolf_haircut"].bg-danger');
    for (const [category, id] of [['storage', 'kallax-ne-stack'], ['spaces', 'living']]) {
      await mount(`?inventory=${category}&item=${id}`);
      await page.waitForSelector(`[data-item-id="${id}"].bg-danger`);
      assert.equal(new URL(page.url()).searchParams.get('item'), id);
    }
    await mount('?inventory=characters&item=native', true);
    await page.waitForSelector('.modal-title');
    assert.match(await page.$eval('.modal-title', e => e.textContent), /Lara|Native/i);
    await mount('?inventory=animations&animation=idle&animationMode=solo');
    await page.waitForSelector('[data-animation-id="idle"][aria-selected="true"]');
    await page.$$eval('[aria-label="Type d’animation"] button', buttons => buttons[1].click());
    await page.waitForFunction(() => new URL(location.href).searchParams.get('animationMode') === 'duo');
    const duoUrl = new URL(page.url());
    const duoId = duoUrl.searchParams.get('animation');
    await mount(duoUrl.search);
    await page.waitForFunction(id => document.querySelector('[aria-selected="true"]')?.dataset.animationId === id, {}, duoId);
    await mount('?inventory=animations&animation=missing&animationMode=duo');
    await page.waitForSelector('[role="alert"]');
    assert.equal(new URL(page.url()).searchParams.get('animation'), 'missing');
    assert.deepEqual(errors, []);
    console.log('PASS: not found, item/category history, sharing, mobile detail, solo and duo direct links');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
