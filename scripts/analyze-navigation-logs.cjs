const fs = require('node:fs');
const readline = require('node:readline');
const path = require('node:path');

async function analyze(file) {
  const actions = {}, actors = new Map(), errors = new Map();
  const worker = { completed: 0, cancelled: 0, maxQueueMs: 0, maxWorkerMs: 0, maxDeliveryMs: 0, maxResumeMs: 0 };
  let first, last, session, lines = 0, world;
  for await (const line of readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })) {
    if (!line) continue;
    const row = JSON.parse(line), e = row.entry, d = e.data;
    lines++; first ??= row.receivedAt; last = row.receivedAt; session ??= row.session;
    actions[e.action ?? 'unclassified'] = (actions[e.action ?? 'unclassified'] ?? 0) + 1;
    if (e.action === 'nav_world') world = d;
    if (['nav_agent_snapshot', 'nav_stop', 'nav_stop_end'].includes(e.action)) {
      let actor = actors.get(e.tag);
      if (!actor) { actor = { id: e.tag, stops: 0, maxStopMs: 0, maxNoProgressMs: 0, reasons: {}, last: null }; actors.set(e.tag, actor); }
      if (e.action === 'nav_stop') { actor.stops++; actor.reasons[d.reason] = (actor.reasons[d.reason] ?? 0) + 1; }
      if (e.action === 'nav_stop_end') actor.maxStopMs = Math.max(actor.maxStopMs, d.durationMs);
      if (e.action === 'nav_agent_snapshot') {
        if (d.stop) actor.maxStopMs = Math.max(actor.maxStopMs, row.elapsedMs - d.stop.startedAt);
        if (!d.idle && (d.navigationError || d.waitingForNavigation || ['MOVING', 'BLOCKED'].includes(d.status))) actor.maxNoProgressMs = Math.max(actor.maxNoProgressMs, d.noProgressMs);
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
  return { file: fs.realpathSync(file), session, first, last, lines, actions, worker,
    actors: [...actors.values()].sort((a, b) => b.maxNoProgressMs - a.maxNoProgressMs), errors: [...errors.values()],
    lastWorld: world && { revision: world.revision, actors: world.actors, furnitureCount: world.furniture.length, movingFurniture: world.movingFurniture,
      doors: world.doors.map(({ key, actualAngle, allowedAngle }) => ({ key, actualAngle, allowedAngle })),
      doorRequests: world.doorRequests, slots: world.slots, rooms: world.rooms, jobs: world.jobs } };
}
module.exports = { analyze };
if (require.main === module) analyze(process.argv[2] ?? path.join('/tmp/room-3d-logs', 'latest.jsonl'))
  .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error); process.exitCode = 1; });
