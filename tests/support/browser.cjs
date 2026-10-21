const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const assert = require('node:assert/strict');
const { instrumentController } = require('./instrument-controller.cjs');
const launch = require('../../scripts/browser-test-options.cjs');
// Deadline runs in Node: a frozen page cannot prevent reporting or teardown.
exports.deadline = async (work, ms, message) => {
    let timer;
    try {
        return await Promise.race([work, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(message)), ms); })]);
    }
    finally {
        clearTimeout(timer);
    }
};
exports.closeResources = async (browser, server) => {
    try {
        if (browser) {
            try {
                await exports.deadline(browser.close(), 5000, 'Browser teardown timeout');
            }
            catch (error) {
                browser.process()?.kill('SIGKILL');
                throw error;
            }
        }
    }
    finally {
        if (server) {
            try { await exports.deadline(server.close(), 5000, 'Vite teardown timeout'); }
            catch (error) { server.httpServer?.closeAllConnections(); throw error; }
        }
    }
};
exports.withBrowser = async (fixture, exercise) => {
    const directory = path.join(process.env.ROOM_TEST_RESULTS, fixture.id);
    fs.mkdirSync(directory, { recursive: true });
    const result = { commit: process.env.ROOM_TEST_COMMIT, dirty: process.env.ROOM_TEST_DIRTY === 'true', id: fixture.id, configuration: fixture, status: 'running', errors: [], logs: [],
        environment: { platform: os.platform(), release: os.release(), arch: os.arch(), cpus: os.cpus(), memoryBytes: os.totalmem(), node: process.version },
        reproduction: fixture.reproduction ?? `npm run test:${process.env.ROOM_TEST_SUITE === 'perf' ? 'perf' : 'studio'} -- --case=${fixture.configurationId ?? fixture.id}${process.argv.includes('--hardware-gpu') ? ' --hardware-gpu' : ''}` };
    const save = () => fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2));
    let browser, server, heartbeat, cacheDir, closing = false, lastHeartbeat = Date.now();
    const start = performance.now();
    let rejectBrowser;
    const browserFailure = new Promise((_, reject) => { rejectBrowser = reject; });
    // The rejection may arrive during browser setup, before the race is attached.
    browserFailure.catch(() => { });
    save();
    try {
        const { createServer } = await import('vite');
        // Vite treats port 0 as its default port; ask the OS for a free port first.
        const probe = net.createServer();
        await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
        const port = probe.address().port;
        await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
        cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'room-3d-vite-'));
        server = await createServer({
            cacheDir,
            server: { host: '127.0.0.1', port, strictPort: true, hmr: false },
            plugins: [{ name: 'test-executed-instructions', enforce: 'pre', transform(source, id) {
                        if (id.split('?')[0].endsWith('/src/features/scene/ai/agentController.ts'))
                            return { code: instrumentController(source), map: null };
                    } }],
        });
        await server.listen();
        await server.watcher.close();
        const address = server.httpServer.address();
        const gpuArgs = process.platform === 'linux' || process.argv.includes('--hardware-gpu')
            ? ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface']
            : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
        browser = await launch({ args: ['--no-sandbox', ...gpuArgs], protocolTimeout: fixture.readinessTimeoutMs + fixture.timeoutMs });
        result.browser = await browser.version();
        browser.process().stderr?.on('data', chunk => fs.appendFileSync(path.join(directory, 'chromium.log'), chunk));
        browser.process().stdout?.on('data', chunk => fs.appendFileSync(path.join(directory, 'chromium.log'), chunk));
        const system = await browser.target().createCDPSession();
        result.gpu = await system.send('SystemInfo.getInfo');
        const page = await browser.newPage();
        await page.setViewport(fixture.viewport);
        const fail = error => { if (closing) return; result.errors.push(error.stack ?? String(error)); save(); rejectBrowser(Error(String(error))); };
        page.on('console', message => {
            result.logs.push({ type: message.type(), text: message.text() });
            if (message.type() === 'error') fail(message.text());
        });
        page.on('pageerror', fail);
        page.on('error', fail);
        page.on('response', response => { if (response.status() >= 400)
            fail(`HTTP ${response.status()}: ${response.url()}`); });
        page.on('requestfailed', request => { if (!closing)
            fail(`${request.url()}: ${request.failure()?.errorText}`); });
        await page.exposeFunction('__testHeartbeat', state => { lastHeartbeat = Date.now(); result.partial = state; save(); });
        await page.evaluateOnNewDocument(seed => {
            let state = seed;
            Math.random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
            window.__testTrace = [];
            const lastInstructions = new Map();
            window.__testRecordInstruction = (actor, instruction) => {
                if (lastInstructions.get(actor) === instruction)
                    return;
                lastInstructions.set(actor, instruction);
                window.__testTrace.push({ at: performance.now(), actor, executedInstruction: instruction ? structuredClone(instruction) : null });
            };
            document.addEventListener('app-log', event => window.__testTrace.push({ at: performance.now(), appLog: event.detail }));
            window.__testFrames = [];
            window.__testLongTasks = [];
            new PerformanceObserver(list => window.__testLongTasks.push(...list.getEntries().map(e => ({ startTime: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true });
            let last;
            const tick = now => {
                if (last !== undefined)
                    window.__testFrames.push({ at: now, ms: now - last });
                last = now;
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            setInterval(() => window.__testHeartbeat({ at: performance.now(), frames: window.__testFrames.length, trace: window.__testTrace }), 1000);
        }, fixture.seed);
        const work = (async () => {
            const startup = performance.now();
            const query = new URLSearchParams({ characterCount: String(fixture.count), skipIntro: '1', preset: fixture.preset, mode: fixture.camera, ...fixture.query });
            await page.goto(`http://127.0.0.1:${address.port}/?${query}`, { waitUntil: 'domcontentloaded', timeout: fixture.readinessTimeoutMs });
            await page.waitForFunction(async (count) => {
                const { cameraState } = await import('/src/features/scene/cameraState.ts');
                const { furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
                const { CHARACTERS, getDefaultSceneCharacterIds } = await import('/src/features/scene/characterConfig.ts');
                const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
                const ids = getDefaultSceneCharacterIds(count, useSceneStore.getState().activeCharacterId);
                return cameraState.isSceneLaunched && !cameraState.isIntroRunning && window.__THREE_GL__ && furnitureObstacles.size > 0 && ids.every(id => {
                    const model = window.__THREE_SCENE__.getObjectByName(CHARACTERS.find(c => c.id === id).name);
                    let skin = false;
                    model?.traverse(o => { if (o.isSkinnedMesh)
                        skin = true; });
                    return skin && model.visible && cameraState.positions[id] && !['falling', 'falling-idle', 'pistol-kneel-to-stand'].includes(cameraState.positions[id].anim);
                });
            }, { timeout: fixture.readinessTimeoutMs }, fixture.count);
            result.startupMs = performance.now() - startup;
            result.loaded = await page.evaluate(async (fixture) => {
                const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
                const { CHARACTERS, getDefaultSceneCharacterIds } = await import('/src/features/scene/characterConfig.ts');
                const { cameraState } = await import('/src/features/scene/cameraState.ts');
                useSceneStore.getState().setCameraMovement('fix');
                useSceneStore.setState(s => ({ layers: { ...s.layers, npcCollisions: fixture.collisions } }));
                const ctx = window.__THREE_GL__.getContext(), extension = ctx.getExtension('WEBGL_debug_renderer_info');
                const models = getDefaultSceneCharacterIds(fixture.count, useSceneStore.getState().activeCharacterId).map(id => {
                    const config = CHARACTERS.find(c => c.id === id), root = window.__THREE_SCENE__.getObjectByName(config.name);
                    let skinnedMeshes = 0;
                    const paths = new Set();
                    root.traverse(o => { if (o.isSkinnedMesh)
                        skinnedMeshes++; if (o.userData.gltfPath)
                        paths.add(o.userData.gltfPath); });
                    if (!paths.has(config.path))
                        throw Error('Wrong loaded model for ' + id + ': ' + [...paths]);
                    return { id, path: config.path, loadedPaths: [...paths], skinnedMeshes };
                });
                return { models, renderer: extension ? ctx.getParameter(extension.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER), drawingBuffer: [ctx.drawingBufferWidth, ctx.drawingBufferHeight], layers: useSceneStore.getState().layers, camera: { mode: cameraState.mode, camX: cameraState.camX, camZ: cameraState.camZ, camRY: cameraState.camRY } };
            }, fixture);
            save();
            await exports.deadline(exercise(page, result, system, browser), fixture.timeoutMs, `Scenario execution deadline: ${fixture.id}`);
            result.trace = await page.evaluate(() => window.__testTrace);
            assert.deepEqual(result.errors, [], 'Browser errors');
        })();
        heartbeat = setInterval(() => {
            if (Date.now() - lastHeartbeat > fixture.heartbeatTimeoutMs)
                rejectBrowser(Error(`Page heartbeat absent for ${fixture.heartbeatTimeoutMs} ms`));
        }, 1000);
        await exports.deadline(Promise.race([work, browserFailure]), fixture.readinessTimeoutMs + fixture.timeoutMs, `Scenario deadline: ${fixture.id}`);
        result.status = 'passed';
    }
    catch (error) {
        result.status = 'failed';
        result.error = error.stack ?? String(error);
        save();
        if (browser) {
            try {
                const pages = await exports.deadline(browser.pages(), 2000, 'Screenshot unavailable');
                await exports.deadline(pages.at(-1)?.screenshot({ path: path.join(directory, 'failure.png') }), 2000, 'Screenshot timed out');
            }
            catch (captureError) {
                result.captureError = String(captureError);
            }
        }
        throw error;
    }
    finally {
        closing = true;
        clearInterval(heartbeat);
        try {
            await exports.closeResources(browser, server);
        }
        catch (error) {
            result.teardownError = String(error);
            result.status = 'failed';
            throw error;
        }
        finally {
            if (cacheDir) fs.rmSync(cacheDir, { recursive: true });
            result.cleanup = { cacheRemoved: !cacheDir || !fs.existsSync(cacheDir), browserClosed: !browser?.connected, serverClosed: !server?.httpServer?.listening };
            result.durationMs = performance.now() - start;
            save();
        }
    }
    return result;
};
