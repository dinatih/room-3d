/**
 * LaptopDesk.tsx — Laptop + smartphone + mug sur le bureau 2.
 * Port fidèle de js/furniture/laptop.js.
 *
 * Le parent (desk2Surface) est au sommet du bureau 2 :
 * world position [200, 70, 170], rotation.y effectif = 0
 * (desk group π + laptop.js parent π = 2π).
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Laptop } from './items/Laptop';
import { Phone } from './items/Phone';

// ── Matériaux ─────────────────────────────────────────────────────────────────

const mugMat      = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });
const mugInnerMat = new THREE.MeshStandardMaterial({ color: 0xf0e8dc, roughness: 0.5 });
const chocoMat    = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.6 });

// ── Mug ───────────────────────────────────────────────────────────────────────

function Mug() {
  const R = 4, H = 9.5, THICK = 0.4;
  const innerR = R - THICK;
  const innerH = H - THICK;
  return (
    <group position={[-22, 0, -7]}>
      {/* Corps */}
      <mesh position={[0, H / 2, 0]} castShadow material={mugMat}>
        <cylinderGeometry args={[R, R * 0.92, H, 24, 1, true]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={mugMat}>
        <circleGeometry args={[R * 0.92, 24]} />
      </mesh>
      <mesh position={[0, THICK + innerH / 2, 0]} material={mugInnerMat}>
        <cylinderGeometry args={[innerR, innerR * 0.92, innerH, 24, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, H - 1.2, 0]} material={chocoMat}>
        <circleGeometry args={[innerR - 0.1, 24]} />
      </mesh>
      {/* Anse */}
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[R, H * 0.48, 0]} castShadow material={mugMat}>
        <torusGeometry args={[2.2, 0.4, 8, 12, Math.PI]} />
      </mesh>
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

/**
 * Contenu posé sur la surface du bureau 2.
 * Doit être rendu dans un group enfant du bureau 2 à [0, height, 0] rotation.y=π.
 * (desk2 rotY=π annulé par ce π = net 0, fidèle à laptop.js vanilla)
 */
export function LaptopDesk() {
  return (
    <>
      <Laptop item={{} as any} actionState={{}} onSize={() => {}} />
      <group position={[22, 0, 2]} rotation={[0, 0.15, 0]}>
        <Phone item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <Mug />
    </>
  );
}
