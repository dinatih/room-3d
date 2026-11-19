import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneModelProps } from '@shared/types';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';
import { useSceneGlass } from '../utils/useSceneGlass';
import { glbLocalBBox } from '../glbUtils';

const GLB = '/items/rowenta-rh2079wo/rowenta-rh2079wo.glb';
type VacuumPart = 'VacuumTube' | 'VacuumHandheld';

/** Detached accessories, centred and grounded in their stored orientation. */
export function VacuumCleanerPart({ part, onSize }: SceneModelProps & { part: VacuumPart }) {
  const { scene } = useGLTFClone(GLB);
  useSceneGlass(scene);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    const selected = scene.getObjectByName(part);
    if (!selected) throw new Error(`Rowenta: missing ${part}`);
    scene.getObjectByName(part === 'VacuumTube' ? 'VacuumHandheld' : 'VacuumTube')?.removeFromParent();

    // Straighten the source's working angle; the handheld motor lies to the right.
    const tilt = part === 'VacuumTube'
      ? Math.atan2(0.494198739528656, 0.7687878012657166)
      : Math.atan2(0.7334622144699097 - 0.39787808060646057, 1.1199582815170288 - 0.7374784350395203);
    scene.rotation.set(tilt, 0, 0);
    if (part === 'VacuumHandheld') scene.quaternion.premultiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
    );
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene, true);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, part, onSize]);

  return <primitive object={scene} />;
}

preloadSceneGLTF(GLB);
