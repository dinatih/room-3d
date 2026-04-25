/**
 * Furniture.tsx — Place tous les composants à leurs coordonnées monde.
 *
 * Quatre exports correspondant aux deux layers × deux types :
 *   EquipmentProc  → Layer 1 (LayerGroup) + layers.equipment
 *   EquipmentGlb   → Layer 2 (GlbLayerGroup) + layers.equipment
 *   FurnitureProc  → Layer 1 (LayerGroup) + layers.furniture
 *   FurnitureGlb   → Layer 2 (GlbLayerGroup) + layers.furniture
 *
 * Conventions d'ancrage (axe Y) :
 *   - Kallax         : geometry spans [PY-H, PY]  → pose au sol : PY = H
 *   - GLB items      : Y=0 = sol (Freezer, Fridge, BathroomCabinet) → PY = 0
 *   - KitchenCabinet : GLB Y=0=sol → PY = 0
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
const AS: Record<string, boolean> = {};

function stub(id: string): Item {
  return {
    id, name: '', brand: '', category: '', qty: 1,
    dims: { w: 0, d: 0, h: 0 }, scenePos: { x: 0, z: 0 },
  };
}

// ── Constantes Kallax ─────────────────────────────────────────────────────────

const TF = 3.5;
const TI = 1.5;
const NW_K = 33.5;
const DEP = 39;

function tw(cols: number) { return cols * NW_K + 2 * TF + (cols - 1) * TI; }

const w1 = tw(1); // 40.5
const w2 = tw(2); // 75.5

// ── Constantes scène ──────────────────────────────────────────────────────────

const ROOM_W      = 300;
const ROOM_D      = 400;
const KITCHEN_X1  = 130;
const NICHE_DEPTH = 10;
const KITCHEN_X0  = 30;
const KITCHEN_D   = 60;
const KITCHEN_Z   = ROOM_D + KITCHEN_D;  // 460
const SDB_Z_END   = KITCHEN_Z + 140;     // 600
const DOOR_START  = 190;
const WALL_H      = 250;

// ── Placements ────────────────────────────────────────────────────────────────

function KallaxNEPlaced() {
  return (
    <group position={[ROOM_W - DEP / 2, 0, w2 / 2]} rotation={[0, Math.PI / 2, 0]}>
      <KallaxNE item={stub('kallax-ne-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

function KallaxSWPlaced() {
  return (
    <group position={[-NICHE_DEPTH + DEP / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]}>
      <KallaxCuisine item={stub('kallax-sw-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

function KallaxSEPlaced() {
  return (
    <group position={[ROOM_W - DEP / 2, 0, ROOM_D - 60 - w1 / 2]} rotation={[0, Math.PI / 2, 0]}>
      <KallaxSE item={stub('kallax-se-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

function KallaxNWPlaced() {
  return (
    <group position={[DEP / 2, 0, w1 / 2]} rotation={[0, -Math.PI / 2, 0]}>
      <KallaxNW item={stub('kallax-nw-stack')} actionState={AS} onSize={noop} />
    </group>
  );
}

function FreezerPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[24.5, 0, 269.5]}
      userData={{ hoverAction: { label: 'Congélateur', actionId: 'freezer' } }}>
      <Freezer item={stub('freezer')} actionState={as} onSize={noop} />
    </group>
  );
}

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

function CorridorClosetPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[(KITCHEN_X1 + DOOR_START) / 2, 0, (ROOM_D + 10 + KITCHEN_Z) / 2]}>
      <CorridorCloset item={stub('corridor-closet')} actionState={as} onSize={noop} />
    </group>
  );
}

function VasqueSdbPlaced() {
  return (
    <group position={[DOOR_START - 84, 14, KITCHEN_Z + 34.5]}>
      <VasqueSdb item={stub('vasque-sdb')} actionState={AS} onSize={noop} />
    </group>
  );
}

function WaterHeaterPlaced() {
  const HW_R = 28, HW_H = 65;
  return (
    <group position={[-NICHE_DEPTH + HW_R, WALL_H - 10 - HW_H / 2, KITCHEN_Z + 20 + HW_R]}>
      <WaterHeater item={stub('water-heater')} actionState={AS} onSize={noop} />
    </group>
  );
}

function GrassRugPlaced() {
  return (
    <group position={[(-NICHE_DEPTH + DOOR_START) / 2, 0, SDB_Z_END - 53]}>
      <GrassRug item={stub('grass-rug')} actionState={AS} onSize={noop} />
    </group>
  );
}

function ShowerPlaced() {
  return (
    <group position={[(-NICHE_DEPTH + 70) / 2, 0, SDB_Z_END]}>
      <Shower item={stub('shower')} actionState={AS} onSize={noop} />
    </group>
  );
}

function ToiletPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[-NICHE_DEPTH + 60, 0, KITCHEN_Z + 31]}>
      <Toilet item={stub('toilet')} actionState={as} onSize={noop} />
    </group>
  );
}

function SdbClosetPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[125, 0, SDB_Z_END]}>
      <SdbCloset item={stub('sdb-closet')} actionState={as} onSize={noop} />
    </group>
  );
}

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

// ── Toggle maps ───────────────────────────────────────────────────────────────

const EQUIPMENT_GLB_TOGGLE_MAP: Record<string, string> = {
  freezer: 'freezer-toggle',
  wcLid:   'wc-lid-toggle',
};

const FURNITURE_PROC_TOGGLE_MAP: Record<string, string> = {
  corrDoors: 'corr-doors-toggle',
  sdbCloset: 'sdb-closet-toggle',
};

const FURNITURE_GLB_TOGGLE_MAP: Record<string, string> = {
  cbnWest: 'cbn-west-toggle',
  cbnEast: 'cbn-east-toggle',
};

// ── Layer 1 (procédural) ──────────────────────────────────────────────────────

/** Équipements procéduraux : chauffe-eau uniquement. */
export function EquipmentProc() {
  return <WaterHeaterPlaced />;
}

/**
 * Mobilier procédural : placards, tapis.
 * Écoute corrDoors + sdbCloset.
 */
export function FurnitureProc() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();

  useEffect(() => {
    const onToggle = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const asKey = FURNITURE_PROC_TOGGLE_MAP[key];
      if (!asKey) return;
      setAs(prev => ({ ...prev, [asKey]: !prev[asKey] }));
      invalidate();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidate]);

  return (
    <>
      <CorridorClosetPlaced as={as} />
      <GrassRugPlaced />
      <SdbClosetPlaced as={as} />
      <CuisineDronaPlaced />
    </>
  );
}

// ── Layer 2 (GLB) ─────────────────────────────────────────────────────────────

/**
 * Équipements GLB : congélateur, vasque SDB, douche, WC.
 * Écoute freezer + wcLid.
 */
export function EquipmentGlb() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();

  useEffect(() => {
    const onToggle = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const asKey = EQUIPMENT_GLB_TOGGLE_MAP[key];
      if (!asKey) return;
      setAs(prev => ({ ...prev, [asKey]: !prev[asKey] }));
      invalidate();
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [invalidate]);

  return (
    <>
      <CuisineGroupPlaced />
      <FreezerPlaced as={as} />
      <VasqueSdbPlaced />
      <ShowerPlaced />
      <ToiletPlaced as={as} />
    </>
  );
}

/**
 * Composites furniture : items qui mélangent GLB et enfants procéduraux.
 * Placés EN DEHORS du <group visible={layers.glb}> dans Studio.tsx ;
 * chaque composite gère sa visibilité GLB interne via GlbSubGroup / GlbContext.
 */
export function FurnitureComposite() {
  return <KallaxNWPlaced />;
}

/**
 * Mobilier GLB pur : Kallax ×3 + meubles SDB METOD.
 * Écoute cbnWest + cbnEast.
 * KallaxNW est dans FurnitureComposite (composite GLB + procédural).
 */
export function FurnitureGlb() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();

  useEffect(() => {
    const onToggle = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const asKey = FURNITURE_GLB_TOGGLE_MAP[key];
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
      <KallaxSWPlaced />
      <KallaxSEPlaced />
      <BathroomCabinetsPlaced as={as} />
    </>
  );
}
