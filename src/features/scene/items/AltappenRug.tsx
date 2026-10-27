/**
 * AltappenRug.tsx — Dalle de terrasse IKEA ALTAPPEN 30×30cm.
 *
 * AltappenRug      — tuile unique, SceneItemProps, pour l'inventaire.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/altappen90420898/Altappen90420898.glb';

// ── Tuile unique (inventaire) ─────────────────────────────────────────────────

export function AltappenRug({ onSize }: SceneItemProps) {
  const { scene } = useGLTF(GLB);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const rawBox = glbLocalBBox(scene);
    const tileW = rawBox.max.x - rawBox.min.x;
    // Modèle IKEA en mètres (~0.3m), cible 30cm
    const scl = 30 / (tileW * 100); 
    scene.scale.setScalar(scl * 100);
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

useGLTF.preload(GLB);
