const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5176'}/AGENTS.md`);
    await page.evaluate(async () => {
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { NonExtraCharactersSelector } = await import('/src/features/scene/sidepanel/sections/NonExtraCharactersSelector.tsx');
      const { ExtraCharactersSelector } = await import('/src/features/scene/sidepanel/sections/ExtraCharactersSelector.tsx');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const { NON_EXTRA_CHARACTERS, EXTRA_CHARACTERS } = await import('/src/features/scene/characterConfig.ts');
      window.store = useSceneStore;
      window.targets = [NON_EXTRA_CHARACTERS.find(c => c.id !== 'xbot'), EXTRA_CHARACTERS[0]];
      useSceneStore.setState(state => ({ activeCharacterId: 'xbot', activeMainIds: ['xbot'], activeExtraIds: [], layers: { ...state.layers, extraCharacters: false } }));
      document.body.innerHTML = '<div id="root"></div>';
      createRoot(document.getElementById('root')).render(React.createElement(React.Fragment, null,
        React.createElement(NonExtraCharactersSelector, { isMobile: false, compact: true }),
        React.createElement(ExtraCharactersSelector, { isMobile: false, compact: true })));
    });
    await page.waitForSelector('button[aria-pressed]');
    const targets = await page.evaluate(() => window.targets);
    for (const target of targets) {
      const selector = `button[aria-label=${JSON.stringify(`Contrôler ${target.name}`)}]`;
      await page.click(selector);
      await page.waitForFunction(id => window.store.getState().activeCharacterId === id, {}, target.id);
      assert.equal(await page.$eval(selector, el => el.getAttribute('aria-pressed')), 'true');
      assert.equal(await page.$eval(selector, el => el.textContent), 'JOUEUR');
      assert.equal(await page.$eval(selector, el => el.parentElement.parentElement.querySelector('input').checked), true);
      const state = await page.evaluate(() => {
        const s = window.store.getState();
        return { main: s.activeMainIds, extra: s.activeExtraIds, enabled: s.layers.extraCharacters };
      });
      assert(state.main.includes(target.id) || state.extra.includes(target.id));
      if (state.extra.includes(target.id)) assert.equal(state.enabled, true);
      await page.click(selector);
      assert.deepEqual(await page.evaluate(() => ({ main: window.store.getState().activeMainIds, extra: window.store.getState().activeExtraIds, enabled: window.store.getState().layers.extraCharacters })), state);
      // The name still toggles visibility independently from the control button.
      await page.$eval(selector, el => el.parentElement.parentElement.querySelector('label').click());
      assert.equal(await page.$eval(selector, el => el.parentElement.parentElement.querySelector('input').checked), false);
    }
    console.log('Character selectors: direct control, automatic visibility, active indicator and independent checkbox passed.');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
