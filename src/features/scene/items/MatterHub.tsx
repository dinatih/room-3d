/**
 * MatterHub.tsx — Hub Matter / passerelle domotique (procédural).
 * 90×90×22 mm = 9×9×2.2 cm. Plastique blanc mat, coins verticaux arrondis.
 * Face avant (−Z) : RESET pinhole + USB Type-C + RJ45 LAN.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W = 9.0;
const D = 9.0;
const H = 2.2;
const R = 0.25;

const bodyMat   = new THREE.MeshStandardMaterial({ color: 0xf6f6f6, metalness: 0.05, roughness: 0.55 });
const topMat    = new THREE.MeshStandardMaterial({ color: 0xfbfbfb, metalness: 0.05, roughness: 0.45 });
const portShell = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6,  roughness: 0.35 });
const portHole  = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.95, metalness: 0 });
const pinSilver = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.75, roughness: 0.25 });
const resetGray = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.7,  metalness: 0.1  });

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
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: H,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function MatterHub({ onSize }: SceneItemProps) {
  const bodyGeo = useMemo(makeBody, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  // Front face plane (−Z), ports centered slightly under mid-height
  const frontZ = -D / 2;
  const yPort  = H * 0.45;

  // Reset pinhole, Type-C, LAN: left → right on the front face
  const xReset = -2.6;
  const xUsbC  = -0.9;
  const xLan   =  1.8;

  return (
    <group userData={{ hoverAction: { label: 'Hub Matter' } }}>
      {/* Corps principal */}
      <mesh geometry={bodyGeo} material={bodyMat} castShadow receiveShadow />

      {/* Top légèrement plus clair (effet finition lisse) */}
      <mesh position={[0, H + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 0.4, D - 0.4]} />
        <primitive object={topMat} attach="material" />
      </mesh>

      {/* === RESET pinhole === */}
      <mesh position={[xReset, yPort + 0.05, frontZ + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
        <primitive object={resetGray} attach="material" />
      </mesh>
      <mesh position={[xReset, yPort + 0.05, frontZ + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
        <primitive object={portHole} attach="material" />
      </mesh>

      {/* === USB Type-C === */}
      {/* Outer port shell (rounded rectangle approx via two boxes) */}
      <mesh position={[xUsbC, yPort, frontZ + 0.02]}>
        <boxGeometry args={[0.92, 0.36, 0.06]} />
        <primitive object={portShell} attach="material" />
      </mesh>
      {/* Recessed black opening */}
      <mesh position={[xUsbC, yPort, frontZ + 0.08]}>
        <boxGeometry args={[0.78, 0.24, 0.12]} />
        <primitive object={portHole} attach="material" />
      </mesh>
      {/* USB-C contact tongue (centered, silver) */}
      <mesh position={[xUsbC, yPort, frontZ + 0.1]}>
        <boxGeometry args={[0.5, 0.08, 0.1]} />
        <primitive object={pinSilver} attach="material" />
      </mesh>

      {/* === RJ45 LAN === */}
      {/* Outer port shell */}
      <mesh position={[xLan, yPort, frontZ + 0.02]}>
        <boxGeometry args={[1.35, 1.05, 0.06]} />
        <primitive object={portShell} attach="material" />
      </mesh>
      {/* Recessed cavity */}
      <mesh position={[xLan, yPort, frontZ + 0.12]}>
        <boxGeometry args={[1.15, 0.85, 0.18]} />
        <primitive object={portHole} attach="material" />
      </mesh>
      {/* Plastic tab notch at bottom (RJ45 retainer cutout) */}
      <mesh position={[xLan, yPort - 0.5, frontZ + 0.08]}>
        <boxGeometry args={[0.5, 0.18, 0.08]} />
        <primitive object={portShell} attach="material" />
      </mesh>
      {/* 8 contact pins (top of cavity) */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <mesh
          key={`pin${i}`}
          position={[xLan - 0.42 + i * 0.12, yPort + 0.32, frontZ + 0.13]}
        >
          <boxGeometry args={[0.05, 0.22, 0.05]} />
          <primitive object={pinSilver} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
