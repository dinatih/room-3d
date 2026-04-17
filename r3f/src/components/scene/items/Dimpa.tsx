/**
 * Dimpa.tsx — Sac de rangement IKEA DIMPA (procédural).
 * Transparent, 65×22×65 cm. Coordonnées locales : centré XZ, Y=0 = base.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W = 65, D = 22, H = 65;

const bodyMat = new THREE.MeshPhysicalMaterial({
  color: 0xc4dff0,
  transparent: true,
  opacity: 0.28,
  roughness: 0.05,
  metalness: 0,
  side: THREE.DoubleSide,
  depthWrite: false,
});

export function Dimpa({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      <mesh position={[0, H / 2, 0]} castShadow material={bodyMat}>
        <boxGeometry args={[W, H, D]} />
      </mesh>
    </group>
  );
}
