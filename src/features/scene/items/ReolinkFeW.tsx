/**
 * ReolinkFeW.tsx — Reolink Caméra Fisheye FE-W 6MP 360° (GLB items/reolink-fe-w/reolink-fe-w.glb).
 * Coordonnées locales : centré en X/Z, face supérieure de fixation plafond à Y = 0 (dôme vers -Y).
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/reolink-fe-w/reolink-fe-w.glb';

export function ReolinkFeW({ onSize }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene } = useGLTFClone(GLB, true);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.max.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    onSize?.(box.getSize(new THREE.Vector3()));
    document.dispatchEvent(new Event('hover-cache-invalidate'));
    return () => {
      document.dispatchEvent(new Event('hover-cache-invalidate'));
    };
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
