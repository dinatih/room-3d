import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import type { SceneModelProps } from '@shared/types';

export const ONEBLADE_GLB = 'items/philips-mg9558/oneblade.glb';

export function OneBlade({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(ONEBLADE_GLB);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    // Le modèle d'origine est orienté le long de l'axe X (longueur ~16.2cm, largeur ~3.5cm, hauteur tête ~12.2cm)
    // On centre en X/Z et pose la base sur Y=0
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}

useGLTF.preload(ONEBLADE_GLB);
