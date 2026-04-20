/**
 * DevToolsCollector.tsx — collecte les stats Three.js depuis le Canvas.
 * Placer dans <Canvas>. Expose devState.refreshScene pour les stats scène.
 */
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { devState } from './devState';

const FPS_SAMPLES = 80;

export function DevToolsCollector() {
  const { gl, scene } = useThree();
  const lastFrameTime = useRef(performance.now());

  useEffect(() => {
    devState.refreshScene = () => {
      let meshes = 0, instances = 0, lights = 0, verts = 0, tris = 0;
      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        if ((obj as THREE.InstancedMesh).isInstancedMesh) instances++;
        else if (m.isMesh) meshes++;
        else if ((obj as THREE.Light).isLight) lights++;
        if (m.isMesh && !(obj as THREE.InstancedMesh).isInstancedMesh && m.geometry) {
          const pos = m.geometry.attributes?.position;
          if (pos) {
            verts += pos.count;
            tris  += m.geometry.index ? m.geometry.index.count / 3 : pos.count / 3;
          }
        }
      });
      devState.meshes    = meshes;
      devState.instances = instances;
      devState.lights    = lights;
      devState.verts     = Math.round(verts);
      devState.tris      = Math.round(tris);
      devState.onUpdate?.();
    };
    return () => { devState.refreshScene = null; };
  }, [scene]);

  useFrame(() => {
    // Renderer stats
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
