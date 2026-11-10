const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withBrowser } = require('../tests/support/browser.cjs');
const { installRenderMetrics } = require('../tests/support/render-metrics.cjs');
const original = process.argv.includes('--original');
const high = process.argv.includes('--high');
const period = process.argv.includes('--night') ? 'night' : 'day';
process.env.ROOM_TEST_SUITE = 'perf';
process.env.ROOM_TEST_OPTIONS = '{}';
const root = path.resolve(__dirname, '../test-results');
fs.mkdirSync(root, { recursive: true });
process.env.ROOM_TEST_RESULTS = fs.mkdtempSync(path.join(root, `light-switches-${original ? 'original' : 'scene'}-`));
const fixture = { ...require('../tests/fixtures/cases.cjs').performance[`studio-9-mid-${period}`], id: 'switches',
    originalLightShader: original, preset: high ? 'high' : 'mid', timeoutMs: 240000,
    reproduction: `node scripts/test-light-switches.cjs${original ? ' --original' : ''}${high ? ' --high' : ''}${period === 'night' ? ' --night' : ''} --hardware-gpu` };
withBrowser(fixture, async (page, result, system) => {
    const memory = async () => {
        const { processInfo } = await system.send('SystemInfo.getProcessInfo');
        let pss = 0, rendererRss = 0;
        for (const process of processInfo) {
            try {
                const status = fs.readFileSync(`/proc/${process.id}/smaps_rollup`, 'utf8');
                pss += Number(/^Pss:\s+(\d+) kB$/m.exec(status)[1]) * 1024;
                if (process.type === 'renderer') rendererRss += Number(/^Rss:\s+(\d+) kB$/m.exec(status)[1]) * 1024;
            } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        return { pss, rendererRss };
    };
    await page.evaluate(installRenderMetrics);
    await new Promise(resolve => setTimeout(resolve, 15000));
    const client = await page.createCDPSession();
    await client.send('HeapProfiler.collectGarbage');
    const samples = [], initialMemory = await memory();
    for (const cycle of [1, 2]) for (const on of [true, false]) for (const key of ['lamp-toggle', 'ninja-light', 'fridge']) {
        const start = await page.evaluate(async ({ key, on }) => {
            const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
            const start = performance.now();
            useSceneStore.getState().triggerAction(key, on, 'user');
            return start;
        }, { key, on });
        await new Promise(resolve => setTimeout(resolve, 3000));
        const data = await page.evaluate(start => {
            const frames = window.__testRenderedFrames.filter(frame => frame.at >= start);
            const lights = [];
            window.__THREE_SCENE__.traverse(light => { if (light.isLight) lights.push({ name: light.name, intensity: light.intensity, visible: light.visible }); });
            return { maxFrameMs: Math.max(...frames.map(frame => frame.ms)), maxRenderMs: Math.max(...frames.map(frame => frame.cpuRenderMs)), programs: window.__THREE_GL__.info.programs.length,
                invalidLights: lights.filter(light => !light.visible) };
        }, start);
        assert.deepEqual(data.invalidLights, []);
        const sample = { cycle, key, on, ...data, memory: await memory() };
        samples.push(sample);
        console.log(JSON.stringify(sample));
    }
    await client.send('HeapProfiler.collectGarbage');
    const finalMemory = await memory();
    fs.writeFileSync(path.join(process.env.ROOM_TEST_RESULTS, 'switches.json'), JSON.stringify({ original, high, period, initialMemory, finalMemory, samples }, null, 2));
    console.log('Mémoire après GC :', finalMemory);
    console.log(`Rapport : ${process.env.ROOM_TEST_RESULTS}/switches.json`);
}).catch(error => { console.error(error); process.exitCode = 1; });
