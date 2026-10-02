/**
 * Floor.tsx — Sols, revêtements (parquet, carrelage, PVC), plinthes, dalle béton et plafonds.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { BermudaGround } from './BermudaGround';
import { MergedStaticGroup } from './MergedStaticGroup';
import { CategoryLayerGroup } from '../sceneLayer';
import {
  ROOM_W, ROOM_D, WALL_H, BATH_WEST_WALL, DOOR_START, DOOR_END,
  DOOR_BATH_START, DOOR_BATH_END,
  KITCHEN_WEST_WALL, KITCHEN_EAST_WALL, KITCHEN_SOUTH_WALL, pSouth, DiagWall,
  BATH_EAST_WALL,
  CORRIDOR_WEST_WALL,
  pX,
} from '../wallData';
import { LAYER_FLOOR_COVERINGS, LAYER_STRUCTURE } from '@config';
import { PARTITION_THICKNESS, BATH_SOUTH_WALL, CORRIDOR_NORTH_WALL } from '../wallData';
import {
  COLORS, skirtingMat, noCapMat, slabConcreteTop, slabConcreteSide,
  boxFaceMats, qrGeo
} from './buildingCommon';
import { P } from './Walls';

const BLDG_Z_MIN = -30;
const CEIL_THICK = 20;

const INT_X_WEST = 0;
const INT_X_NICHE = BATH_WEST_WALL;
const INT_X_KITCHEN_L = KITCHEN_WEST_WALL;
const INT_X_KITCHEN_R = KITCHEN_EAST_WALL;
const INT_X_DOOR_S = DOOR_START;
const INT_X_EAST = ROOM_W;

const INT_Z_NORTH = 0;
const INT_Z_NICHE_S = pSouth('niche-beam');
const INT_Z_ROOM_S = ROOM_D;
const INT_Z_KITCHEN_B = KITCHEN_SOUTH_WALL;
const INT_Z_BATH_N = KITCHEN_SOUTH_WALL + PARTITION_THICKNESS;

const ceilBottomBack = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
  side: THREE.BackSide,
});
const ceilBottom = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
});
const ceilMats = boxFaceMats({ '-y': ceilBottom });

function QR({ cx, cz, len, dir, mat }: {
  cx: number; cz: number;
  len: number;
  dir: '+X' | '-X' | '+Z' | '-Z';
  mat: THREE.Material;
}) {
  const ry = dir === '+X' ? 0
           : dir === '-Z' ? Math.PI / 2
           : dir === '-X' ? Math.PI
           : -Math.PI / 2;
  return (
    <mesh
      geometry={qrGeo}
      material={mat}
      position={[cx, 0, cz]}
      rotation-y={ry}
      scale-z={len}
      castShadow receiveShadow
    />
  );
}

function makeParquetTex(): THREE.CanvasTexture {
  const CW = 256, CH = 1024, PW = CW / 2;
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  let seed = 0xC0FFEE;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  ctx.fillStyle = 'rgb(135, 105, 78)';
  ctx.fillRect(0, 0, CW, CH);

  function drawPlank(x0: number, y0: number, w: number, h: number) {
    const hueShift = (rng() - 0.5) * 14;
    const lumShift = (rng() - 0.5) * 26;
    const baseR = Math.max(155, Math.min(225, 190 + lumShift + hueShift * 0.5));
    const baseG = Math.max(120, Math.min(180, 155 + lumShift * 0.85));
    const baseB = Math.max(80,  Math.min(145, 118 + lumShift * 0.6 - hueShift * 0.6));

    ctx.fillStyle = `rgb(${baseR | 0},${baseG | 0},${baseB | 0})`;
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);

    const grad = ctx.createLinearGradient(x0, y0, x0 + w, y0);
    grad.addColorStop(0,    `rgba(255,240,210,${0.04 + rng() * 0.04})`);
    grad.addColorStop(0.5,  'rgba(0,0,0,0)');
    grad.addColorStop(1,    `rgba(50,28,10,${0.04 + rng() * 0.05})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);

    const grainCount = 70 + Math.floor(rng() * 40);
    for (let i = 0; i < grainCount; i++) {
      const lx = x0 + 2 + rng() * (w - 4);
      const wave = 0.6 + rng() * 1.8;
      const waveFreq = 0.015 + rng() * 0.035;
      const phase = rng() * Math.PI * 2;
      const alpha = 0.04 + rng() * 0.10;
      const dark = rng() < 0.5;
      ctx.strokeStyle = dark
        ? `rgba(80,50,22,${alpha})`
        : `rgba(245,220,180,${alpha * 0.55})`;
      ctx.lineWidth = 0.4 + rng() * 0.8;
      ctx.beginPath();
      ctx.moveTo(lx + Math.sin(phase) * wave, y0 + 1);
      const steps = 36;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const ly = y0 + 1 + t * (h - 2);
        const ox = Math.sin(phase + ly * waveFreq) * wave;
        ctx.lineTo(lx + ox, ly);
      }
      ctx.stroke();
    }
  }

  const c0Offsets = [0, 420, 800, 1024];
  for (let i = 0; i < c0Offsets.length - 1; i++) {
    drawPlank(0, c0Offsets[i], PW, c0Offsets[i + 1] - c0Offsets[i]);
  }
  const c1Offsets = [0, 210, 610, 1024];
  for (let i = 0; i < c1Offsets.length - 1; i++) {
    drawPlank(PW, c1Offsets[i], PW, c1Offsets[i + 1] - c1Offsets[i]);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / 40, 1 / 260);
  return tex;
}

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

export function Parquet() {
  const { geo, mat } = useMemo(() => {
    const parquetDiagZ = DiagWall.A.z + (INT_X_DOOR_S - DiagWall.A.x) * DiagWall.slope;
    const WALL_SE_W = DOOR_END;
    const WALL_SOUTH_FACE = CORRIDOR_NORTH_WALL;

    const shape = new THREE.Shape([
      new THREE.Vector2(INT_X_WEST,      -INT_Z_NORTH),
      new THREE.Vector2(INT_X_WEST,      -INT_Z_NICHE_S),
      new THREE.Vector2(INT_X_NICHE,     -INT_Z_NICHE_S),
      new THREE.Vector2(INT_X_NICHE,     -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_WEST,      -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_KITCHEN_L, -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_KITCHEN_L, -INT_Z_KITCHEN_B),
      new THREE.Vector2(INT_X_KITCHEN_R, -INT_Z_KITCHEN_B),
      new THREE.Vector2(INT_X_KITCHEN_R, -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_DOOR_S,    -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_DOOR_S,    -parquetDiagZ),
      new THREE.Vector2(INT_X_EAST,      -DiagWall.A.z),
      new THREE.Vector2(INT_X_EAST,      -WALL_SOUTH_FACE),
      new THREE.Vector2(WALL_SE_W,       -WALL_SOUTH_FACE),
      new THREE.Vector2(WALL_SE_W,       -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_EAST,      -INT_Z_ROOM_S),
      new THREE.Vector2(INT_X_EAST,      -INT_Z_NORTH),
    ]);
    const g = new THREE.ShapeGeometry(shape);
    const tex = makeParquetTex();
    const m = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.55,
      metalness: 0.04,
      envMapIntensity: 0.6,
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

export function Tile() {
  const CLOSET_W_REAL = DOOR_START - (KITCHEN_EAST_WALL + PARTITION_THICKNESS);
  const CLOSET_D_REAL = KITCHEN_SOUTH_WALL - (CORRIDOR_NORTH_WALL);
  const CLOSET_X_REAL = ((KITCHEN_EAST_WALL + PARTITION_THICKNESS) + DOOR_START) / 2;
  const CLOSET_Z_REAL = ((CORRIDOR_NORTH_WALL) + KITCHEN_SOUTH_WALL) / 2;

  const { bathGeo, bathMat, closetMat } = useMemo(() => {
    const baseTex = makeTileTex();

    const Ax = INT_X_NICHE,  Az = INT_Z_BATH_N;
    const Bx = INT_X_NICHE,  Bz = DiagWall.A.z + (INT_X_NICHE - DiagWall.A.x) * DiagWall.slope;
    const Cx = INT_X_DOOR_S, Cz = DiagWall.A.z + (INT_X_DOOR_S - DiagWall.A.x) * DiagWall.slope;
    const Dx = INT_X_DOOR_S, Dz = INT_Z_BATH_N;

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

    const tBath = baseTex.clone();
    tBath.wrapS = tBath.wrapT = THREE.RepeatWrapping;
    tBath.repeat.set(1, 1);
    tBath.needsUpdate = true;
    const mBath = new THREE.MeshStandardMaterial({
      map: tBath, roughness: 0.25, metalness: 0.05,
    });

    const brownCanvas = document.createElement('canvas');
    brownCanvas.width = 128; brownCanvas.height = 128;
    const ctx = brownCanvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#7a5030'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, 128, 3); ctx.fillRect(0, 125, 128, 3);
    ctx.fillRect(0, 0, 3, 128); ctx.fillRect(125, 0, 3, 128);
    const brownTex = new THREE.CanvasTexture(brownCanvas);
    brownTex.wrapS = brownTex.wrapT = THREE.RepeatWrapping;

    const tB = brownTex.clone();
    tB.repeat.set(CLOSET_W_REAL / 20, CLOSET_D_REAL / 20);
    tB.needsUpdate = true;
    const mB = new THREE.MeshStandardMaterial({
      map: tB, roughness: 0.25, metalness: 0.05,
    });

    return { bathGeo: g, bathMat: mBath, closetMat: mB };
  }, [CLOSET_W_REAL, CLOSET_D_REAL]);

  return (
    <>
      <mesh geometry={bathGeo} material={bathMat} receiveShadow userData={{ brickType: 'floor' }} />
      <mesh
        ref={(m) => { if (m) m.material = closetMat; }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[CLOSET_X_REAL, 0, CLOSET_Z_REAL]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      >
        <planeGeometry args={[CLOSET_W_REAL, CLOSET_D_REAL]} />
      </mesh>
    </>
  );
}

const SKIRTING_H = 6;
const SKIRTING_D = 1;
const SKIRTING_Y = SKIRTING_H / 2;

function BaseboardX({ x1, x2, z, dir }: { x1: number; x2: number; z: number; dir: '+Z' | '-Z' }) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const len = maxX - minX;
  if (len <= 0) return null;
  const cx = (minX + maxX) / 2;
  const czBox = dir === '+Z' ? z + SKIRTING_D / 2 : z - SKIRTING_D / 2;
  const czQr  = dir === '+Z' ? z + SKIRTING_D     : z - SKIRTING_D;
  return (
    <>
      <P w={len} h={SKIRTING_H} d={SKIRTING_D} x={cx} y={SKIRTING_Y} z={czBox} mat={skirtingMat} />
      <QR cx={cx} cz={czQr} len={len} dir={dir} mat={skirtingMat} />
    </>
  );
}

function BaseboardZ({ z1, z2, x, dir }: { z1: number; z2: number; x: number; dir: '+X' | '-X' }) {
  const minZ = Math.min(z1, z2);
  const maxZ = Math.max(z1, z2);
  const len = maxZ - minZ;
  if (len <= 0) return null;
  const cz = (minZ + maxZ) / 2;
  const cxBox = dir === '+X' ? x + SKIRTING_D / 2 : x - SKIRTING_D / 2;
  const cxQr  = dir === '+X' ? x + SKIRTING_D     : x - SKIRTING_D;
  return (
    <>
      <P w={SKIRTING_D} h={SKIRTING_H} d={len} x={cxBox} y={SKIRTING_Y} z={cz} mat={skirtingMat} />
      <QR cx={cxQr} cz={cz} len={len} dir={dir} mat={skirtingMat} />
    </>
  );
}

function DiagBaseboard({ startD, endD }: { startD: number; endD: number }) {
  const len = endD - startD;
  if (len <= 0) return null;
  const mid = (startD + endD) / 2;
  const pBox = DiagWall.p(mid, -SKIRTING_D / 2);
  const pQr  = DiagWall.p(mid, -SKIRTING_D);
  return (
    <>
      <mesh position={[pBox.x, SKIRTING_Y, pBox.z]} rotation-y={DiagWall.rotY} castShadow receiveShadow material={skirtingMat}>
        <boxGeometry args={[SKIRTING_D, SKIRTING_H, len]} />
      </mesh>
      <mesh position={[pQr.x, SKIRTING_Y, pQr.z]} rotation-y={DiagWall.rotY} castShadow receiveShadow material={skirtingMat} scale={[1, 1, len]} geometry={qrGeo} />
    </>
  );
}

export function Baseboards() {
  const DOOR_CLEARANCE = 1.5;
  const CW_ENTRY = 5.5;

  const parquetDiagZ = DiagWall.A.z + (INT_X_DOOR_S - DiagWall.A.x) * DiagWall.slope;
  const diagParquetLen = Math.hypot(INT_X_EAST - INT_X_DOOR_S, DiagWall.A.z - parquetDiagZ);

  const corridorZEnd = DiagWall.A.z + (CORRIDOR_WEST_WALL - DiagWall.A.x) * DiagWall.slope;
  const diagCorridorTotalLen = Math.hypot(DiagWall.A.x - CORRIDOR_WEST_WALL, DiagWall.A.z - corridorZEnd);

  // Placard couloir
  const CL_N = CORRIDOR_NORTH_WALL;
  const CL_S = INT_Z_KITCHEN_B;
  const CL_W = INT_X_KITCHEN_R + PARTITION_THICKNESS;
  const CL_E = CORRIDOR_WEST_WALL;

  return (
    <group name="skirting-baseboards" userData={{ brickType: 'skirting' }}>
      {/* ── Séjour — Périphérie ────────────────────────────────────────────────── */}
      <BaseboardX x1={INT_X_WEST} x2={INT_X_EAST} z={INT_Z_NORTH} dir="+Z" />
      <BaseboardZ z1={INT_Z_NORTH} z2={INT_Z_ROOM_S} x={INT_X_EAST} dir="-X" />
      <BaseboardX x1={DOOR_END + DOOR_CLEARANCE} x2={INT_X_EAST} z={INT_Z_ROOM_S} dir="-Z" />
      <BaseboardX x1={INT_X_KITCHEN_R} x2={DOOR_START - DOOR_CLEARANCE} z={INT_Z_ROOM_S} dir="-Z" />
      <BaseboardX x1={INT_X_NICHE} x2={INT_X_KITCHEN_L} z={INT_Z_ROOM_S} dir="-Z" />
      <BaseboardZ z1={INT_Z_NICHE_S} z2={INT_Z_ROOM_S} x={INT_X_NICHE} dir="+X" />
      <BaseboardX x1={INT_X_NICHE} x2={INT_X_WEST} z={INT_Z_NICHE_S} dir="+Z" />
      <BaseboardZ z1={INT_Z_NORTH} z2={INT_Z_NICHE_S} x={INT_X_WEST} dir="+X" />

      {/* ── Cuisine ────────────────────────────────────────────────────────────── */}
      <BaseboardZ z1={INT_Z_ROOM_S} z2={INT_Z_KITCHEN_B} x={INT_X_KITCHEN_R} dir="-X" />
      <BaseboardX x1={INT_X_KITCHEN_L} x2={INT_X_KITCHEN_R} z={INT_Z_KITCHEN_B} dir="-Z" />
      <BaseboardZ z1={INT_Z_ROOM_S} z2={INT_Z_KITCHEN_B} x={INT_X_KITCHEN_L} dir="+X" />

      {/* ── Couloir ────────────────────────────────────────────────────────────── */}
      <BaseboardZ z1={CORRIDOR_NORTH_WALL} z2={DiagWall.A.z} x={INT_X_EAST} dir="-X" />
      <BaseboardX x1={DOOR_END + DOOR_CLEARANCE} x2={INT_X_EAST} z={CORRIDOR_NORTH_WALL} dir="+Z" />
      <BaseboardZ z1={CL_S} z2={DOOR_BATH_START - DOOR_CLEARANCE} x={CORRIDOR_WEST_WALL} dir="+X" />
      <BaseboardZ z1={DOOR_BATH_END + DOOR_CLEARANCE} z2={parquetDiagZ} x={CORRIDOR_WEST_WALL} dir="+X" />

      {/* ── Placard couloir ────────────────────────────────────────────────────── */}
      <BaseboardX x1={CL_W} x2={CL_E + SKIRTING_D} z={CL_N} dir="+Z" />
      <BaseboardX x1={CL_W} x2={CL_E} z={CL_S} dir="-Z" />
      <BaseboardZ z1={CL_N} z2={CL_S} x={CL_W} dir="+X" />

      {/* ── Mur diagonal ───────────────────────────────────────────────────────── */}
      <DiagBaseboard startD={0} endD={Math.max(0, DiagWall.door.start - CW_ENTRY)} />
      <DiagBaseboard startD={DiagWall.door.end + CW_ENTRY} endD={diagParquetLen} />
      <DiagBaseboard startD={diagParquetLen} endD={diagCorridorTotalLen} />
    </group>
  );
}

export function BathSkirting() {
  const SH_T = 10;
  const SD_T = 1;
  const y = SH_T / 2;

  const tileMat = useMemo(() => {
    const tex = makeTileTex();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.5, 1);
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.25, metalness: 0.05,
    });
  }, []);

  const BATH_E_FACE  = BATH_EAST_WALL;
  const BATH_S_FACE  = BATH_SOUTH_WALL;
  const SHOWER_E_X   = pX('shower-ne');

  const Bz = DiagWall.A.z + (INT_X_NICHE  - DiagWall.A.x) * DiagWall.slope;
  const corridorXEnd = BATH_E_FACE;
  const Cz = DiagWall.A.z + (corridorXEnd - DiagWall.A.x) * DiagWall.slope;

  const CORR_DOOR_S = DOOR_BATH_START;
  const CORR_DOOR_E = DOOR_BATH_END;

  const showerWallZCenter1 = KITCHEN_SOUTH_WALL + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2;
  const showerWallZCenter2 = showerWallZCenter1 + 70;
  const showerWallZ1 = showerWallZCenter1 + PARTITION_THICKNESS / 2;
  const showerWallZ2 = showerWallZCenter2 - PARTITION_THICKNESS / 2;

  const dC = Math.sqrt((corridorXEnd - DiagWall.A.x) ** 2 + (Cz - DiagWall.A.z) ** 2);
  const dB = Math.sqrt((INT_X_NICHE  - DiagWall.A.x) ** 2 + (Bz - DiagWall.A.z) ** 2);
  const dm = (dC + dB) / 2;
  const { x: diagX, z: diagZ } = DiagWall.p(dm, SD_T / 2);
  const diagLen = dB - dC;

  return (
    <group name="skirting-bath" userData={{ brickType: 'skirting' }}>
      <P w={INT_X_DOOR_S - INT_X_NICHE} h={SH_T} d={SD_T}
         x={(INT_X_NICHE + INT_X_DOOR_S) / 2} y={y} z={INT_Z_BATH_N + SD_T / 2}
         mat={tileMat} />

      <P w={SD_T} h={SH_T} d={Bz - INT_Z_BATH_N}
         x={INT_X_NICHE + SD_T / 2} y={y} z={(INT_Z_BATH_N + Bz) / 2}
         mat={tileMat} />

      <P w={SD_T} h={SH_T} d={(CORR_DOOR_S - 1.5) - INT_Z_BATH_N}
         x={BATH_E_FACE - SD_T / 2} y={y} z={(INT_Z_BATH_N + (CORR_DOOR_S - 1.5)) / 2}
         mat={tileMat} />
      <P w={SD_T} h={SH_T} d={BATH_S_FACE - (CORR_DOOR_E + 1.5)}
         x={BATH_E_FACE - SD_T / 2} y={y} z={((CORR_DOOR_E + 1.5) + BATH_S_FACE) / 2}
         mat={tileMat} />

      <P w={PARTITION_THICKNESS} h={SH_T} d={SD_T}
         x={65} y={y} z={showerWallZCenter1 - PARTITION_THICKNESS / 2 - SD_T / 2}
         mat={tileMat} />

      <P w={SD_T} h={SH_T} d={PARTITION_THICKNESS}
         x={65 + PARTITION_THICKNESS / 2 + SD_T / 2} y={y} z={showerWallZCenter1}
         mat={tileMat} />

      <P w={SD_T} h={SH_T} d={showerWallZ2 - showerWallZ1}
         x={SHOWER_E_X + SD_T / 2} y={y} z={(showerWallZ1 + showerWallZ2) / 2}
         mat={tileMat} />

      <mesh position={[diagX, y, diagZ]} rotation-y={DiagWall.rotY}
            ref={(m) => { if (m) m.material = tileMat as any; }}
            castShadow receiveShadow>
        <boxGeometry args={[SD_T, SH_T, diagLen]} />
      </mesh>
    </group>
  );
}

export function RedPVCCorridor() {
  const WIDTH = 120;
  const TOTAL_LENGTH = 1200;
  const dCenter = DiagWall.len / 2;
  const center = DiagWall.p(dCenter, DiagWall.depth / 2 + WIDTH / 2);

  const mat = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#b32d2d';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(TOTAL_LENGTH / 100, WIDTH / 100);
    return new THREE.MeshStandardMaterial({
      map: t,
      roughness: 0.6,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  }, []);

  const yellowCeilMats = useMemo(() => {
    const yellowCeilMat = new THREE.MeshStandardMaterial({
      color: '#e5c93d',
      roughness: 0.8,
    });
    // BoxFace order: ['+x', '-x', '+y', '-y', '+z', '-z']
    // Face +Y masquée (noCapMat) pour éviter tout z-fighting sous le revêtement PVC
    return boxFaceMats({ '+y': noCapMat }, yellowCeilMat);
  }, []);

  return (
    <group position={[center.x, 0, center.z]} rotation-y={DiagWall.rotY + Math.PI / 2}>
      <mesh position={[0, -0.1, 0]} renderOrder={1} receiveShadow userData={{ brickType: 'floor' }} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[TOTAL_LENGTH, WIDTH]} />
        <primitive object={mat} attach="material" />
      </mesh>

      <mesh position={[0, -8.5, 0]} material={yellowCeilMats} castShadow receiveShadow userData={{ brickType: 'floor' }}>
        <boxGeometry args={[TOTAL_LENGTH, 10, WIDTH]} />
      </mesh>
    </group>
  );
}

export function Floor() {
  const bermudaGrass = useSceneStore(state => state.layers.bermudaGrass);
  const groundType = useSceneStore(state => state.layers.groundType);

  const slabShape = useMemo(() => new THREE.Shape([
    new THREE.Vector2(-20, 30),
    new THREE.Vector2(316, 30),
    new THREE.Vector2(316, 230),
    new THREE.Vector2(326, 230),
    new THREE.Vector2(326, 220),
    new THREE.Vector2(326, -547.77),
    new THREE.Vector2(-20, -747.53),
  ]), []);

  const slabTopGeo = useMemo(() => {
    const g = new THREE.ShapeGeometry(slabShape);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [slabShape]);

  const slabSideGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(slabShape, { depth: 10, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -10, 0);
    return g;
  }, [slabShape]);

  const SlabUnit = ({ x, z }: { x: number; z: number }) => (
    <group position={[x, -3.5, z]}>
      <mesh
        geometry={slabTopGeo}
        material={slabConcreteTop}
        receiveShadow
        userData={{ brickType: 'floor' }}
      />
      <mesh
        geometry={slabSideGeo}
        material={[noCapMat, slabConcreteSide]}
        receiveShadow
        userData={{ brickType: 'floor' }}
      />
    </group>
  );

  const ceilShape = useMemo(() => new THREE.Shape([
    new THREE.Vector2(-20, 30),
    new THREE.Vector2(316, 30),
    new THREE.Vector2(316, 230),
    new THREE.Vector2(326, 230),
    new THREE.Vector2(326, 220),
    new THREE.Vector2(326, -547.77),
    new THREE.Vector2(-20, -747.53),
  ]), []);

  const ceilBottomGeo = useMemo(() => {
    const geo = new THREE.ShapeGeometry(ceilShape);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [ceilShape]);

  return (
    <>
      <CategoryLayerGroup layer={LAYER_FLOOR_COVERINGS}>
        <group name="parquet-group" userData={{ itemName: 'Sol Parquet' }}>
          <Parquet />
        </group>

        <group name="tile-group" userData={{ itemName: 'Carrelage Sol' }}>
          <Tile />
        </group>

        <group name="pvc-corridor-group" userData={{ itemName: 'Couloir PVC' }}>
          <RedPVCCorridor />
        </group>

        <group name="skirting-group" userData={{ animUnit: true, brickType: 'skirting', itemName: 'Plinthes' }}>
          <MergedStaticGroup name="merged-skirting">
            <Baseboards />
            <BathSkirting />
          </MergedStaticGroup>
        </group>
      </CategoryLayerGroup>

      <CategoryLayerGroup layer={LAYER_STRUCTURE}>
        <group name="slab-group" userData={{ itemName: 'Dalle Béton' }}>
          <MergedStaticGroup name="merged-slab">
            <SlabUnit x={0} z={0} />
            <SlabUnit x={ 346} z={-199.76} />
            <SlabUnit x={-346} z={ 199.76} />
          </MergedStaticGroup>
        </group>

        <group name="ceiling-group" userData={{ itemName: 'Plafonds' }}>
          <MergedStaticGroup name="merged-ceiling">
            <group position={[0, WALL_H - 1, 0]}>
              <mesh
                geometry={ceilBottomGeo}
                material={ceilBottomBack}
                receiveShadow
                userData={{ brickType: 'ceiling' }}
              />
            </group>

            <mesh
              ref={(m) => { if (m) m.material = ceilMats as any; }}
              position={[300 - 235 / 2 + 16, WALL_H - 1 + CEIL_THICK / 2, BLDG_Z_MIN - 75]}
              receiveShadow
              userData={{ brickType: 'ceiling' }}
            >
              <boxGeometry args={[235, CEIL_THICK, 150]} />
            </mesh>
          </MergedStaticGroup>
        </group>
      </CategoryLayerGroup>

      <BermudaGround active={bermudaGrass} groundType={groundType} />
    </>
  );
}
