/**
 * Furnishings.tsx — Meubles principaux de la scène (géométrie procédurale).
 * Port fidèle de js/furniture/bed.js, desks.js et tv.js.
 *
 * Contenu :
 *   - Lit Utåker 2 couchages empilés (avec couette/polochons rouges)
 *   - 2 bureaux BOLLSIDAN (plateau arrondi ExtrudeGeometry)
 *   - Téléviseur mural
 */
import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
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
const tvBodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.4 });

// ────────────────────────────────────────────────────────────────────────────
// LIT UTÅKER
// ────────────────────────────────────────────────────────────────────────────

/** Un cadre Utåker : côtés + extrémités + 4 pieds + matelas. */
function UtakerFrame({ matColor, matHeight, stacked = false }: {
  matColor: number; matHeight: number; stacked?: boolean;
}) {
  return (
    <group position={[0, stacked ? 23 : 0, 0]}>
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

/** Couette rouge + 2 polochons (attachés au cadre du haut, y relatif à b2). */
function BedcoversRed({ b2Y }: { b2Y: number }) {
  const relTop = b2Y + 11 + 24; // top of upper mattress in parent frame
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
  const pos = useMemo(() => {
    const PAD = 3;
    const halfL = 102.5, halfW = 41.5;
    const dxK = ROOM_W - (ROOM_W - KALLAX_DEPTH);   // 39
    const dxS = ROOM_W - SUNNERSTA_NW_X + PAD;       // 39
    const dzT = SUNNERSTA_NW_Z - (kallaxW2 + PAD);   // 165
    const u = (dzT - Math.sqrt(dzT * dzT - 4 * dxK * dxS)) / 2;
    const NE_Z = kallaxW2 + PAD + u;
    const alpha = Math.atan2(dxK, u);
    const neOffX = halfL * Math.cos(alpha) + halfW * Math.sin(alpha);
    const neOffZ = -halfL * Math.sin(alpha) + halfW * Math.cos(alpha);
    return {
      x: ROOM_W - neOffX,
      z: NE_Z - neOffZ,
      ry: alpha,
    };
  }, []);

  return (
    <group position={[pos.x, 0, pos.z]} rotation={[0, pos.ry, 0]}>
      <UtakerFrame matColor={0x87ceeb} matHeight={18} />
      <UtakerFrame matColor={0xffffff} matHeight={24} stacked />
      <BedcoversRed b2Y={23} />
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

function Desks() {
  return (
    <>
      {/* Bureau 1 : contre mur A */}
      <group position={[22, 0, 74.5]} rotation={[0, Math.PI / 2, 0]}>
        <Bollsidan />
      </group>
      {/* Bureau 2 : au centre */}
      <group position={[200, 0, 170]} rotation={[0, Math.PI, 0]}>
        <Bollsidan />
      </group>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TÉLÉVISEUR
// ────────────────────────────────────────────────────────────────────────────

function TV() {
  const TV_W = 70, TV_H = 40, TV_D = 1.5;
  const TV_Y = WALL_H - 10 - TV_H / 2;
  const TILT = -Math.PI / 36;

  const screenTex = useTexture('media/omarchy-screen.png');
  screenTex.colorSpace = THREE.SRGBColorSpace;

  return (
    <group
      position={[ROOM_W - 25, TV_Y, 25]}
      rotation-order="YXZ"
      rotation={[TILT, (3 * Math.PI) / 4, 0]}
    >
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

// ── Export principal ──────────────────────────────────────────────────────────

export function Furnishings() {
  return (
    <>
      <Bed />
      <Desks />
      <TV />
    </>
  );
}
