/**
 * TradfriBulb.tsx — TRÅDFRI Ampoule LED E27 globe, suspendue tête en bas.
 * Coordonnées locales : centré X/Z, Y=0 = culot (socket).
 * Le wrapper parent est roté [Math.PI, 0, 0] pour que le culot pointe vers le plafond.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@shared/utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@shared/utils/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/TRÅDFRI Ampoule LED E27 1055 lumen connecté sans fil à variateur d\'intensité-spectre blanc globe.glb';

export function TradfriBulb({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = false; c.receiveShadow = true; }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
