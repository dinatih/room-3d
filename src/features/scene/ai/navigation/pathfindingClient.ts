import type { Point } from './geometry';
import { directObjectApproach, objectApproachCandidates, type GraphSnapshot, type ApproachQuery, type DuoQuery } from './queries';
import type { PathRequest, PathResponse, NavigationQuery, NavigationResult, WorkerDefinition } from './pathfinding.worker';
import { navigationQuery, readNavigationJob, type NavigationJob } from './navigationScope';
import { cameraState } from '../../cameraState';
import { NavigationMesh } from './mesh';
import { devLog, DEV_LOG_ENABLED } from '@/devLog';

export interface NavigationGraph extends GraphSnapshot {
  readonly id: number;
  readonly epoch: string;
  readonly definition: WorkerDefinition;
  canReach(start: Point, target: Point): boolean;
  findReachable(start: Point, targets: Point[]): Point | null;
  find(start: Point, target: Point): Point[] | null;
}
interface Job extends NavigationJob<NavigationResult> {
  id: number;
  graphId: number;
  definition: WorkerDefinition;
  query: NavigationQuery;
  onComplete: () => void;
  settle: () => void;
  submittedAt: number;
  dispatchedAt: number;
  receivedAt?: number;
  waitStartedAt?: number;
}
const queue = new Map<number, Job>();
const navigationEpoch = DEV_LOG_ENABLED ? crypto.randomUUID() : '';
let nextGraphId = 0, nextJobId = 0;
let worker: Worker | undefined;
const workerGraphIds = new Set<number>();
let failure: Error | undefined;

function traceJob(action: string, job: Job, data: object = {}) {
  devLog({ tag: 'navigation', category: 'nav', action, data: { epoch: navigationEpoch, jobId: job.id, graphId: job.graphId, kind: job.query.kind,
    status: job.status, queued: Math.max(0, queue.size - 1), runningJobId: queue.values().next().value?.id, ...data } });
}

export function getNavigationJobDiagnostics() {
  const describe = (job: Job) => ({ jobId: job.id, graphId: job.graphId, kind: job.query.kind, status: job.status,
    ageMs: performance.now() - job.submittedAt, submittedAt: job.submittedAt, dispatchedAt: job.dispatchedAt, waitStartedAt: job.waitStartedAt });
  const jobs = [...queue.values()];
  return { epoch: navigationEpoch, running: jobs[0] && describe(jobs[0]), queued: jobs.slice(1).map(describe), failure, stats: pathfindingStats };
}

export const pathfindingStats = { submitted: 0, completed: 0, cancelled: 0, running: false, queued: 0, lastWorkerMs: 0, maxWorkerMs: 0,
  timings: Object.fromEntries(['build', 'path', 'approach', 'duo'].map(kind => [kind, {
    completed: 0, consumed: 0, queueMs: 0, workerMs: 0, localMs: 0, deliveryMs: 0, resumeMs: 0, maxTotalMs: 0,
  }])),
};

function fail(error: Error) {
  devLog({ tag: 'error', category: 'nav', action: 'nav_worker_failure', data: { error, jobs: getNavigationJobDiagnostics() } });
  failure = error;
  const jobs = [...queue.values()];
  queue.clear();
  pathfindingStats.running = false;
  pathfindingStats.queued = 0;
  for (const job of jobs) {
    if (job.status === 'cancelled') continue;
    job.error = error;
    job.status = 'error';
    job.settle();
    job.onComplete();
  }
}

function dispatch(job: Job) {
  if (failure) return;
  if (!worker) {
    worker = new Worker(new URL('./pathfinding.worker.ts', import.meta.url), { type: 'module', name: 'room-navigation' });
    worker.onerror = event => fail(new Error(`Navigation worker: ${event.message}`));
    worker.onmessageerror = () => fail(new Error('Navigation worker response could not be decoded'));
    worker.onmessage = (event: MessageEvent<PathResponse>) => {
      const response = event.data, job = queue.get(response.id);
      if (!job || job.id !== response.id || job.graphId !== response.graphId) {
        fail(new Error('Navigation worker response does not match the running request'));
        return;
      }
      queue.delete(job.id);
      pathfindingStats.running = queue.size > 0;
      pathfindingStats.queued = Math.max(0, queue.size - 1);
      pathfindingStats.completed++;
      pathfindingStats.lastWorkerMs = response.milliseconds;
      pathfindingStats.maxWorkerMs = Math.max(pathfindingStats.maxWorkerMs, response.milliseconds);
      job.receivedAt = performance.now();
      const timing = pathfindingStats.timings[job.query.kind];
      timing.completed++;
      timing.queueMs += job.dispatchedAt - job.submittedAt + response.queueMilliseconds;
      timing.workerMs += response.milliseconds;
      timing.deliveryMs += job.receivedAt - job.dispatchedAt - response.milliseconds - response.queueMilliseconds;
      traceJob('nav_job_completed', job, { ok: response.ok, workerMs: response.milliseconds,
        queueMs: job.dispatchedAt - job.submittedAt + response.queueMilliseconds, deliveryMs: job.receivedAt - job.dispatchedAt - response.milliseconds - response.queueMilliseconds,
        result: response.ok ? job.query.kind === 'build' ? { cells: (response.result as GraphSnapshot).cells.length, vertices: (response.result as GraphSnapshot).vertices.length } : response.result : response.error });
      if (response.ok && job.status !== 'cancelled') workerGraphIds.add(job.graphId);
      else workerGraphIds.delete(job.graphId);
      if (job.status !== 'cancelled') {
        if (response.ok) { job.result = response.result; job.status = 'ready'; }
        else { job.error = new Error(response.error); job.status = 'error'; }
        job.settle();
        job.onComplete();
      } else if (!response.ok) {
        // Cancellation never hides invalid geometry or an algorithm failure.
        console.error(response.error);
      }
    };
  }
  pathfindingStats.running = true;
  pathfindingStats.queued = Math.max(0, queue.size - 1);
  job.dispatchedAt = performance.now();
  const request: PathRequest = { id: job.id, graphId: job.graphId, query: job.query, sentAt: performance.timeOrigin + job.dispatchedAt };
  if (!workerGraphIds.has(job.graphId)) request.definition = job.definition;
  traceJob('nav_job_dispatched', job, { queueMs: job.dispatchedAt - job.submittedAt });
  try { worker.postMessage(request); }
  catch (error) { fail(error instanceof Error ? error : new Error(String(error))); }
}

function request(graphId: number, definition: WorkerDefinition, query: NavigationQuery, onComplete = () => cameraState.invalidate?.()): Job {
  if (failure) throw failure;
  let settle!: () => void;
  const settled = new Promise<void>(resolve => { settle = resolve; });
  const description = { build: 'Construction du réseau de navigation', duo: 'Calcul du placement du duo' }[query.kind];
  let consumed = false;
  const job: Job = { id: ++nextJobId, graphId, definition, query, description, status: 'pending', onComplete, settled, settle,
    submittedAt: performance.now(), dispatchedAt: 0,
    onWait() { if (job.waitStartedAt === undefined) { job.waitStartedAt = performance.now(); traceJob('nav_job_wait', job); } },
    onRead() {
      if (consumed || job.receivedAt === undefined) return;
      consumed = true;
      const now = performance.now(), timing = pathfindingStats.timings[query.kind];
      traceJob('nav_job_consumed', job, { resumeMs: now - job.receivedAt, totalMs: now - job.submittedAt });
      timing.consumed++;
      if (job.waitStartedAt !== undefined) {
        timing.resumeMs += now - Math.max(job.receivedAt, job.waitStartedAt);
        timing.maxTotalMs = Math.max(timing.maxTotalMs, now - job.waitStartedAt);
      }
    },
    cancel() {
      if (job.status !== 'pending') return;
      job.status = 'cancelled';
      job.settle();
      pathfindingStats.cancelled++;
      traceJob('nav_job_cancelled', job, { ageMs: performance.now() - job.submittedAt });
    },
  };
  pathfindingStats.submitted++;
  queue.set(job.id, job);
  traceJob('nav_job_queued', job, { query });
  dispatch(job);
  return job;
}

export function findPath(graph: NavigationGraph, start: Point, target: Point): Point[] | null {
  const began = performance.now();
  let path: Point[] | null;
  try { path = graph.find(start, target); }
  catch (error) { devLog({ tag: 'error', category: 'nav', action: 'nav_path_error', data: { epoch: graph.epoch, graphId: graph.id, start, target, error, definition: graph.definition } }); throw error; }
  const elapsed = performance.now() - began;
  devLog({ tag: 'navigation', category: 'nav', action: 'nav_path', data: { epoch: graph.epoch, graphId: graph.id, start, target, path, elapsedMs: elapsed,
    startAccessible: path ? true : graph.canReach(start, start), targetAccessible: path ? true : graph.canReach(target, target) } });
  const timing = pathfindingStats.timings.path;
  timing.completed++; timing.consumed++; timing.localMs += elapsed;
  timing.maxTotalMs = Math.max(timing.maxTotalMs, elapsed);
  return path;
}

function releaseGraph(id: number): void {
  for (const job of queue.values()) if (job.graphId === id) job.cancel();
  workerGraphIds.delete(id);
  worker?.postMessage({ release: id });
  devLog({ tag: 'navigation', category: 'nav', action: 'nav_graph_released', data: { epoch: navigationEpoch, graphId: id } });
}

type GraphPreparation = { id: number; epoch: string; readonly pending: boolean; read(): NavigationGraph; retain(): () => void; cancel(): void };
const sharedGraphs = new Map<string, GraphPreparation>();
export function prepareNavigationGraph(definition: WorkerDefinition): GraphPreparation {
  const key = JSON.stringify(definition), shared = sharedGraphs.get(key);
  if (shared) {
    const release = shared.retain();
    let cancelled = false;
    return { ...shared, get pending() { return shared.pending; }, cancel: () => { if (!cancelled) { cancelled = true; release(); } } };
  }
  const id = ++nextGraphId;
  devLog({ tag: 'navigation', category: 'nav', action: 'nav_graph_created', data: { epoch: navigationEpoch, graphId: id, definition } });
  const job = request(id, definition, { kind: 'build' });
  let graph: NavigationGraph | undefined;
  let users = 1, cancelled = false;
  const release = () => {
    if (users <= 0) throw new Error('Navigation graph released without an owner');
    if (--users === 0) { sharedGraphs.delete(key); job.cancel(); releaseGraph(id); }
  };
  const preparation: GraphPreparation = {
    id,
    epoch: navigationEpoch,
    get pending() { return job.status === 'pending'; },
    retain: () => {
      if (users === 0) throw new Error('Cannot retain a released navigation graph');
      users++;
      return release;
    },
    cancel: () => { if (!cancelled) { cancelled = true; release(); } },
    read() {
      if (!graph) {
        const snapshot = readNavigationJob(job) as GraphSnapshot;
        const mesh = NavigationMesh.restore(snapshot);
        graph = { ...snapshot, id, epoch: navigationEpoch, definition,
          canReach: (start, target) => mesh.canReach(start, target),
          find: (start, target) => mesh.find(start, target),
          findReachable(start, targets) {
            return targets.find(target => mesh.canReach(start, target)) ?? null;
          },
        };
      }
      return graph;
    },
  };
  sharedGraphs.set(key, preparation);
  return preparation;
}

export function readObjectApproach(graph: NavigationGraph, approach: ApproachQuery): Point[] {
  const began = performance.now(), direct = directObjectApproach(approach, graph);
  const candidates = direct ? [direct] : objectApproachCandidates(approach, graph);
  const elapsed = performance.now() - began, timing = pathfindingStats.timings.approach;
  devLog({ tag: 'navigation', category: 'nav', action: 'nav_approach_candidates', data: { epoch: graph.epoch, graphId: graph.id,
    owner: approach.owner, goal: approach.goal, start: approach.start, owned: approach.owned, actors: approach.actors,
    exiting: approach.exiting, flexible: approach.flexible, region: approach.region, candidates, direct: Boolean(direct), elapsedMs: elapsed } });
  timing.completed++; timing.consumed++; timing.localMs += elapsed;
  timing.maxTotalMs = Math.max(timing.maxTotalMs, elapsed);
  return candidates;
}
export function readDuoAnchor(graph: NavigationGraph, duo: DuoQuery): Point | null {
  return navigationQuery(`${graph.id}:duo:${JSON.stringify(duo)}`, () => request(graph.id, graph.definition, { kind: 'duo', duo })) as Point | null;
}

if (import.meta.hot) import.meta.hot.dispose(() => {
  worker?.terminate();
  fail(new Error('Navigation worker replaced during hot reload'));
});
