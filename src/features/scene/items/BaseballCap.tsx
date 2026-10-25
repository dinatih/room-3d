/**
 * BaseballCap.tsx — Casquette baseball (GLB characters/accessories/baseball_cap.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, largeur normalisée 20cm, rouge.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function createBaseballCapMaterial(color: THREE.ColorRepresentation = 0x991111) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.9,
    metalness: 0,
    sheen: 1,
    sheenColor: new THREE.Color(0xff5555),
    sheenRoughness: 0.6,
  });
}

const redMat = createBaseballCapMaterial();

export function BaseballCap({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('characters/accessories/baseball_cap.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(20 / rawSize.x);

    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).material = redMat;
      }
    });

    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('characters/accessories/baseball_cap.glb');
