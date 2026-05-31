/**
 * Drona.tsx — Boîte de rangement IKEA DRONA.
 * Coordonnées locales : centré par bbox, Y=0 = sol, rouge.
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 *
 * Toggle "dronaRougeGlb" : bascule la géométrie entre DRÖNA.glb (qualité) et
 * DRÖNA rouge.glb (comparaison).
 *
 * Exports :
 *   Drona          — composant SceneItemProps (instance unique, inventaire)
 *   useDronaGeo    — hook retournant la géométrie active selon le toggle
 *   DroneCell      — boîte unique pour groupes positionnés
 *   DronaInstances — N boîtes via InstancedMesh, prend un tableau de Matrix4
 */
import { useLayoutEffect, useMemo, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB_DRONA = 'media/glb/ikea-official/DRÖNA.glb';
const GLB_ROUGE = 'media/glb/ikea-official/DRÖNA rouge.glb';

const dronaMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.DoubleSide });

function useDronaToggle(): boolean {
  const [useRouge, setUseRouge] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail;
      if (key === 'dronaRougeGlb') setUseRouge(v => !v);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  return useRouge;
}

function extractGeo(scene: THREE.Object3D, scale: number): THREE.BufferGeometry {
  scene.updateMatrixWorld(true);

  const parts: THREE.BufferGeometry[] = [];
  scene.traverse(c => {
    const m = c as THREE.Mesh;
    if (m.isMesh) {
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      for (const key of Object.keys(g.attributes)) {
        if (!['position', 'normal', 'uv'].includes(key)) g.deleteAttribute(key);
      }
      parts.push(g);
    }
  });

  let geo: THREE.BufferGeometry =
    parts.length === 0 ? new THREE.BoxGeometry(33, 33, 38)
    : parts.length === 1 ? parts[0]
    : (mergeGeometries(parts) ?? parts[0]);

  geo.applyMatrix4(new THREE.Matrix4().makeScale(scale, scale, scale));
  const box = new THREE.Box3().setFromBufferAttribute(
    geo.getAttribute('position') as THREE.BufferAttribute,
  );
  const center = box.getCenter(new THREE.Vector3());
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  return geo;
}

function useDronaGeoFrom(glb: typeof GLB_DRONA | typeof GLB_ROUGE): THREE.BufferGeometry {
  const { scene } = useGLTF(glb);
  return useMemo(() => extractGeo(scene, 100), [scene]);
}

/**
 * Retourne la géométrie BufferGeometry de la boîte DRONA active (scalée, centrée),
 * prête à l'emploi dans un InstancedMesh.
 */
export function useDronaGeo(): THREE.BufferGeometry {
  const geoNormal = useDronaGeoFrom(GLB_DRONA);
  const geoRouge  = useDronaGeoFrom(GLB_ROUGE);
  const useRouge  = useDronaToggle();
  return useRouge ? geoRouge : geoNormal;
}

export function Drona({ onSize }: SceneItemProps) {
  const useRouge = useDronaToggle();
  const { scene: sceneDrona } = useGLTF(GLB_DRONA);
  const { scene: sceneRouge } = useGLTF(GLB_ROUGE);

  const scene = useRouge ? sceneRouge : sceneDrona;

  useLayoutEffect(() => {
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).material = dronaMat;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

/** Boîte Drona unique — à placer dans un <group position rotation>. */
export function DroneCell() {
  const geoNormal = useDronaGeoFrom(GLB_DRONA);
  const geoRouge  = useDronaGeoFrom(GLB_ROUGE);
  const useRouge  = useDronaToggle();
  const geo = useRouge ? geoRouge : geoNormal;
  return <mesh geometry={geo} material={dronaMat} castShadow receiveShadow />;
}

/** N boîtes Drona via InstancedMesh. Chaque Matrix4 encode position + rotation. */
export function DronaInstances({ matrices }: { matrices: THREE.Matrix4[] }) {
  const geoNormal = useDronaGeoFrom(GLB_DRONA);
  const geoRouge  = useDronaGeoFrom(GLB_ROUGE);
  const useRouge  = useDronaToggle();
  const geo = useRouge ? geoRouge : geoNormal;
  const N = matrices.length;
  const apply = (mesh: THREE.InstancedMesh) => {
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh args={[geo, dronaMat, N]} castShadow receiveShadow onUpdate={apply} />;
}

useGLTF.preload(GLB_DRONA);
useGLTF.preload(GLB_ROUGE);
