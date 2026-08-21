import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SceneItemProps } from '@shared/types';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useGLTFClone } from '@features/scene/useGLTFClone';

export function ElectricRacket({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/electric-racket/electric-racket.glb');
  const group = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    const size = glbLocalBBox(scene);

    if (size.max.x - size.min.x > 0 && size.max.y - size.min.y > 0 && size.max.z - size.min.z > 0) {
      const sx = size.max.x - size.min.x;
      const sy = size.max.y - size.min.y;
      const sz = size.max.z - size.min.z;

      const targetScale: Record<'x' | 'y' | 'z', number> = { x: 1, y: 1, z: 1 };
      
      const dims = [
        { axis: 'x' as const, val: sx },
        { axis: 'y' as const, val: sy },
        { axis: 'z' as const, val: sz },
      ].sort((a, b) => b.val - a.val); // Longest first

      // Longest -> length (43)
      targetScale[dims[0].axis] = 43 / dims[0].val;
      // Middle -> width (24)
      targetScale[dims[1].axis] = 24 / dims[1].val;
      // Shortest -> thickness (2)
      targetScale[dims[2].axis] = 2 / dims[2].val;
      
      scene.scale.set(targetScale.x, targetScale.y, targetScale.z);
    }

    scene.updateMatrixWorld(true);
    const finalSize = glbLocalBBox(scene);

    scene.position.set(0, -finalSize.min.y, 0);

    scene.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
            if (!mat.name.toLowerCase().includes('rede') && !mat.name.toLowerCase().includes('raio')) {
              mat.color.set('#ffffff');
              mat.map = null;
              mat.needsUpdate = true;
            }
          }
        }
      }
    });

    if (onSize) {
      onSize(finalSize.getSize(new THREE.Vector3()));
    }
  }, [scene, onSize]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/items/electric-racket/electric-racket.glb');
