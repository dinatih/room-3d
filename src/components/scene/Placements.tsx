/**
 * Placements.tsx — Positionnement monde de tous les meubles et objets décoratifs.
 *
 * Regroupe le contenu des anciens Furniture.tsx, Furnishings.tsx et Placements.tsx.
 *
 * Exports principaux (utilisés dans Studio.tsx) :
 *   EquipmentProc     → équipements procéduraux (chauffe-eau)
 *   EquipmentGlb      → équipements GLB (congélateur, vasque, douche, WC, cuisine)
 *   FurnitureProc     → mobilier procédural (placards, tapis, Drona)
 *   FurnitureGlb      → mobilier GLB (Kallax ×3, meubles SDB)
 *   FurnitureComposite→ items composites GLB+procédural (KallaxNW)
 *   Furnishings       → meubles avec état animé (lit, bureaux, TV)
 *   FurniturePlacements → décoration procédurale (mannequin, purificateur)
 *   GlbPlacements     → décoration GLB (étagère, Smörkull, lampe…)
 *   CompositePlacements → composites décoratifs (Sunnersta)
 */
import { useState, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';

// ── Items structurels (Furniture) ─────────────────────────────────────────────
import { KallaxNE }      from './items/KallaxNE';
import { KallaxSE }      from './items/KallaxSE';
import { KallaxNW }      from './items/KallaxNW';
import { KallaxCuisine } from './items/KallaxCuisine';
import { CuisineGroup, CuisineDrona } from './items/CuisineGroup';
import { Freezer }       from './items/Freezer';
import { BathroomCabinetWest, BathroomCabinetEast } from './items/BathroomCabinet';
import { Toilet }        from './items/Toilet';
import { Shower }        from './items/Shower';
import { VasqueSdb }     from './items/VasqueSdb';
import { WaterHeater }   from './items/WaterHeater';
import { GrassRug }      from './items/GrassRug';
import { CorridorCloset } from './items/CorridorCloset';
import { SdbCloset }     from './items/SdbCloset';
import type { Item }     from '../../types';

// ── Items Furnishings ─────────────────────────────────────────────────────────
import { LaptopDesk }    from './LaptopDesk';
import { TV, TV_H }      from './items/TV';
import { UtakerFrame }   from './items/UtakerFrame';
import { BollsidanDesk } from './items/BollsidanDesk';

// ── Items décoratifs ──────────────────────────────────────────────────────────
import { AirPerformer }  from './items/AirPerformer';
import { BaseballCap }   from './items/BaseballCap';
import { Fniss }         from './items/Fniss';
import { LackShelf }     from './items/LackShelf';
import { LampOla }       from './items/LampOla';
import { MackaparGroup } from './items/MackaparGroup';
import { MannequinHead } from './items/MannequinHead';
import { MuligRail }     from './items/MuligRail';
import { Scooter }       from './items/Scooter';
import { Smorkull }      from './items/Smorkull';
import { Sneakers }      from './items/Sneakers';
import { SunnerstaGroup } from './items/SunnerstaGroup';
import { Dimpa }         from './items/Dimpa';
import { Grejig }        from './items/Grejig';
import { PalmLeaf }      from './items/PalmLeaf';

import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '../../utils/sceneItem';

import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  SDB_Z_END, DOOR_START,
  KALLAX_DEPTH, KALLAX_CELL, KALLAX_FRAME, KALLAX_PANEL,
} from '@config';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Crée un Item minimal avec un id pour le registry (preview inventaire). */
function stub(id: string): Item {
  return { id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 }, scenePos: { x: 0, z: 0 } };
}

// ── Constantes Kallax ─────────────────────────────────────────────────────────

const tw = (cols: number) => cols * KALLAX_CELL + 2 * KALLAX_FRAME + (cols - 1) * KALLAX_PANEL;
const w1 = tw(1); // 40.5
const w2 = tw(2); // 75.5

// ── Constantes dérivées ───────────────────────────────────────────────────────

const KALLAX_SE_Z   = ROOM_D - 60 - w1 / 2;  // 319.75
const KALLAX_SE_TOP = 2 * w2;                  // 151

const lackY   = 187.5;
const lackCX  = 26 / 2;
const lackCZ  = NICHE_Z_START - 110 / 2;
const lackTopY = lackY + 5;
const mannRot  = Math.atan2(150 - lackCX, 200 - lackCZ);

const MUL_D       = 13;
const MUL_MOUNT_Y = 230;
const MUL_RAIL_Y  = 60;
const mulCZ       = NICHE_Z_START - 110 - 80 / 2;

const MEUBLE_T_D = 27.5;
const MEUBLE_T_H = 55;
const MEUBLE_T_X = ROOM_W - MEUBLE_T_D / 2;
const MEUBLE_T_Z = KALLAX_SE_Z;
const MEUBLE_T_Y = KALLAX_SE_TOP;

const LAMP_ROT_Y  = Math.atan2(ROOM_W / 2 - MEUBLE_T_X, ROOM_D / 2 - MEUBLE_T_Z);
const MACK_X      = -NICHE_DEPTH + 3.5 + 38.5;
const MACK_Z      = ROOM_D - w2 - 16;
const MIRROR_CX   = (130 + 190) / 2;

const SUNNERSTA_NW_X = ROOM_W - 36;  // 264
const SUNNERSTA_NW_Z = 243.5;

const SIT_H   = 70;
const STAND_H = 103;

// ═══════════════════════════════════════════════════════════════════════════════
// PLACED HELPERS (Furniture)
// ═══════════════════════════════════════════════════════════════════════════════

function KallaxNEPlaced() {
  return (
    <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, w2 / 2]} rotation={[0, Math.PI / 2, 0]}>
      <KallaxNE item={stub('kallax-ne-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function KallaxSWPlaced() {
  return (
    <group position={[-NICHE_DEPTH + KALLAX_DEPTH / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]}>
      <KallaxCuisine item={stub('kallax-sw-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function KallaxSEPlaced() {
  return (
    <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, ROOM_D - 60 - w1 / 2]} rotation={[0, Math.PI / 2, 0]}>
      <KallaxSE item={stub('kallax-se-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function KallaxNWPlaced() {
  return (
    <group position={[KALLAX_DEPTH / 2, 0, w1 / 2]} rotation={[0, -Math.PI / 2, 0]}>
      <KallaxNW item={stub('kallax-nw-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function FreezerPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[24.5, 0, 269.5]}
      userData={{ hoverAction: { label: 'Congélateur', actionId: 'freezer' } }}>
      <Freezer item={stub('freezer')} actionState={as} onSize={NOOP_SIZE} />
    </group>
  );
}

function CuisineGroupPlaced() {
  return (
    <group position={[KITCHEN_X0, 0, ROOM_D]}>
      <CuisineGroup item={stub('cuisine-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} noDrona />
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
      <CorridorCloset item={stub('corridor-closet')} actionState={as} onSize={NOOP_SIZE} />
    </group>
  );
}

function VasqueSdbPlaced() {
  return (
    <group position={[DOOR_START - 84, 14, KITCHEN_Z + 34.5]}>
      <VasqueSdb item={stub('vasque-sdb')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function WaterHeaterPlaced() {
  const HW_R = 28, HW_H = 65;
  return (
    <group position={[-NICHE_DEPTH + HW_R, WALL_H - 10 - HW_H / 2, KITCHEN_Z + 20 + HW_R]}>
      <WaterHeater item={stub('water-heater')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function GrassRugPlaced() {
  return (
    <group position={[(-NICHE_DEPTH + DOOR_START) / 2, 0, SDB_Z_END - 53]}>
      <GrassRug item={stub('grass-rug')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function ShowerPlaced() {
  return (
    // Niche douche 70×70cm : X -10→60, Z 600→670. Centre : (25, 635).
    <group position={[-NICHE_DEPTH + 35, 0, SDB_Z_END + 35]}>
      <Shower item={stub('shower')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function ToiletPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[-NICHE_DEPTH + 60, 0, KITCHEN_Z + 46.5]}>
      <Toilet item={stub('toilet')} actionState={as} onSize={NOOP_SIZE} />
    </group>
  );
}

function SdbClosetPlaced({ as }: { as: Record<string, boolean> }) {
  return (
    <group position={[125, 0, SDB_Z_END]}>
      <SdbCloset item={stub('sdb-closet')} actionState={as} onSize={NOOP_SIZE} />
    </group>
  );
}

function BathroomCabinetsPlaced({ as }: { as: Record<string, boolean> }) {
  const cbZ = KITCHEN_Z + 11 + 37 / 2; // 489.5
  return (
    <>
      <group position={[-NICHE_DEPTH + 40 / 2, 0, cbZ]}>
        <BathroomCabinetWest item={stub('bathroom-cabinet-west')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[DOOR_START - 40 / 2 - 11, 0, cbZ]}>
        <BathroomCabinetEast item={stub('bathroom-cabinet-east')} actionState={as} onSize={NOOP_SIZE} />
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

// ═══════════════════════════════════════════════════════════════════════════════
// EQUIPMENT (Layer 1)
// ═══════════════════════════════════════════════════════════════════════════════

export function EquipmentProc() {
  return <WaterHeaterPlaced />;
}

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

// ═══════════════════════════════════════════════════════════════════════════════
// FURNITURE (Layer 2)
// ═══════════════════════════════════════════════════════════════════════════════

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

export function FurnitureComposite() {
  return <KallaxNWPlaced />;
}

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

// ═══════════════════════════════════════════════════════════════════════════════
// FURNISHINGS — meubles principaux avec état (lit, bureaux, TV)
// ═══════════════════════════════════════════════════════════════════════════════

function Bed() {
  const bedPositions = useMemo(() => {
    const PAD = 3;
    const halfL = 102.5, halfW = 41.5;
    const dxK = ROOM_W - (ROOM_W - KALLAX_DEPTH);
    const dxS = ROOM_W - SUNNERSTA_NW_X + PAD;
    const dzT = SUNNERSTA_NW_Z - (w2 + PAD);
    const u = (dzT - Math.sqrt(dzT * dzT - 4 * dxK * dxS)) / 2;
    const NE_Z  = w2 + PAD + u;
    const alpha = Math.atan2(dxK, u);
    const neOffX = halfL * Math.cos(alpha) + halfW * Math.sin(alpha);
    const neOffZ = -halfL * Math.sin(alpha) + halfW * Math.cos(alpha);
    return [
      { x: ROOM_W - neOffX,  z: NE_Z - neOffZ, ry: alpha       },
      { x: ROOM_W - 83 / 2,  z: 190,           ry: Math.PI / 2 },
      { x: ROOM_W - 205 / 2, z: 200,           ry: 0           },
    ];
  }, []);

  const [stacked,   setStacked]   = useState(true);
  const [sofa,      setSofa]      = useState(false);
  const [bedPosIdx, setBedPosIdx] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'bed-toggle'   || key === 'bedStacked')  setStacked(v => !v);
      if (key === 'bed-sofa'     || key === 'bedSofa')     setSofa(v => !v);
      if (key === 'bed-position' || key === 'bedPosition') { setSofa(false); setBedPosIdx(i => (i + 1) % 3); }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p    = bedPositions[bedPosIdx];
  const gPos: [number, number, number] = sofa ? [ROOM_W - 83 / 2, 0, 190]   : [p.x, 0, p.z];
  const gRy  = sofa ? Math.PI / 2 : p.ry;
  const b2Pos: [number, number, number] = sofa
    ? [46, 0, -(ROOM_W - 83)]
    : [0, stacked ? 23 : 0, stacked ? 0 : -83];

  return (
    <group
      position={gPos}
      rotation={[0, gRy, 0]}
      userData={{ hoverAction: { label: 'Lit Utåker', actions: ['bed-toggle', 'bed-position', 'bed-sofa'] } }}
    >
      <UtakerFrame item={{ id: 'utaker-lower' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      <group position={b2Pos}>
        <UtakerFrame item={{ id: 'utaker-upper' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}

const DESK1_POSITIONS = [
  { x: 22,   z: 74.5, ry: Math.PI / 2 },
  { x: 73.5, z: 18,   ry: 0           },
] as const;

const DESK2_POSITIONS = [
  { x: 200, z: 170, ry: Math.PI     },
  { x: 85,  z: 151, ry: Math.PI / 2 },
] as const;

function Desks() {
  const [d1H,   setD1H]   = useState(SIT_H);
  const [d2H,   setD2H]   = useState(SIT_H);
  const [d1Pos, setD1Pos] = useState(0);
  const [d2Pos, setD2Pos] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'desk1-toggle')   setD1H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk1-position') setD1Pos(i => (i + 1) % DESK1_POSITIONS.length);
      if (key === 'desk2-toggle')   setD2H(h => h === SIT_H ? STAND_H : SIT_H);
      if (key === 'desk2-position') setD2Pos(i => (i + 1) % DESK2_POSITIONS.length);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p1 = DESK1_POSITIONS[d1Pos];
  const p2 = DESK2_POSITIONS[d2Pos];

  return (
    <>
      <group
        position={[p1.x, 0, p1.z]} rotation={[0, p1.ry, 0]}
        userData={{ hoverAction: { label: 'Bureau 1', actions: ['desk1-toggle', 'desk1-position'] } }}
      >
        <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d1H} />
      </group>
      <group
        position={[p2.x, 0, p2.z]} rotation={[0, p2.ry, 0]}
        userData={{ hoverAction: { label: 'Bureau 2', actions: ['desk2-toggle', 'desk2-position'] } }}
      >
        <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d2H} />
        <group position={[0, d2H, 0]} rotation={[0, Math.PI, 0]}>
          <LaptopDesk />
        </group>
      </group>
    </>
  );
}

function TVPlaced() {
  const TV_Y = WALL_H - 10 - TV_H / 2;
  return (
    <group
      position={[ROOM_W - 25, TV_Y, 25]}
      rotation-order="YXZ"
      rotation={[-Math.PI / 36, (3 * Math.PI) / 4, 0]}
    >
      <TV item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

export function Furnishings() {
  return (
    <>
      <Bed />
      <Desks />
      <TVPlaced />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FURNITURE PLACEMENTS  (layers.furniture)
// ═══════════════════════════════════════════════════════════════════════════════

export function FurniturePlacements() {
  return (
    <>
      <group position={[lackCX, lackTopY, lackCZ]} rotation={[0, mannRot, 0]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[287.5, 0, 230]}>
        <AirPerformer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLB PLACEMENTS  (layers.glb)
// ═══════════════════════════════════════════════════════════════════════════════

const SMORKULL_POSITIONS = [
  { x: 30,  z: 151, ry: Math.PI / 2 },
  { x: 150, z: 100, ry: Math.PI     },
  { x: 150, z: 300, ry: Math.PI     },
];

function SmorkullPlaced() {
  const [posIdx, setPosIdx] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'smorkull-position' || key === 'smorkullPos')
        setPosIdx(i => (i + 1) % SMORKULL_POSITIONS.length);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p = SMORKULL_POSITIONS[posIdx];
  return (
    <group
      position={[p.x, 0, p.z]}
      rotation-y={p.ry}
      userData={{ hoverAction: { label: 'Smörkull', actionId: 'smorkull-position' } }}
    >
      <Smorkull item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function LampOlaPlaced() {
  const [lampOn, setLampOn] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'lampOn') setLampOn(v => !v);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  return (
    <group
      position={[MEUBLE_T_X, MEUBLE_T_Y + MEUBLE_T_H, MEUBLE_T_Z]}
      rotation-y={LAMP_ROT_Y}
      userData={{ hoverAction: { label: 'Lampe OLA', actionId: 'lamp-toggle' } }}
    >
      <LampOla item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      {lampOn && <pointLight color={0xfff5e0} intensity={120000} distance={350} decay={2} position={[0, 96, 0]} />}
    </group>
  );
}

function SneakersPlaced() {
  const [pairW, setPairW] = useState(0);
  const px = MIRROR_CX + 40 - 50;
  const pz = ROOM_D - 15;
  return (
    <>
      <group position={[px, 0, pz]}>
        <Sneakers item={NOOP_ITEM} actionState={NOOP_STATE} onSize={s => setPairW(s.x)} />
      </group>
      <group position={[px + pairW + 3, 0, pz]}>
        <Sneakers item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

const PALM_COUNT = 5;
const MARGIN_X   = 40;
const MARGIN_Z   = 40;

function CeilingPalmLeaves() {
  const placements = useMemo(() => (
    Array.from({ length: PALM_COUNT }, () => ({
      x:  MARGIN_X + Math.random() * (ROOM_W - 2 * MARGIN_X),
      z:  MARGIN_Z + Math.random() * (ROOM_D - 2 * MARGIN_Z),
      ry: Math.random() * Math.PI * 2,
    }))
  ), []);

  return (
    <>
      {placements.map((p, i) => (
        <group key={i} position={[p.x, WALL_H, p.z]} rotation={[Math.PI, p.ry, 0]}>
          <PalmLeaf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
    </>
  );
}

export function GlbPlacements() {
  return (
    <>
      {/* LACK étagère murale */}
      <group position={[lackCX, lackY, lackCZ]} rotation={[0, Math.PI / 2, 0]}>
        <LackShelf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* MULIG rail */}
      <group position={[MUL_D, MUL_MOUNT_Y - MUL_RAIL_Y, mulCZ]}>
        <MuligRail item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* FNISS poubelles */}
      <group position={[110, 0, 500]}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[286, 0, 202]}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* DIMPA — 1 près du congélateur */}
      <group position={[14, 0, 210]} rotation-y={Math.PI / 2}>
        <Dimpa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* DIMPA — 4 dans le fond du jardin */}
      {[55, 120, 185, 250].map(x => (
        <group key={x} position={[x, 0, -386]}>
          <Dimpa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}

      <group position={[282, 0, 470]} rotation-y={Math.PI}>
        <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <SmorkullPlaced />

      <LampOlaPlaced />

      <group position={[MACK_X, 0, MACK_Z]} rotation-y={Math.PI / 2}>
        <MackaparGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Cap 1 — mur B au-dessus du lit */}
      <group position={[297, 144, 173.5]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <SneakersPlaced />

      <CeilingPalmLeaves />

      {/* GREJIG ×3 empilées — entrée, mur D */}
      {[0, 18, 36].map(y => (
        <group key={y} position={[MIRROR_CX, y, ROOM_D - 14]}>
          <Grejig item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITE PLACEMENTS  (hors groupe GLB — gèrent leur visibilité GLB en interne)
// ═══════════════════════════════════════════════════════════════════════════════

export function CompositePlacements() {
  return (
    <>
      <group position={[ROOM_W - 20, 0, 271.5]} rotation-y={Math.PI / 2}>
        <SunnerstaGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}
