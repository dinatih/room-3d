/**
 * Drona.tsx — Boîte de rangement IKEA DRONA (GLB media/DRÖNA.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, rouge.
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 *
 * Exports :
 *   Drona          — composant SceneItemProps (instance unique, inventaire)
 *   useDronaGeo    — hook retournant la géométrie extraite (pour InstancedMesh)
 *   DroneCell      — boîte unique (front+back) pour groupes positionnés
 *   DronaInstances — N boîtes via InstancedMesh, prend un tableau de Matrix4
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { glbLocalBBox } from '@shared/utils/glbUtils';
import type { SceneItemProps } from '@shared/types';

const redMat   = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });
const redFront = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.FrontSide });
const redBack  = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.9, side: THREE.BackSide });

export function Drona({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/DRÖNA.glb');

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
        (c as THREE.Mesh).material = redMat;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

/**
 * Retourne la géométrie BufferGeometry de la boîte DRONA (scalée, centrée),
 * prête à l'emploi dans un InstancedMesh.
 */
export function useDronaGeo(): THREE.BufferGeometry {
  const { scene } = useGLTF('media/DRÖNA.glb');

  return useMemo(() => {
    const s = 100;
    let geo: THREE.BufferGeometry | null = null;
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh && !geo) {
        geo = m.geometry.clone();
        geo.applyMatrix4(m.matrixWorld);
      }
    });
    if (!geo) geo = new THREE.BoxGeometry(33, 33, 38);

    (geo as THREE.BufferGeometry).applyMatrix4(new THREE.Matrix4().makeScale(s, s, s));
    const scaled = new THREE.Box3().setFromBufferAttribute(
      (geo as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute,
    );
    const center = scaled.getCenter(new THREE.Vector3());
    (geo as THREE.BufferGeometry).applyMatrix4(
      new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z),
    );
    return geo as THREE.BufferGeometry;
  }, [scene]);
}

/** Boîte Drona unique (front+back) — à placer dans un <group position rotation>. */
export function DroneCell() {
  const geo = useDronaGeo();
  return (
    <>
      <mesh geometry={geo} material={redFront} castShadow receiveShadow />
      <mesh geometry={geo} material={redBack} />
    </>
  );
}

/** N boîtes Drona via InstancedMesh. Chaque Matrix4 encode position + rotation. */
export function DronaInstances({ matrices }: { matrices: THREE.Matrix4[] }) {
  const geo = useDronaGeo();
  const N = matrices.length;
  const apply = (mesh: THREE.InstancedMesh) => {
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };
  return (
    <>
      <instancedMesh args={[geo, redFront, N]} castShadow receiveShadow onUpdate={apply} />
      <instancedMesh args={[geo, redBack,  N]} onUpdate={apply} />
    </>
  );
}

useGLTF.preload('media/DRÖNA.glb');
