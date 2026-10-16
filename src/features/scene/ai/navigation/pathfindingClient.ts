import type { Point, VisibilityGraph } from './geometry';
import type { PathRequest, PathResponse } from './pathfinding.worker';

export interface PathSearch {
  readonly graph: VisibilityGraph;
  readonly start: Point;
  readonly target: Point;
  status: 'pending' | 'ready' | 'error' | 'cancelled';
  path: Point[] | null;
  error?: Error;
  cancel: () => void;
}
interface Job extends PathSearch {
  id: number;
  graphId: number;
  onComplete: () => void;
}
const graphIds = new WeakMap<VisibilityGraph, number>();
const queue = new Map<number, Job>();
let nextGraphId = 0, nextJobId = 0;
let worker: Worker | undefined;
let running: Job | undefined;
let workerGraphId: number | undefined;
let failure: Error | undefined;

export const pathfindingStats = { submitted: 0, completed: 0, cancelled: 0, running: false, queued: 0, lastWorkerMs: 0, maxWorkerMs: 0 };

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
      workerGraphId = response.ok ? job.graphId : undefined;
      if (job.status !== 'cancelled') {
        if (response.ok) { job.path = response.path; job.status = 'ready'; }
        else { job.error = new Error(response.error); job.status = 'error'; }
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
  const request: PathRequest = { id: job.id, graphId: job.graphId, start: job.start, target: job.target };
  if (workerGraphId !== job.graphId) request.definition = { obstacles: job.graph.obstacles, comfort: job.graph.comfort };
  try { worker.postMessage(request); }
  catch (error) { fail(error instanceof Error ? error : new Error(String(error))); }
}

export function requestPath(graph: VisibilityGraph, start: Point, target: Point, onComplete: () => void): PathSearch {
  if (failure) throw failure;
  let graphId = graphIds.get(graph);
  if (graphId === undefined) { graphId = ++nextGraphId; graphIds.set(graph, graphId); }
  const job: Job = { id: ++nextJobId, graphId, graph, start: { ...start }, target: { ...target }, status: 'pending', path: null, onComplete,
    cancel() {
      if (job.status !== 'pending') return;
      job.status = 'cancelled';
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

if (import.meta.hot) import.meta.hot.dispose(() => {
  worker?.terminate();
  fail(new Error('Navigation worker replaced during hot reload'));
});
