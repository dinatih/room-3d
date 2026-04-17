/**
 * Furnishings.tsx — Meubles principaux de la scène (géométrie procédurale).
 * Port fidèle de js/furniture/bed.js, desks.js et tv.js.
 *
 * Contenu :
 *   - Lit Utåker 2 couchages empilés (avec couette/polochons rouges)
 *   - 2 bureaux BOLLSIDAN (plateau arrondi ExtrudeGeometry)
 *   - Téléviseur mural
 */
import { useMemo, useState, useEffect } from 'react';
import { LaptopDesk } from './LaptopDesk';
import { TV, TV_W, TV_H, TV_D } from './items/TV';
import * as THREE from 'three';

// @ts-ignore
import { ROOM_W, WALL_H, KALLAX_DEPTH } from '@config';

// ── Constantes partagées ──────────────────────────────────────────────────────

const kallaxW2  = 75.5; // kallaxW(2)
const SUNNERSTA_NW_X = ROOM_W - 36; // 264
const SUNNERSTA_NW_Z = 243.5;

// ── Matériaux (module-level) ──────────────────────────────────────────────────

const woodMat   = new THREE.MeshStandardMaterial({ color: 0xe8c39e, roughness: 0.8 });
const whiteMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const blueMat   = new THREE.MeshStandardMaterial({ color: 0x87ceeb, roughness: 0.8 });
const redMat    = new THREE.MeshStandardMaterial({ color: 0xCC2222, roughness: 0.75 });

// ────────────────────────────────────────────────────────────────────────────
// LIT UTÅKER
// ────────────────────────────────────────────────────────────────────────────

/** Un cadre Utåker : côtés + extrémités + 4 pieds + matelas. */
function UtakerFrame({ matColor, matHeight }: {
  matColor: number; matHeight: number;
}) {
  return (
    <group>
      {/* Côtés longs */}
      <mesh position={[0, 17, 40]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[205, 12, 3]} />
      </mesh>
      <mesh position={[0, 17, -40]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[205, 12, 3]} />
      </mesh>
      {/* Extrémités */}
      <mesh position={[101, 17, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[3, 12, 83]} />
      </mesh>
      <mesh position={[-101, 17, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[3, 12, 83]} />
      </mesh>
      {/* 4 pieds */}
      {([-98, 98] as const).flatMap(px => ([-38.5, 38.5] as const).map(pz => (
        <mesh key={`${px}${pz}`} position={[px, 11.5, pz]} castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[4, 23, 4]} />
        </mesh>
      )))}
      {/* Matelas */}
      <mesh position={[0, 11 + matHeight / 2, 0]} castShadow receiveShadow
        material={new THREE.MeshStandardMaterial({ color: matColor, roughness: 0.8 })}>
        <boxGeometry args={[200, matHeight, 80]} />
      </mesh>
    </group>
  );
}

/** Couette rouge + 2 polochons — en coordonnées locales du cadre b2. */
function BedcoversRed() {
  const relTop = 11 + 24; // top of upper mattress (legs 11 + matH 24)
  const polR = 8, polL = 90;
  return (
    <group>
      {/* Couette (surface) */}
      <mesh position={[1.5, relTop + 0.6, 0]} castShadow receiveShadow material={redMat}>
        <boxGeometry args={[203, 1.2, 86]} />
      </mesh>
      {/* Drapés longs */}
      {([-1, 1] as const).map(s => (
        <mesh key={s} position={[1.5, relTop - 10, s * 43]} castShadow material={redMat}>
          <boxGeometry args={[203, 20, 1.2]} />
        </mesh>
      ))}
      {/* Drapé pied */}
      <mesh position={[103, relTop - 10, 0]} castShadow material={redMat}>
        <boxGeometry args={[1.2, 20, 86]} />
      </mesh>
      {/* Polochons */}
      {([-50, 50] as const).map(cx => (
        <mesh key={cx} position={[cx, relTop + 1.2 + polR + 0.5, 40 - polR - 1]}
          rotation={[0, 0, -Math.PI / 2]} castShadow material={redMat}>
          <cylinderGeometry args={[polR, polR, polL, 12]} />
        </mesh>
      ))}
    </group>
  );
}

function Bed() {
  const bedPositions = useMemo(() => {
    const PAD = 3;
    const halfL = 102.5, halfW = 41.5;
    const dxK = ROOM_W - (ROOM_W - KALLAX_DEPTH);
    const dxS = ROOM_W - SUNNERSTA_NW_X + PAD;
    const dzT = SUNNERSTA_NW_Z - (kallaxW2 + PAD);
    const u = (dzT - Math.sqrt(dzT * dzT - 4 * dxK * dxS)) / 2;
    const NE_Z = kallaxW2 + PAD + u;
    const alpha = Math.atan2(dxK, u);
    const neOffX = halfL * Math.cos(alpha) + halfW * Math.sin(alpha);
    const neOffZ = -halfL * Math.sin(alpha) + halfW * Math.cos(alpha);
    return [
      { x: ROOM_W - neOffX,    z: NE_Z - neOffZ, ry: alpha       }, // pos 0 — diagonale
      { x: ROOM_W - 83 / 2,    z: 190,            ry: Math.PI / 2 }, // pos 1 — ∥ mur B
      { x: ROOM_W - 205 / 2,   z: 200,            ry: 0           }, // pos 2 — ⊥ mur B
    ];
  }, []);

  const [stacked,    setStacked]    = useState(true);
  const [sofa,       setSofa]       = useState(false);
  const [bedPosIdx,  setBedPosIdx]  = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'bed-toggle' || key === 'bedStacked')  setStacked(v => !v);
      if (key === 'bed-sofa'   || key === 'bedSofa')    setSofa(v => !v);
      if (key === 'bed-position' || key === 'bedPosition') { setSofa(false); setBedPosIdx(i => (i + 1) % 3); }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p    = bedPositions[bedPosIdx];
  const gPos: [number, number, number] = sofa ? [ROOM_W - 83 / 2, 0, 190]            : [p.x, 0, p.z];
  const gRy  = sofa ? Math.PI / 2 : p.ry;
  const b2Pos: [number, number, number] = sofa
    ? [46, 0, -(ROOM_W - 83)]
    : [0, stacked ? 23 : 0, stacked ? 0 : -83];

  return (
    <group
      position={gPos}
      rotation={[0, gRy, 0]}
      userData={{ hoverAction: { label: 'Lit Utåker', actions: ['bed-toggle', 'bed-position', 'bed-sofa'] } }}
    >
      <UtakerFrame matColor={0x87ceeb} matHeight={18} />
      <group position={b2Pos}>
        <UtakerFrame matColor={0xffffff} matHeight={24} />
        <BedcoversRed />
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BUREAU BOLLSIDAN
// ────────────────────────────────────────────────────────────────────────────

function BollsidanTop() {
  const geo = useMemo(() => {
    const w = 68, d = 36, r = 6;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -d / 2);
    shape.lineTo( w / 2 - r, -d / 2);
    shape.absarc( w / 2 - r, -d / 2 + r, r, -Math.PI / 2, 0, false);
    shape.lineTo( w / 2,      d / 2 - r);
    shape.absarc( w / 2 - r,  d / 2 - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-w / 2 + r,  d / 2);
    shape.absarc(-w / 2 + r,  d / 2 - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-w / 2,      -d / 2 + r);
    shape.absarc(-w / 2 + r,  -d / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return <mesh geometry={geo} material={whiteMat} castShadow receiveShadow />;
}

function Bollsidan({ height = 70 }: { height?: number }) {
  const footHgt = 2.5;
  const colSize = 4.2;
  const w = 68;
  const refEastX = w / 2 - 8;   // ~26
  const colX = refEastX - colSize; // ~21.8
  const colHeight = height - footHgt;

  return (
    <group>
      {/* Plateau */}
      <group position={[0, height, 0]}>
        <BollsidanTop />
      </group>
      {/* Piètement H */}
      <mesh position={[refEastX,      footHgt / 2, 0]} castShadow material={whiteMat}>
        <boxGeometry args={[5, footHgt, 32]} />
      </mesh>
      <mesh position={[refEastX - 55, footHgt / 2, 0]} castShadow material={whiteMat}>
        <boxGeometry args={[5, footHgt, 32]} />
      </mesh>
      <mesh position={[refEastX - 27.5, footHgt / 2, 0]} castShadow material={whiteMat}>
        <boxGeometry args={[55, footHgt, 5]} />
      </mesh>
      {/* Colonne */}
      <mesh position={[colX, footHgt + colHeight / 2, 0]} castShadow material={whiteMat}>
        <boxGeometry args={[colSize, colHeight, colSize]} />
      </mesh>
    </group>
  );
}

const SIT_H  = 70;
const STAND_H = 103;

const DESK1_POSITIONS = [
  { x: 22,   z: 74.5, ry: Math.PI / 2 }, // contre mur A
  { x: 73.5, z: 18,   ry: 0           }, // face mur C, devant Kallax NW
] as const;

const DESK2_POSITIONS = [
  { x: 200, z: 170, ry: Math.PI       }, // position initiale
  { x: 85,  z: 151, ry: Math.PI / 2   }, // devant la chaise
] as const;

function Desks() {
  const [d1H,   setD1H]   = useState(SIT_H);
  const [d2H,   setD2H]   = useState(SIT_H);
  const [d1Pos, setD1Pos] = useState(0);
  const [d2Pos, setD2Pos] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'desk1-toggle')   setD1H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk1-position') setD1Pos(i => (i + 1) % DESK1_POSITIONS.length);
      if (key === 'desk2-toggle')   setD2H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk2-position') setD2Pos(i => (i + 1) % DESK2_POSITIONS.length);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p1 = DESK1_POSITIONS[d1Pos];
  const p2 = DESK2_POSITIONS[d2Pos];

  return (
    <>
      <group
        position={[p1.x, 0, p1.z]} rotation={[0, p1.ry, 0]}
        userData={{ hoverAction: { label: 'Bureau 1', actions: ['desk1-toggle', 'desk1-position'] } }}
      >
        <Bollsidan height={d1H} />
      </group>
      <group
        position={[p2.x, 0, p2.z]} rotation={[0, p2.ry, 0]}
        userData={{ hoverAction: { label: 'Bureau 2', actions: ['desk2-toggle', 'desk2-position'] } }}
      >
        <Bollsidan height={d2H} />
        {/* Objets surface — position [0, height, 0] rotY=π, fidèle à desk2Surface vanilla */}
        <group position={[0, d2H, 0]} rotation={[0, Math.PI, 0]}>
          <LaptopDesk />
        </group>
      </group>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TÉLÉVISEUR
// ────────────────────────────────────────────────────────────────────────────

function TVPlaced() {
  const TV_Y = WALL_H - 10 - TV_H / 2;
  const TILT = -Math.PI / 36;
  return (
    <group
      position={[ROOM_W - 25, TV_Y, 25]}
      rotation-order="YXZ"
      rotation={[TILT, (3 * Math.PI) / 4, 0]}
    >
      <TV item={{} as any} actionState={{}} onSize={() => {}} />
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Furnishings() {
  return (
    <>
      <Bed />
      <Desks />
      <TVPlaced />
    </>
  );
}
