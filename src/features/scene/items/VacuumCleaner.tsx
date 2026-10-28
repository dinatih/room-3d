/**
 * VacuumCleaner.tsx — Rowenta X-Force Flex 9.60 RH2038WO / RH2079WO (112×24.8×23.4 cm).
 * Modèle officiel Amazon AR avec textures PBR d'origine.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/rowenta-rh2079wo/rowenta-rh2079wo.glb';

export function VacuumCleaner({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB, true);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.userData.sceneItemRoot = scene.userData.skipMerge = true;
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <group userData={{ hoverAction: { label: 'Aspirateur Rowenta X-Force Flex' } }}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB);
