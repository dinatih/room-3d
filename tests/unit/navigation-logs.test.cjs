const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { analyze } = require('../../scripts/analyze-navigation-logs.cjs');

it('mesure les constructions, attentes complètes et arrêts sans confondre fin du worker et reprise', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'navigation-logs-'));
  const file = path.join(directory, 'session.jsonl');
  const row = (elapsedMs, action, data) => JSON.stringify({ elapsedMs, receivedAt: new Date(elapsedMs).toISOString(), session: 'fixture',
    entry: { tag: 'walker', action, data: { epoch: 'fixture', jobId: 1, graphId: 1, kind: 'build', ...data } } });
  fs.writeFileSync(file, [row(0, 'nav_job_queued'), row(10, 'nav_job_wait'),
    row(300, 'nav_job_completed', { workerMs: 200, queueMs: 40, deliveryMs: 60 }),
    row(400, 'nav_job_consumed', { resumeMs: 100 }), row(500, 'nav_stop', { reason: 'calcul' }),
    row(600, 'nav_stop', { reason: 'porte', stoppedForMs: 100 }),
    row(800, 'nav_stop_end', { reason: 'calcul', durationMs: 300 }), row(900, 'nav_path', { startAccessible: false }),
    row(1000, 'nav_job_wait', { jobId: 2 }), row(1400, 'page_heartbeat')].join('\n'));
  try {
    const { navigation } = await analyze(file);
    assert.equal(navigation.builds, 1); assert.equal(navigation.buildCpuMs, 200);
    assert.equal(navigation.buildsPerMinute, 60000 / 1400);
    assert.equal(navigation.inaccessibleStarts, 1);
    assert.equal(navigation.completedWaits, 1); assert.equal(navigation.incompleteWaits, 1);
    assert.equal(navigation.totalWaitMs, 390); assert.equal(navigation.maxWaitMs, 390);
    assert.deepEqual(navigation.waitsOver250Ms.map(j => j.waitMs), [390, 400]);
    assert.equal(navigation.waitsOver250Ms[0].events.at(-1).action, 'nav_job_consumed');
    assert.deepEqual(navigation.stopDurations.calcul, { count: 1, totalMs: 100, maxMs: 100 });
    assert.deepEqual(navigation.stopDurations.porte, { count: 1, totalMs: 200, maxMs: 200 });
    assert.equal((await analyze(file, 500)).navigation.builds, 0, 'A measurement window excludes startup builds');
    assert.equal((await analyze(file, 550)).navigation.stopDurations.calcul.totalMs, 50, 'An ongoing stop keeps its cause and is clipped to the measurement window');
    fs.writeFileSync(file, [row(0, 'nav_stop', { reason: 'calcul' }), row(100, 'nav_agent_snapshot', {
      status: 'INTERACTING', waitingForNavigation: false, stop: { reason: 'calcul', startedAt: 0 },
      state: { x: 0, z: 0 }, route: { path: [] }, noProgressMs: 100,
    }), row(10000, 'nav_stop_end', { reason: 'calcul', durationMs: 10000 })].join('\n'));
    const legacy = await analyze(file);
    assert.equal(legacy.navigation.stopDurations.calcul.totalMs, 100, 'An old diagnostic label must not count the interaction as a navigation stop');
    assert.equal(legacy.navigation.snapshotClippedStops.length, 1, 'Snapshot-based end times must remain explicit');
    assert.deepEqual((await analyze(file, 500)).navigation.stopDurations, {}, 'A stale stop ended before the measurement must not reappear');
  } finally { fs.rmSync(directory, { recursive: true }); }
});
