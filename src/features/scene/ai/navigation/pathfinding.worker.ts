import { VisibilityGraph, type Point, type Polygon } from './geometry';
import type { NavigationComfort } from './comfort';

export interface PathRequest {
  id: number;
  graphId: number;
  definition?: { obstacles: Polygon[][]; comfort?: NavigationComfort };
  start: Point;
  target: Point;
}
export type PathResponse = { id: number; graphId: number; milliseconds: number } & (
  { ok: true; path: Point[] | null } | { ok: false; error: string }
);

// Keep the latest graph's lazy search caches without retaining every historical
// furniture/door snapshot. The client sends a definition whenever it changes.
let graphId: number | undefined;
let graph: VisibilityGraph | undefined;

self.onmessage = (event: MessageEvent<PathRequest>) => {
  const request = event.data;
  const started = performance.now();
  let result: PathResponse;
  try {
    if (request.definition) {
      graph = new VisibilityGraph(request.definition.obstacles, request.definition.comfort);
      graphId = request.graphId;
    }
    if (!graph || graphId !== request.graphId) throw new Error('Navigation worker received an unknown graph');
    const path = graph.find(request.start, request.target);
    result = { id: request.id, graphId: request.graphId, ok: true, path, milliseconds: performance.now() - started };
  } catch (error) {
    result = { id: request.id, graphId: request.graphId, ok: false,
      error: error instanceof Error ? error.stack ?? error.message : String(error), milliseconds: performance.now() - started };
  }
  self.postMessage(result);
};
