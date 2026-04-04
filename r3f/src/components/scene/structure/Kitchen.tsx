/**
 * Cuisine — port fidèle de js/structure/kitchen.js.
 *
 * Contenu : plan de travail avec trou évier, évier BOHOLMEN inox,
 * meuble haut ouvert, plaques à induction.
 * Le meuble évier et le frigo sont des items séparés (items/KitchenCabinet,
 * items/Fridge) placés par Furniture.tsx.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// @ts-ignore
import { KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, ROOM_D } from '@config';

// ── Constantes ────────────────────────────────────────────────────────────────

const COUNTER_H    = 90;
const COUNTER_SLAB = 3;
const KIT_W        = KITCHEN_X1 - KITCHEN_X0;   // 100
const KIT_D        = KITCHEN_DEPTH;              // 60
const CABINET_W    = 40;
const FRIDGE_W     = 60;

const SINK_CX  = KITCHEN_X0 + CABINET_W / 2;      // 50
const SINK_CZ  = ROOM_D + KIT_D / 2;              // 430
const SINK_Y   = COUNTER_H + COUNTER_SLAB;        // 93

const STOVE_CX = KITCHEN_X0 + CABINET_W + FRIDGE_W / 2; // 100
const STOVE_CZ = ROOM_D + KIT_D / 2;                    // 430

// ── Matériaux (module-level) ──────────────────────────────────────────────────

const counterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 });
const inoxMat    = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.75, roughness: 0.12 });
const faucetMat  = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.1 });
const hcMat      = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35 });
const glassMat   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.08, metalness: 0.3 });
const zoneMat    = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.05, metalness: 0.2 });
const ringMat    = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.1,  metalness: 0.1 });
const controlMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3,  metalness: 0.1 });

// ── Plan de travail avec trou évier ──────────────────────────────────────────

function Counter() {
  const geo = useMemo(() => {
    const cW  = KIT_W + 2;  // 102
    const cD  = KIT_D  + 2; // 62
    const cx0 = KITCHEN_X0 + KIT_W / 2 - cW / 2; // 29
    const cz0 = ROOM_D + KIT_D / 2 - cD / 2;      // 399

    const holeW = 28, holeD = 44.6;
    const hX = SINK_CX - cx0 - holeW / 2;
    const hZ = SINK_CZ - cz0 - holeD / 2;

    const shape = new THREE.Shape();
    shape.moveTo(0,  0 ); shape.lineTo(cW, 0);
    shape.lineTo(cW, cD); shape.lineTo(0,  cD);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(hX,        hZ);
    hole.lineTo(hX + holeW, hZ);
    hole.lineTo(hX + holeW, hZ + holeD);
    hole.lineTo(hX,         hZ + holeD);
    hole.closePath();
    shape.holes.push(hole);

    const g = new THREE.ExtrudeGeometry(shape, { depth: COUNTER_SLAB, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    // Translate so counter sits at y=COUNTER_H, spans Z from ROOM_D-1 to KITCHEN_Z+1
    g.translate(cx0, COUNTER_H, cz0 + cD);
    return g;
  }, []);

  return <mesh geometry={geo} material={counterMat} castShadow receiveShadow />;
}

// ── Évier BOHOLMEN (inox) ─────────────────────────────────────────────────────

function Sink() {
  const sinkW  = 30, sinkD  = 47;
  const holeW  = 28, holeD  = 44.6;
  const basinW = 23, basinD = 40;
  const sinkDepth = 15;
  const rimT   = 1.2;
  const rimZW  = (sinkD - holeD) / 2;
  const rimXW  = (sinkW - holeW) / 2;
  const wallT  = (holeW - basinW) / 2;

  return (
    <group>
      {/* Rebord extérieur (4 côtés) */}
      {([
        [sinkW, rimZW, SINK_CX,              SINK_CZ - holeD / 2 - rimZW / 2],
        [sinkW, rimZW, SINK_CX,              SINK_CZ + holeD / 2 + rimZW / 2],
        [rimXW, holeD, SINK_CX - holeW / 2 - rimXW / 2, SINK_CZ],
        [rimXW, holeD, SINK_CX + holeW / 2 + rimXW / 2, SINK_CZ],
      ] as [number, number, number, number][]).map(([w, d, cx, cz], i) => (
        <mesh key={i} position={[cx, SINK_Y + rimT / 2, cz]} material={inoxMat}>
          <boxGeometry args={[w, rimT, d]} />
        </mesh>
      ))}

      {/* Parois du bac (4 côtés) */}
      {([
        { sx: holeW, sz: wallT, px: 0,                     pz: -(basinD + wallT) / 2 },
        { sx: holeW, sz: wallT, px: 0,                     pz:  (basinD + wallT) / 2 },
        { sx: wallT, sz: holeD, px: -(basinW + wallT) / 2, pz: 0 },
        { sx: wallT, sz: holeD, px:  (basinW + wallT) / 2, pz: 0 },
      ]).map((s, i) => (
        <mesh key={i} position={[SINK_CX + s.px, SINK_Y - sinkDepth / 2, SINK_CZ + s.pz]} material={inoxMat}>
          <boxGeometry args={[s.sx, sinkDepth, s.sz]} />
        </mesh>
      ))}

      {/* Fond du bac */}
      <mesh position={[SINK_CX, SINK_Y - sinkDepth + 0.25, SINK_CZ]} material={inoxMat}>
        <boxGeometry args={[basinW, 0.5, basinD]} />
      </mesh>
      {/* Bonde */}
      <mesh position={[SINK_CX, SINK_Y - sinkDepth + 0.7, SINK_CZ]} rotation={[Math.PI / 2, 0, 0]} material={inoxMat}>
        <cylinderGeometry args={[2.5, 2.5, 0.8, 16]} />
      </mesh>

      {/* Robinet */}
      <mesh position={[SINK_CX, SINK_Y + 10, SINK_CZ + sinkD / 2 - 3]} rotation={[Math.PI / 2, 0, 0]} material={faucetMat}>
        <cylinderGeometry args={[1, 1, 20, 8]} />
      </mesh>
      <mesh position={[SINK_CX, SINK_Y + 19, SINK_CZ + sinkD / 2 - 9]} rotation={[Math.PI / 2, 0, 0]} material={faucetMat}>
        <cylinderGeometry args={[0.8, 0.8, 12, 8]} />
      </mesh>
    </group>
  );
}

// ── Meuble haut (ouvert, sans porte ni fond) ──────────────────────────────────

function UpperCabinet() {
  const HC_W = KIT_W;   // 100
  const HC_H = 40;
  const HC_D = 40;
  const P    = 1.5;     // épaisseur panneau
  const y0   = COUNTER_H + COUNTER_SLAB + 60; // 153
  const cx   = KITCHEN_X0 + KIT_W / 2;         // 80
  const cz   = ROOM_D + KITCHEN_DEPTH - HC_D / 2; // 440

  return (
    <group>
      {/* Dessus */}
      <mesh position={[cx, y0 + HC_H - P / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      {/* Dessous */}
      <mesh position={[cx, y0 + P / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      {/* Étagère milieu */}
      <mesh position={[cx, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      {/* Côté gauche */}
      <mesh position={[cx - HC_W / 2 + P / 2, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[P, HC_H, HC_D]} />
      </mesh>
      {/* Côté droit */}
      <mesh position={[cx + HC_W / 2 - P / 2, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[P, HC_H, HC_D]} />
      </mesh>
    </group>
  );
}

// ── Plaques à induction ───────────────────────────────────────────────────────

function Stove() {
  const plateY  = COUNTER_H + COUNTER_SLAB; // 93
  const baseW   = FRIDGE_W - 8;             // 52
  const baseD   = KIT_D - 12;               // 48

  return (
    <group>
      {/* Surface vitro-céramique */}
      <mesh position={[STOVE_CX, plateY + 0.5, STOVE_CZ]} castShadow material={glassMat}>
        <boxGeometry args={[baseW, 1, baseD]} />
      </mesh>

      {/* 2 zones de chauffe */}
      {([STOVE_CZ - 12, STOVE_CZ + 12] as const).map((cz, i) => (
        <group key={i}>
          <mesh position={[STOVE_CX, plateY + 1.1, cz]} material={zoneMat}>
            <cylinderGeometry args={[9, 9, 0.15, 40]} />
          </mesh>
          <mesh position={[STOVE_CX, plateY + 1.2, cz]} rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
            <ringGeometry args={[7.5, 9, 40]} />
          </mesh>
          <mesh position={[STOVE_CX, plateY + 1.2, cz]} material={ringMat}>
            <cylinderGeometry args={[1.5, 1.5, 0.05, 16]} />
          </mesh>
        </group>
      ))}

      {/* Bandeau de contrôle */}
      <mesh position={[STOVE_CX, plateY + 1.1, STOVE_CZ - baseD / 2 + 4]} material={glassMat}>
        <boxGeometry args={[baseW - 10, 0.5, 6]} />
      </mesh>
      {([0, 1, 2, 3] as const).map((i) => (
        <mesh key={i} position={[STOVE_CX - 10 + i * 7, plateY + 1.35, STOVE_CZ - baseD / 2 + 4]} material={controlMat}>
          <cylinderGeometry args={[0.6, 0.6, 0.3, 8]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Kitchen() {
  return (
    <>
      <Counter />
      <Sink />
      <UpperCabinet />
      <Stove />
    </>
  );
}
