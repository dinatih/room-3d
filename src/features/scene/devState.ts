/**
 * devState.ts — état partagé entre DevToolsCollector (Canvas) et DevToolsOverlay (HTML).
 */

export interface TopObjectStat {
  name: string;
  tris: number;
  verts: number;
  meshes: number;
  instances: number;
}

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
  topObjects: TopObjectStat[];
  fpsSamples: number[];
  onUpdate: (() => void) | null;
  /** Enregistré par DevToolsCollector ; appeler pour recalculer les stats scène. */
  refreshScene: (() => void) | null;
  /** Déclenche un diagnostic complet avec log dans la console de l'app et console browser. */
  logDiagnostics: (() => void) | null;
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
  topObjects: [] as TopObjectStat[],

  // FPS — tableau glissant de samples (temps entre frames rendus)
  fpsSamples: [] as number[],

  onUpdate:       null as (() => void) | null,
  refreshScene:   null as (() => void) | null,
  logDiagnostics: null as (() => void) | null,
  fpsCanvas:      null as HTMLCanvasElement | null,
};
