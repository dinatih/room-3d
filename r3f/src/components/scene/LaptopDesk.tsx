/**
 * LaptopDesk.tsx — Laptop + smartphone + mug sur le bureau 2.
 * Port fidèle de js/furniture/laptop.js.
 *
 * Le parent (desk2Surface) est au sommet du bureau 2 :
 * world position [200, 70, 170], rotation.y effectif = 0
 * (desk group π + laptop.js parent π = 2π).
 */
import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ── Matériaux ─────────────────────────────────────────────────────────────────

const aluMat   = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6, roughness: 0.35 });
const bezelMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
const kbMat    = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const portMat  = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3, metalness: 0.5 });
const caseMat  = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
const camMat   = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.2 });
const phoneScrMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.05, metalness: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const mugMat   = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.35 });
const mugInnerMat = new THREE.MeshStandardMaterial({ color: 0xf0e8dc, roughness: 0.5 });
const chocoMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.6 });

// ── Laptop ────────────────────────────────────────────────────────────────────

function Laptop() {
  const BASE_W = 29.7, BASE_D = 22.8, BASE_H = 1.6;
  const SCREEN_W = 29, SCREEN_D = 19.5, SCREEN_H = 0.8;
  const BEZEL = 0.6;
  const PORT_W = 1.2, PORT_H = 0.6, PORT_D = 3;

  const screenTex = useTexture('media/omarchy-screen.png');
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: screenTex, roughness: 0.1, metalness: 0.2,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }), [screenTex]);

  // Keyboard InstancedMesh
  const { keyGeo, keyInst } = useMemo(() => {
    const KW = 1.28, KD = 1.22, KH = 0.18;
    const KPX = 1.64, KPZ = 1.56;
    const NCOLS = 14, NROWS = 5;
    const KB_CZ = -2.8;
    const KB_Z0 = KB_CZ - (NROWS - 1) * KPZ / 2;
    const geo = new THREE.BoxGeometry(KW, KH, KD);
    const inst = new THREE.InstancedMesh(geo, kbMat, NCOLS * NROWS);
    const dummy = new THREE.Object3D();
    let ki = 0;
    for (let r = 0; r < NROWS; r++) {
      for (let c = 0; c < NCOLS; c++) {
        dummy.position.set((-NCOLS / 2 + 0.5 + c) * KPX, BASE_H + KH / 2, KB_Z0 + r * KPZ);
        dummy.updateMatrix();
        inst.setMatrixAt(ki++, dummy.matrix);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    return { keyGeo: geo, keyInst: inst };
  }, []);

  return (
    <group>
      {/* Base */}
      <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow material={aluMat}>
        <boxGeometry args={[BASE_W, BASE_H, BASE_D]} />
      </mesh>
      {/* Keys */}
      <primitive object={keyInst} />
      {/* Trackpad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_H + 0.01, 5.5]} material={kbMat}>
        <planeGeometry args={[10, 6]} />
      </mesh>
      {/* Screen hinge → écran ouvert 110° */}
      <group position={[0, BASE_H, -BASE_D / 2]} rotation={[-1.92, 0, 0]}>
        <mesh position={[0, 0, SCREEN_D / 2]} castShadow material={aluMat}>
          <boxGeometry args={[SCREEN_W, SCREEN_H, SCREEN_D]} />
        </mesh>
        {/* Bezels */}
        <mesh position={[0, -SCREEN_H / 2, BEZEL / 2]} material={bezelMat}>
          <boxGeometry args={[SCREEN_W, BEZEL, BEZEL]} />
        </mesh>
        <mesh position={[0, -SCREEN_H / 2, SCREEN_D - BEZEL / 2]} material={bezelMat}>
          <boxGeometry args={[SCREEN_W, BEZEL, BEZEL]} />
        </mesh>
        <mesh position={[-SCREEN_W / 2 + BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2]} material={bezelMat}>
          <boxGeometry args={[BEZEL, BEZEL, SCREEN_D]} />
        </mesh>
        <mesh position={[SCREEN_W / 2 - BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2]} material={bezelMat}>
          <boxGeometry args={[BEZEL, BEZEL, SCREEN_D]} />
        </mesh>
        {/* Écran */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -SCREEN_H / 2 - 0.01, SCREEN_D / 2]} material={screenMat}>
          <planeGeometry args={[SCREEN_W - BEZEL * 2, SCREEN_D - BEZEL * 2]} />
        </mesh>
      </group>
      {/* Ports USB-C */}
      <mesh position={[-BASE_W / 2 - PORT_W / 2 + 0.1, BASE_H * 0.6, -BASE_D / 2 + 5]} material={portMat}>
        <boxGeometry args={[PORT_W, PORT_H, PORT_D]} />
      </mesh>
      <mesh position={[BASE_W / 2 + PORT_W / 2 - 0.1, BASE_H * 0.6, -BASE_D / 2 + 5]} material={portMat}>
        <boxGeometry args={[PORT_W, PORT_H, PORT_D]} />
      </mesh>
    </group>
  );
}

// ── Téléphone OnePlus ─────────────────────────────────────────────────────────

function Phone() {
  const W = 7.5, D = 16.2, H = 0.8;
  return (
    <group position={[22, 0, 2]} rotation={[0, 0.15, 0]}>
      <mesh position={[0, H / 2, 0]} castShadow material={caseMat}>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, H + 0.01, 0]} material={phoneScrMat}>
        <planeGeometry args={[W - 0.6, D - 0.8]} />
      </mesh>
      <mesh position={[0, -0.01, -D / 2 + 3]} material={camMat}>
        <boxGeometry args={[3, 0.2, 3.5]} />
      </mesh>
    </group>
  );
}

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
      <Laptop />
      <Phone />
      <Mug />
    </>
  );
}
