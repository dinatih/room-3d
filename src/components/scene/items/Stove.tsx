/**
 * Plaques à induction — géométrie fidèle à Kitchen.tsx.
 * Local coords : centré XZ, Y=0=niveau du plan de travail.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const BASE_W = 52;  // FRIDGE_W - 8
const BASE_D = 48;  // KIT_D - 12

const glassMat   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.08, metalness: 0.3 });
const zoneMat    = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.05, metalness: 0.2 });
const ringMat    = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.1,  metalness: 0.1 });
const controlMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3,  metalness: 0.1 });

export function Stove({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(BASE_W, 2, BASE_D));
  }, []);

  return (
    <group>
      {/* Surface vitro-céramique */}
      <mesh position={[0, 0.5, 0]} castShadow material={glassMat}>
        <boxGeometry args={[BASE_W, 1, BASE_D]} />
      </mesh>

      {/* 2 zones de chauffe */}
      {([-12, 12] as const).map((pz, i) => (
        <group key={i}>
          <mesh position={[0, 1.1, pz]} material={zoneMat}>
            <cylinderGeometry args={[9, 9, 0.15, 40]} />
          </mesh>
          <mesh position={[0, 1.2, pz]} rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
            <ringGeometry args={[7.5, 9, 40]} />
          </mesh>
          <mesh position={[0, 1.2, pz]} material={ringMat}>
            <cylinderGeometry args={[1.5, 1.5, 0.05, 16]} />
          </mesh>
        </group>
      ))}

      {/* Bandeau de contrôle */}
      <mesh position={[0, 1.1, -BASE_D / 2 + 4]} material={glassMat}>
        <boxGeometry args={[BASE_W - 10, 0.5, 6]} />
      </mesh>
      {([0, 1, 2, 3] as const).map((i) => (
        <mesh key={i} position={[-10 + i * 7, 1.35, -BASE_D / 2 + 4]} material={controlMat}>
          <cylinderGeometry args={[0.6, 0.6, 0.3, 8]} />
        </mesh>
      ))}
    </group>
  );
}
