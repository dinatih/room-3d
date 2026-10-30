const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const launch = require('./browser-test-options.cjs');
const { deadline, closeResources } = require('../tests/support/browser.cjs');
const { analyze } = require('./analyze-navigation-logs.cjs');
require('../tests/support/load-ts.cjs');
const { CHARACTERS } = require('../src/features/scene/characterConfig.ts');
const reportDirectory = process.argv.find(arg => arg.startsWith('--report='))?.slice('--report='.length);
const reference = reportDirectory ? '' : process.env.ROOM_NAV_BASELINE_REF ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const resume = process.argv.find(arg => arg.startsWith('--resume='))?.slice('--resume='.length);
const directory = path.resolve(resume ?? process.env.ROOM_CAMPAIGN_OUT ?? `test-results/navigation-rebuild-${new Date().toISOString().replaceAll(':', '-')}`);
const versions = process.argv.includes('--after-only') ? ['after'] : ['before', 'after'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const snapshot = reportDirectory ? undefined : fs.mkdtempSync(path.join(os.tmpdir(), 'navigation-campaign-'));
if (snapshot) execFileSync('tar', ['-x', '-C', snapshot], { input: execFileSync('git', ['archive', reference, 'src'], { maxBuffer: 64 * 1024 * 1024 }) });
const changed = new Map(['service.ts', 'pathfindingClient.ts'].map(name => {
  const file = `src/features/scene/ai/navigation/${name}`;
  return [path.resolve(file), fs.readFileSync(file, 'utf8')];
}));

async function run(version, seed, visible = false) {
  const id = `${version}-${seed}-${visible ? 'visible' : 'hidden'}`, output = path.join(directory, id);
  if (resume && fs.existsSync(path.join(output, 'report.json'))) {
    const previous = JSON.parse(fs.readFileSync(path.join(output, 'report.json')));
    if (previous.reference !== reference) throw Error('Cannot resume with a different baseline');
    if (previous.status === 'complete') { console.log(id, 'already complete'); return previous; }
    throw Error('Keep incomplete reports distinct; move the incomplete session directory before resuming');
  }
  fs.mkdirSync(output, { recursive: true });
  const report = { id, reference, seed, count: CHARACTERS.length, catalog: CHARACTERS.map(c => c.id), visible,
    sessionMs: visible ? 600000 : 300000, headless: true, errors: [], status: 'running' };
  const save = () => fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(id, 'started', new Date().toISOString()); save();
  let server, browser, page;
  const deployed = new Set();
  try {
    const { createServer } = await import('vite');
    server = await createServer({ server: { host: '127.0.0.1', port: 5198, strictPort: true },
      plugins: [{ name: 'navigation-baseline', enforce: 'pre', configureServer(server) {
        server.ws.on('room:app-log', ({ entry, session }) => {
          if (report.session !== session) { report.session = session; deployed.clear(); }
          if (entry.action === 'nav_agent_snapshot' && entry.data.deployment?.hasCompleted && report.catalog.includes(entry.tag)) deployed.add(entry.tag);
        });
      }, load(id) {
        const file = id.split('?')[0];
        if (version === 'after' && changed.has(file)) return changed.get(file);
        const relative = path.relative(process.cwd(), file);
        if (relative.startsWith('src/') && /\.(tsx?|css|scss)$/.test(file)) return fs.readFileSync(path.join(snapshot, relative), 'utf8');
      } }] });
    await server.listen();
    await server.watcher.close();
    browser = await launch({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'], protocolTimeout: 240000,
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 } });
    report.gpu = await (await browser.target().createCDPSession()).send('SystemInfo.getInfo');
    page = await browser.newPage();
    page.on('error', e => { report.errors.push(String(e)); save(); });
    page.on('pageerror', e => { report.errors.push(String(e)); save(); });
    await page.evaluateOnNewDocument(seed => {
      let state = seed;
      Math.random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
      window.__testTrace = [];
      setInterval(() => window.dispatchEvent(new MouseEvent('mousemove')), 1000);
    }, seed);
    const query = new URLSearchParams({ characterCount: String(CHARACTERS.length), skipIntro: '1', preset: 'low', target: 'studio',
      ...(visible ? {} : { debug: 'characters-only' }), animals: '1', npcCollisions: '1' });
    await page.goto(`http://127.0.0.1:5198/?${query}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    const startup = Date.now();
    while (deployed.size !== report.count) {
      if (Date.now() - startup > 300000) throw Error('Character deployment incomplete after five minutes');
      await sleep(1000);
      report.deployed = [...deployed]; save();
      if (report.errors.length) throw Error(report.errors.join('\n'));
    }
    report.startupMs = Date.now() - startup;
    report.conditions = await page.evaluate(async visible => {
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { resetAppIdle } = await import('/src/features/scene/idleState.ts');
      useSceneStore.setState(s => ({ layers: { ...s.layers, animals: true, npcCollisions: true } }));
      setInterval(() => { resetAppIdle(); cameraState.invalidate?.(); }, 1000);
      const { devLog } = await import('/src/devLog.ts');
      devLog({ tag: 'campaign', action: 'campaign_start', data: { visible } });
      return { layers: useSceneStore.getState().layers, startedAt: performance.now() };
    }, visible);
    save();
    const began = Date.now();
    while (Date.now() - began < report.sessionMs) {
      await sleep(Math.min(10000, report.sessionMs - (Date.now() - began)));
      report.progress = await deadline(page.evaluate(async () => {
        const { OccupancyManager, LIMITED_ROOMS, ROOM_CAPACITIES } = await import('/src/features/scene/ai/occupancyManager.ts');
        const rooms = LIMITED_ROOMS.map(room => ({ room, count: OccupancyManager.getRoomOccupants(room).size, capacity: ROOM_CAPACITIES[room] }));
        if (rooms.some(r => r.count > r.capacity)) throw Error('Room capacity exceeded: ' + JSON.stringify(rooms));
        const { pathfindingStats } = await import('/src/features/scene/ai/navigation/pathfindingClient.ts');
        return { at: performance.now(), rooms, pathfindingStats };
      }), 30000, 'Browser heartbeat unavailable');
      save(); console.log(id, Math.round((Date.now() - began) / 1000), 'seconds');
      if (report.errors.length) throw Error(report.errors.join('\n'));
    }
    report.measuredMs = Date.now() - began;
    report.status = 'complete';
  } catch (error) {
    report.status = 'incomplete'; report.error = error.stack; report.cause = error.cause?.stack; process.exitCode = 1;
    try { report.failureState = await deadline(page.evaluate(() => ({ text: document.body.innerText, session: window.__roomDevLog })), 5000, 'Failure state unavailable'); }
    catch (error) { report.captureError = String(error); }
  }
  finally {
    try { await closeResources(browser, server); }
    catch (error) { report.status = 'incomplete'; report.teardownError = String(error); process.exitCode = 1; }
    if (report.session) {
      report.logFile = path.join('/tmp/room-3d-logs', fs.readdirSync('/tmp/room-3d-logs').find(name => name.endsWith(`_${report.session}.jsonl`)));
      fs.copyFileSync(report.logFile, path.join(output, 'session.jsonl'));
      report.analysis = await analyze(path.join(output, 'session.jsonl'), report.conditions?.startedAt ?? 0);
    }
    save(); console.log(id, report.status, report.error ?? '');
  }
  return report;
}
(async () => {
  if (reportDirectory) {
    const summaries = [];
    for (const entry of fs.readdirSync(reportDirectory, { withFileTypes: true }).filter(e => e.isDirectory())) {
      const output = path.join(reportDirectory, entry.name), file = path.join(output, 'report.json');
      if (!fs.existsSync(file)) continue;
      const report = JSON.parse(fs.readFileSync(file));
      if (report.status === 'running') { summaries.push({ id: report.id, status: report.status }); continue; }
      if (fs.existsSync(path.join(output, 'session.jsonl'))) {
        report.analysis = await analyze(path.join(output, 'session.jsonl'), report.conditions?.startedAt ?? 0);
        report.session = report.analysis.session;
        for (const job of report.analysis.navigation.waitsOver250Ms) {
          const completed = job.events.find(e => e.action === 'nav_job_completed'), consumed = job.events.find(e => e.action === 'nav_job_consumed');
          job.review = { complete: job.complete, workerMs: completed?.workerMs, queueMs: completed?.queueMs,
            deliveryMs: completed?.deliveryMs, resumeMs: consumed?.resumeMs,
            outcome: !job.complete ? completed ? 'ready-without-consumption' : 'unfinished-at-session-end' : job.events.at(-1).action === 'nav_job_cancelled' ? 'cancelled' : 'resumed' };
        }
        fs.writeFileSync(file, JSON.stringify(report, null, 2));
      }
      summaries.push({ id: report.id, status: report.status, measuredMs: report.measuredMs, error: report.error,
        ...report.analysis?.navigation, waitsOver250Ms: report.analysis?.navigation.waitsOver250Ms.length });
    }
    fs.writeFileSync(path.join(reportDirectory, 'summary.json'), JSON.stringify(summaries, null, 2));
    console.log(JSON.stringify(summaries, null, 2));
    return;
  }
  for (const seed of [20261019, 20261020, 20261021]) for (const version of versions) {
    const report = await run(version, seed);
    if (report.status !== 'complete') return;
  }
  await run('after', 20261021, true);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { if (snapshot) fs.rmSync(snapshot, { recursive: true }); });
