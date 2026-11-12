// Submission counts by object, including shadow and mirror passes. No per-draw GPU timers.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { withBrowser } = require('../tests/support/browser.cjs');
process.env.ROOM_TEST_SUITE = 'perf';
process.env.ROOM_TEST_COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
process.env.ROOM_TEST_DIRTY = String(!!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim());
fs.mkdirSync('test-results', { recursive: true });
const directory = fs.mkdtempSync(path.resolve('test-results/draw-submissions-'));
process.env.ROOM_TEST_RESULTS = directory;
const fixture = { ...require('../tests/fixtures/cases.cjs').performance[`studio-9-mid-${process.argv.includes('--night') ? 'night' : 'day'}`], id: 'draw-submissions' };
withBrowser(fixture, async page => {
  await new Promise(resolve => setTimeout(resolve, fixture.stableMs));
  const data = await page.evaluate(async () => {
    const { resolveEntityKey } = await import('/src/features/scene/DevToolsCollector.tsx');
    const renderer = window.__THREE_GL__, main = window.__THREE_SCENE__;
    const render = renderer.render, direct = renderer.renderBufferDirect, shadow = renderer.shadowMap.render;
    const rows = new Map(), entities = new WeakMap();
    let pass = 'main', frames = 0;
    renderer.shadowMap.render = function(...args) {
      const previous = pass; pass = 'shadow';
      try { return shadow.apply(this, args); } finally { pass = previous; }
    };
    renderer.renderBufferDirect = function(camera, scene, geometry, material, object, group) {
      let entity = entities.get(object);
      if (!entity) { entity = resolveEntityKey(object, main); entities.set(object, entity); }
      const key = `${pass}: ${entity}`;
      const row = rows.get(key) ?? { pass, entity, calls: 0, triangles: 0, materials: new Map() };
      rows.set(key, row);
      const calls = renderer.info.render.calls, triangles = renderer.info.render.triangles;
      try { return direct.apply(this, arguments); }
      finally {
        row.calls += renderer.info.render.calls - calls;
        row.triangles += renderer.info.render.triangles - triangles;
        row.materials.set(material.uuid, material.name || material.type);
      }
    };
    await new Promise(resolve => {
      renderer.render = function(scene, camera) {
        const primary = scene === main && renderer.getRenderTarget() === null;
        const previous = pass; pass = primary ? 'main' : 'mirror';
        try { return render.call(this, scene, camera); }
        finally {
          pass = previous;
          if (primary && ++frames === 60) {
            renderer.render = render; renderer.renderBufferDirect = direct; renderer.shadowMap.render = shadow; resolve();
          }
        }
      };
    });
    return { frames, rows: [...rows.values()].map(row => ({ ...row, calls: row.calls / frames, triangles: row.triangles / frames, materials: [...row.materials.values()] })).sort((a, b) => b.calls - a.calls) };
  });
  fs.writeFileSync(`${directory}/submissions.json`, JSON.stringify(data, null, 2));
  const markdown = ['# Dessins par objet et par image', '', 'Moyennes sur 60 images, PNJ actifs. Mesure de soumissions, pas de temps GPU par objet.', '', '| Passe | Objet | Dessins/image | Triangles/image | Matériaux |', '| --- | --- | ---: | ---: | ---: |',
    ...data.rows.map(row => `| ${row.pass} | ${row.entity.replaceAll('|', '/')} | ${row.calls.toFixed(1)} | ${Math.round(row.triangles)} | ${row.materials.length} |`)];
  fs.writeFileSync(`${directory}/report.md`, markdown.join('\n') + '\n');
  console.log(`Rapport Markdown : ${directory}/report.md`);
  console.log(`Rapport JSON : ${directory}/submissions.json`);
}).catch(error => { console.error(error); process.exitCode = 1; });
