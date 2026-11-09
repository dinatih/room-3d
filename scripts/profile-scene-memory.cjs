const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { withBrowser } = require('../tests/support/browser.cjs');
const { hostMetrics } = require('../tests/support/host-metrics.cjs');
const fixture = require('../tests/fixtures/cases.cjs').performance['studio-9-mid-day'];

async function main() {
    const variants = process.argv.slice(2).filter(arg => arg !== '--hardware-gpu');
    if (!variants.length || variants.some(variant => !['original', 'scene'].includes(variant))) throw Error('Select original and/or scene');
    process.env.ROOM_TEST_SUITE = 'perf';
    process.env.ROOM_TEST_OPTIONS = '{}';
    process.env.ROOM_TEST_RESULTS = await fs.mkdtemp(path.join(os.tmpdir(), 'room-memory-'));
    process.env.ROOM_TEST_COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    process.env.ROOM_TEST_DIRTY = String(Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()));
    for (const [index, variant] of variants.entries()) {
        await withBrowser({ ...fixture, sceneModels: variant === 'original' ? 'original' : 'scene-512', retainLoaderParser: variant === 'original', id: `${index + 1}-${variant}` }, async (page, result, system) => {
            const client = await page.createCDPSession();
            await new Promise(resolve => setTimeout(resolve, 15000));
            await client.send('HeapProfiler.collectGarbage');
            result.memorySamples = [];
            for (let sample = 0; sample < 4; sample++) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                const { processInfo } = await system.send('SystemInfo.getProcessInfo');
                const processes = [];
                for (const process of processInfo) {
                    try {
                        const memory = await fs.readFile(`/proc/${process.id}/smaps_rollup`, 'utf8');
                        const bytes = name => Number(new RegExp(`^${name}:\\s+(\\d+) kB`, 'm').exec(memory)[1]) * 1024;
                        processes.push({ type: process.type, rssBytes: bytes('Rss'), pssBytes: bytes('Pss') });
                    } catch (error) {
                        if (error.code !== 'ENOENT') throw error;
                        processes.push({ type: process.type, exited: true });
                    }
                }
                const metrics = { processes, javascript: await client.send('Runtime.getHeapUsage'), host: await hostMetrics(),
                    sumPssBytes: processes.reduce((sum, process) => sum + (process.pssBytes ?? 0), 0), sumRssBytes: processes.reduce((sum, process) => sum + (process.rssBytes ?? 0), 0) };
                result.memorySamples.push(metrics);
                const rendererRss = Math.max(...processes.filter(process => process.type === 'renderer').map(process => process.rssBytes ?? 0));
                console.log(`MEMORY ${variant} ${sample + 1}/4 — rendu RSS ${(rendererRss / 1024 ** 3).toFixed(2)} Gio ; navigateur PSS ${(metrics.sumPssBytes / 1024 ** 3).toFixed(2)} Gio`);
            }
            result.sceneMemory = await page.evaluate(() => {
                const scene = window.__THREE_SCENE__, textures = new Map(), paths = new Set();
                scene.traverse(object => {
                    if (object.userData.loadedGltfPath) paths.add(object.userData.loadedGltfPath);
                    if (!object.isMesh) return;
                    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                        for (const texture of Object.values(material)) if (texture?.isTexture) textures.set(texture.source.uuid, texture);
                    }
                });
                return { paths: [...paths], textures: textures.size, baseRgbaBytes: [...textures.values()].reduce((sum, texture) => sum + (texture.image?.width ?? 0) * (texture.image?.height ?? 0) * 4, 0) };
            });
            await page.screenshot({ path: path.join(process.env.ROOM_TEST_RESULTS, result.id, 'scene.png') });
            console.log(`SCENE ${variant} — ${result.sceneMemory.textures} sources ; pixels RGBA de base ${(result.sceneMemory.baseRgbaBytes / 1024 ** 2).toFixed(0)} Mio`);
        });
    }
    console.log('Results:', process.env.ROOM_TEST_RESULTS);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
