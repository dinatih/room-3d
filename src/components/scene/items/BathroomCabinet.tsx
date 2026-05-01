/**
 * BathroomCabinet.tsx — Meuble mural SDB METOD IKEA.
 * media/METOD Rangement mural blanc 40x37x60 cm.glb
 * GLB officiel IKEA en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 * BathroomCabinetWest et BathroomCabinetEast conservés pour compatibilité.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const GLB = 'media/METOD Rangement mural blanc 40x37x60 cm.glb';

function MetodCabinet({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.x = Math.PI / 2; // Z-up GLB → debout
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);

export function BathroomCabinetWest(props: SceneItemProps) {
  return <MetodCabinet {...props} />;
}

export function BathroomCabinetEast(props: SceneItemProps) {
  return <MetodCabinet {...props} />;
}
