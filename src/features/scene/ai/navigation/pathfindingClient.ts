import type { Point } from './geometry';
import type { GraphSnapshot, ApproachQuery, DuoQuery } from './queries';
import type { PathRequest, PathResponse, NavigationQuery, NavigationResult, WorkerDefinition } from './pathfinding.worker';
import { navigationQuery, readNavigationJob, type NavigationJob } from './navigationScope';
import { cameraState } from '../../cameraState';

export interface NavigationGraph extends GraphSnapshot {
  readonly id: number;
  readonly definition: WorkerDefinition;
  canReach(start: Point, target: Point): boolean;
  findReachable(start: Point, targets: Point[]): Point | null;
}

export interface PathSearch {
  readonly graph: NavigationGraph;
  readonly start: Point;
  readonly target: Point;
  status: 'pending' | 'ready' | 'error' | 'cancelled';
  path: Point[] | null;
  error?: Error;
  cancel: () => void;
  onRead?: () => void;
}
interface Job extends NavigationJob<NavigationResult> {
  id: number;
  graphId: number;
  definition: WorkerDefinition;
  query: NavigationQuery;
  path: Point[] | null;
  onComplete: () => void;
  settle: () => void;
  submittedAt: number;
  dispatchedAt: number;
  receivedAt?: number;
}
const queue = new Map<number, Job>();
let nextGraphId = 0, nextJobId = 0;
let worker: Worker | undefined;
let running: Job | undefined;
const workerGraphIds = new Set<number>();
let failure: Error | undefined;

export const pathfindingStats = { submitted: 0, completed: 0, cancelled: 0, running: false, queued: 0, lastWorkerMs: 0, maxWorkerMs: 0,
  timings: Object.fromEntries(['build', 'path', 'reach', 'reach-first', 'approach', 'duo'].map(kind => [kind, {
    completed: 0, consumed: 0, queueMs: 0, workerMs: 0, deliveryMs: 0, resumeMs: 0, maxTotalMs: 0,
  }])),
};

function fail(error: Error) {
  failure = error;
  const jobs = [...(running ? [running] : []), ...queue.values()];
  running = undefined;
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

function dispatch() {
  if (failure || running || !queue.size) return;
  if (!worker) {
    worker = new Worker(new URL('./pathfinding.worker.ts', import.meta.url), { type: 'module', name: 'room-navigation' });
    worker.onerror = event => fail(new Error(`Navigation worker: ${event.message}`));
    worker.onmessageerror = () => fail(new Error('Navigation worker response could not be decoded'));
    worker.onmessage = (event: MessageEvent<PathResponse>) => {
      const response = event.data, job = running;
      if (!job || job.id !== response.id || job.graphId !== response.graphId) {
        fail(new Error('Navigation worker response does not match the running request'));
        return;
      }
      running = undefined;
      pathfindingStats.running = false;
      pathfindingStats.completed++;
      pathfindingStats.lastWorkerMs = response.milliseconds;
      pathfindingStats.maxWorkerMs = Math.max(pathfindingStats.maxWorkerMs, response.milliseconds);
      job.receivedAt = performance.now();
      const timing = pathfindingStats.timings[job.query.kind];
      timing.completed++;
      timing.queueMs += job.dispatchedAt - job.submittedAt;
      timing.workerMs += response.milliseconds;
      timing.deliveryMs += job.receivedAt - job.dispatchedAt - response.milliseconds;
      if (response.ok && job.status !== 'cancelled') workerGraphIds.add(job.graphId);
      else workerGraphIds.delete(job.graphId);
      if (job.status !== 'cancelled') {
        if (response.ok) { job.result = response.result; if (job.query.kind === 'path') job.path = response.result as Point[] | null; job.status = 'ready'; }
        else { job.error = new Error(response.error); job.status = 'error'; }
        job.settle();
        job.onComplete();
      } else if (!response.ok) {
        // Cancellation never hides invalid geometry or an algorithm failure.
        console.error(response.error);
      }
      dispatch();
    };
  }
  const job = queue.values().next().value!;
  queue.delete(job.id);
  running = job;
  pathfindingStats.running = true;
  pathfindingStats.queued = queue.size;
  const request: PathRequest = { id: job.id, graphId: job.graphId, query: job.query };
  if (!workerGraphIds.has(job.graphId)) request.definition = job.definition;
  job.dispatchedAt = performance.now();
  try { worker.postMessage(request); }
  catch (error) { fail(error instanceof Error ? error : new Error(String(error))); }
}

function request(graphId: number, definition: WorkerDefinition, query: NavigationQuery, onComplete = () => cameraState.invalidate?.()): Job {
  if (failure) throw failure;
  let settle!: () => void;
  const settled = new Promise<void>(resolve => { settle = resolve; });
  const description = { build: 'Construction du graphe de navigation', path: 'Calcul du trajet', reach: 'Vérification de l’accessibilité', 'reach-first': 'Vérification groupée de l’accessibilité', approach: 'Calcul de l’approche de l’objet', duo: 'Calcul du placement du duo' }[query.kind];
  let consumed = false;
  const job: Job = { id: ++nextJobId, graphId, definition, query, description, status: 'pending', path: null, onComplete, settled, settle,
    submittedAt: performance.now(), dispatchedAt: 0,
    onRead() {
      if (consumed || job.receivedAt === undefined) return;
      consumed = true;
      const now = performance.now(), timing = pathfindingStats.timings[query.kind];
      timing.consumed++;
      timing.resumeMs += now - job.receivedAt;
      timing.maxTotalMs = Math.max(timing.maxTotalMs, now - job.submittedAt);
    },
    cancel() {
      if (job.status !== 'pending') return;
      job.status = 'cancelled';
      job.settle();
      queue.delete(job.id);
      pathfindingStats.queued = queue.size;
      pathfindingStats.cancelled++;
    },
  };
  pathfindingStats.submitted++;
  queue.set(job.id, job);
  pathfindingStats.queued = queue.size;
  dispatch();
  return job;
}

export function requestPath(graph: NavigationGraph, start: Point, target: Point, onComplete: () => void): PathSearch {
  return Object.assign(request(graph.id, graph.definition, { kind: 'path', start: { ...start }, target: { ...target } }, onComplete), { graph, start: { ...start }, target: { ...target } });
}

function releaseGraph(id: number): void {
  for (const job of queue.values()) if (job.graphId === id) job.cancel();
  if (running?.graphId === id) running.cancel();
  workerGraphIds.delete(id);
  worker?.postMessage({ release: id });
}

export function prepareNavigationGraph(definition: WorkerDefinition): { read(): NavigationGraph; retain(): () => void; cancel(): void } {
  const id = ++nextGraphId;
  const job = request(id, definition, { kind: 'build' });
  let graph: NavigationGraph | undefined;
  let users = 1, cancelled = false;
  const release = () => {
    if (users <= 0) throw new Error('Navigation graph released without an owner');
    if (--users === 0) { job.cancel(); releaseGraph(id); }
  };
  return {
    retain: () => {
      if (users === 0) throw new Error('Cannot retain a released navigation graph');
      users++;
      return release;
    },
    cancel: () => { if (!cancelled) { cancelled = true; release(); } },
    read() {
      if (!graph) {
        const snapshot = readNavigationJob(job) as GraphSnapshot;
        graph = { ...snapshot, id, definition,
          canReach(start, target) {
            return navigationQuery(`${id}:reach:${start.x}:${start.z}:${target.x}:${target.z}`, () => request(id, definition, { kind: 'reach', start: { ...start }, target: { ...target } })) as boolean;
          },
          findReachable(start, targets) {
            if (!targets.length) return null;
            return navigationQuery(`${id}:reach-first:${JSON.stringify([start, targets])}`, () => request(id, definition, { kind: 'reach-first', start: { ...start }, targets })) as Point | null;
          },
        };
      }
      return graph;
    },
  };
}

export function readObjectApproach(graph: NavigationGraph, approach: ApproachQuery): Point[] {
  const { owner, goal, start, exiting, flexible, region, actors } = approach;
  return navigationQuery(`${graph.id}:approach:${JSON.stringify([owner, goal, start, exiting, flexible, region, actors])}`, () => request(graph.id, graph.definition, { kind: 'approach', approach })) as Point[];
}
export function readDuoAnchor(graph: NavigationGraph, duo: DuoQuery): Point | null {
  return navigationQuery(`${graph.id}:duo:${JSON.stringify(duo)}`, () => request(graph.id, graph.definition, { kind: 'duo', duo })) as Point | null;
}

if (import.meta.hot) import.meta.hot.dispose(() => {
  worker?.terminate();
  fail(new Error('Navigation worker replaced during hot reload'));
});
