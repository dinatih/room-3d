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
  const lastFrameTime = useRef(performance.now());

  useEffect(() => {
    devState.refreshScene = () => {
      let meshes = 0, instances = 0, lights = 0, verts = 0, tris = 0;
      const buckets = new Map<string, number>();

      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        if (!m.isMesh) {
          if ((obj as THREE.Light).isLight) lights++;
          return;
        }

        const isInst = (obj as THREE.InstancedMesh).isInstancedMesh;
        if (isInst) instances++;
        else meshes++;

        if (m.geometry) {
          const pos = m.geometry.attributes?.position;
          if (pos) {
            const count = m.geometry.index ? m.geometry.index.count : pos.count;
            const t = count / 3;
            const factor = isInst ? (obj as THREE.InstancedMesh).count : 1;
            verts += pos.count * factor;
            tris  += t * factor;
          }
          const key = ancestorKey(obj);
          buckets.set(key, (buckets.get(key) ?? 0) + (isInst ? (obj as THREE.InstancedMesh).count : 1));
        }
      });

      devState.meshes    = meshes;
      devState.instances = instances;
      devState.lights    = lights;
      devState.verts     = Math.round(verts);
      devState.tris      = Math.round(tris);
      devState.topMeshes = Array.from(buckets.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
      devState.onUpdate?.();
    };

    // Auto-refresh stats every 2s
    const id = setInterval(() => devState.refreshScene?.(), 2000);
    return () => { devState.refreshScene = null; clearInterval(id); };
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

    devState.onUpdate?.();
  });

  return null;
}
