import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';
import type { SceneModelProps } from '@shared/types';

const PATH = '/items/rugs/tapis.glb';
preloadSceneGLTF(PATH);

/** tapis.glb contient deux tapis (grand_* et petit_*), en mètres. Chacun est recentré en X/Z, posé sur Y=0. */
function createRug(prefix: 'grand' | 'petit') {
  const other = prefix === 'grand' ? 'petit_' : 'grand_';
  return function Rug({ onSize }: SceneModelProps) {
    const { scene } = useGLTFClone(PATH);
    useLayoutEffect(() => {
      scene.scale.set(1, 1, 1);
      scene.children.filter(c => c.name.startsWith(other)).forEach(c => c.removeFromParent());
      scene.scale.setScalar(100);
      mergeGlbByMaterial(scene);
      scene.traverse(obj => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const mats = Array.isArray((obj as THREE.Mesh).material)
          ? ((obj as THREE.Mesh).material as THREE.Material[])
          : [(obj as THREE.Mesh).material as THREE.Material];
        for (const m of mats) {
          m.polygonOffset = true;
          m.polygonOffsetFactor = -4;
          m.polygonOffsetUnits = -4;
          m.needsUpdate = true;
        }
      });
      const box = glbLocalBBox(scene);
      scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      onSize?.(box.getSize(new THREE.Vector3()));
    }, [scene, onSize]);
    return <group><primitive object={scene} /></group>;
  };
}

export const RugLarge = createRug('grand');
export const RugSmall = createRug('petit');
