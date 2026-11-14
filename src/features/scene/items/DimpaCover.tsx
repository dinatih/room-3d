/**
 * DimpaCover.tsx — Housse en drap rouge simulée (Blender Cloth) recouvrant les sacs Dimpa.
 * Remplace le rendu des sacs Dimpa cachés dessous (économie ~133k tris).
 * Coordonnées locales : centré XZ, base au sol à Y=0.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTFClone, preloadSceneGLTF } from '@features/scene/useGLTFClone';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { redFabricMat } from '@features/scene/utils/redFabricMaterial';
import * as THREE from 'three';
import type { SceneModelProps } from '@shared/types';

const DIMPA_COVER_GLB = 'models/dimpa-cover.glb';

export function DimpaCover({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(DIMPA_COVER_GLB);
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.material = redFabricMat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const box = glbLocalBBox(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    scene.scale.set(100, 100, 100);
    scene.position.set(-center.x * 100, -box.min.y * 100, -center.z * 100);

    onSize?.(size.multiplyScalar(100));
  }, [scene, onSize]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

preloadSceneGLTF(DIMPA_COVER_GLB);
