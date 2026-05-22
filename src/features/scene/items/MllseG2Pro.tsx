/**
 * MllseG2Pro.tsx — Mini PC MLLSE G2 Pro (procédural).
 * 87×87×39 mm = 8.7×8.7×3.9 cm. Bleu nuit, coins verticaux arrondis.
 * Bouton rouge sur la face avant (gauche).
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W = 8.7;
const D = 8.7;
const H = 3.9;
const R = 0.7; // rayon arrondi coins verticaux

const navyBlue   = new THREE.MeshStandardMaterial({ color: 0x0d1b2e, metalness: 0.55, roughness: 0.35 });
const navyDark   = new THREE.MeshStandardMaterial({ color: 0x090f1a, metalness: 0.4,  roughness: 0.5  });
const redButton  = new THREE.MeshStandardMaterial({ color: 0xcc1a0a, metalness: 0.2,  roughness: 0.5  });
const meshGray   = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 0.3,  roughness: 0.7  });
const ledGreen   = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: new THREE.Color(0x00ff88), emissiveIntensity: 0.8, roughness: 0.3, metalness: 0 });
const rubberFoot = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95, metalness: 0 });

function makeBody(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = W / 2, hd = D / 2;
  shape.moveTo(-hw + R, -hd);
  shape.lineTo( hw - R, -hd);
  shape.quadraticCurveTo( hw, -hd,  hw, -hd + R);
  shape.lineTo( hw,  hd - R);
  shape.quadraticCurveTo( hw,  hd,  hw - R,  hd);
  shape.lineTo(-hw + R,  hd);
  shape.quadraticCurveTo(-hw,  hd, -hw,  hd - R);
  shape.lineTo(-hw, -hd + R);
  shape.quadraticCurveTo(-hw, -hd, -hw + R, -hd);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function MllseG2Pro({ onSize }: SceneItemProps) {
  const bodyGeo = useMemo(makeBody, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  const ventSlots = useMemo(() => {
    const arr: number[] = [];
    for (let i = -2; i <= 2; i++) arr.push(i * 1.1);
    return arr;
  }, []);

  return (
    <group userData={{ hoverAction: { label: 'Mini PC MLLSE G2 Pro' } }}>
      {/* Corps principal bleu nuit */}
      <mesh geometry={bodyGeo} material={navyBlue} castShadow receiveShadow />

      {/* Dessus légèrement plus sombre (texture sablée) */}
      <mesh position={[0, H + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 0.4, D - 0.4]} />
        <primitive object={navyDark} attach="material" />
      </mesh>

      {/* Fentes d'aération dessus (5 slots parallèles) */}
      {ventSlots.map((x, i) => (
        <mesh key={`v${i}`} position={[x, H + 0.02, 0]}>
          <boxGeometry args={[0.5, 0.05, D - 2.5]} />
          <primitive object={meshGray} attach="material" />
        </mesh>
      ))}

      {/* Bouton rouge (face avant = -Z, côté gauche) */}
      <mesh position={[-W / 2 + 1.4, H / 2, -(D / 2 + 0.12)]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.25, 20]} />
        <primitive object={redButton} attach="material" />
      </mesh>

      {/* LED statut verte (face avant, droite du bouton) */}
      <mesh position={[-W / 2 + 2.4, H / 2, -(D / 2 + 0.12)]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
        <primitive object={ledGreen} attach="material" />
      </mesh>

      {/* Port USB face avant */}
      <mesh position={[0.8, H / 2, -(D / 2 + 0.1)]}>
        <boxGeometry args={[1.0, 0.5, 0.15]} />
        <primitive object={meshGray} attach="material" />
      </mesh>
      {/* Port USB-A (plus petit) */}
      <mesh position={[2.0, H / 2, -(D / 2 + 0.1)]}>
        <boxGeometry args={[0.7, 0.4, 0.15]} />
        <primitive object={meshGray} attach="material" />
      </mesh>

      {/* 4 pieds caoutchouc */}
      {[
        [-W / 2 + 1, -D / 2 + 1],
        [ W / 2 - 1, -D / 2 + 1],
        [-W / 2 + 1,  D / 2 - 1],
        [ W / 2 - 1,  D / 2 - 1],
      ].map(([x, z], i) => (
        <mesh key={`f${i}`} position={[x, -0.2, z]}>
          <cylinderGeometry args={[0.55, 0.65, 0.4, 12]} />
          <primitive object={rubberFoot} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
