/**
 * Furniture.tsx — Place tous les composants TSX existants à leurs coordonnées
 * monde exactes, fidèles aux positions de la scène vanilla Three.js.
 *
 * Conventions d'ancrage (axe Y) :
 *   - Kallax       : geometry spans [PY-H, PY]  → pose au sol : PY = H
 *   - Autres (Freezer, Fridge, KitchenCabinet, BathroomCabinet) :
 *                    corps centré en PY           → pose au sol : PY = H/2
 *
 * Sources :
 *   js/furniture/kallax.js  (positions exactes des 4 stacks)
 *   js/decor/decor.js       (congélateur)
 *   js/structure/kitchen.js (frigo, meuble évier)
 *   js/structure/bathroom.js (meubles SDB)
 */
import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Kallax } from './items/Kallax';
import { Freezer } from './items/Freezer';
import { Fridge } from './items/Fridge';
import { KitchenCabinet } from './items/KitchenCabinet';
import { BathroomCabinetWest, BathroomCabinetEast } from './items/BathroomCabinet';
import { Toilet } from './items/Toilet';
import { Shower } from './items/Shower';
import { VasqueSdb } from './items/VasqueSdb';
import { WaterHeater } from './items/WaterHeater';
import { GrassRug } from './items/GrassRug';
import { CorridorCloset } from './items/CorridorCloset';
import { SdbCloset }      from './items/SdbCloset';
import type { Item } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const noop = (_: THREE.Vector3) => {};

// Empty actionState for items that have no toggleable state (Kallax, BathroomCabinet)
const AS: Record<string, boolean> = {};

// Map furniture-toggle key → actionState key used by item components
const TOGGLE_MAP: Record<string, string> = {
  freezer:   'freezer-toggle',
  fridge:    'fridge-toggle',
  cabinet:   'cabinet-toggle',
  wcLid:     'wc-lid-toggle',
  corrDoors: 'corr-doors-toggle',
  sdbCloset: 'sdb-closet-toggle',
};

function stub(id: string): Item {
  return {
    id, name: '', brand: '', category: '', qty: 1,
    dims: { w: 0, d: 0, h: 0 }, scenePos: { x: 0, z: 0 },
  };
}

// ── Constantes Kallax (depuis Kallax.tsx) ─────────────────────────────────────

const TF = 3.5;
const TI = 1.5;
const NH = 34;
const NW_K = 33.5;
const DEP = 39;

function tw(cols: number) { return cols * NW_K + 2 * TF + (cols - 1) * TI; }
function th(rows: number) { return rows * NH + 2 * TF + (rows - 1) * TI; }

const w1 = tw(1); // 40.5  (1 colonne)
const w2 = tw(2); // 75.5  (2 colonnes)
const h1 = th(1); // 41    (1 rangée)
const h2 = th(2); // 76.5  (2 rangées)

// ── Constantes scène ──────────────────────────────────────────────────────────
// Reprises de config.js (via @config) ou calculées depuis les modules JS source.

const ROOM_W      = 300;
const ROOM_D      = 400;
const KITCHEN_X1  = 130;
const NICHE_DEPTH = 10;
const KITCHEN_X0  = 30;
const KITCHEN_D   = 60;  // KITCHEN_DEPTH
const KITCHEN_Z   = ROOM_D + KITCHEN_D;  // 460
const SDB_Z_END   = KITCHEN_Z + 140;     // 600
const DOOR_START  = 190;
const WALL_H      = 250;

// ── Stack NE — mur B (X=300) + mur C (Z=0) ───────────────────────────────────
// gStack.rotation.y = +π/2 ; gStack.position = (ROOM_W-DEP/2, 0, w2/2)
// 2×1 (sol) + 2×2 (dessus)

function KallaxNE() {
  return (
    <group position={[ROOM_W - DEP / 2, 0, w2 / 2]} rotation={[0, Math.PI / 2, 0]}>
      {/* 2×1 base — PY = h1 */}
      <group position={[0, h1, 0]}>
        <Kallax item={stub('kallax-ne-2x1')} actionState={AS} onSize={noop} />
      </group>
      {/* 2×2 dessus — PY = h1 + h2 */}
      <group position={[0, h1 + h2, 0]}>
        <Kallax item={stub('kallax-ne-2x2')} actionState={AS} onSize={noop} />
      </group>
    </group>
  );
}

// ── Stack SW — niche mur A (X=-NICHE_DEPTH) + mur D (Z=400) ─────────────────
// gStack.rotation.y = -π/2 ; gStack.position = (-NICHE_DEPTH+DEP/2, 0, ROOM_D-w2/2)
// 2×2 + 2×2 + 2×1

function KallaxSW() {
  return (
    <group
      position={[-NICHE_DEPTH + DEP / 2, 0, ROOM_D - w2 / 2]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      {/* sw0 2×2 — PY = h2 */}
      <group position={[0, h2, 0]}>
        <Kallax item={stub('kallax-sw-2x2')} actionState={AS} onSize={noop} />
      </group>
      {/* sw1 2×2 — PY = h2 + h2 */}
      <group position={[0, h2 + h2, 0]}>
        <Kallax item={stub('kallax-sw-2x2')} actionState={AS} onSize={noop} />
      </group>
      {/* sw2 2×1 — PY = h2 + h2 + h1 */}
      <group position={[0, h2 + h2 + h1, 0]}>
        <Kallax item={stub('kallax-sw-2x1')} actionState={AS} onSize={noop} />
      </group>
    </group>
  );
}

// ── Stack SE — mur B, 60cm avant mur D ───────────────────────────────────────
// gStack.rotation.y = +π/2 ; gStack.position = (ROOM_W-DEP/2, 0, ROOM_D-60-w1/2)
// 2 × Kallax 2×1 posés sur le côté (rotation.z = π/2)
//
// Pour un Kallax 2×1 pivoté (W=w2, H=h1) avec décalage interne [0,-H/2,0] :
//   Après rotation.z=π/2, le décalage interne devient [+H/2, 0] dans le repère parent.
//   La géométrie occupe X∈[px, px+H], Y∈[py-W/2, py+W/2].
//   Pour correspondre au JS (X centré, Y depuis ySE jusqu'à ySE+W) :
//     px = -h1/2 = -20.5
//     py = ySE + w2/2  (ySE = 0 pour k1, ySE = w2 pour k2)

function KallaxSE() {
  const px = -h1 / 2; // -20.5
  return (
    <group
      position={[ROOM_W - DEP / 2, 0, ROOM_D - 60 - w1 / 2]}
      rotation={[0, Math.PI / 2, 0]}
    >
      {/* k1 — base */}
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={stub('kallax-se-2x1')} actionState={AS} onSize={noop} />
      </group>
      {/* k2 — dessus */}
      <group position={[px, w2 / 2 + w2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={stub('kallax-se-2x1')} actionState={AS} onSize={noop} />
      </group>
    </group>
  );
}

// ── Stack NW — mur A (X=0) + mur C (Z=0) ────────────────────────────────────
// gStack.rotation.y = -π/2 ; gStack.position = (DEP/2, 0, w1/2)
// 2×1 + 1×1 + 1×1, tous pivotés rotation.z=π/2
//   nwB(2×1) : ySE=0,        W=w2=75.5 → py = w2/2
//   nwM(1×1) : ySE=w2,       W=w1=40.5 → py = w2 + w1/2
//   nwT(1×1) : ySE=w2+w1,    W=w1=40.5 → py = w2 + w1 + w1/2

function KallaxNW() {
  const px = -h1 / 2; // -20.5
  return (
    <group position={[DEP / 2, 0, w1 / 2]} rotation={[0, -Math.PI / 2, 0]}>
      {/* nwB 2×1 */}
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={stub('kallax-nw-2x1')} actionState={AS} onSize={noop} />
      </group>
      {/* nwM 1×1 */}
      <group position={[px, w2 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={stub('kallax-nw-1x1-a')} actionState={AS} onSize={noop} />
      </group>
      {/* nwT 1×1 */}
      <group position={[px, w2 + w1 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={stub('kallax-nw-1x1-b')} actionState={AS} onSize={noop} />
      </group>
    </group>
  );
}

// ── Congélateur ───────────────────────────────────────────────────────────────
// js/decor/decor.js : frzX=24.5, frzZ=269.5, frzBaseY=0
// FRZ_H=50 → PY = FRZ_H/2 = 25

function FreezerPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[24.5, 25, 269.5]}
      userData={{ hoverAction: { label: 'Congélateur', actionId: 'freezer' } }}>
      <Freezer item={stub('freezer')} actionState={as} onSize={noop} />
    </group>
  );
}

// ── Meuble sous évier cuisine ─────────────────────────────────────────────────
// KitchenCabinet: W=40, H=90, D=60
// X = KITCHEN_X0 + W/2 = 50  |  Z = KITCHEN_Z - D/2 = 430  |  PY = H/2 = 45

function KitchenCabinetPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[KITCHEN_X0 + 40 / 2, 90 / 2, KITCHEN_Z - KITCHEN_D / 2]}
      userData={{ hoverAction: { label: 'Meuble évier', actionId: 'cabinet' } }}>
      <KitchenCabinet item={stub('kitchen-cabinet')} actionState={as} onSize={noop} />
    </group>
  );
}

// ── Réfrigérateur cuisine ─────────────────────────────────────────────────────
// Fridge: W=60, H=90, D=60
// X = KITCHEN_X0 + 40 + W/2 = 100  |  Z = 430  |  PY = H/2 = 45

function FridgePlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[KITCHEN_X0 + 40 + 60 / 2, 90 / 2, KITCHEN_Z - KITCHEN_D / 2]}
      userData={{ hoverAction: { label: 'Réfrigérateur', actionId: 'fridge' } }}>
      <Fridge item={stub('fridge')} actionState={as} onSize={noop} />
    </group>
  );
}

// ── Placard couloir ───────────────────────────────────────────────────────────
// CX = (KITCHEN_X1 + DOOR_START) / 2 = 160  |  CZ = (ROOM_D+10 + KITCHEN_Z) / 2 = 435

function CorridorClosetPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[(KITCHEN_X1 + DOOR_START) / 2, 0, (ROOM_D + 10 + KITCHEN_Z) / 2]}>
      <CorridorCloset item={stub('corridor-closet')} actionState={as} onSize={noop} />
    </group>
  );
}

// ── Vasque SDB ────────────────────────────────────────────────────────────────
// VANITY_CX = DOOR_START - 48 - 60/2 = 112  |  VANITY_CZ = KITCHEN_Z + 11 + 47/2 = 494.5

function VasqueSdbPlaced() {
  return (
    <group position={[DOOR_START - 78, 0, KITCHEN_Z + 34.5]}>
      <VasqueSdb item={stub('vasque-sdb')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── Ballon d'eau chaude ───────────────────────────────────────────────────────
// HW_R=28, HW_H=65 → center at (-NICHE_DEPTH+HW_R, WALL_H-10-HW_H/2, KITCHEN_Z+20+HW_R)

function WaterHeaterPlaced() {
  const HW_R = 28, HW_H = 65;
  return (
    <group position={[-NICHE_DEPTH + HW_R, WALL_H - 10 - HW_H / 2, KITCHEN_Z + 20 + HW_R]}>
      <WaterHeater item={stub('water-heater')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── Tapis pelouse synthétique ─────────────────────────────────────────────────
// rugCX = (-NICHE_DEPTH + DOOR_START) / 2 = 90  |  rugCZ = SDB_Z_END - 53 = 547

function GrassRugPlaced() {
  return (
    <group position={[(-NICHE_DEPTH + DOOR_START) / 2, 0, SDB_Z_END - 53]}>
      <GrassRug item={stub('grass-rug')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── Douche ────────────────────────────────────────────────────────────────────
// showerCX = (-NICHE_DEPTH + SHOWER_W) / 2 = 25  |  SHOWER_Z0 = SDB_Z_END = 600

function ShowerPlaced() {
  return (
    <group position={[(-NICHE_DEPTH + 70) / 2, 0, SDB_Z_END]}>
      <Shower item={stub('shower')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── WC ────────────────────────────────────────────────────────────────────────
// WC_CX = -NICHE_DEPTH + 40 + 20 = 50  |  WC_Z0 = KITCHEN_Z + 11 = 471

function ToiletPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[-NICHE_DEPTH + 60, 0, KITCHEN_Z + 11]}>
      <Toilet item={stub('toilet')} actionState={as} onSize={noop} />
    </group>
  );
}

// ── Placard SDB ───────────────────────────────────────────────────────────────
// SLIDE_CX = (70+180)/2 = 125  |  SLIDE_Z = SDB_Z_END = 600

function SdbClosetPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[125, 0, SDB_Z_END]}>
      <SdbCloset item={stub('sdb-closet')} actionState={as} onSize={noop} />
    </group>
  );
}

// ── Meubles SDB ───────────────────────────────────────────────────────────────
// BathroomCabinet: W=40, H=60, D=37
// West : X = -NICHE_DEPTH + W/2 = 10  |  Z = KITCHEN_Z+11+37/2 = 489.5  |  PY = H/2 = 30
// East : X = DOOR_START - W/2 - 8 = 162

function BathroomCabinetsPlaced() {
  const cbZ = KITCHEN_Z + 11 + 37 / 2; // 489.5
  return (
    <>
      <group position={[-NICHE_DEPTH + 40 / 2, 60 / 2, cbZ]}>
        <BathroomCabinetWest item={stub('cbn-west')} actionState={AS} onSize={noop} />
      </group>
      <group position={[DOOR_START - 40 / 2 - 8, 60 / 2, cbZ]}>
        <BathroomCabinetEast item={stub('cbn-east')} actionState={AS} onSize={noop} />
      </group>
    </>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Furniture() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();

  useEffect(() => {
    const onToggle = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const asKey = TOGGLE_MAP[key];
      if (!asKey) return;
      setAs(prev => ({ ...prev, [asKey]: !prev[asKey] }));
      invalidate();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidate]);

  return (
    <>
      <KallaxNE />
      <KallaxSW />
      <KallaxSE />
      <KallaxNW />
      <FreezerPlaced as={as} />
      <KitchenCabinetPlaced as={as} />
      <CorridorClosetPlaced as={as} />
      <FridgePlaced as={as} />
      <VasqueSdbPlaced />
      <WaterHeaterPlaced />
      <GrassRugPlaced />
      <ShowerPlaced />
      <ToiletPlaced as={as} />
      <SdbClosetPlaced as={as} />
      <BathroomCabinetsPlaced />
    </>
  );
}
