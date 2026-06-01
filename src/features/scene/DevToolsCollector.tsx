/**
 * DevToolsCollector.tsx — collecte les stats Three.js depuis le Canvas.
 * Placer dans <Canvas>. Expose devState.refreshScene pour les stats scène.
 */
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { devState } from './devState';

const FPS_SAMPLES = 80;

/**
 * Trouve le plus proche ancêtre identifiable d'un mesh, pour le grouping.
 * Cherche, en remontant : un nom non-vide, ou userData.hoverAction.label
 * (convention de wrapping utilisée par les composants du projet).
 */
function ancestorKey(obj: THREE.Object3D): string {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.name) return cur.name;
    const label = cur.userData?.hoverAction?.label as string | undefined;
    if (label) return label;
    cur = cur.parent;
  }
  return '(unnamed)';
}

export function DevToolsCollector() {
  const { gl, scene } = useThree();
  const lastFrameTime   = useRef(performance.now());
  const sinceLastUpdate = useRef(0); // accumulateur pour throttle UI (en ms)

  useEffect(() => {
    devState.refreshScene = () => {
      let meshes = 0, instances = 0, lights = 0, verts = 0, tris = 0;
      const buckets = new Map<string, number>();

      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        const isInst = (obj as THREE.InstancedMesh).isInstancedMesh;
        if (isInst) instances++;
        else if (m.isMesh) meshes++;
        else if ((obj as THREE.Light).isLight) lights++;
        if (m.isMesh && !isInst && m.geometry) {
          const pos = m.geometry.attributes?.position;
          if (pos) {
            verts += pos.count;
            tris  += m.geometry.index ? m.geometry.index.count / 3 : pos.count / 3;
          }
          const key = ancestorKey(obj);
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
      });

      devState.meshes    = meshes;
      devState.instances = instances;
      devState.lights    = lights;
      devState.verts     = Math.round(verts);
      devState.tris      = Math.round(tris);
      devState.topMeshes = Array.from(buckets.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      devState.onUpdate?.();
    };
    return () => { devState.refreshScene = null; };
  }, [scene]);

  useFrame(() => {
    // Renderer stats — mis à jour dans devState à chaque frame (pas de React)
    const info = gl.info;
    devState.drawCalls  = info.render.calls;
    devState.triangles  = info.render.triangles;
    devState.geometries = info.memory.geometries;
    devState.textures   = info.memory.textures;

    // FPS — temps entre deux frames rendus
    const now = performance.now();
    const dt  = now - lastFrameTime.current;
    lastFrameTime.current = now;
    if (dt > 0 && dt < 2000) {
      devState.fpsSamples.push(Math.round(1000 / dt));
      if (devState.fpsSamples.length > FPS_SAMPLES) devState.fpsSamples.shift();
    }

    // Throttle : ne déclencher le re-render React que toutes les 250ms
    sinceLastUpdate.current += dt;
    if (sinceLastUpdate.current >= 250) {
      sinceLastUpdate.current = 0;
      devState.onUpdate?.();
    }
  });

  return null;
}
