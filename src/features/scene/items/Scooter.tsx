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
import type { SceneModelProps } from '@shared/types';

type ScooterProps = SceneModelProps & { steeringAngle?: number; onWheels?: (front: THREE.Vector3[], rear: THREE.Vector3[]) => void };
export const SCOOTER_STEERING_ANGLE = -Math.PI / 3;

export function Scooter({ onSize, steeringAngle = 0, onWheels }: ScooterProps) {
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
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, steering, onSize]);

  useLayoutEffect(() => {
    if (!Number.isFinite(steeringAngle)) throw new Error('Scooter steeringAngle must be finite');
    // The exported pivot's local Y follows the inclined steering column.
    steering.pivot.quaternion.copy(steering.rest).multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), steeringAngle),
    );
    const box = glbLocalBBox(scene);
    scene.position.y = -box.min.y;
    onSize?.(box.getSize(new THREE.Vector3()));
    if (onWheels) {
      scene.updateWorldMatrix(true, true);
      const inverse = scene.parent!.matrixWorld.clone().invert();
      const wheels = (root: THREE.Object3D): THREE.Vector3[] => {
        const points: THREE.Vector3[] = [];
        root.traverse(node => {
          const mesh = node as THREE.Mesh;
          if (!mesh.isMesh || Array.isArray(mesh.material) || mesh.material.name !== 'Black.001') return;
          const matrix = inverse.clone().multiply(mesh.matrixWorld);
          const positions = mesh.geometry.getAttribute('position');
          for (let i = 0; i < positions.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(matrix));
        });
        if (!points.length) throw new Error('Scooter GLB is missing its wheel geometry');
        return points;
      };
      onWheels(wheels(scene.getObjectByName('SteeringAssembly')!), wheels(scene.getObjectByName('ScooterBody')!));
    }
  }, [scene, steering, steeringAngle, onSize, onWheels]);

  return <primitive object={scene} />;
}

useGLTF.preload('items/xiaomi-scooter4/xiaomi-scooter4.glb');
