/**
 * Furniture.tsx — Place tous les composants TSX existants à leurs coordonnées
 * monde exactes, fidèles aux positions de la scène vanilla Three.js.
 *
 * Conventions d'ancrage (axe Y) :
 *   - Kallax         : geometry spans [PY-H, PY]  → pose au sol : PY = H
 *   - GLB items      : Y=0 = sol (Freezer, Fridge, BathroomCabinet) → PY = 0
 *   - KitchenCabinet : procédural centré → PY = H/2
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
import { KallaxNE }      from './items/KallaxNE';
import { KallaxSE }      from './items/KallaxSE';
import { KallaxNW }      from './items/KallaxNW';
import { KallaxCuisine } from './items/KallaxCuisine';
import { CuisineGroup, CuisineDrona } from './items/CuisineGroup';
import { Freezer } from './items/Freezer';
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


function stub(id: string): Item {
  return {
    id, name: '', brand: '', category: '', qty: 1,
    dims: { w: 0, d: 0, h: 0 }, scenePos: { x: 0, z: 0 },
  };
}

// ── Constantes Kallax (depuis Kallax.tsx) ─────────────────────────────────────

const TF = 3.5;
const TI = 1.5;
const NW_K = 33.5;
const DEP = 39;

function tw(cols: number) { return cols * NW_K + 2 * TF + (cols - 1) * TI; }

const w1 = tw(1); // 40.5  (1 colonne)
const w2 = tw(2); // 75.5  (2 colonnes)

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
// Kallax + Drona intégrés dans KallaxNE

function KallaxNEPlaced() {
  return (
    <group position={[ROOM_W - DEP / 2, 0, w2 / 2]} rotation={[0, Math.PI / 2, 0]}>
      <KallaxNE item={stub('kallax-ne-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── Stack SW — niche mur A (X=-NICHE_DEPTH) + mur D (Z=400) ─────────────────
// Kallax + Drona intégrés dans KallaxCuisine

function KallaxSW() {
  return (
    <group position={[-NICHE_DEPTH + DEP / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]}>
      <KallaxCuisine item={stub('kallax-sw-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── Stack SE — mur B, 60cm avant mur D ───────────────────────────────────────
// gStack.rotation.y = +π/2 ; gStack.position = (ROOM_W-DEP/2, 0, ROOM_D-60-w1/2)
// Kallax + Drona intégrés dans KallaxSE

function KallaxSEPlaced() {
  return (
    <group position={[ROOM_W - DEP / 2, 0, ROOM_D - 60 - w1 / 2]} rotation={[0, Math.PI / 2, 0]}>
      <KallaxSE item={stub('kallax-se-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── Stack NW — mur A (X=0) + mur C (Z=0) ────────────────────────────────────
// gStack.rotation.y = -π/2 ; gStack.position = (DEP/2, 0, w1/2)
// Kallax + Drona intégrés dans KallaxNW

function KallaxNWPlaced() {
  return (
    <group position={[DEP / 2, 0, w1 / 2]} rotation={[0, -Math.PI / 2, 0]}>
      <KallaxNW item={stub('kallax-nw-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

// ── Congélateur ───────────────────────────────────────────────────────────────
// js/decor/decor.js : frzX=24.5, frzZ=269.5, frzBaseY=0
// GLB Y=0=sol → PY = 0

function FreezerPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[24.5, 0, 269.5]}
      userData={{ hoverAction: { label: 'Congélateur', actionId: 'freezer' } }}>
      <Freezer item={stub('freezer')} actionState={as} onSize={noop} />
    </group>
  );
}

// ── Cuisine (plan de travail + évier + plaques + frigo + meuble bas + meuble haut + 3 Drona) ──

function CuisineGroupPlaced() {
  return (
    <group position={[KITCHEN_X0, 0, ROOM_D]}>
      <CuisineGroup item={stub('cuisine-stack')} actionState={{}} onSize={noop} noDrona />
    </group>
  );
}

function CuisineDronaPlaced() {
  return (
    <group position={[KITCHEN_X0, 0, ROOM_D]}>
      <CuisineDrona />
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
    <group position={[DOOR_START - 84, 14, KITCHEN_Z + 34.5]}>
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

function BathroomCabinetsPlaced({ as }: { as: Record<string, boolean> }) {
  const cbZ = KITCHEN_Z + 11 + 37 / 2; // 489.5
  return (
    <>
      <group position={[-NICHE_DEPTH + 40 / 2, 0, cbZ]}>
        <BathroomCabinetWest item={stub('bathroom-cabinet-west')} actionState={as} onSize={noop} />
      </group>
      <group position={[DOOR_START - 40 / 2 - 11, 0, cbZ]}>
        <BathroomCabinetEast item={stub('bathroom-cabinet-east')} actionState={as} onSize={noop} />
      </group>
    </>
  );
}

// ── Toggles équipements ───────────────────────────────────────────────────────

const EQUIPMENT_TOGGLE_MAP: Record<string, string> = {
  freezer: 'freezer-toggle',
  wcLid:   'wc-lid-toggle',
};

const FURNITURE_TOGGLE_MAP: Record<string, string> = {
  corrDoors: 'corr-doors-toggle',
  sdbCloset: 'sdb-closet-toggle',
  cbnWest:   'cbn-west-toggle',
  cbnEast:   'cbn-east-toggle',
};

// ── Équipements (cuisine + sanitaires) ───────────────────────────────────────

export function Equipment() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();

  useEffect(() => {
    const onToggle = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const asKey = EQUIPMENT_TOGGLE_MAP[key];
      if (!asKey) return;
      setAs(prev => ({ ...prev, [asKey]: !prev[asKey] }));
      invalidate();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidate]);

  return (
    <>
      <FreezerPlaced as={as} />
      <CuisineGroupPlaced />
      <VasqueSdbPlaced />
      <WaterHeaterPlaced />
      <ShowerPlaced />
      <ToiletPlaced as={as} />
    </>
  );
}

// ── Mobilier fixe (rangements) ────────────────────────────────────────────────

export function Furniture() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();

  useEffect(() => {
    const onToggle = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const asKey = FURNITURE_TOGGLE_MAP[key];
      if (!asKey) return;
      setAs(prev => ({ ...prev, [asKey]: !prev[asKey] }));
      invalidate();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidate]);

  return (
    <>
      <KallaxNEPlaced />
      <KallaxSW />
      <KallaxSEPlaced />
      <KallaxNWPlaced />
      <CorridorClosetPlaced as={as} />
      <GrassRugPlaced />
      <SdbClosetPlaced as={as} />
      <BathroomCabinetsPlaced as={as} />
      <CuisineDronaPlaced />
    </>
  );
}
