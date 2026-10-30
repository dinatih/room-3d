const fs = require('node:fs');
const readline = require('node:readline');
const path = require('node:path');

async function analyze(file, sinceElapsedMs = 0) {
  const actions = {}, actors = new Map(), errors = new Map();
  const jobs = new Map(), stopDurations = {}, openStops = new Map(), buildCauses = {}, reuseCauses = {};
  const snapshotClippedStops = [];
  const navigating = data => data.waitingForNavigation || ['MOVING', 'BLOCKED'].includes(data.status);
  const finishStop = (stop, at) => {
    const duration = at - stop.at, totals = stopDurations[stop.reason] ??= { count: 0, totalMs: 0, maxMs: 0 };
    totals.count++; totals.totalMs += duration; totals.maxMs = Math.max(totals.maxMs, duration);
  };
  let builds = 0, buildCpuMs = 0, inaccessibleStarts = 0, firstElapsed, lastElapsed;
  const worker = { completed: 0, cancelled: 0, maxQueueMs: 0, maxWorkerMs: 0, maxDeliveryMs: 0, maxResumeMs: 0 };
  let first, last, session, lines = 0, world;
  for await (const line of readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })) {
    if (!line) continue;
    const row = JSON.parse(line), e = row.entry, d = e.data;
    if (row.elapsedMs !== undefined && row.elapsedMs < sinceElapsedMs) {
      if (e.action === 'nav_stop') openStops.set(e.tag, { reason: d.reason, at: sinceElapsedMs });
      if (e.action === 'nav_stop_end') openStops.delete(e.tag);
      if (e.action === 'nav_agent_snapshot' && !navigating(d)) openStops.delete(e.tag);
      continue;
    }
    lines++; first ??= row.receivedAt; last = row.receivedAt; session ??= row.session;
    if (row.elapsedMs !== undefined) { firstElapsed ??= row.elapsedMs; lastElapsed = row.elapsedMs; }
    if (e.action === 'nav_path' && d.startAccessible === false) inaccessibleStarts++;
    if (['nav_graph_geometry', 'nav_detour_geometry'].includes(e.action)) buildCauses[d.cause ?? 'unclassified'] = (buildCauses[d.cause ?? 'unclassified'] ?? 0) + 1;
    if (['nav_graph_reused', 'nav_detour_reused'].includes(e.action)) reuseCauses[d.cause] = (reuseCauses[d.cause] ?? 0) + 1;
    if (e.action?.startsWith('nav_job_')) {
      const key = `${d.epoch}:${d.jobId}`;
      const job = jobs.get(key) ?? { jobId: d.jobId, graphId: d.graphId, kind: d.kind, events: [] };
      job.events.push({ action: e.action, at: row.elapsedMs, timestamp: row.receivedAt, ...d });
      jobs.set(key, job);
      if (e.action === 'nav_job_wait') job.waitAt ??= row.elapsedMs;
      if (['nav_job_consumed', 'nav_job_cancelled'].includes(e.action)) job.endAt = row.elapsedMs;
      if (e.action === 'nav_job_completed' && d.kind === 'build') { builds++; buildCpuMs += d.workerMs; }
    }
    if (e.action === 'nav_stop') {
      const previous = openStops.get(e.tag);
      if (previous?.reason !== d.reason) {
        if (previous) finishStop(previous, row.elapsedMs);
        openStops.set(e.tag, { reason: d.reason, at: row.elapsedMs });
      }
    }
    if (e.action === 'nav_stop_end') {
      const stop = openStops.get(e.tag);
      if (stop) finishStop(stop, row.elapsedMs);
      openStops.delete(e.tag);
    }
    if (e.action === 'nav_agent_snapshot' && !navigating(d) && openStops.has(e.tag)) {
      const stop = openStops.get(e.tag);
      finishStop(stop, row.elapsedMs);
      snapshotClippedStops.push({ actor: e.tag, reason: stop.reason, at: row.elapsedMs });
      openStops.delete(e.tag);
    }
    actions[e.action ?? 'unclassified'] = (actions[e.action ?? 'unclassified'] ?? 0) + 1;
    if (e.action === 'nav_world') world = d;
    if (['nav_agent_snapshot', 'nav_stop', 'nav_stop_end'].includes(e.action)) {
      let actor = actors.get(e.tag);
      if (!actor) { actor = { id: e.tag, stops: 0, maxReportedStopMs: 0, maxNoProgressMs: 0, reasons: {}, last: null }; actors.set(e.tag, actor); }
      if (e.action === 'nav_stop') { actor.stops++; actor.reasons[d.reason] = (actor.reasons[d.reason] ?? 0) + 1; }
      if (e.action === 'nav_stop_end') actor.maxReportedStopMs = Math.max(actor.maxReportedStopMs, d.durationMs);
      if (e.action === 'nav_agent_snapshot') {
        if (d.stop) actor.maxReportedStopMs = Math.max(actor.maxReportedStopMs, row.elapsedMs - d.stop.startedAt);
        if (!d.idle && navigating(d)) actor.maxNoProgressMs = Math.max(actor.maxNoProgressMs, d.noProgressMs);
        actor.last = { at: row.receivedAt, position: d.state, status: d.status, instruction: d.instruction, reason: d.navigationError,
          route: { graphId: d.route.graphId, target: d.route.target, next: d.route.next, index: d.route.index, points: d.route.path.length,
            blockers: d.route.blockers, waitReason: d.route.waitReason, error: d.route.error, crowd: d.route.crowd },
          pendingJob: d.pendingJob, idle: d.idle, noProgressMs: d.noProgressMs };
      }
    }
    if (e.action === 'nav_job_completed') {
      worker.completed++; worker.maxQueueMs = Math.max(worker.maxQueueMs, d.queueMs);
      worker.maxWorkerMs = Math.max(worker.maxWorkerMs, d.workerMs); worker.maxDeliveryMs = Math.max(worker.maxDeliveryMs, d.deliveryMs);
    }
    if (e.action === 'nav_job_consumed') worker.maxResumeMs = Math.max(worker.maxResumeMs, d.resumeMs);
    if (e.action === 'nav_job_cancelled') worker.cancelled++;
    if (e.tag === 'error' || ['nav_exception', 'nav_path_error'].includes(e.action)) {
      const key = `${e.action}:${d?.error?.message ?? d?.message ?? e.message ?? ''}`;
      const previous = errors.get(key);
      if (previous) { previous.count++; previous.last = row.receivedAt; }
      else errors.set(key, { action: e.action, message: key, count: 1, first: row.receivedAt, last: row.receivedAt });
    }
  }
  const elapsedMs = (lastElapsed ?? 0) - (firstElapsed ?? 0);
  const waits = [...jobs.values()].filter(job => job.waitAt !== undefined).map(job => ({ ...job,
    complete: job.endAt !== undefined, waitMs: (job.endAt ?? lastElapsed) - job.waitAt }));
  const completedWaits = waits.filter(job => job.complete);
  return { file: fs.realpathSync(file), session, first, last, lines, actions, worker,
    navigation: { elapsedMs, builds, buildsPerMinute: elapsedMs > 0 ? builds * 60000 / elapsedMs : null, buildCpuMs, buildCauses, reuseCauses,
      inaccessibleStarts, completedWaits: completedWaits.length, incompleteWaits: waits.filter(job => !job.complete).length,
      totalWaitMs: completedWaits.reduce((total, job) => total + job.waitMs, 0), maxWaitMs: completedWaits.reduce((max, job) => Math.max(max, job.waitMs), 0),
      cancelledWaits: completedWaits.filter(job => job.events.at(-1).action === 'nav_job_cancelled').length,
      waitsOver250Ms: waits.filter(job => job.waitMs > 250), stopDurations, snapshotClippedStops,
      openStops: [...openStops].map(([actor, stop]) => ({ actor, ...stop, durationMs: lastElapsed - stop.at })) },
    actors: [...actors.values()].sort((a, b) => b.maxNoProgressMs - a.maxNoProgressMs), errors: [...errors.values()],
    lastWorld: world && { revision: world.revision, actors: world.actors, furnitureCount: world.furniture.length, movingFurniture: world.movingFurniture,
      doors: world.doors.map(({ key, actualAngle, allowedAngle }) => ({ key, actualAngle, allowedAngle })),
      doorRequests: world.doorRequests, slots: world.slots, rooms: world.rooms, jobs: world.jobs } };
}
module.exports = { analyze };
if (require.main === module) analyze(process.argv[2] ?? path.join('/tmp/room-3d-logs', 'latest.jsonl'))
  .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error); process.exitCode = 1; });
