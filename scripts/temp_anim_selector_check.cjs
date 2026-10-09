const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
    await page.evaluate(async () => {
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { AnimFrameController } = await import('/src/features/inventory/AnimFrameController.tsx');
      const selector = await import('/src/features/scene/CharacterAnimSelector.tsx');
      const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts');
      window.selector = selector;
      window.store = useAnimPreviewStore;
      useAnimPreviewStore.getState().setSelectedCategories([]);
      useAnimPreviewStore.getState().setAnimSearch('');
      document.body.innerHTML = '<div id="root"></div>';
      document.body.style.margin = '0';
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/node_modules/bootstrap/dist/css/bootstrap.min.css';
      document.head.append(css);
      const layout = document.createElement('style');
      layout.textContent = '.anim-frame-controller__controls { display: flex; }';
      document.head.append(layout);
      createRoot(document.getElementById('root')).render(React.createElement(AnimFrameController, {
        animKey: 'idle', isHumanCharacter: true,
        onSelectAnim: value => { window.selectedAnimation = value; },
      }));
    });
    await page.waitForSelector('button[title]');
    for (const viewport of [{width: 1496, height: 810}, {width: 800, height: 400}, {width: 390, height: 600}]) {
      await page.setViewport(viewport);
      await page.click('button[title^="Animation :"]');
      await page.waitForSelector('button[aria-expanded="false"]');
      const placement = await page.evaluate(() => {
        const selector = document.querySelector('[tabindex="0"]').parentElement;
        const controller = selector.parentElement;
        const badge = document.querySelector('button[title="Fermer le sélecteur d\'animations"]');
        const box = selector.getBoundingClientRect();
        const container = controller.getBoundingClientRect();
        const button = badge.getBoundingClientRect();
        return {
          left: box.left,
          expectedLeft: Math.max(container.left + controller.clientLeft, Math.min(button.left, container.left + controller.clientLeft + controller.clientWidth - box.width)),
          right: box.right,
          controllerRight: container.right,
        };
      });
      assert(Math.abs(placement.left - placement.expectedLeft) < 1, JSON.stringify(placement));
      assert(placement.right <= placement.controllerRight + 1, JSON.stringify(placement));
      await page.click('button[aria-expanded]');
      await page.waitForSelector('input[type="checkbox"]');
      const bounds = await page.evaluate(() => {
        const last = [...document.querySelectorAll('label')].at(-1);
        const panel = last.parentElement.parentElement;
        panel.scrollTop = panel.scrollHeight;
        const item = last.getBoundingClientRect();
        const scroll = panel.getBoundingClientRect();
        const selector = document.querySelector('[tabindex="0"]').getBoundingClientRect();
        return { count: document.querySelectorAll('input[type="checkbox"]').length, item: {top: item.top, bottom: item.bottom}, scroll: {top: scroll.top, bottom: scroll.bottom}, selector: {top: selector.top, bottom: selector.bottom}, height: innerHeight };
      });
      assert.equal(bounds.count, 12);
      assert(bounds.item.top >= bounds.scroll.top && bounds.item.bottom <= bounds.scroll.bottom + 1, JSON.stringify(bounds));
      assert(bounds.selector.top >= 0 && bounds.selector.bottom <= bounds.height, JSON.stringify(bounds));
      await page.evaluate(() => [...document.querySelectorAll('label')].at(-1).click());
      assert.deepEqual(await page.evaluate(() => window.store.getState().selectedCategories), ['others']);
      await page.click('button[aria-expanded]');
      await page.waitForSelector('.overflow-auto .border-bottom');
      const results = await page.evaluate(() => {
        const { getFilteredAnimOptions, ENHANCED_ANIM_OPTIONS } = window.selector;
        const results = {};
        for (const source of ['miley', 'mixamo', 'npz', 'others']) {
          const filtered = getFilteredAnimOptions('', [source]);
          if (!filtered.length || filtered.some(a => a.source !== source)) throw Error(`Invalid source filter: ${source}`);
          results[source] = filtered.length;
        }
        const mixed = getFilteredAnimOptions('', ['combat', 'npz']);
        const expected = ENHANCED_ANIM_OPTIONS.filter(a => a.category === 'combat' || a.source === 'npz');
        if (mixed.length !== expected.length) throw Error('Mixed filters mismatch');
        const search = getFilteredAnimOptions('yoga', ['npz']);
        if (!search.length || search.some(a => a.source !== 'npz' || !a.searchIndex.includes('yoga'))) throw Error('Search mismatch');
        window.store.getState().setSelectedCategories([]);
        return results;
      });
      await page.click('button[aria-label="Fermer"]');
      console.log('Reachable categories and source filters passed:', viewport, results);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
