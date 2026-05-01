/**
 * TV.tsx — Téléviseur mural.
 * Coordonnées locales : origine = centre géométrique du châssis.
 * Placement monde dans Furnishings.tsx.
 */
import { useLayoutEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

export const TV_W = 70, TV_H = 40, TV_D = 1.5;

const tvBodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.4 });

export function TV({ onSize }: SceneItemProps) {
  const screenTex = useTexture('media/omarchy-screen.png');
  screenTex.colorSpace = THREE.SRGBColorSpace;

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(TV_W, TV_H, TV_D));
  }, []);

  return (
    <group>
      {/* Châssis */}
      <mesh castShadow material={tvBodyMat}>
        <boxGeometry args={[TV_W, TV_H, TV_D]} />
      </mesh>
      {/* Écran */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -(TV_D / 2 + 0.1)]}>
        <planeGeometry args={[TV_W - 3, TV_H - 3]} />
        <meshStandardMaterial
          map={screenTex}
          roughness={0.05}
          metalness={0.3}
          polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}
