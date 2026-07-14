/**
 * devState.ts — état partagé entre DevToolsCollector (Canvas) et DevToolsOverlay (HTML).
 */

export interface DevState {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  meshes: number;
  instances: number;
  lights: number;
  verts: number;
  tris: number;
  topMeshes: Array<[name: string, count: number]>;
  fpsSamples: number[];
  onUpdate: (() => void) | null;
  /** Enregistré par DevToolsCollector ; appeler pour recalculer les stats scène. */
  refreshScene: (() => void) | null;
  /** Canvas optionnel pour le rendu direct des FPS sans React. */
  fpsCanvas: HTMLCanvasElement | null;
}

export const devState: DevState = {
  // Renderer stats — mis à jour chaque frame rendu
  drawCalls:  0,
  triangles:  0,
  geometries: 0,
  textures:   0,

  // Scene stats — mis à jour à la demande via refreshScene()
  meshes:    0,
  instances: 0,
  lights:    0,
  verts:     0,
  tris:      0,
  /** Top contributeurs au mesh count, groupés par ancêtre nommé. */
  topMeshes: [] as Array<[name: string, count: number]>,

  // FPS — tableau glissant de samples (temps entre frames rendus)
  fpsSamples: [] as number[],

  onUpdate:     null as (() => void) | null,
  /** Enregistré par DevToolsCollector ; appeler pour recalculer les stats scène. */
  refreshScene: null as (() => void) | null,
  /** Canvas optionnel pour le rendu direct des FPS sans React. */
  fpsCanvas: null as HTMLCanvasElement | null,
};
