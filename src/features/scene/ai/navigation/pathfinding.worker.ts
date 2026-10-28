import { mergeObstacles, type Point, type Polygon } from './geometry';
import { NavigationMesh } from './mesh';
import { buildNavigationGraph, findDuoPoint, type GraphDefinition, type GraphSnapshot, type DuoQuery } from './queries';

export type WorkerDefinition = GraphDefinition | { obstacles: Polygon[][]; surfaces: Polygon[][] };
export type NavigationQuery = { kind: 'build' } | { kind: 'duo'; duo: DuoQuery };

export interface PathRequest {
  id: number;
  graphId: number;
  sentAt: number;
  definition?: WorkerDefinition;
  query: NavigationQuery;
}
export type NavigationResult = GraphSnapshot | Point[] | Point | boolean | null;
export type PathResponse = { id: number; graphId: number; milliseconds: number; queueMilliseconds: number } & (
  { ok: true; result: NavigationResult } | { ok: false; error: string }
);

// Keep the latest graph's lazy search caches without retaining every historical
// furniture/door snapshot. The client sends a definition whenever it changes.
const graphs = new Map<number, NavigationMesh>();

self.onmessage = (event: MessageEvent<PathRequest | { release: number }>) => {
  const request = event.data;
  if ('release' in request) { graphs.delete(request.release); return; }
  const started = performance.now();
  const queueMilliseconds = performance.timeOrigin + started - request.sentAt;
  let result: PathResponse;
  try {
    let graph = graphs.get(request.graphId);
    if (request.definition) {
      graph = 'solids' in request.definition ? buildNavigationGraph(request.definition) : new NavigationMesh(mergeObstacles(request.definition.obstacles), request.definition.surfaces);
      graphs.set(request.graphId, graph);
    }
    if (!graph) throw new Error('Navigation worker received an unknown graph');
    const query = request.query;
    const value = query.kind === 'build' ? graph.snapshot()
      : findDuoPoint(query.duo, graph);
    result = { id: request.id, graphId: request.graphId, ok: true, result: value, milliseconds: performance.now() - started, queueMilliseconds };
  } catch (error) {
    result = { id: request.id, graphId: request.graphId, ok: false,
      error: error instanceof Error ? error.stack ?? error.message : String(error), milliseconds: performance.now() - started, queueMilliseconds };
  }
  self.postMessage(result);
};
