/**
 * Scooter.tsx — Trottinette Xiaomi 4 (GLB items/xiaomi-scooter4/xiaomi-scooter4.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, hauteur normalisée 113cm.
 * Placement monde dans CorridorPlacements.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

type ScooterProps = SceneItemProps & { steeringAngle?: number };

export function Scooter({ onSize, steeringAngle = 0 }: ScooterProps) {
  const { scene } = useGLTFClone('items/xiaomi-scooter4/xiaomi-scooter4.glb');
  const steering = useMemo(() => {
    const pivot = scene.getObjectByName('SteeringPivot');
    if (!pivot) throw new Error('Scooter GLB is missing SteeringPivot');
    return { pivot, rest: pivot.quaternion.clone() };
  }, [scene]);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    steering.pivot.quaternion.copy(steering.rest);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(113 / raw.y);
    removeGlbLines(scene);
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, steering, onSize]);

  useLayoutEffect(() => {
    if (!Number.isFinite(steeringAngle)) throw new Error('Scooter steeringAngle must be finite');
    // The exported pivot's local Y follows the inclined steering column.
    steering.pivot.quaternion.copy(steering.rest).multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), steeringAngle),
    );
    onSize(glbLocalBBox(scene).getSize(new THREE.Vector3()));
  }, [steering, steeringAngle, onSize]);

  return <primitive object={scene} />;
}

useGLTF.preload('items/xiaomi-scooter4/xiaomi-scooter4.glb');
