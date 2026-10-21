import { VisibilityGraph, mergeObstacles, type Point, type Polygon } from './geometry';
import { buildNavigationGraph, objectApproachCandidates, findDuoPoint, type GraphDefinition, type GraphSnapshot, type ApproachQuery, type DuoQuery } from './queries';

export type WorkerDefinition = GraphDefinition | { obstacles: Polygon[][] };
export type NavigationQuery = { kind: 'build' } | { kind: 'path' | 'reach'; start: Point; target: Point } | { kind: 'reach-first'; start: Point; targets: Point[] } | { kind: 'approach'; approach: ApproachQuery } | { kind: 'duo'; duo: DuoQuery };

export interface PathRequest {
  id: number;
  graphId: number;
  definition?: WorkerDefinition;
  query: NavigationQuery;
}
export type NavigationResult = GraphSnapshot | Point[] | Point | boolean | null;
export type PathResponse = { id: number; graphId: number; milliseconds: number } & (
  { ok: true; result: NavigationResult } | { ok: false; error: string }
);

// Keep the latest graph's lazy search caches without retaining every historical
// furniture/door snapshot. The client sends a definition whenever it changes.
const graphs = new Map<number, VisibilityGraph>();

self.onmessage = (event: MessageEvent<PathRequest | { release: number }>) => {
  const request = event.data;
  if ('release' in request) { graphs.delete(request.release); return; }
  const started = performance.now();
  let result: PathResponse;
  try {
    let graph = graphs.get(request.graphId);
    if (request.definition) {
      graph = 'solids' in request.definition ? buildNavigationGraph(request.definition) : new VisibilityGraph(mergeObstacles(request.definition.obstacles));
      graphs.set(request.graphId, graph);
    }
    if (!graph) throw new Error('Navigation worker received an unknown graph');
    const query = request.query;
    const value = query.kind === 'build' ? { obstacles: graph.obstacles, comfort: graph.comfort, vertices: graph.vertices }
      : query.kind === 'approach' ? objectApproachCandidates(query.approach, graph)
      : query.kind === 'duo' ? findDuoPoint(query.duo, graph)
      : query.kind === 'reach-first' ? query.targets.find(target => graph!.canReach(query.start, target)) ?? null
      : query.kind === 'reach' ? graph.canReach(query.start, query.target) : graph.find(query.start, query.target);
    result = { id: request.id, graphId: request.graphId, ok: true, result: value, milliseconds: performance.now() - started };
  } catch (error) {
    result = { id: request.id, graphId: request.graphId, ok: false,
      error: error instanceof Error ? error.stack ?? error.message : String(error), milliseconds: performance.now() - started };
  }
  self.postMessage(result);
};
