/**
 * DevToolsCollector.tsx — collecte les stats Three.js depuis le Canvas.
 * Placer dans <Canvas>. Expose devState.refreshScene et devState.logDiagnostics.
 */
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { devState, type TopObjectStat } from './devState';
import { drawFps } from './DevToolsOverlay';
import { isAppIdle } from './idleState';
import { appLog } from '@features/ui/AppConsole';

const FPS_SAMPLES = 80;

/**
 * Trouve l'entité / ancêtre de plus haut niveau pour identifier clairement le composant.
 */
function resolveEntityKey(obj: THREE.Object3D): string {
  let cur: THREE.Object3D | null = obj;
  let bestName = '';

  while (cur && cur.type !== 'Scene') {
    // 1. Label dans hoverAction (défini par convention sur les items interactifs et portes)
    const label = cur.userData?.hoverAction?.label as string | undefined;
    if (label) return label;

    // 2. Nom explicite via itemName ou name dans userData
    const itemName = (cur.userData?.itemName || cur.userData?.name) as string | undefined;
    if (itemName && itemName !== 'Scene' && itemName !== 'Group' && itemName !== 'Scene3D') return itemName;

    // 3. gltfPath ou item ID
    const gltfPath = (cur.userData?.gltfPath || cur.userData?.glb) as string | undefined;
    if (gltfPath) {
      const fn = gltfPath.split('/').pop()?.replace(/\.glb$/i, '');
      if (fn && fn !== 'Scene') return fn;
    }

    // 4. Nom d'objet explicite non générique
    if (
      cur.name &&
      cur.name !== 'Scene' &&
      cur.name !== 'Scene3D' &&
      !cur.name.match(/^(Group|primitive|default|Scene)$/i)
    ) {
      bestName = cur.name;
    }

    cur = cur.parent;
  }

  if (bestName) return bestName;

  // 5. Fallback sur le nom du matériau
  const mat = (obj as THREE.Mesh).material;
  if (mat) {
    const matName = Array.isArray(mat) ? mat[0]?.name : mat.name;
    if (matName && matName.trim() !== '' && !matName.match(/^(default)$/i)) {
      return `Mat: ${matName}`;
    }
  }

  // 6. Nom du maillage ou géométrie
  if (obj.name && obj.name.trim() !== '') return obj.name;
  if ((obj as THREE.Mesh).geometry?.name) return (obj as THREE.Mesh).geometry.name;

  return (obj as any).isInstancedMesh ? 'Instanced Mesh' : 'Élément 3D';
}

export function DevToolsCollector() {
  const { gl, scene } = useThree();
  const lastFrameTime = useRef(performance.now());
  const lowFpsCount = useRef(0);
  const lastAutoDiagTime = useRef(0);

  useEffect(() => {
    (window as any).__DEV_STATE__ = devState;
    (window as any).__THREE_SCENE__ = scene;
    (window as any).__THREE_GL__ = gl;
    devState.refreshScene = () => {
      let meshes = 0, instances = 0, lights = 0, verts = 0, tris = 0;
      const objectStats = new Map<string, { meshes: number; instances: number; tris: number; verts: number }>();

      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        if (!m.isMesh) {
          if ((obj as THREE.Light).isLight) lights++;
          return;
        }

        // Ignore hidden meshes (originals before merge, or toggled off)
        if (!m.visible) return;

        const isInst = (obj as THREE.InstancedMesh).isInstancedMesh;
        const instCount = isInst ? (obj as THREE.InstancedMesh).count : 1;

        if (isInst) instances++;
        else meshes++;

        let objVerts = 0;
        let objTris = 0;

        if (m.geometry) {
          const pos = m.geometry.attributes?.position;
          if (pos) {
            const count = m.geometry.index ? m.geometry.index.count : pos.count;
            const t = count / 3;
            objVerts = pos.count * instCount;
            objTris = t * instCount;
            verts += objVerts;
            tris  += objTris;
          }
        }

        const key = resolveEntityKey(obj);
        const existing = objectStats.get(key) ?? { meshes: 0, instances: 0, tris: 0, verts: 0 };
        if (isInst) existing.instances += instCount;
        else existing.meshes += 1;
        existing.tris += objTris;
        existing.verts += objVerts;
        objectStats.set(key, existing);
      });

      devState.meshes    = meshes;
      devState.instances = instances;
      devState.lights    = lights;
      devState.verts     = Math.round(verts);
      devState.tris      = Math.round(tris);

      const topObjectsList: TopObjectStat[] = Array.from(objectStats.entries()).map(([name, s]) => ({
        name,
        tris: Math.round(s.tris),
        verts: Math.round(s.verts),
        meshes: s.meshes,
        instances: s.instances,
      }));

      devState.topObjects = [...topObjectsList].sort((a, b) => b.tris - a.tris);
      devState.topMeshes  = [...topObjectsList]
        .sort((a, b) => (b.meshes + b.instances) - (a.meshes + a.instances))
        .map(o => [o.name, o.meshes + o.instances]);

      devState.onUpdate?.();
    };

    const runDiagnostics = (autoReason?: string) => {
      if (!devState.refreshScene) return;
      devState.refreshScene();

      const samples = devState.fpsSamples;
      const curFps = samples.length ? samples[samples.length - 1] : 0;
      const dc = devState.drawCalls;
      const trisK = (devState.triangles / 1000).toFixed(1);

      if (autoReason) {
        appLog('perf', `⚠️ Chute FPS détectée (${curFps} FPS) — ${autoReason}`);
      } else {
        appLog('perf', `🔍 Diagnostic Perf lancé — ${curFps} FPS | ${dc} Draw calls | ${trisK}k Triangles`);
      }

      // Top 5 coupables par triangles
      const topTris = [...devState.topObjects].sort((a, b) => b.tris - a.tris).slice(0, 5);
      topTris.forEach((item, idx) => {
        const kTris = (item.tris / 1000).toFixed(1);
        const instStr = item.instances > 0 ? ` (+${item.instances} inst)` : '';
        appLog('perf', `#${idx + 1} ${item.name} : ${kTris}k tris, ${item.meshes} meshes${instStr}`);
      });

      // Affichage détaillé dans la console développeur du navigateur
      console.group('%c[PERF DIAGNOSTIC] Analyse de la scène 3D', 'color: #ffaa00; font-weight: bold; font-size: 12px;');
      console.log(`FPS: ${curFps} | Draw calls: ${dc} | Triangles rendus: ${devState.triangles}`);
      console.table(devState.topObjects);
      console.groupEnd();
    };

    devState.logDiagnostics = () => runDiagnostics();

    // Auto-refresh stats every 2s
    const id = setInterval(() => devState.refreshScene?.(), 2000);
    return () => {
      devState.refreshScene = null;
      devState.logDiagnostics = null;
      clearInterval(id);
    };
  }, [scene]);

  useFrame(() => {
    if (isAppIdle()) {
      devState.drawCalls = 0;
      devState.triangles = 0;
      return;
    }

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
    let fps = 0;
    if (dt > 0 && dt < 2000) {
      fps = Math.round(1000 / dt);
      devState.fpsSamples.push(fps);
      if (devState.fpsSamples.length > FPS_SAMPLES) devState.fpsSamples.shift();
    }

    // Détection de chute de FPS (< 24 FPS persistant sur plusieurs frames)
    if (fps > 0 && fps < 24) {
      lowFpsCount.current += 1;
      if (lowFpsCount.current > 40 && now - lastAutoDiagTime.current > 15000) {
        lastAutoDiagTime.current = now;
        lowFpsCount.current = 0;
        devState.logDiagnostics?.();
      }
    } else if (fps >= 30) {
      lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
    }

    if (devState.fpsCanvas && devState.fpsSamples.length > 0) {
      drawFps(devState.fpsCanvas, devState.fpsSamples);
    }

    // Throttle React updates to 4fps (250ms)
    if (now - (devState as any).lastReactUpdate > 250 || !(devState as any).lastReactUpdate) {
      (devState as any).lastReactUpdate = now;
      devState.onUpdate?.();
    }
  });

  return null;
}

