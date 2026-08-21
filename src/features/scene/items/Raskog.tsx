/**
 * Raskog.tsx — Dessertes roulantes IKEA RÅSKOG.
 * RaskogLarge : 35×45×77 cm. RaskogSmall : 28×38×61 cm.
 * Coordonnées locales : centré XZ, Y=0 = sol, normalisé sur la hauteur réelle.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const RASKOG_LARGE = 'items/råskog desserte 35x45x77 blanc/RÅSKOG desserte 35x45x77 blanc.glb';

function RaskogBase({ glbPath, targetH, onSize }: SceneItemProps & { glbPath: string; targetH: number }) {
  const { scene } = useGLTFClone(glbPath);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(targetH / Math.max(rawSize.x, rawSize.y, rawSize.z));
    removeGlbLines(scene);
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

export function RaskogLarge(props: SceneItemProps) {
  return <RaskogBase {...props} glbPath={RASKOG_LARGE} targetH={77} />;
}

useGLTF.preload(RASKOG_LARGE);
