/**
 * Building.tsx — Coque architecturale fixe : murs, sol/plafond, miroirs.
 *
 * Regroupe ce qui était dans Walls.tsx, Floor.tsx et Mirrors.tsx — éléments
 * définis en coordonnées monde (pas des items réutilisables).
 *
 * makeGrassTex est exporté car GrassRug (items/) le réutilise.
 */
import { useMemo, useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { cameraState } from '@features/scene/cameraState';
import { NissedalFrame, NissedalGlbFrame, GLB_40x150 } from './items/NissedalMirror';
import { DoorLiving, DoorSdb } from './items/DoorWhite';
import { DoorEntry }            from './items/DoorEntry';
import { GlassDoor }            from './items/GlassDoor';
import { NOOP_ITEM, NOOP_SIZE } from './sceneItem';

import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  DOOR_START, DOOR_END, DOOR_H,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

const BLDG_X_MIN = -100;
const BLDG_X_MAX =  400;
const BLDG_Z_MIN =  -30;
const BLDG_Z_MAX =  800;

const COLORS = {
  wall:    0xeeeeee,
  floor:   0xd4a437,
  parquet: 0xC19A6B,
  accent:  0xcc0000,
  accentS: 0xaa0000,
  ground:  0x3a7d44,
  tile:    0xe8e8e8,
};

import { WALL_DEFS, PILLAR_DEFS, W, CORR_WALL_X } from './wallData';

const FLOOR_Y = -5.25; // dalle béton : surface parquet à Y=0

// ═══════════════════════════════════════════════════════════════════════════════
// WALLS — murs de l'appartement (port de js/structure/walls.js)
// ═══════════════════════════════════════════════════════════════════════════════


// ── Matériaux (module-level, instances uniques) ───────────────────────────────
const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
const ghostMat = new THREE.MeshStandardMaterial({
  color: 0xe8e4dc, roughness: 0.9,
  transparent: true, opacity: 0.18, depthWrite: false,
});
const wallMatDiag = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
const panelMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.6 });
const pvcMat     = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const sillMat    = new THREE.MeshStandardMaterial({ color: 0xb0a898, roughness: 0.8 });
const glassMat   = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff, transparent: true, opacity: 0.25,
  roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide,
});
const handleMat  = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 });

// BoxGeometry face order : [+X(0), -X(1), +Y(2), -Y(3), +Z(4), -Z(5)]
// westMats : face -X (index 1) fantôme ; eastMats : face +X (index 0) fantôme
// northMats : face -Z (index 5) fantôme (face extérieure nord, vue de Z<0)
const westMats  = [wallMat, ghostMat, wallMat, wallMat, wallMat, wallMat];
const eastMats  = [ghostMat, wallMat, wallMat, wallMat, wallMat, wallMat];
const northMats = [wallMat, wallMat, wallMat, wallMat, wallMat, ghostMat];

// W et CORR_WALL_X importés depuis wallData.ts

// Lookup matériau par nom (utilisé lors du rendu WALL_DEFS)
const MAT_MAP: Record<string, THREE.Material | THREE.Material[]> = {
  west:    westMats,
  east:    eastMats,
  north:   northMats,
  default: wallMat,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Panneau box simple avec matériau optionnel (array ou simple). */
function P({ w, h, d, x, y, z, mat = wallMat, userData }: {
  w: number; h: number; d: number;
  x: number; y: number; z: number;
  mat?: THREE.Material | THREE.Material[];
  userData?: Record<string, unknown>;
}) {
  return (
    <mesh
      ref={(m) => { if (m) m.material = mat as any; }}
      position={[x, y, z]}
      userData={userData}
      castShadow receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

// Face invisible pour les bouts de segments — BoxGeometry face indices :
//   0=+X  1=-X  2=+Y  3=-Y  4=+Z  5=-Z
// WZ : end caps = indices 4 et 5 (faces ⊥ Z)
// WX : end caps = indices 0 et 1 (faces ⊥ X)
const noCapMat = new THREE.MeshBasicMaterial({ visible: false });

function caplessZ(mat: THREE.Material | THREE.Material[]): THREE.Material[] {
  const m = Array.isArray(mat) ? mat : [mat, mat, mat, mat, mat, mat];
  return [m[0], m[1], m[2], m[3], noCapMat, noCapMat];
}
function caplessX(mat: THREE.Material | THREE.Material[]): THREE.Material[] {
  const m = Array.isArray(mat) ? mat : [mat, mat, mat, mat, mat, mat];
  return [noCapMat, noCapMat, m[2], m[3], m[4], m[5]];
}

/** Segment de mur axe Z — span de z1 à z2, centré sur x=xc. */
function WZ({ xc, z1, z2, t = W, yBase = 0, h = WALL_H, mat = wallMat }: {
  xc: number; z1: number; z2: number;
  t?: number; yBase?: number; h?: number;
  mat?: THREE.Material | THREE.Material[];
}) {
  return <P w={t} h={h} d={z2 - z1} x={xc} y={yBase + h / 2} z={(z1 + z2) / 2} mat={caplessZ(mat)} />;
}

/** Segment de mur axe X — span de x1 à x2, centré sur z=zc. */
function WX({ x1, x2, zc, t = W, yBase = 0, h = WALL_H, mat = wallMat }: {
  x1: number; x2: number; zc: number;
  t?: number; yBase?: number; h?: number;
  mat?: THREE.Material | THREE.Material[];
}) {
  return <P w={x2 - x1} h={h} d={t} x={(x1 + x2) / 2} y={yBase + h / 2} z={zc} mat={caplessX(mat)} />;
}

/** ExtrudeGeometry depuis une liste de points [worldX, worldZ]. */
export function makeExtrudeGeo(
  pts: [number, number][],
  height: number,
  yBase = 0,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  if (yBase > 0) geo.translate(0, yBase, 0);
  return geo;
}

// ── Mur C : trapèze nord + baie vitrée ────────────────────────────────────────
function WallC({ piersOnly = false }: { piersOnly?: boolean }) {
  const WALL_DEPTH = 30;
  const GLASS_TOP_Y = 210;
  const linteauH = WALL_H - GLASS_TOP_Y; // 40

  return (
    <>
      {/* Pilier NW (intersection MurA × MurC) — toujours visible */}
      <P w={20} h={WALL_H} d={WALL_DEPTH} x={-10} y={WALL_H / 2} z={-WALL_DEPTH / 2}
        userData={{ type: 'pillar', id: 'nw' }} />
      {/* Pilier NE (intersection MurB × MurC) — toujours visible */}
      <P w={W} h={WALL_H} d={WALL_DEPTH} x={ROOM_W + W / 2} y={WALL_H / 2} z={-WALL_DEPTH / 2}
        userData={{ type: 'pillar', id: 'ne' }} />

      <group visible={!piersOnly}>
        <P w={GLASS_START} h={WALL_H} d={WALL_DEPTH}
          x={GLASS_START / 2} y={WALL_H / 2} z={-WALL_DEPTH / 2} mat={northMats} />
        <P w={ROOM_W - GLASS_END} h={WALL_H} d={WALL_DEPTH}
          x={(GLASS_END + ROOM_W) / 2} y={WALL_H / 2} z={-WALL_DEPTH / 2} mat={northMats} />

        {/* Linteau */}
        <P w={GLASS_END - GLASS_START} h={linteauH} d={WALL_DEPTH}
          x={(GLASS_START + GLASS_END) / 2}
          y={GLASS_TOP_Y + linteauH / 2}
          z={-WALL_DEPTH / 2}
          mat={northMats}
        />

        {/* Seuil maçonné */}
        <mesh ref={(m) => { if (m) m.material = sillMat; }}
          position={[(GLASS_START + GLASS_END) / 2, 10, -15]}
          castShadow receiveShadow
        >
          <boxGeometry args={[GLASS_END - GLASS_START, 20, WALL_DEPTH]} />
        </mesh>

      </group>
    </>
  );
}


// ── Labels piliers (mode piersOnly) ───────────────────────────────────────────

function makeSprite(text: string, color: string, worldSize: number): THREE.Sprite {
  const PX = 64;
  const w  = Math.ceil(text.length * PX * 0.58 + PX * 0.6);
  const h  = Math.ceil(PX * 1.3);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `bold ${PX}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true, depthTest: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(worldSize * (w / h), worldSize, 1);
  return sp;
}

function PillarLabels() {
  const { scene } = useThree();

  useEffect(() => {
    const group = new THREE.Group();
    group.name = 'pillar-labels';
    const box = new THREE.Box3();

    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData?.type !== 'pillar') return;
      const id = mesh.userData.id as string;
      box.setFromObject(mesh);
      const cx = (box.min.x + box.max.x) / 2;
      const cz = (box.min.z + box.max.z) / 2;
      const sp = makeSprite(id, '#ffdd44', 14);
      sp.renderOrder = 999;
      sp.position.set(cx, WALL_H + 18, cz);
      group.add(sp);
    });

    scene.add(group);
    return () => {
      scene.remove(group);
      group.traverse(o => {
        const sp = o as THREE.Sprite;
        if (!sp.isSprite) return;
        sp.material.map?.dispose();
        sp.material.dispose();
      });
    };
  }, [scene]);

  return null;
}

// PILLAR_DEFS importé depuis wallData.ts

/** Ref module-level vers le group Walls — consommé par Neighbors pour clone. */
export const wallsGroupRef = { current: null as THREE.Group | null };

// ── Composant principal ────────────────────────────────────────────────────────
export function Walls({ piersOnly = false }: { piersOnly?: boolean }) {
  // Géométries complexes via useMemo ──────────────────────────────────────────

  // Mur diagonal : constantes dérivées
  const diagGeos = useMemo(() => {
    const diagDX  = DIAG_CX - DIAG_AX;
    const diagDZ  = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ    = diagDX / diagLen;
    const cosθ    = diagDZ / diagLen;
    const pX      = cosθ;
    const pZ      = -sinθ;
    const DIAG_DEPTH = 10;

    const iP = (d: number): [number, number] => [DIAG_AX + d * sinθ, DIAG_AZ + d * cosθ];
    const eP = (d: number): [number, number] => [
      DIAG_AX + d * sinθ + DIAG_DEPTH * pX,
      DIAG_AZ + d * cosθ + DIAG_DEPTH * pZ,
    ];

    const E_DOOR_START = 10, E_DOOR_W = 90, E_DOOR_END = E_DOOR_START + E_DOOR_W;

    // Section NE — rectangulaire : épaisseur uniforme, face ext à eP(0)
    const ne = makeExtrudeGeo(
      [iP(0), iP(E_DOOR_START), eP(E_DOOR_START), eP(0)],
      WALL_H,
    );

    // Linteau au-dessus de la porte d'entrée
    const linteau = makeExtrudeGeo(
      [iP(E_DOOR_START), iP(E_DOOR_END), eP(E_DOOR_END), eP(E_DOOR_START)],
      WALL_H - DOOR_H,
      DOOR_H,
    );

    // Section SW — rectangulaire : épaisseur uniforme, face ext à eP(diagLen)
    const sw = makeExtrudeGeo(
      [iP(E_DOOR_END), iP(diagLen), eP(diagLen), eP(E_DOOR_END)],
      WALL_H,
    );

    // Pilier NE (kite) — 4 côtés, angle en C = angle interne de la jonction (~122°).
    // Face BC ∥ Mur B (direction Z), face CD ∥ mur diagonal (direction sinθ,cosθ).
    // C = intersection de X=DIAG_AX+W avec la droite ext diagonale passant par eP(0).
    // eP(0) + t·(sinθ,cosθ) → X = DIAG_AX+W ⟹ t = (W − DIAG_DEPTH·pX) / sinθ
    const tC = (W - DIAG_DEPTH * pX) / sinθ;           // valeur négative
    const cX = DIAG_AX + W;
    const cZ = DIAG_AZ + DIAG_DEPTH * pZ + tC * cosθ;
    // Ordre CW en XZ : D, C, B, A → normales outward correctes.
    const diagPillar = makeExtrudeGeo(
      [
        [DIAG_AX + DIAG_DEPTH * pX, DIAG_AZ + DIAG_DEPTH * pZ] as [number, number], // D = eP(0)
        [cX, cZ]                                                 as [number, number], // C = sommet ext
        [DIAG_AX + W,               DIAG_AZ]                    as [number, number], // B = coin ext Mur B
        [DIAG_AX,                   DIAG_AZ]                    as [number, number], // A = coin int
      ],
      WALL_H,
    );

    // Pilier SW (kite) — même principe que NE, côté Mur A2b (X = DIAG_CX − W).
    // Face BC ∥ Mur A2b (direction Z), face CD ∥ mur diagonal.
    // C = intersection de X=DIAG_CX−W avec la droite ext diagonale par eP(diagLen).
    // eP(diagLen) + t·(sinθ,cosθ) → X = DIAG_CX−W ⟹ t = (−W − DIAG_DEPTH·pX) / sinθ
    const tC_sw  = (-W - DIAG_DEPTH * pX) / sinθ;          // valeur positive
    const cX_sw  = DIAG_CX - W;
    const cZ_sw  = DIAG_CZ + DIAG_DEPTH * pZ + tC_sw * cosθ;
    // Ordre CW en XZ : A, B, C, D → normales outward correctes.
    const diagPillarSW = makeExtrudeGeo(
      [
        [DIAG_CX,                        DIAG_CZ]                    as [number, number], // A = coin int
        [DIAG_CX - W,                    DIAG_CZ]                    as [number, number], // B = coin ext Mur A
        [cX_sw, cZ_sw]                                               as [number, number], // C = sommet ext
        [DIAG_CX + DIAG_DEPTH * pX, DIAG_CZ + DIAG_DEPTH * pZ]     as [number, number], // D = eP(diagLen)
      ],
      WALL_H,
    );

    return { ne, linteau, sw, diagPillar, diagPillarSW };
  }, []);

  return (
    <group ref={(g) => { wallsGroupRef.current = g; }} userData={{ brickType: 'wall' }}>

      {piersOnly && <PillarLabels />}

      {/* ── Piliers box — toujours visibles ─────────────────────────────────── */}
      {PILLAR_DEFS.map(({ id, x, z, w = W, d = W }) => (
        <P key={id} w={w} h={WALL_H} d={d} x={x} y={WALL_H / 2} z={z}
          userData={{ type: 'pillar', id }} />
      ))}
      {/* Pilier NE diag (kite — coin entre Mur B ext et mur diag ext) */}
      <mesh geometry={diagGeos.diagPillar}   material={wallMat} castShadow receiveShadow
        userData={{ type: 'pillar', id: 'ne-diag' }} />
      {/* Pilier SW diag (kite — coin entre Mur A2b ext et mur diag ext) */}
      <mesh geometry={diagGeos.diagPillarSW} material={wallMat} castShadow receiveShadow
        userData={{ type: 'pillar', id: 'sw-diag' }} />

      {/* ── Mur C (piliers NW/NE toujours visibles, panneaux masqués si piersOnly) */}
      <WallC piersOnly={piersOnly} />

      {/* ── Longs murs et parois intérieures — masqués en mode piliers seuls ── */}
      <group visible={!piersOnly}>

        {/* Panneaux bois occultants jardin (mur B2) */}
        {[0, 1].map((i) => (
          <P key={i} w={10} h={190} d={90} x={ROOM_W + 5} y={95} z={-230 - W - i * 90 - 45} mat={panelMat} />
        ))}

        {/* ── Tous les segments de mur axiaux (dérivés de WALL_DEFS) ─────── */}
        {WALL_DEFS.filter(d => !d.skip3d).map((d, i) => {
          const mat = MAT_MAP[d.mat ?? 'default'];
          if (d.axis === 'z')
            return <WZ key={i} xc={d.xc} z1={d.z1} z2={d.z2} mat={mat} h={d.h} yBase={d.yBase} />;
          return <WX key={i} x1={d.x1} x2={d.x2} zc={d.zc} mat={mat} h={d.h} yBase={d.yBase} />;
        })}

        {/* ── Mur diagonal ─────────────────────────────────────────────────── */}
        <mesh geometry={diagGeos.ne}      material={wallMatDiag} castShadow receiveShadow />
        <mesh geometry={diagGeos.linteau} material={wallMatDiag} castShadow receiveShadow />
        <mesh geometry={diagGeos.sw}      material={wallMatDiag} castShadow receiveShadow />

      </group>

    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOOR — sol, plafond, dalles, textures procédurales
// ═══════════════════════════════════════════════════════════════════════════════


const BLDG_W  = BLDG_X_MAX - BLDG_X_MIN;
const BLDG_D  = BLDG_Z_MAX - BLDG_Z_MIN;
const BLDG_CX = (BLDG_X_MIN + BLDG_X_MAX) / 2;
const BLDG_CZ = (BLDG_Z_MIN + BLDG_Z_MAX) / 2;
const CEIL_THICK = 20;

// ── Matériaux plafond (module-level) ─────────────────────────────────────────
const ceilBottom = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
});
const ceilTop = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35,
  transparent: true, opacity: 0.18, depthWrite: false,
});
const ceilSide = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.35 });
// BoxGeometry face order: [+X, -X, +Y(top), -Y(bot), +Z, -Z]
const ceilMats = [ceilSide, ceilSide, ceilTop, ceilBottom, ceilSide, ceilSide];

// ── Texture parquet ────────────────────────────────────────────────────────────
function makeParquetTex(): THREE.CanvasTexture {
  const CW = 128, CH = 512, PW = CW / 2, PH = CH / 2;
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgb(122, 74, 30)';
  ctx.fillRect(0, 0, CW, CH);

  const PLANK_COLOR = 'rgb(122, 74, 30)';
  function drawPlank(x0: number, y0: number, w: number, h: number, skipTop = false) {
    ctx.fillStyle = PLANK_COLOR;
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    for (let i = 0; i < 10; i++) {
      const lx = x0 + 2 + Math.random() * (w - 4);
      ctx.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
      ctx.lineWidth = 0.5 + Math.random() * 0.8;
      ctx.beginPath(); ctx.moveTo(lx, y0 + 1); ctx.lineTo(lx, y0 + h - 1); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x0, y0, 1, h);
    ctx.fillRect(x0 + w - 1, y0, 1, h);
    if (!skipTop) ctx.fillRect(x0, y0, w, 1);
  }

  drawPlank(0,  0,   PW, PH);
  drawPlank(0,  PH,  PW, PH);
  drawPlank(PW, 0,             PW, PH / 2, true);
  drawPlank(PW, PH / 2,        PW, PH);
  drawPlank(PW, PH + PH / 2,   PW, PH / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / 40, 1 / 260);
  return tex;
}

// ── Texture carrelage ──────────────────────────────────────────────────────────
function makeTileTex(): THREE.CanvasTexture {
  const SIZE = 128;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4f4f2';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, 0, SIZE, 3);
  ctx.fillRect(0, SIZE - 3, SIZE, 3);
  ctx.fillRect(0, 0, 3, SIZE);
  ctx.fillRect(SIZE - 3, 0, 3, SIZE);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ── Texture herbe ──────────────────────────────────────────────────────────────
export function makeGrassTex(): THREE.CanvasTexture {
  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1e4a22';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const rng = () => Math.random();
  for (let i = 0; i < 80; i++) {
    const x = rng() * SIZE, y = rng() * SIZE, r = 5 + rng() * 15;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(10,30,10,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 9000; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const len = 5 + rng() * 14;
    const angle = -Math.PI / 2 + (rng() - 0.5) * 1.0;
    const g = Math.floor(60 + rng() * 100), r = Math.floor(10 + rng() * 30);
    ctx.strokeStyle = `rgb(${r},${g},${r})`;
    ctx.lineWidth = 0.8 + rng() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(25, 18);
  return tex;
}

// ── Parquet ────────────────────────────────────────────────────────────────────
function Parquet() {
  const { geo, mat } = useMemo(() => {
    const shape = new THREE.Shape([
      new THREE.Vector2(0,           0),
      new THREE.Vector2(0,           -NICHE_Z_START),
      new THREE.Vector2(-NICHE_DEPTH,-NICHE_Z_START),
      new THREE.Vector2(-NICHE_DEPTH,-ROOM_D),
      new THREE.Vector2(0,           -ROOM_D),
      new THREE.Vector2(KITCHEN_X0,  -ROOM_D),
      new THREE.Vector2(KITCHEN_X0,  -KITCHEN_Z),
      new THREE.Vector2(KITCHEN_X1,  -KITCHEN_Z),
      new THREE.Vector2(KITCHEN_X1,  -ROOM_D),
      new THREE.Vector2(DOOR_START,  -ROOM_D),
      new THREE.Vector2(DOOR_START,  -SDB_Z_END),
      new THREE.Vector2(ROOM_W,      -DIAG_AZ),
      new THREE.Vector2(ROOM_W,      0),
    ]);
    const g = new THREE.ShapeGeometry(shape);
    const tex = makeParquetTex();
    const m = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.45,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    return { geo: g, mat: m };
  }, []);

  return (
    <mesh geometry={geo} material={mat}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      userData={{ brickType: 'floor' }}
    />
  );
}

// ── Carrelage SDB + couloir ────────────────────────────────────────────────────
function Tile() {
  const { sdbGeo, sdbMat, closetMat } = useMemo(() => {
    const baseTex = makeTileTex();

    // Trapèze SDB : coins A(-10,460) B(-10,727) C(190,600) D(190,460)
    const Ax = DIAG_CX, Az = KITCHEN_Z;
    const Bx = DIAG_CX, Bz = DIAG_CZ;
    const Cx = DOOR_START, Cz = SDB_Z_END;
    const Dx = DOOR_START, Dz = KITCHEN_Z;

    const positions = new Float32Array([
      Ax, 0, Az,  Bx, 0, Bz,  Cx, 0, Cz,
      Ax, 0, Az,  Cx, 0, Cz,  Dx, 0, Dz,
    ]);
    const uvs = new Float32Array([
      Ax / 20, Az / 20,  Bx / 20, Bz / 20,  Cx / 20, Cz / 20,
      Ax / 20, Az / 20,  Cx / 20, Cz / 20,  Dx / 20, Dz / 20,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    g.computeVertexNormals();

    const tSdb = baseTex.clone();
    tSdb.wrapS = tSdb.wrapT = THREE.RepeatWrapping;
    tSdb.repeat.set(1, 1);
    tSdb.needsUpdate = true;
    const mSdb = new THREE.MeshStandardMaterial({
      map: tSdb, roughness: 0.25, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });

    // Carrelage marron placard couloir
    const brownCanvas = document.createElement('canvas');
    brownCanvas.width = 128; brownCanvas.height = 128;
    const ctx = brownCanvas.getContext('2d')!;
    ctx.fillStyle = '#7a5030'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, 128, 3); ctx.fillRect(0, 125, 128, 3);
    ctx.fillRect(0, 0, 3, 128); ctx.fillRect(125, 0, 3, 128);
    const brownTex = new THREE.CanvasTexture(brownCanvas);
    brownTex.wrapS = brownTex.wrapT = THREE.RepeatWrapping;

    const CLOSET_W = DOOR_START - KITCHEN_X1;
    const CLOSET_D = KITCHEN_Z - ROOM_D;
    const tB = brownTex.clone();
    tB.repeat.set(CLOSET_W / 20, CLOSET_D / 20);
    tB.needsUpdate = true;
    const mB = new THREE.MeshStandardMaterial({
      map: tB, roughness: 0.25, metalness: 0.05,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });

    return { sdbGeo: g, sdbMat: mSdb, closetMat: mB };
  }, []);

  const CLOSET_W = DOOR_START - KITCHEN_X1;
  const CLOSET_D = KITCHEN_Z - ROOM_D;

  return (
    <>
      <mesh geometry={sdbGeo} material={sdbMat} receiveShadow userData={{ brickType: 'floor' }} />
      <mesh
        ref={(m) => { if (m) m.material = closetMat; }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[KITCHEN_X1 + CLOSET_W / 2, 0, ROOM_D + CLOSET_D / 2]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <planeGeometry args={[CLOSET_W, CLOSET_D]} />
      </mesh>
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function Floor({ showCeiling = true }: { showCeiling?: boolean }) {
  const slabY = FLOOR_Y + 1.75 - 10 / 2;

  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: makeGrassTex(), roughness: 0.85, color: 0xffffff,
  }), []);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x1e4022, roughness: 0.9 });
  const gardenMats = [sideMat, sideMat, grassMat, sideMat, sideMat, sideMat];

  const gardenD = Math.abs(-400 - BLDG_Z_MIN); // BLDG_Z_MIN + 400

  return (
    <>
      {/* Parquet séjour + cuisine */}
      <Parquet />

      {/* Carrelage SDB + couloir */}
      <Tile />

      {/* Dalle béton */}
      <mesh
        ref={(m) => { if (m) m.material = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.6 }); }}
        position={[BLDG_CX, slabY, BLDG_CZ]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <boxGeometry args={[BLDG_W, 10, BLDG_D]} />
      </mesh>

      {/* Dalle jardin herbe */}
      <mesh
        ref={(m) => { if (m) m.material = gardenMats as any; }}
        position={[BLDG_CX, slabY, (BLDG_Z_MIN + -400) / 2]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <boxGeometry args={[BLDG_W, 10, gardenD]} />
      </mesh>

      {/* Plafonds — masquables via toggle "Plafond" */}
      <group visible={showCeiling}>
        {/* Plafond principal */}
        <mesh
          ref={(m) => { if (m) m.material = ceilMats as any; }}
          position={[BLDG_CX, WALL_H - 1 + CEIL_THICK / 2, BLDG_CZ]}
          userData={{ brickType: 'ceiling' }}
        >
          <boxGeometry args={[BLDG_W, CEIL_THICK, BLDG_D]} />
        </mesh>

        {/* Plafond terrasse (235×150cm côté Est) */}
        <mesh
          ref={(m) => { if (m) m.material = ceilMats as any; }}
          position={[300 - 235 / 2, WALL_H - 1 + CEIL_THICK / 2, BLDG_Z_MIN - 75]}
          userData={{ brickType: 'ceiling' }}
        >
          <boxGeometry args={[235, CEIL_THICK, 150]} />
        </mesh>
      </group>

      {/* Sol extérieur — centré sur le bounding box studio + voisins.
          X[-400,690] Z[-490,990] → centre [145,250], marges ~50 unités */}
      <mesh
        ref={(m) => { if (m) m.material = new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 }); }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[145, -10, 250]}
        receiveShadow
        userData={{ brickType: 'ground' }}
      >
        <planeGeometry args={[1090, 1480]} />
      </mesh>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIRRORS — miroirs Nissedal avec THREE.Reflector
// ═══════════════════════════════════════════════════════════════════════════════


const kallaxW1 = 40.5; // kallaxW(1)

// Compteur global de profondeur de réflexion.
// Empêche les miroirs perpendiculaires de se rendre mutuellement en boucle infinie :
// chaque Reflector vérifie la profondeur avant de lancer sa passe — si on est déjà
// en train de rendre un reflet (depth >= 1), on skippe.
let _reflectionDepth = 0;

// ── Composant miroir Reflector ────────────────────────────────────────────────

function ReflectorMirror({ w, h, position, rotationY }: {
  w: number; h: number;
  position: [number, number, number];
  rotationY: number;
}) {
  const reflector = useMemo(() => {
    const mir = new Reflector(new THREE.PlaneGeometry(w, h), {
      textureWidth:  512,
      textureHeight: 512,
      color: 0xbbbbbb,
    } as ConstructorParameters<typeof Reflector>[1]);
    mir.position.set(...position);
    mir.rotation.y = rotationY;
    mir.camera.layers.mask = 1;

    const origOnBeforeRender = mir.onBeforeRender.bind(mir);
    mir.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      if (_reflectionDepth >= 1) return;
      _reflectionDepth++;
      mir.camera.layers.mask = cameraState.mirrorsHD ? camera.layers.mask : 1;
      origOnBeforeRender(renderer, scene, camera, geometry, material, group);
      _reflectionDepth--;
    };

    return mir;
  }, []);

  return <primitive object={reflector} />;
}

// ── 3× Nissedal 60×60 — Mur D ────────────────────────────────────────────────

function MirrorsD() {
  const W = 60, H = 60; // temporaire 60×60 — passage ROOM_W 300→314 en cours
  const FT = 1.8, FD = 1.2;
  const cx  = (KITCHEN_X1 + DOOR_START) / 2;
  const fz  = ROOM_D - 0.2 - FD / 2;
  const mirZ = fz - 0.1;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const cy = (WALL_H - 3.5) - H / 2 - i * (H + 0.5);
        return (
          <group key={i} userData={{ animUnit: true }}>
            <ReflectorMirror
              w={W - FT * 2} h={H - FT * 2}
              position={[cx, cy, mirZ]}
              rotationY={Math.PI}
            />
            <group position={[cx, cy - H / 2, fz]}>
              <NissedalFrame w={W} h={H} ft={FT} fd={FD} />
            </group>
          </group>
        );
      })}
    </>
  );
}

// ── 3× Nissedal 40×150 + 1× 70×160 — Mur A ──────────────────────────────────

function MirrorsA() {
  const MA_W = 40, MA_H = 150;
  const M4_W = 70, M4_H = 160;
  const FT = 1.8, FD = 1.2;
  const MA_START_Z  = kallaxW1 + 10;
  const MA_BOTTOM_Y = 6;
  const fx  = 0.2 + FD / 2;
  const mirX = fx + 0.1;

  return (
    <>
      {([0, 1, 2] as const).map((i) => {
        const mz = MA_START_Z + MA_W / 2 + i * MA_W;
        const cy = MA_BOTTOM_Y + MA_H / 2;
        return (
          <group key={i} userData={{ animUnit: true }}>
            <ReflectorMirror
              w={MA_W - FT * 2} h={MA_H - FT * 2}
              position={[mirX, cy, mz]}
              rotationY={Math.PI / 2}
            />
            {/* cadre GLB — rotation-y=-π/2 : glace locale -Z → monde +X (face pièce) */}
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={-Math.PI / 2}>
              <NissedalGlbFrame glb={GLB_40x150} />
            </group>
          </group>
        );
      })}

      {/* 4e miroir 70×160 */}
      {(() => {
        const mz = MA_START_Z + 3 * MA_W + M4_W / 2;
        const cy = MA_BOTTOM_Y + M4_H / 2;
        return (
          <group userData={{ animUnit: true }}>
            <ReflectorMirror
              w={M4_W - FT * 2} h={M4_H - FT * 2}
              position={[mirX, cy, mz]}
              rotationY={Math.PI / 2}
            />
            <group position={[fx, MA_BOTTOM_Y, mz]} rotation-y={Math.PI / 2}>
              <NissedalFrame w={M4_W} h={M4_H} ft={FT} fd={FD} />
            </group>
          </group>
        );
      })()}
    </>
  );
}

// ── Miroir vasque SDB ─────────────────────────────────────────────────────────

function MirrorSDB() {
  const VANITY_W    = 60, VANITY_D = 47, VANITY_Y0 = 30, VANITY_H = 50;
  const VANITY_CX   = DOOR_START - 84;
  const VANITY_CZ   = KITCHEN_Z + 11 + VANITY_D / 2;
  const counterTopY = VANITY_Y0 + VANITY_H + 4;
  const mirrorW     = VANITY_W + 3;
  const mirrorH     = 90;
  const mirrorY     = counterTopY + mirrorH / 2;
  const mirrorZ     = -VANITY_D / 2 + 0.5;

  return (
    <ReflectorMirror
      w={mirrorW} h={mirrorH}
      position={[VANITY_CX, mirrorY, VANITY_CZ + mirrorZ + 0.1]}
      rotationY={0}
    />
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Mirrors() {
  return (
    <>
      <MirrorsD />
      <MirrorsA />
      <MirrorSDB />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOORS — portes placées en coordonnées monde
// ═══════════════════════════════════════════════════════════════════════════════
//
// Calcul de placement (wrapper rotY=θ, item pivot local = [px, -H/2, 0]) :
//   world_hinge = wrapper_pos + R_y(θ) * [px, -H/2, 0]
//   → wrapper_pos = [hx - px·cosθ, H/2, hz - px·sinθ]
//
//   DoorLiving : pivotX=+W/2, θ=0          → wrapper=(DOOR_END − W/2 + 6, H/2, ROOM_D + 4.5)
//   DoorSdb    : pivotX=−W/2, θ=+π/2       → wrapper=(WALL_X, H/2, hingeZ − W/2)
//   DoorEntry  : pivotX=−W/2, θ=diagRotY−π/2 (panneau items/ s'étend en +X local,
//                structure attendue +Z → correction −π/2)

function useFurnitureToggles(map: Record<string, string>): Record<string, boolean> {
  const [state, setState] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const stateKey = map[key];
      if (!stateKey) return;
      setState(prev => ({ ...prev, [stateKey]: !prev[stateKey] }));
      invalidate();
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate]);
  return state;
}

const DOOR_W_WHITE = 83;
const DOOR_W_ENTRY = 90;
const DOOR_HEIGHT  = 204;

export function DoorsPlaced() {
  const as = useFurnitureToggles({
    eastGlassDoor:     'east-glass-door-toggle',
    livingDoor:   'living-door-toggle',
    bathroomDoor: 'bathroom-door-toggle',
    entryDoor:    'entry-door-toggle',
  });

  const sdbHingeZ = SDB_Z_END - 10;

  const entry = useMemo(() => {
    const diagDX  = DIAG_CX - DIAG_AX;
    const diagDZ  = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ    = diagDX / diagLen;
    const cosθ    = diagDZ / diagLen;
    const originX = DIAG_AX + 5 * cosθ;
    const originZ = DIAG_AZ - 5 * sinθ;
    const dR      = Math.atan2(diagDX, diagDZ);
    const cosR    = Math.cos(dR);
    const sinR    = Math.sin(dR);
    const E_DOOR_START = 10;
    const hingeX  = originX + E_DOOR_START * sinθ;
    const hingeZ  = originZ + E_DOOR_START * cosθ;
    return {
      wx:       hingeX + DOOR_W_ENTRY / 2 * sinR,
      wy:       DOOR_HEIGHT / 2,
      wz:       hingeZ + DOOR_W_ENTRY / 2 * cosR,
      diagRotY: dR - Math.PI / 2,
    };
  }, []);

  return (
    <>
      <group
        position={[(GLASS_START + GLASS_END) / 2, 105, 0]}
        userData={{ animUnit: true, hoverAction: { label: 'Porte-fenêtre', actionId: 'eastGlassDoor' } }}>
        <GlassDoor item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[DOOR_END - DOOR_W_WHITE / 2 + 6, DOOR_HEIGHT / 2, ROOM_D + 4.5]}
        userData={{ animUnit: true, hoverAction: { label: 'Porte séjour', actionId: 'livingDoor' } }}>
        <DoorLiving item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[CORR_WALL_X, DOOR_HEIGHT / 2, sdbHingeZ - DOOR_W_WHITE / 2]}
        rotation-y={Math.PI / 2}
        userData={{ animUnit: true, hoverAction: { label: 'Porte SDB', actionId: 'bathroomDoor' } }}>
        <DoorSdb item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[entry.wx, entry.wy, entry.wz]}
        rotation-y={entry.diagRotY}
        userData={{ animUnit: true, hoverAction: { label: 'Porte entrée', actionId: 'entryDoor' } }}>
        <DoorEntry item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}
