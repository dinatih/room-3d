/**
 * TrashBin.tsx — TATAY Smart Deco 25L (26×36×47 cm)
 * Wood-effect rectangular body, black lid/base/collar, front pedal.
 * Action 'bin-toggle': lid open (pedal).
 */
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W = 26, D = 36, H = 47;
const BASE_H   = 4;
const BODY_H   = 38;
const COLLAR_H = 3;
const LID_H    = 2;

const BODY_Y   = BASE_H;
const COLLAR_Y = BASE_H + BODY_H;  // 42
const LID_Y    = COLLAR_Y + COLLAR_H; // 45

const blackMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.65, metalness: 0.05 });
const woodMat  = new THREE.MeshStandardMaterial({ color: 0xc9aa7c, roughness: 0.78, metalness: 0.0  });

export function TrashBin({ actionState, onSize }: SceneItemProps) {
  const lidGroupRef = useRef<THREE.Group>(null);
  const isOpen = actionState['bin-toggle'] ?? false;

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  useFrame(() => {
    if (!lidGroupRef.current) return;
    const target = isOpen ? -Math.PI * 0.62 : 0;
    lidGroupRef.current.rotation.x += (target - lidGroupRef.current.rotation.x) * 0.12;
  });

  return (
    <group userData={{ hoverAction: { label: 'Poubelle TATAY 25L', actionId: 'bin' } }}>

      {/* Base / pied — noir */}
      <mesh position={[0, BASE_H / 2, 0]} material={blackMat}>
        <boxGeometry args={[W, BASE_H, D]} />
      </mesh>

      {/* Pédale — petite excroissance avant */}
      <mesh position={[0, 1.5, D / 2 + 1.5]} material={blackMat}>
        <boxGeometry args={[7, 2.5, 3]} />
      </mesh>

      {/* Corps — effet bois clair */}
      <mesh position={[0, BODY_Y + BODY_H / 2, 0]} material={woodMat}>
        <boxGeometry args={[W - 0.4, BODY_H, D - 0.4]} />
      </mesh>

      {/* Rebord / col — noir */}
      <mesh position={[0, COLLAR_Y + COLLAR_H / 2, 0]} material={blackMat}>
        <boxGeometry args={[W, COLLAR_H, D]} />
      </mesh>

      {/* Couvercle — pivoté à l'arrière (charnière = Z = -D/2) */}
      <group ref={lidGroupRef} position={[0, LID_Y, -D / 2]}>
        <mesh position={[0, LID_H / 2, D / 2]} material={blackMat}>
          <boxGeometry args={[W, LID_H, D]} />
        </mesh>
      </group>

    </group>
  );
}
