// Inventory actual resident GLB resources; disk sizes alone miss decoded textures.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { withBrowser } = require('../tests/support/browser.cjs');
const fixture = require('../tests/fixtures/cases.cjs').performance['studio-9-high-day'];

async function main() {
  process.env.ROOM_TEST_SUITE = 'perf';
  process.env.ROOM_TEST_OPTIONS = '{}';
  const directory = fs.mkdtempSync(path.resolve('test-results/asset-audit-'));
  process.env.ROOM_TEST_RESULTS = directory;
  process.env.ROOM_TEST_COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  process.env.ROOM_TEST_DIRTY = String(Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()));
  await withBrowser({ ...fixture, id: 'assets' }, async (page, result) => {
    await new Promise(resolve => setTimeout(resolve, fixture.stableMs));
    result.assets = await page.evaluate(() => {
      const textures = new Map(), geometry = new Map(), models = new Set();
      window.__THREE_SCENE__.traverse(object => {
        if (object.userData.loadedGltfPath) models.add(object.userData.loadedGltfPath);
        if (object.geometry) {
          const g = object.geometry;
          geometry.set(g.uuid, { name: object.name, bytes: Object.values(g.attributes).reduce((sum, a) => sum + a.array.byteLength, g.index?.array.byteLength ?? 0) });
        }
        for (const material of [object.material].flat().filter(Boolean)) {
          for (const t of Object.values(material)) if (t?.isTexture) {
            const img = t.image;
            textures.set(t.source.uuid, { name: t.name, object: object.name, width: img?.width, height: img?.height, rgbaBytes: (img?.width ?? 0) * (img?.height ?? 0) * 4 });
          }
        }
      });
      // The timing buffer can fill before GLBs finish; the application observer
      // already preserves every completed download in the test trace.
      const requests = window.__testTrace.flatMap(entry => {
        const match = /Premier chargement : "([^"]+\.glb)"/.exec(entry.appLog?.message ?? '');
        return match ? [decodeURI(match[1])] : [];
      });
      return { models: [...models].sort(), textures: [...textures.values()].sort((a, b) => b.rgbaBytes - a.rgbaBytes), geometry: [...geometry.values()].sort((a,b) => b.bytes - a.bytes), requests };
    });
    fs.writeFileSync(path.join(directory, 'assets.json'), JSON.stringify(result.assets, null, 2));
    console.log('ASSET AUDIT:', path.join(directory, 'assets.json'));
    console.log('TOP TEXTURES:', JSON.stringify(result.assets.textures.slice(0, 30)));
  });
}
main().catch(error => { console.error(error); process.exitCode = 1; });
