/**
 * devState.ts — état partagé entre DevToolsCollector (Canvas) et DevToolsOverlay (HTML).
 */

export const devState = {
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

  // FPS — tableau glissant de samples (temps entre frames rendus)
  fpsSamples: [] as number[],

  onUpdate:     null as (() => void) | null,
  /** Enregistré par DevToolsCollector ; appeler pour recalculer les stats scène. */
  refreshScene: null as (() => void) | null,
};
