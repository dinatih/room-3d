const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await launchBrowser({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.ROOM_TEST_URL || 'http://127.0.0.1:5174/AGENTS.md');
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { HoverOverlay } = await import('/src/features/scene/HoverMenu.tsx');
      const { hoverState } = await import('/src/features/scene/hoverState.ts');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const registry = await import('/src/features/scene/ai/smartObjectRegistry.ts');
      document.body.replaceChildren();
      const container = document.createElement('div');
      document.body.append(container);
      createRoot(container).render(React.createElement(HoverOverlay));
      window.fixture = { hoverState, cameraState, useSceneStore, registry, orders: [] };
      document.addEventListener('agent-force-smartobject', event => window.fixture.orders.push(event.detail));
      useSceneStore.getState().setActiveCharacterId('lara');
    });
    await page.waitForFunction(() => window.fixture.hoverState.onUpdate);
    const cases = [
      ['sofa-garden-east', ['seat-1', 'seat-2']],
      ['sofa-garden-west', ['seat-1', 'seat-2']],
      ['bathtub-garden', ['center', 'west', 'east']],
      ['shower', ['take-shower-1', 'take-shower-2', 'take-shower-3']],
      ['toilet', ['use']],
      ['vasque-sdb', ['wash-hands', 'brush-teeth', 'shave-makeup']],
      ['cuisine-group', ['cook-oven', 'cook-stove']],
    ];
    for (const [objectId, slots] of cases) {
      for (const slotId of slots) {
        await page.evaluate(({ objectId, slotId }) => {
          const { hoverState, registry, cameraState } = window.fixture;
          const slot = registry.getSmartObject(objectId).slots.find(slot => slot.slotId === slotId);
          for (const id of Object.keys(cameraState.positions)) delete cameraState.positions[id];
          cameraState.positions.lara = { x: slot.offset[0], y: 0, z: slot.offset[2] };
          cameraState.positions.shiba = { x: slot.offset[0], y: 0, z: slot.offset[2] };
          Object.assign(hoverState, { locked: true, lockedLabel: objectId, lockedX: 100, lockedY: 200,
            lockedActionIds: [`smart-object:::${objectId}:::${slotId}`] });
          hoverState.onUpdate();
        }, { objectId, slotId });
        await page.waitForSelector('button.btn-sm');
        await page.click('button.btn-sm');
        const result = await page.evaluate(({ objectId, slotId }) => ({
          order: window.fixture.orders.at(-1),
          locked: window.fixture.hoverState.locked,
          sequence: window.fixture.registry.buildSmartObjectInstructionSequence(objectId, slotId),
        }), { objectId, slotId });
        assert.deepEqual(result.order, { targetId: 'lara', objectId, slotId });
        assert.equal(result.locked, false);
        assert(result.sequence.some(step => step.smartObjectId === objectId && step.slotId === slotId));
        if (objectId === 'toilet') {
          assert.deepEqual(result.sequence.map(step => step.slotId), ['use', 'flush', 'wash-hands']);
        }
        console.log(`${objectId}/${slotId}: NPC order, sequence and menu close OK`);
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
