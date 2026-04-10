/**
 * Sol, plafond et dalles — port fidèle de js/structure/floor.js.
 *
 * Les textures procédurales (parquet, carrelage, herbe) sont générées
 * via document.createElement('canvas') dans des useMemo, identiques
 * à la version JS.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// @ts-ignore
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, SDB_Z_END, DIAG_AZ, DIAG_CX, DIAG_CZ,
  DOOR_START,
  FLOOR_Y,
  BLDG_X_MIN, BLDG_X_MAX, BLDG_Z_MIN, BLDG_Z_MAX,
  COLORS,
} from '@config';

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
      <mesh geometry={sdbGeo} material={sdbMat} receiveShadow />
      <mesh
        ref={(m) => { if (m) m.material = closetMat; }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[KITCHEN_X1 + CLOSET_W / 2, 0, ROOM_D + CLOSET_D / 2]}
        receiveShadow
      >
        <planeGeometry args={[CLOSET_W, CLOSET_D]} />
      </mesh>
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export function Floor() {
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
      >
        <boxGeometry args={[BLDG_W, 10, BLDG_D]} />
      </mesh>

      {/* Dalle jardin herbe */}
      <mesh
        ref={(m) => { if (m) m.material = gardenMats as any; }}
        position={[BLDG_CX, slabY, (BLDG_Z_MIN + -400) / 2]}
        receiveShadow
      >
        <boxGeometry args={[BLDG_W, 10, gardenD]} />
      </mesh>

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

      {/* Sol extérieur */}
      <mesh
        ref={(m) => { if (m) m.material = new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 }); }}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -10, 0]}
        receiveShadow
        userData={{ brickType: 'ground' }}
      >
        <planeGeometry args={[2000, 2000]} />
      </mesh>
    </>
  );
}
