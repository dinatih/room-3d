const assert = require('node:assert/strict');
const fs = require('node:fs');
const { withBrowser } = require('../tests/support/browser.cjs');
process.env.ROOM_TEST_SUITE = 'perf';
process.env.ROOM_TEST_OPTIONS = '{}';
process.env.ROOM_TEST_RESULTS = fs.mkdtempSync('/tmp/room-glass-previews-');
const objects = [
    { id: 'ninja-sp101', node: 'Plane002_1', transmission: 1, path: '/items/ninja-sp101/ninja-sp101-animated.glb' },
    { id: 'air-performer', node: 'Circle670_1', transmission: 1, path: '/items/philips-amf870/philips-amf870.glb' },
    { id: 'phone', node: 'Glass_glass_0', transmission: .5, path: '/items/xiaomi-phone/xiaomi-phone.glb' },
];
const fixture = { ...require('../tests/fixtures/cases.cjs').performance['studio-9-mid-day'], count: 0,
    id: 'glass-previews', timeoutMs: 240000, cancelledRequestPaths: objects.map(object => object.path), reproduction: 'node scripts/test-scene-glass-previews.cjs --hardware-gpu' };
withBrowser(fixture, async page => {
    const sceneGlass = await page.evaluate(nodes => nodes.map(name => {
        const mesh = window.__THREE_SCENE__.getObjectByName(name);
        if (!mesh?.isMesh) throw Error(`Missing scene glass: ${name}`);
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        return materials.filter(material => material.isMeshPhysicalMaterial).map(material => ({ transmission: material.transmission, transparent: material.transparent }));
    }), objects.map(object => object.node));
    for (const materials of sceneGlass) {
        assert(materials.length, 'Expected physical glass material');
        for (const material of materials) { assert.equal(material.transmission, 0); assert.equal(material.transparent, true); }
    }
    for (const preset of ['high', 'mid']) {
        await page.evaluate(async preset => {
            const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
            useSceneStore.getState().setGraphicsQualityPreset(preset);
        }, preset);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await page.waitForFunction(objects => objects.every(({ node }) => {
            const mesh = window.__THREE_SCENE__?.getObjectByName(node);
            return mesh?.isMesh && (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).every(material => !(material.transmission > 0));
        }), { timeout: 60000 }, objects);
    }
    console.log('High et Mid : vitrage optimisé conservé');
    for (const object of objects) {
        await page.evaluate(async object => {
            const { openInventoryTarget } = await import('/src/features/ui/AppConsole.tsx');
            openInventoryTarget({ type: 'object', object: { id: object.id, inventoryId: object.id, label: object.id } });
        }, object);
        for (const [index, transmission] of [object.transmission, 0, object.transmission].entries()) {
            if (index) await page.click('button[aria-label="Vitrage optimisé"]');
            await page.waitForFunction(({ node, transmission }) => {
                const mesh = window.__THREE_SCENE__?.getObjectByName(node);
                return mesh?.isMesh && (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).some(material => material.transmission === transmission);
            }, { timeout: 60000 }, { ...object, transmission });
            assert.equal(await page.$eval('button[aria-label="Vitrage optimisé"]', button => button.getAttribute('aria-pressed')), String(transmission === 0));
            await page.screenshot({ path: `${process.env.ROOM_TEST_RESULTS}/${object.id}-${index}.png` });
        }
        await page.click('button.btn-close[aria-label="Fermer"]');
        await page.waitForFunction(async () => {
            const { cameraState } = await import('/src/features/scene/cameraState.ts');
            return !cameraState.isInventoryOpen && !!window.__THREE_SCENE__?.getObjectByName('NinjaDoor');
        }, { timeout: 15000 });
        console.log(`Preview ${object.id}: original → optimisé → original vérifié`);
    }
    console.log(`Captures : ${process.env.ROOM_TEST_RESULTS}`);
}).catch(error => { console.error(error); process.exitCode = 1; });
