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
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// @ts-ignore
import { ROOM_W, ROOM_D, NICHE_DEPTH, KALLAX_DEPTH } from '@config';

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

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });
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

  return mats;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function DronaBoxes() {
  const { scene } = useGLTF('media/ikea_DRONA_black.glb');

  const iMeshRef = useRef<THREE.InstancedMesh>(null);

  const { geo } = useMemo(() => {
    let mergedGeo: THREE.BufferGeometry | null = null;
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh && !mergedGeo) {
        mergedGeo = (c as THREE.Mesh).geometry.clone();
      }
    });
    if (!mergedGeo) mergedGeo = new THREE.BoxGeometry(33.5, 33.5, 38);

    // Apply scale: 38/rawSize.z, centered
    const box = new THREE.Box3().setFromBufferAttribute(
      (mergedGeo as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute,
    );
    const rawSize = new THREE.Vector3();
    box.getSize(rawSize);
    const s = rawSize.z > 0.01 ? 38 / rawSize.z : 1;
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    const bake = new THREE.Matrix4()
      .makeTranslation(-cx * s, -cy * s, -cz * s)
      .multiply(new THREE.Matrix4().makeScale(s, s, s));
    mergedGeo.applyMatrix4(bake);

    return { geo: mergedGeo };
  }, [scene]);

  const matrices = useMemo(() => buildMatrices(), []);

  // Set instance matrices once after mount
  useMemo(() => {
    // Will be set via ref callback
  }, [matrices]);

  return (
    <instancedMesh
      ref={iMeshRef}
      args={[geo, redMat, matrices.length]}
      castShadow
      receiveShadow
      onUpdate={(self) => {
        matrices.forEach((m, i) => self.setMatrixAt(i, m));
        self.instanceMatrix.needsUpdate = true;
      }}
    />
  );
}

useGLTF.preload('media/ikea_DRONA_black.glb');
