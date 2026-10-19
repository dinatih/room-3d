const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { withBrowser, deadline } = require('../support/browser.cjs');
const { writeGallery, writeHistory } = require('../support/visual-gallery.cjs');
const { navigation } = require('../fixtures/cases.cjs');

async function main() {
    const options = { preset: 'mid', label: '' };
    for (const arg of process.argv.slice(2)) {
        if (arg === '--hardware-gpu') continue;
        const match = /^--(view|preset|label)=(.+)$/.exec(arg);
        if (!match) throw Error(`Unknown argument: ${arg}`);
        options[match[1]] = match[2];
    }
    assert(['low', 'mid'].includes(options.preset), 'Expected --preset=low or mid');
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const root = path.resolve('test-results/visual');
    const createdAt = new Date().toISOString();
    const id = `${createdAt.replaceAll(':', '-')}-${commit.slice(0, 8)}`;
    const directory = path.join(root, id);
    const manifest = { schema: 1, id, commit, dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()), createdAt, label: options.label, status: 'running', captures: [] };
    const fixture = { ...navigation[0], id, preset: options.preset, camera: 'orbit', timeoutMs: 240000,
        freezeSource: true, query: { ui: '0', animals: '0', cameraTarget: 'studio' }, reproduction: 'npm run test:screenshots' };
    manifest.viewport = fixture.viewport;
    process.env.ROOM_TEST_RESULTS = root;
    process.env.ROOM_TEST_COMMIT = commit;
    process.env.ROOM_TEST_DIRTY = String(manifest.dirty);
    const save = () => { writeGallery(directory, manifest); writeHistory(root); };
    save();
    try {
        await withBrowser(fixture, async (page, result, system, browser) => {
            manifest.browser = result.browser; manifest.gpu = result.loaded.renderer;
            manifest.conditions = { preset: fixture.preset, viewport: fixture.viewport, layers: result.loaded.layers, browser: result.browser, gpu: manifest.gpu, seed: fixture.seed, count: fixture.count, animationTime: 0 };
            const views = await page.evaluate(async () => (await import('/tests/support/visual-capture.mjs')).prepare());
            const selected = options.view ? options.view.split(',') : views.map(v => v.key);
            assert.equal(new Set(selected).size, selected.length, 'Duplicate views');
            for (const key of selected) assert(views.some(v => v.key === key), `Unknown view ${key}`);
            result.reproduction = `npm run test:screenshots -- --preset=${fixture.preset} --view=${selected.join(',')}`;
            manifest.views = views;
            const canvas = await page.$('[data-visual-capture]');
            assert(canvas, 'Missing scene canvas');
            for (const view of views.filter(v => selected.includes(v.key))) {
                for (const projection of ['ortho', 'persp']) {
                    const camera = await deadline(page.evaluate(async (key, projection) => (await import('/tests/support/visual-capture.mjs')).applyView(key, projection), view.key, projection), fixture.heartbeatTimeoutMs, `Camera did not settle: ${view.key}/${projection}`);
                    const file = `${view.key}-${projection}.png`;
                    await canvas.screenshot({ path: path.join(directory, file) });
                    manifest.captures.push({ kind: 'image', view: view.key, label: view.label, projection, file, camera });
                    save();
                    console.log(`✓ ${view.key} / ${projection}`);
                }
            }
            assert.equal(manifest.captures.length, selected.length * 2);
            save();
            const review = await browser.newPage(), errors = [];
            review.on('pageerror', error => errors.push(String(error)));
            try {
                await review.goto(pathToFileURL(path.join(root, 'index.html')).href);
                const loaded = await review.evaluate(async () => {
                    const before = document.getElementById('before'), after = document.getElementById('after');
                    before.value = '0'; after.value = '0';
                    before.dispatchEvent(new Event('change'));
                    const images = [...document.images];
                    for (const img of images) img.loading = 'eager';
                    await Promise.all(images.map(img => img.decode()));
                    return images.filter(img => img.naturalWidth > 0).length;
                });
                assert.equal(loaded, manifest.captures.length * 2, 'Offline comparison images did not load');
                assert.deepEqual(errors, [], 'Offline gallery errors');
                manifest.galleryVerified = true;
            } finally { await review.close(); }
            manifest.status = 'passed';
        });
    } catch (error) { manifest.status = 'failed'; manifest.error = error.stack; throw error; }
    finally {
        save();
        console.log(`Galerie : ${path.join(directory, 'index.html')}`);
        console.log(`Historique : ${path.join(root, 'index.html')}`);
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
