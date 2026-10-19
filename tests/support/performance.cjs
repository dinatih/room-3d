const fs = require('node:fs/promises');
const { summary, assertCompatible } = require('./statistics.cjs');
const { deadline } = require('./browser.cjs');
async function chromeMemory(system) {
    const { processInfo } = await system.send('SystemInfo.getProcessInfo');
    const processes = [];
    for (const process of processInfo) {
        try {
            const status = await fs.readFile(`/proc/${process.id}/status`, 'utf8');
            const rss = /^VmRSS:\s+(\d+) kB$/m.exec(status);
            processes.push({ ...process, rssBytes: rss ? Number(rss[1]) * 1024 : null });
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
            processes.push({ ...process, unavailable: 'Process exited before RSS sampling' });
        }
    }
    return { processes, sumRssBytes: processes.reduce((n, p) => n + (p.rssBytes ?? 0), 0), note: 'RSS sum counts shared pages in each process; not unique physical memory' };
}
exports.measure = async (page, result, system, fixture) => {
    result.conditions = {
        scenario: fixture.activity, configuration: { count: fixture.count, preset: fixture.preset, seed: fixture.seed, collisions: fixture.collisions, stableMs: fixture.stableMs, sessionMs: fixture.sessionMs },
        viewport: fixture.viewport, drawingBuffer: result.loaded.drawingBuffer, models: result.loaded.models,
        layers: result.loaded.layers, camera: result.loaded.camera, browser: result.browser,
        renderer: result.loaded.renderer, gpu: { devices: result.gpu.gpu.devices, featureStatus: result.gpu.gpu.featureStatus }, cache: fixture.cache,
        hardware: { platform: result.environment.platform, release: result.environment.release, arch: result.environment.arch, cpu: result.environment.cpus.map(c => c.model), memoryBytes: result.environment.memoryBytes },
    };
    const referenceConditions = JSON.parse(process.env.ROOM_TEST_OPTIONS).referenceConditions?.[fixture.configurationId];
    if (referenceConditions)
        assertCompatible(result, { conditions: referenceConditions });
    await page.evaluate(async () => {
        const { cameraState } = await import('/src/features/scene/cameraState.ts');
        const { resetAppIdle } = await import('/src/features/scene/idleState.ts');
        // Keep the scene active for the complete explicit measurement campaign.
        window.__testActiveFrame = () => { resetAppIdle(); cameraState.invalidate?.(); requestAnimationFrame(window.__testActiveFrame); };
        window.__testActiveFrame();
    });
    const client = await page.createCDPSession();
    await client.send('Performance.enable');
    async function snapshot(since, end) {
        return page.evaluate(async ({ since, end }) => {
            const { pathfindingStats } = await import('/src/features/scene/ai/navigation/pathfindingClient.ts');
            const { cameraState } = await import('/src/features/scene/cameraState.ts');
            const gl = window.__THREE_GL__;
            const frames = window.__testFrames.filter(f => f.at >= since && f.at <= end).map(f => f.ms);
            const longTasks = window.__testLongTasks.filter(t => t.startTime >= since && t.startTime <= end);
            const positions = structuredClone(cameraState.positions);
            return { frames, longTasks, pathfinding: { ...pathfindingStats }, three: { ...gl.info.memory, programs: gl.info.programs.length }, positions,
                camera: window.__THREE_SCENE__ ? { mode: cameraState.mode, characterX: cameraState.characterX, characterZ: cameraState.characterZ } : null,
                now: performance.now() };
        }, { since, end });
    }
    const startupEnd = await page.evaluate(() => performance.now());
    const startup = await snapshot(0, startupEnd);
    result.measurements = { startup: { durationMs: result.startupMs, frameMs: summary(startup.frames), longTasks: startup.longTasks, pathfinding: startup.pathfinding }, samples: [] };
    for (const [name, duration] of [['stable', fixture.stableMs], ['session', fixture.sessionMs]]) {
        const initial = await snapshot(0, 0), start = initial.now;
        const memory = [], activities = [];
        const began = performance.now();
        while (performance.now() - began < duration) {
            const sample = await deadline((async () => {
                const [chrome, metrics, scene] = await Promise.all([
                    chromeMemory(system), client.send('Performance.getMetrics'), snapshot(0, 0),
                ]);
                const js = Object.fromEntries(metrics.metrics.filter(m => ['JSHeapUsedSize', 'JSHeapTotalSize'].includes(m.name)).map(m => [m.name, m.value]));
                return { elapsedMs: performance.now() - began, chrome, javascript: js, three: scene.three, pathfinding: scene.pathfinding, positions: scene.positions };
            })(), fixture.heartbeatTimeoutMs, 'Performance page unresponsive');
            memory.push({ elapsedMs: sample.elapsedMs, chrome: sample.chrome, javascript: sample.javascript, three: sample.three });
            activities.push({ elapsedMs: sample.elapsedMs, positions: sample.positions, pathfinding: sample.pathfinding });
            result.measurements.samples.push({ phase: name, ...sample });
            // Persist independently of the browser heartbeat so a freeze retains last metrics.
            await fs.writeFile(`${process.env.ROOM_TEST_RESULTS}/${fixture.id}/partial-metrics.json`, JSON.stringify(result.measurements));
            await new Promise(resolve => setTimeout(resolve, Math.min(1000, Math.max(0, duration - (performance.now() - began)))));
        }
        const end = await snapshot(start, Number.MAX_VALUE);
        result.measurements[name] = { durationMs: performance.now() - began, frameMs: summary(end.frames), longTasks: { count: end.longTasks.length, totalMs: end.longTasks.reduce((n, t) => n + t.duration, 0), entries: end.longTasks },
            memorySummary: Object.fromEntries(Object.entries({ chromeRssBytes: memory.map(m => m.chrome.sumRssBytes), jsHeapUsedBytes: memory.map(m => m.javascript.JSHeapUsedSize), jsHeapTotalBytes: memory.map(m => m.javascript.JSHeapTotalSize), geometries: memory.map(m => m.three.geometries), textures: memory.map(m => m.three.textures), programs: memory.map(m => m.three.programs) }).map(([key, values]) => [key, summary(values)])),
            pathfinding: { submitted: end.pathfinding.submitted - initial.pathfinding.submitted, completed: end.pathfinding.completed - initial.pathfinding.completed, cancelled: end.pathfinding.cancelled - initial.pathfinding.cancelled, maximumWorkerMsSinceLaunch: end.pathfinding.maxWorkerMs, queued: end.pathfinding.queued }, memory, activities };
    }
};
