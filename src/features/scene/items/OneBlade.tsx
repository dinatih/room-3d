import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import type { SceneModelProps } from '@shared/types';

export const ONEBLADE_GLB = 'items/philips-mg9558/oneblade.glb';

const TARGET_LENGTH_CM = 17; // Longueur réelle d'un rasoir OneBlade (~17 cm)

export function OneBlade({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(ONEBLADE_GLB);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    const rawLength = box.max.x - box.min.x;
    const scale = rawLength > 0 ? TARGET_LENGTH_CM / rawLength : 0.1;
    scene.scale.setScalar(scale);

    const scaledBox = glbLocalBBox(scene);
    scene.position.set(
      -(scaledBox.min.x + scaledBox.max.x) / 2,
      -scaledBox.min.y,
      -(scaledBox.min.z + scaledBox.max.z) / 2
    );
    onSize?.(scaledBox.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}

useGLTF.preload(ONEBLADE_GLB);
