/**
 * DronaBoxes.tsx — boîtes DRONA IKEA (rouge) dans les Kallax.
 * Port de js/furniture/drona.js + placement depuis js/furniture/kallax.js.
 *
 * Seuls les Kallax avec fillAll() / fillRows() sont remplis :
 *   NE : neB(2×1 fillAll) + neT(2×2 fillAll)
 *   SE : 2 × Kallax(2×1 fillAll, pivotés)
 *   NW : nwB(2×1) + nwM(1×1) + nwT(1×1) (tous pivotés)
 *   SW : k1(2×2 fillAll)
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDronaGeo } from './items/Drona';

// @ts-ignore
import { ROOM_W, ROOM_D, NICHE_DEPTH, KALLAX_DEPTH, KITCHEN_Z, KITCHEN_X0, KITCHEN_X1, DOOR_START } from '@config';

// Kallax geometry constants
const THICK_FRAME = 3.5;
const THICK_INNER = 1.5;
const NICHE_H = 34;
const NICHE_W = 33.5;

function kallaxW(cols: number) { return cols * NICHE_W + 2 * THICK_FRAME + (cols - 1) * THICK_INNER; }
function kallaxH(rows: number) { return rows * NICHE_H + 2 * THICK_FRAME + (rows - 1) * THICK_INNER; }

/** Positions locales des dronas dans un Kallax(cols, rows). */
function cellPositions(cols: number, rows: number): Array<[number, number, number]> {
  const totalW = kallaxW(cols);
  const totalH = kallaxH(rows);
  const pos: Array<[number, number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -(totalW / 2) + THICK_FRAME + NICHE_W / 2 + c * (NICHE_W + THICK_INNER);
      const y = totalH / 2 - THICK_FRAME - NICHE_H / 2 - r * (NICHE_H + THICK_INNER);
      pos.push([x, y, 0]);
    }
  }
  return pos;
}

const redMatFront = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.FrontSide });
const redMatBack  = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.9, side: THREE.BackSide });
const DEPTH = KALLAX_DEPTH; // 39

// ── Groupe NE : gStack(280.5, 0, 37.75) rotY=π/2 ────────────────────────────
const w1 = kallaxW(1); // 40.5
const w2 = kallaxW(2); // 75.5
const h1 = kallaxH(1); // 41
const h2 = kallaxH(2); // 76.5

// Pre-compute all 18 world matrices
function buildMatrices(): THREE.Matrix4[] {
  const mats: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();

  function addDronas(
    stackPos: [number, number, number],
    stackRotY: number,
    kallaxLocalPos: [number, number, number],
    kallaxRotZ: number,
    cells: Array<[number, number, number]>,
  ) {
    const stackM = new THREE.Matrix4()
      .makeRotationY(stackRotY)
      .setPosition(...stackPos);
    const stackG = new THREE.Group();
    stackG.position.set(...stackPos);
    stackG.rotation.y = stackRotY;
    stackG.updateMatrixWorld(true);

    const kallaxG = new THREE.Group();
    kallaxG.position.set(...kallaxLocalPos);
    kallaxG.rotation.z = kallaxRotZ;
    stackG.add(kallaxG);
    stackG.updateMatrixWorld(true);

    for (const [cx, cy, cz] of cells) {
      const dronaG = new THREE.Object3D();
      dronaG.position.set(cx, cy, cz);
      dronaG.rotation.y = Math.PI;
      if (Math.abs(kallaxRotZ) > 0.1) dronaG.rotation.z = kallaxRotZ;
      kallaxG.add(dronaG);
    }
    stackG.updateMatrixWorld(true);

    for (const [cx, cy, cz] of cells) {
      // Find matching child
      const dronaG = new THREE.Object3D();
      dronaG.position.set(cx, cy, cz);
      dronaG.rotation.y = Math.PI;
      if (Math.abs(kallaxRotZ) > 0.1) dronaG.rotation.z = kallaxRotZ;
      kallaxG.add(dronaG);
      kallaxG.updateMatrixWorld(true);
      dronaG.updateMatrixWorld(true);
      mats.push(dronaG.matrixWorld.clone());
    }
  }

  // NE: gStack at (280.5, 0, w2/2=37.75) rotY=π/2
  addDronas([ROOM_W - DEPTH / 2, 0, w2 / 2], Math.PI / 2,
    [0, h1 / 2, 0], 0, cellPositions(2, 1));
  addDronas([ROOM_W - DEPTH / 2, 0, w2 / 2], Math.PI / 2,
    [0, h1 + h2 / 2, 0], 0, cellPositions(2, 2));

  // SE: gStack at (280.5, 0, 319.75) rotY=π/2, two Kallax(2,1) pivotés
  {
    let ySE = 0;
    for (let i = 0; i < 2; i++) {
      addDronas([ROOM_W - DEPTH / 2, 0, ROOM_D - 60 - w1 / 2], Math.PI / 2,
        [0, ySE + w2 / 2, 0], Math.PI / 2, cellPositions(2, 1));
      ySE += w2;
    }
  }

  // NW: gStack at (DEPTH/2=19.5, 0, w1/2=20.25) rotY=-π/2
  addDronas([DEPTH / 2, 0, w1 / 2], -Math.PI / 2,
    [0, w2 / 2, 0], Math.PI / 2, cellPositions(2, 1));
  addDronas([DEPTH / 2, 0, w1 / 2], -Math.PI / 2,
    [0, w2 + w1 / 2, 0], Math.PI / 2, cellPositions(1, 1));
  addDronas([DEPTH / 2, 0, w1 / 2], -Math.PI / 2,
    [0, w2 + w1 + w1 / 2, 0], Math.PI / 2, cellPositions(1, 1));

  // SW: gStack at (-NICHE_DEPTH+DEPTH/2=-19.5, 0, ROOM_D-w2/2=362.25) rotY=-π/2
  addDronas([-NICHE_DEPTH + DEPTH / 2, 0, ROOM_D - w2 / 2], -Math.PI / 2,
    [0, h2 / 2, 0], 0, cellPositions(2, 2));

  // ── Dronas standalone (hors cases Kallax) ────────────────────────────────────
  // Port de addSingleDrona() dans js/decor/decor.js.
  // Toutes en coordonnées monde (les groupes parents ont position=(0,0,0)).

  function addSingle(cx: number, cy: number, cz: number, rotY = 0) {
    dummy.position.set(cx, cy + 0.2, cz);
    dummy.rotation.set(0, rotY, 0);
    dummy.updateMatrix();
    mats.push(dummy.matrix.clone());
  }

  const DF = 33;

  // 2 sur Mackapär (mackaparGroup.position=(0,0,0) → world = local)
  const mpCX = -NICHE_DEPTH + 3.5 + 77 / 2; // 32
  const mpCZ = ROOM_D - w2 - 16;             // 308.5
  addSingle(mpCX - 20, 200 + DF / 2, mpCZ + 0.5, Math.PI / 2);
  addSingle(mpCX + 20, 200 + DF / 2, mpCZ + 0.5, Math.PI / 2);

  // 1 sur Kallax NE dessus — world calculé depuis kallaxNEGroup (pos=(280.5,0,37.75), rotY=π/2)
  // local: (-18.75, k1TopY+DF/2, 0.5, -π/2) → world: (280, 134, 19, 0)
  // +0.5 sur Z : face avant (profondeur le long de Z, rotY=0) à Z=0 = mur C → gap
  addSingle(ROOM_W - DEPTH / 2 - 0.5, h1 + h2 + DF / 2, w2 / 2 - 18.75 + 0.5, 0);

  // 2 sur Kallax SW dessus — kallaxSWGroup (pos=(9.5,0,362.25), rotY=-π/2)
  // local: (±18, k4TopY+DF/2, 0, π) → world: (9.5, 210.5, 344.25/380.25, π/2)
  const k4TopY = h2 * 2 + h1;
  addSingle(-NICHE_DEPTH + DEPTH / 2, k4TopY + DF / 2, ROOM_D - w2 / 2 - 18, Math.PI / 2);
  addSingle(-NICHE_DEPTH + DEPTH / 2, k4TopY + DF / 2, ROOM_D - w2 / 2 + 18, Math.PI / 2);

  // 1 sur meuble SDB côté vasque (east cabinet top)
  addSingle(DOOR_START - 28, 60 + DF / 2, KITCHEN_Z + 30);
  // 1 sur meuble SDB ouest
  addSingle(-NICHE_DEPTH + 20, 60 + DF / 2, KITCHEN_Z + 30);

  // 3 sur meuble haut cuisine (kitchenGroup.position=(0,0,0))
  const KIT_W = KITCHEN_X1 - KITCHEN_X0; // 100
  const gap   = (KIT_W - 3 * DF) / 4;   // 0.25
  const hcCZ  = KITCHEN_Z - 38 / 2 - 0.5; // 440.5 — gap avec mur cuisine (Z=KITCHEN_Z)
  for (let i = 0; i < 3; i++) {
    addSingle(KITCHEN_X0 + gap + DF / 2 + i * (DF + gap), 195 + DF / 2, hcCZ, Math.PI);
  }

  // 1 sur congélateur CHIQ
  addSingle(24.5, 50 + DF / 2, 269.5, Math.PI);

  return mats;
}

// ── Label canvas (sprite circulaire blanc + numéro rouge) ─────────────────────

function makeDronaLabel(n: number): THREE.Sprite {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(136,0,0,0.6)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#880000';
  ctx.font = `bold ${n > 9 ? 54 : 66}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), S / 2, S / 2 + 3);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas), depthTest: false,
  }));
  sp.renderOrder = 10;
  sp.scale.set(13, 13, 1);
  return sp;
}

export function DronaLabels() {
  const matrices = useMemo(() => buildMatrices(), []);
  const group = useMemo(() => {
    const g = new THREE.Group();
    matrices.forEach((m, i) => {
      const sp = makeDronaLabel(i + 1);
      sp.position.setFromMatrixPosition(m);
      g.add(sp);
    });
    return g;
  }, [matrices]);
  return <primitive object={group} />;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function DronaBoxes() {
  const geo = useDronaGeo();

  const iFrontRef = useRef<THREE.InstancedMesh>(null);
  const iBackRef  = useRef<THREE.InstancedMesh>(null);

  const matrices = useMemo(() => buildMatrices(), []);

  // Set instance matrices once after mount
  useMemo(() => {
    // Will be set via ref callback
  }, [matrices]);

  const applyMatrices = (self: THREE.InstancedMesh) => {
    matrices.forEach((m, i) => self.setMatrixAt(i, m));
    self.instanceMatrix.needsUpdate = true;
  };

  return (
    <>
      <instancedMesh ref={iFrontRef} args={[geo, redMatFront, matrices.length]}
        castShadow receiveShadow onUpdate={applyMatrices} />
      <instancedMesh ref={iBackRef}  args={[geo, redMatBack,  matrices.length]}
        onUpdate={applyMatrices} />
    </>
  );
}

