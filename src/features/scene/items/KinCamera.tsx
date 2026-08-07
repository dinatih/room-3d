import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import type { SceneItemProps } from '@shared/types';
import { glbLocalBBox } from '@features/scene/glbUtils';

export function KinCamera({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/sandbox/camera_render.glb');

  useLayoutEffect(() => {
    // 1. Reset scale pour lire la vraie bounding box
    scene.scale.set(1, 1, 1);
    const box = glbLocalBBox(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 2. L'utilisateur veut que le diamètre soit d'environ 12cm.
    // L'axe X ou Z de size correspond au diamètre.
    const S = 12 / size.x;
    scene.scale.set(S, S, S);

    // 3. Corriger le décalage du modèle ET l'aligner sous le plafond
    // - Pour centrer sur X/Z : -center.x * S
    // - Pour que le HAUT touche le plafond (qui est l'origine du groupe parent à Y=250) :
    //   Le point le plus haut localement est (center.y + size.y / 2)
    scene.position.set(
      -center.x * S,
      - (center.y + size.y / 2) * S,
      -center.z * S
    );

    // 4. Identifier les meshes par leur nom de matériau et appliquer les bons styles
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (child.material.name.includes('lambert8')) {
          // Le dôme (lambert8 était en mode BLEND)
          child.material = new THREE.MeshStandardMaterial({
            color: 0x111111,
            transparent: true,
            opacity: 0.75,
            roughness: 0.1,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });
        } else if (child.material.name.includes('lambert1') || child.material.name.includes('lambert9')) {
          // La base et la lentille interne (on les met en blanc opaque)
          child.material = new THREE.MeshStandardMaterial({
            color: child.material.name.includes('lambert9') ? 0x222222 : 0xffffff,
            roughness: 0.7,
            side: THREE.DoubleSide,
          });
        }
      }
    });

    onSize?.(new THREE.Vector3(12, size.y * S, 12));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
