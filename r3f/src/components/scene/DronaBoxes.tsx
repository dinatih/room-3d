/**
 * DronaBoxes.tsx — boîtes DRONA IKEA (rouge) standalone (hors cases Kallax).
 *
 * Les Drona à l'intérieur des tours Kallax sont gérés par leurs composants :
 *   KallaxNE.tsx (7), KallaxSE.tsx (4), KallaxNW.tsx (4), KallaxCuisine.tsx (6)
 *
 * Ce fichier contient uniquement les 8 boîtes autonomes :
 *   - 2 sur Mackapär, 2 sur meubles SDB, 3 sur meuble haut cuisine, 1 sur congélateur
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDronaGeo } from './items/Drona';

// @ts-ignore
import { ROOM_W, ROOM_D, NICHE_DEPTH, KALLAX_DEPTH, KITCHEN_Z, KITCHEN_X0, KITCHEN_X1, DOOR_START } from '@config';

// Kallax geometry constants
const NICHE_W = 33.5;
const THICK_FRAME = 3.5;
const THICK_INNER = 1.5;

function kallaxW(cols: number) { return cols * NICHE_W + 2 * THICK_FRAME + (cols - 1) * THICK_INNER; }

const redMatFront = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.FrontSide });
const redMatBack  = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.9, side: THREE.BackSide });
const DEPTH = KALLAX_DEPTH; // 39

const w2 = kallaxW(2); // 75.5 — utilisé pour mpCZ (Mackapär)

// Standalone Drona (hors cases Kallax — les Kallax stacks ont leurs propres Drona intégrés)
function buildMatrices(): THREE.Matrix4[] {
  const mats: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();

  function addSingle(cx: number, cy: number, cz: number, rotY = 0) {
    dummy.position.set(cx, cy + 0.2, cz);
    dummy.rotation.set(0, rotY, 0);
    dummy.updateMatrix();
    mats.push(dummy.matrix.clone());
  }

  const DF = 33;

  // 2 sur Mackapär
  const mpCX = -NICHE_DEPTH + 3.5 + 77 / 2; // 32
  const mpCZ = ROOM_D - w2 - 16;             // 308.5
  addSingle(mpCX - 20, 200 + DF / 2, mpCZ + 0.5, Math.PI / 2);
  addSingle(mpCX + 20, 200 + DF / 2, mpCZ + 0.5, Math.PI / 2);

  // NE/SE/NW/SW : Drona intégrés dans KallaxNE/SE/NW/Cuisine.tsx

  // 1 sur meuble SDB côté vasque (east cabinet top)
  addSingle(DOOR_START - 28, 60 + DF / 2, KITCHEN_Z + 30);
  // 1 sur meuble SDB ouest
  addSingle(-NICHE_DEPTH + 20, 60 + DF / 2, KITCHEN_Z + 30);

  // 3 sur meuble haut cuisine
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

// ── Label canvas ──────────────────────────────────────────────────────────────

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

