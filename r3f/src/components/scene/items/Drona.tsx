/**
 * Drona.tsx — Boîte de rangement IKEA DRONA (GLB media/ikea_DRONA_black.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, profondeur normalisée 38cm, rouge.
 *
 * Exports :
 *   Drona       — composant SceneItemProps (instance unique, inventaire)
 *   useDronaGeo — hook retournant la géométrie extraite (pour InstancedMesh dans DronaBoxes)
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });

export function Drona({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/ikea_DRONA_black.glb');

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true);
    const rawSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const s = rawSize.z > 0.01 ? 38 / rawSize.z : 1;
    scene.scale.setScalar(s);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
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
    onSize(new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

/**
 * Retourne la géométrie BufferGeometry de la boîte DRONA (scalée, centrée),
 * prête à l'emploi dans un InstancedMesh.
 */
export function useDronaGeo(): THREE.BufferGeometry {
  const { scene } = useGLTF('media/ikea_DRONA_black.glb');

  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const rawSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const s = rawSize.z > 0.01 ? 38 / rawSize.z : 1;

    let geo: THREE.BufferGeometry | null = null;
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh && !geo) {
        geo = m.geometry.clone();
        geo.applyMatrix4(m.matrixWorld);
      }
    });
    if (!geo) geo = new THREE.BoxGeometry(33.5, 33.5, 38);

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

useGLTF.preload('media/ikea_DRONA_black.glb');
