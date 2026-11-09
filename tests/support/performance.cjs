const fs = require('node:fs/promises');
const { summary, assertCompatible } = require('./statistics.cjs');
const { deadline } = require('./browser.cjs');
const { installRenderMetrics } = require('./render-metrics.cjs');
const { hostMetrics } = require('./host-metrics.cjs');
const { createProgress, PROGRESS_INTERVAL_MS } = require('./progress.cjs');
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
    const progress = createProgress(fixture.id);
    const initialHost = await hostMetrics();
    result.conditions = {
        powerMode: initialHost.powerMode,
        scenario: fixture.activity, configuration: { count: fixture.count, preset: fixture.preset, seed: fixture.seed, collisions: fixture.collisions, stableMs: fixture.stableMs, sessionMs: fixture.sessionMs, environment: fixture.fixedEnvironment ?? null, frameSource: fixture.fixedEnvironment ? 'main-scene-render' : 'requestAnimationFrame' },
        viewport: fixture.viewport, drawingBuffer: result.loaded.drawingBuffer, models: result.loaded.models,
        layers: result.loaded.layers, camera: result.loaded.camera, browser: result.browser,
        renderer: result.loaded.renderer, gpu: { devices: result.gpu.gpu.devices, featureStatus: result.gpu.gpu.featureStatus }, cache: fixture.cache,
        hardware: { platform: result.environment.platform, release: result.environment.release, arch: result.environment.arch, cpu: result.environment.cpus.map(c => c.model), memoryBytes: result.environment.memoryBytes },
    };
    const referenceConditions = JSON.parse(process.env.ROOM_TEST_OPTIONS).referenceConditions?.[fixture.configurationId];
    if (referenceConditions)
        assertCompatible(result, { conditions: referenceConditions });
    progress(`Alimentation : ${initialHost.powerMode} ; RAM disponible : ${(initialHost.availableBytes / 1024 ** 3).toFixed(2)} Gio ; swap : ${(initialHost.swapUsedBytes / 1024 ** 3).toFixed(2)} Gio`);
    if (fixture.fixedEnvironment) await page.evaluate(installRenderMetrics);
    if (!fixture.fixedEnvironment) await page.evaluate(async () => {
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
            const rendered = since > 0 ? window.__testRenderedFrames?.filter(f => f.at >= since && f.at <= end) : undefined;
            const frames = (rendered ?? window.__testFrames).filter(f => f.at >= since && f.at <= end).map(f => f.ms);
            const longTasks = window.__testLongTasks.filter(t => t.startTime >= since && t.startTime <= end);
            const positions = structuredClone(cameraState.positions);
            const materials = new Set();
            window.__THREE_SCENE__.traverse(o => { if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m); });
            const rendering = rendered?.length ? Object.fromEntries(['cpuRenderMs', 'calls', 'triangles'].map(key => [key, rendered.map(f => f[key])])) : null;
            const gpu = window.__testGpu;
            const recent = (window.__testRenderedFrames ?? window.__testFrames).filter(frame => frame.at >= performance.now() - 1000);
            const recentMs = recent.reduce((total, frame) => total + frame.ms, 0);
            const liveFps = recentMs > 0 ? recent.length * 1000 / recentMs : null;
            return { liveFps, rendering, gpu: gpu ? { available: gpu.available, disjoint: gpu.disjoint, frames: gpu.samples.filter(f => f.at >= since && f.at <= end).map(f => f.ms) } : null, frames, longTasks, pathfinding: { ...pathfindingStats }, three: { ...gl.info.memory, programs: gl.info.programs.length, materials: materials.size }, positions,
                camera: window.__THREE_SCENE__ ? { mode: cameraState.mode, characterX: cameraState.characterX, characterZ: cameraState.characterZ } : null,
                now: performance.now() };
        }, { since, end });
    }
    const startupEnd = await page.evaluate(() => performance.now());
    const startup = await snapshot(0, startupEnd);
    result.measurements = { startup: { durationMs: result.startupMs, frameMs: summary(startup.frames), longTasks: startup.longTasks, pathfinding: startup.pathfinding }, samples: [] };
    for (const [name, duration] of [['stable', fixture.stableMs], ['session', fixture.sessionMs]]) {
        const phaseLabel = name === 'stable' ? 'Chauffe' : 'Mesure';
        progress(`${phaseLabel} : 0/${duration / 1000} s`);
        const initial = await snapshot(0, 0), start = initial.now;
        const memory = [], activities = [];
        const began = performance.now();
        let nextProgress = PROGRESS_INTERVAL_MS;
        while (performance.now() - began < duration) {
            const sample = await deadline((async () => {
                const [chrome, metrics, scene, host] = await Promise.all([
                    chromeMemory(system), client.send('Performance.getMetrics'), snapshot(0, 0), hostMetrics(),
                ]);
                const js = Object.fromEntries(metrics.metrics.filter(m => ['JSHeapUsedSize', 'JSHeapTotalSize'].includes(m.name)).map(m => [m.name, m.value]));
                return { elapsedMs: performance.now() - began, liveFps: scene.liveFps, host, chrome, javascript: js, three: scene.three, pathfinding: scene.pathfinding, positions: scene.positions };
            })(), fixture.heartbeatTimeoutMs, 'Performance page unresponsive');
            memory.push({ elapsedMs: sample.elapsedMs, chrome: sample.chrome, javascript: sample.javascript, three: sample.three });
            activities.push({ elapsedMs: sample.elapsedMs, positions: sample.positions, pathfinding: sample.pathfinding });
            result.measurements.samples.push({ phase: name, ...sample });
            if (sample.elapsedMs >= nextProgress) {
                progress(`${phaseLabel} : ${(sample.elapsedMs / 1000).toFixed(0)}/${duration / 1000} s — ${sample.liveFps === null ? 'FPS en attente' : sample.liveFps.toFixed(1) + ' FPS'} ; ${sample.three.programs} programmes GPU ; RAM dispo ${(sample.host.availableBytes / 1024 ** 3).toFixed(2)} Gio ; ${sample.host.powerMode}`);
                nextProgress = sample.elapsedMs + PROGRESS_INTERVAL_MS;
            }
            // Persist independently of the browser heartbeat so a freeze retains last metrics.
            await fs.writeFile(`${process.env.ROOM_TEST_RESULTS}/${fixture.id}/partial-metrics.json`, JSON.stringify(result.measurements));
            await new Promise(resolve => setTimeout(resolve, Math.min(1000, Math.max(0, duration - (performance.now() - began)))));
        }
        const end = await snapshot(start, Number.MAX_VALUE);
        result.measurements[name] = { durationMs: performance.now() - began, fps: end.frames.length * 1000 / end.frames.reduce((n, ms) => n + ms, 0),
            rendering: end.rendering ? Object.fromEntries(Object.entries(end.rendering).map(([key, values]) => [key, summary(values)])) : null,
            gpu: end.gpu ? { available: end.gpu.available, disjoint: end.gpu.disjoint, timeMs: end.gpu.frames.length ? summary(end.gpu.frames) : null } : { available: false },
            frameMs: summary(end.frames), longTasks: { count: end.longTasks.length, totalMs: end.longTasks.reduce((n, t) => n + t.duration, 0), entries: end.longTasks },
            memorySummary: Object.fromEntries(Object.entries({ chromeRssBytes: memory.map(m => m.chrome.sumRssBytes), jsHeapUsedBytes: memory.map(m => m.javascript.JSHeapUsedSize), jsHeapTotalBytes: memory.map(m => m.javascript.JSHeapTotalSize), geometries: memory.map(m => m.three.geometries), textures: memory.map(m => m.three.textures), materials: memory.map(m => m.three.materials), programs: memory.map(m => m.three.programs) }).map(([key, values]) => [key, summary(values)])),
            pathfinding: { submitted: end.pathfinding.submitted - initial.pathfinding.submitted, completed: end.pathfinding.completed - initial.pathfinding.completed, cancelled: end.pathfinding.cancelled - initial.pathfinding.cancelled, maximumWorkerMsSinceLaunch: end.pathfinding.maxWorkerMs, queued: end.pathfinding.queued }, memory, activities };
        progress(`${phaseLabel} terminée : ${result.measurements[name].fps.toFixed(1)} FPS ; image p95 ${result.measurements[name].frameMs.p95.toFixed(1)} ms`);
    }
    const hosts = [result.hostAtStart, initialHost, ...result.measurements.samples.map(sample => sample.host), await hostMetrics()];
    result.disturbances = {
        minimumAvailableBytes: Math.min(...hosts.map(host => host.availableBytes)),
        swapGrowthBytes: hosts.at(-1).swapUsedBytes - hosts[0].swapUsedBytes,
        powerChanged: hosts.some(host => host.powerMode !== initialHost.powerMode),
        note: 'Swap growth or a power change requires review before accepting a reference; memory availability alone does not prove contention.',
    };
    if (result.disturbances.powerChanged) progress('ATTENTION : alimentation modifiée ; création/comparaison de référence refusée');
    if (result.disturbances.swapGrowthBytes > 0) progress(`ATTENTION : swap en hausse de ${(result.disturbances.swapGrowthBytes / 1024 ** 2).toFixed(1)} Mio ; vérifier la pression mémoire`);
    await page.screenshot({ path: `${process.env.ROOM_TEST_RESULTS}/${fixture.id}/scene.png` });
};
