/**
 * Placements.tsx — Positionnement monde de tous les meubles et objets décoratifs.
 *
 * Exports (Studio.tsx) :
 *   EquipmentProc / EquipmentGlb — équipements (Layer 1)
 *   FurnitureProc / FurnitureGlb / FurnitureComposite — mobilier (Layer 2)
 *   Furnishings — lit, bureaux, TV (avec état animé)
 *   FurniturePlacements / GlbPlacements / CompositePlacements — décoration
 *   Garden / GardenGlb — jardin (procédural + GLB)
 *   Backpacks — sacs à dos procéduraux
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

import { KallaxNE }      from './items/KallaxNE';
import { KallaxSE }      from './items/KallaxSE';
import { KallaxNW }      from './items/KallaxNW';
import { KallaxCuisine } from './items/KallaxCuisine';
import { CuisineGroup, CuisineDrona } from './items/CuisineGroup';
import { Freezer }       from './items/Freezer';
import { BathroomCabinetWest, BathroomCabinetEast } from './items/BathroomCabinet';
import { Toilet }        from './items/Toilet';
import { TradfriBulb }   from './items/TradfriBulb';
import { Shower }        from './items/Shower';
import { VasqueSdb }     from './items/VasqueSdb';
import { WaterHeater }   from './items/WaterHeater';
import { GrassRug }      from './items/GrassRug';
import { CorridorCloset } from './items/CorridorCloset';
import { SdbCloset }     from './items/SdbCloset';
import { TV, TV_H }      from './items/TV';
import { MllseG2Pro }    from './items/MllseG2Pro';
import { JblCharge3 }   from './items/JblCharge3';
import { UtakerFrame }   from './items/UtakerFrame';
import { BollsidanDesk } from './items/BollsidanDesk';
import { AirPerformer }  from './items/AirPerformer';
import { TrashBin }      from './items/TrashBin';
import { BaseballCap }   from './items/BaseballCap';
import { Fniss }         from './items/Fniss';
import { LackShelf }     from './items/LackShelf';
import { LampOla }       from './items/LampOla';
import { MackaparGroup } from './items/MackaparGroup';
import { MannequinHead } from './items/MannequinHead';
import { GoogleNestMini } from './items/GoogleNestMini';
import { MuligRail }     from './items/MuligRail';
import { Scooter }       from './items/Scooter';
import { Smorkull }      from './items/Smorkull';
import { Sneakers }      from './items/Sneakers';
import { SunnerstaGroup } from './items/SunnerstaGroup';
import { Dimpa }         from './items/Dimpa';
import { Grejig }        from './items/Grejig';
import { PalmLeaf }      from './items/PalmLeaf';
import { Laptop }        from './items/Laptop';
import { Phone }         from './items/Phone';
import { Mug }           from './items/Mug';
import { Backpack, BackpackSmall } from './items/Backpack';
// Garden items
import { Tent }          from './items/Tent';
import { Vihals }        from './items/Vihals';
import { AltappenRugField } from './items/AltappenRug';
import { ArmrestSofa }  from './items/ArmrestSofa';
import { ArmlessSofa }  from './items/ArmlessSofa';
import { Bathtub }      from './items/Bathtub';
import { ChestBench }   from './items/ChestBench';
import { PottedPalm }   from './items/PottedPalm';
import { Viggja }       from './items/Viggja';
import { JoggingSuit }  from './items/JoggingSuit';
import { ShibaInu }    from './items/ShibaInu';
import { Tisken }        from './items/Tisken';
import { Vathult }       from './items/Vathult';
import { DronaInstances, DroneCell } from './items/Drona';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';
import { useFurnitureToggles } from './utils/useFurnitureToggles';

import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_X, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  BATH_Z_END, DOOR_START,
} from '@config';

const KALLAX_DEPTH = 39;

// ── Helpers ───────────────────────────────────────────────────────────────────

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });


// ── Constantes ────────────────────────────────────────────────────────────────

const w1 = 40.5; // 1×Kallax : 33.5 + 2×3.5
const w2 = 75.5; // 2×Kallax : 2×33.5 + 2×3.5 + 1.5

const KALLAX_SE_Z   = ROOM_D - 60 - w1 / 2; // 319.75
const KALLAX_SE_TOP = 2 * w2;                // 151

const lackY    = 187.5;
const lackCX   = 13;
const lackCZ   = NICHE_Z_START - 55;
const lackTopY = lackY + 5;
const mannRot  = Math.atan2(150 - lackCX, 200 - lackCZ);

const MUL_D    = 13;
const mulCZ    = NICHE_Z_START - 110 - 40;

const MEUBLE_T_X = ROOM_W - 13.75;
const MEUBLE_T_Z = KALLAX_SE_Z;
const MEUBLE_T_Y = KALLAX_SE_TOP + 55; // dessus meuble + lampe

const LAMP_ROT_Y = Math.atan2(ROOM_W / 2 - MEUBLE_T_X, ROOM_D / 2 - MEUBLE_T_Z);
const MACK_X     = NICHE_X + 42;
const MACK_Z     = ROOM_D - w2 - 16;
const MIRROR_CX  = 160; // (130 + 190) / 2

const SIT_H   = 70;
const STAND_H = 103;

const DESK1_POSITIONS = [
  { x: 22,   z: 74.5, ry: Math.PI / 2 },
  { x: 73.5, z: 18,   ry: 0           },
] as const;

const DESK2_POSITIONS = [
  { x: 200, z: 170, ry: Math.PI     },
  { x: 85,  z: 151, ry: Math.PI / 2 },
] as const;

const SMORKULL_POSITIONS = [
  { x: 30,  z: 151, ry: Math.PI / 2 },
  { x: 150, z: 100, ry: Math.PI     },
  { x: 150, z: 300, ry: Math.PI     },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EQUIPMENT (Layer 1)
// ═══════════════════════════════════════════════════════════════════════════════

export function Equipment() {
  const as = useFurnitureToggles({ lampSdb: 'lamp-sdb-toggle', lampCouloir: 'lamp-couloir-toggle' });
  const HW_R = 28, HW_H = 65;
  const SDB_CX  = (NICHE_X + DOOR_START) / 2;
  const SDB_CZ  = (KITCHEN_Z + BATH_Z_END) / 2;
  const CORR_CX = (DOOR_START + ROOM_W) / 2;
  const CORR_CZ = (ROOM_D + KITCHEN_Z) / 2;
  return (
    <>
      <group position={[NICHE_X + HW_R, WALL_H - 10 - HW_H / 2, KITCHEN_Z + 20 + HW_R]} rotation-y={Math.PI / 2} userData={{ side: 'west' }}>
        <WaterHeater item={stub('water-heater')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[KITCHEN_X0, 0, ROOM_D]} userData={{ animUnit: true }}>
        <CuisineGroup item={stub('cuisine-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} noDrona />
      </group>
      <group position={[24.5, 0, 269.5]} userData={{ animUnit: true }}>
        <Freezer item={stub('freezer')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[DOOR_START - 84, 14, KITCHEN_Z + 34.5]} userData={{ animUnit: true }}>
        <VasqueSdb item={stub('vasque-sdb')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* TISKEN sur miroir vasque — mi-hauteur, bord gauche et droit */}
      <group position={[DOOR_START - 84 - 22, 129, KITCHEN_Z + 12.1]} rotation={[Math.PI / 2, 0, 0]}>
        <Tisken item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[DOOR_START - 84 + 22, 129, KITCHEN_Z + 12.1]} rotation={[Math.PI / 2, 0, 0]}>
        <Tisken item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* VÅTHULT — bandeau LED 35 cm au-dessus du miroir vasque (top miroir = 174) */}
      <group position={[DOOR_START - 84, 176, KITCHEN_Z + 12.1]}>
        <Vathult item={stub('vathult-350')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Niche douche 70×70cm : X -10→60, Z 600→670. Centre : (25, 635). */}
      <group position={[NICHE_X + 35, 0, BATH_Z_END + 35]} userData={{ animUnit: true }}>
        <Shower item={stub('shower')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[NICHE_X + 60, 0, KITCHEN_Z + 46.5]} userData={{ animUnit: true }}>
        <Toilet item={stub('toilet')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group visible={!!as['lamp-sdb-toggle']} position={[SDB_CX, WALL_H - 10, SDB_CZ]} rotation={[Math.PI, 0, 0]}>
        <TradfriBulb item={stub('tradfri-bulb')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        <pointLight intensity={8} distance={250} color={0xffe8b0} />
      </group>
      <group visible={!!as['lamp-couloir-toggle']} position={[CORR_CX, WALL_H - 10, CORR_CZ]} rotation={[Math.PI, 0, 0]}>
        <TradfriBulb item={stub('tradfri-bulb')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        <pointLight intensity={8} distance={250} color={0xffe8b0} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FURNITURE (Layer 2)
// ═══════════════════════════════════════════════════════════════════════════════

export function Furniture() {
  const as = useFurnitureToggles({
    corrDoors:     'corr-doors-toggle',
    sdbCloset:     'sdb-closet-toggle',
    cbnWest:       'cbn-west-toggle',
    cbnEast:       'cbn-east-toggle',
    ninja:         'ninja-toggle',
    'bin-toggle':  'bin-toggle',
  });
  const cbZ = KITCHEN_Z + 11 + 18.5; // 489.5
  return (
    <>
      <group position={[KALLAX_DEPTH / 2, 0, w1 / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <KallaxNW item={stub('kallax-nw-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, w2 / 2]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <KallaxNE item={stub('kallax-ne-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* JBL Charge 3 — debout sur le dessus du KallaxNE (h1+h2+Variera=133.5), côté lit */}
      <group position={[ROOM_W - KALLAX_DEPTH / 2, 118, w2 - 11]}>
        <JblCharge3 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[NICHE_X + KALLAX_DEPTH / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <KallaxCuisine item={stub('kallax-sw-stack')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      {/* Poubelle TATAY — angle KallaxCuisine × Mackapar */}
      <group position={[NICHE_X + KALLAX_DEPTH + 18, 0, MACK_Z + w2 / 2 - 6]} rotation-y={Math.PI / 2}>
        <TrashBin item={stub('trash-bin')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, ROOM_D - 60 - w1 / 2]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <KallaxSE item={stub('kallax-se-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[(KITCHEN_X1 + DOOR_START) / 2, 0, (ROOM_D + 10 + KITCHEN_Z) / 2]}>
        <CorridorCloset item={stub('corridor-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[(NICHE_X + DOOR_START) / 2 - 5, 0, BATH_Z_END - 53]}>
        <GrassRug item={stub('grass-rug')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[130, 0, BATH_Z_END]}>
        <SdbCloset item={stub('sdb-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[KITCHEN_X0, 0, ROOM_D]}>
        <CuisineDrona />
      </group>
      <group position={[NICHE_X + 20, 0, cbZ]} userData={{ animUnit: true }}>
        <BathroomCabinetWest item={stub('bathroom-cabinet-west')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[DOOR_START - 31, 0, cbZ]} userData={{ animUnit: true }}>
        <BathroomCabinetEast item={stub('bathroom-cabinet-east')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      {/* Surfaces fixes pour les boîtes Drona — METOD 40×37×60cm et congélateur ~60×57×50cm */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[20, 30, 18.5]} position={[NICHE_X + 20, 30, cbZ]} />
        <CuboidCollider args={[20, 30, 18.5]} position={[DOOR_START - 31, 30, cbZ]} />
        <CuboidCollider args={[27.5, 25, 28.5]} position={[24.5, 25, 269.5]} />
      </RigidBody>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FURNISHINGS — meubles avec état animé (lit, bureaux, TV)
// ═══════════════════════════════════════════════════════════════════════════════

function Bed() {
  const bedPositions = useMemo(() => {
    const PAD = 3, halfL = 102.5, halfW = 41.5;
    const dxK = KALLAX_DEPTH;
    const dxS = ROOM_W - (ROOM_W - 36) + PAD; // SUNNERSTA_NW_X = ROOM_W-36
    const dzT = 243.5 - (w2 + PAD);            // SUNNERSTA_NW_Z = 243.5
    const u    = (dzT - Math.sqrt(dzT * dzT - 4 * dxK * dxS)) / 2;
    const NE_Z = w2 + PAD + u;
    const alpha = Math.atan2(dxK, u);
    return [
      { x: ROOM_W - halfL * Math.cos(alpha) - halfW * Math.sin(alpha),
        z: NE_Z + halfL * Math.sin(alpha) - halfW * Math.cos(alpha), ry: alpha },
      { x: ROOM_W - 83 / 2,  z: 190, ry: Math.PI / 2 },
      { x: ROOM_W - 205 / 2, z: 200, ry: 0           },
    ];
  }, []);

  const [stacked,   setStacked]   = useState(true);
  const [sofa,      setSofa]      = useState(false);
  const [bedPosIdx, setBedPosIdx] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'bedStacked')  setStacked(v => !v);
      if (key === 'bedSofa')     setSofa(v => !v);
      if (key === 'bedPosition') { setSofa(false); setBedPosIdx(i => (i + 1) % 3); }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  const p   = bedPositions[bedPosIdx];
  const pos: [number, number, number] = sofa ? [ROOM_W - 83 / 2, 0, 190] : [p.x, 0, p.z];
  const ry  = sofa ? Math.PI / 2 : p.ry;
  const b2: [number, number, number] = sofa
    ? [46, 0, -(ROOM_W - 83)]
    : [0, stacked ? 23 : 0, stacked ? 0 : -83];

  return (
    <group position={pos} rotation={[0, ry, 0]}
      userData={{ hoverAction: { label: 'Lit Utåker', actions: ['bed-toggle', 'bed-position', 'bed-sofa'] } }}>
      <UtakerFrame item={{ id: 'utaker-lower' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      <group position={b2}>
        <UtakerFrame item={{ id: 'utaker-upper' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}

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
      <group position={[p1.x, 0, p1.z]} rotation={[0, p1.ry, 0]}
        userData={{ animUnit: true, hoverAction: { label: 'Bureau 1', actions: ['desk1-toggle', 'desk1-position'] } }}>
        <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d1H} />
      </group>
      <group position={[p2.x, 0, p2.z]} rotation={[0, p2.ry, 0]} userData={{ animUnit: true, hoverAction: { label: 'Bureau 2', actions: ['desk2-toggle', 'desk2-position'] } }}>
        <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d2H} />
        <group position={[0, d2H, 0]} rotation={[0, Math.PI, 0]}>
          <Laptop item={{} as any} actionState={{}} onSize={() => {}} />
          <group position={[22, 0, 2]} rotation={[0, 0.15, 0]}>
            <Phone item={{} as any} actionState={{}} onSize={() => {}} />
          </group>
          <group position={[-22, 0, -7]}>
            <Mug item={{} as any} actionState={{}} onSize={() => {}} />
          </group>
        </group>
      </group>
    </>
  );
}

export function Furnishings() {
  const TV_Y = WALL_H - 10 - TV_H / 2;
  const as = useFurnitureToggles({ tvOn: 'tv-toggle' });
  return (
    <>
      <Bed />
      <Desks />
      <group position={[ROOM_W - 30, TV_Y, 30]} rotation-order="YXZ"
        rotation={[-Math.PI / 36, (3 * Math.PI) / 4, 0]}>
        <TV item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      {/* Mini PC MLLSE G2 Pro — sur le bureau 2 */}
      <group position={[ROOM_W - 25, 40, 30]}>
        <MllseG2Pro item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATIVE PLACEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Smorkull_() {
  const [posIdx, setPosIdx] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'smorkullPos')
        setPosIdx(i => (i + 1) % SMORKULL_POSITIONS.length);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  const p = SMORKULL_POSITIONS[posIdx];
  return (
    <group position={[p.x, 0, p.z]} rotation-y={p.ry}
      userData={{ animUnit: true, hoverAction: { label: 'Smörkull', actionId: 'smorkull-position' } }}>
      <Smorkull item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function LampOla_() {
  const [lampOn, setLampOn] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.key === 'lampOn') setLampOn(v => !v);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  return (
    <group position={[MEUBLE_T_X, MEUBLE_T_Y, MEUBLE_T_Z]} rotation-y={LAMP_ROT_Y}
      userData={{ animUnit: true, hoverAction: { label: 'Lampe OLA', actionId: 'lamp-toggle' } }}>
      <LampOla item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      {lampOn && <pointLight color={0xfff5e0} intensity={120000} distance={350} decay={2} position={[0, 96, 0]} />}
    </group>
  );
}

function SneakersPair() {
  const [pairW, setPairW] = useState(0);
  const px = MIRROR_CX - 10, pz = ROOM_D - 15;
  return (
    <>
      <group position={[px, 0, pz]} userData={{ animUnit: true }}>
        <Sneakers item={NOOP_ITEM} actionState={NOOP_STATE} onSize={s => setPairW(s.x)} />
      </group>
      <group position={[px + pairW + 3, 0, pz]} userData={{ animUnit: true }}>
        <Sneakers item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

function CeilingPalmLeaves() {
  const placements = useMemo(() => Array.from({ length: 5 }, () => ({
    x:  40 + Math.random() * (ROOM_W - 80),
    z:  40 + Math.random() * (ROOM_D - 80),
    ry: Math.random() * Math.PI * 2,
  })), []);
  return (
    <>
      {placements.map((p, i) => (
        <group key={i} position={[p.x, WALL_H, p.z]} rotation={[Math.PI, p.ry, 0]} userData={{ animUnit: true }}>
          <PalmLeaf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
    </>
  );
}

export function Decor() {
  return (
    <>
      <group position={[lackCX, lackTopY, lackCZ]} rotation={[0, mannRot, 0]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[300, 0, 230]}>
        <AirPerformer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Google Nest Mini — mur EST (B) en son centre, à plat contre le mur */}
      <group position={[ROOM_W - 5, WALL_H / 2, ROOM_D / 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <GoogleNestMini item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[lackCX, lackY, lackCZ]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <LackShelf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[MUL_D, 170, mulCZ]} userData={{ animUnit: true }}>
        <MuligRail item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[110, 1, 500]} userData={{ animUnit: true }}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[300, 1, 202]} userData={{ animUnit: true }}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[14, 0, 210]} rotation-y={Math.PI / 2} userData={{ animUnit: true }}>
        <Dimpa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {[55, 120, 185, 250].map(x => (
        <group key={x} position={[x, 0, -386]} userData={{ animUnit: true }}>
          <Dimpa item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
      <group position={[298, 0, 470]} rotation-y={Math.PI} userData={{ animUnit: true }}>
        <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <Smorkull_ />
      <LampOla_ />
      <group position={[MACK_X, 0, MACK_Z]} rotation-y={Math.PI / 2} userData={{ animUnit: true }}>
        <MackaparGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[297, 144, 173.5]} rotation={[Math.PI / 2, 0, Math.PI / 2]} userData={{ animUnit: true }}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <SneakersPair />
      <CeilingPalmLeaves />
      {[0, 18, 36].map(y => (
        <group key={y} position={[MIRROR_CX, y, ROOM_D - 14]} userData={{ animUnit: true }}>
          <Grejig item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
      <group position={[ROOM_W - 20, 0, 271.5]} rotation-y={Math.PI / 2} userData={{ animUnit: true }}>
        <SunnerstaGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GARDEN — jardin / terrasse
// ═══════════════════════════════════════════════════════════════════════════════

export function Garden() {
  return (
    <>
      <group position={[270, 0, -110]}>
        <ArmrestSofa item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[100, 0, -80]} rotation={[0, Math.PI, 0]}>
        <ArmlessSofa item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[40, 0, -90]}>
        <ChestBench item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[120, 0, -250]} rotation={[0, 1, 0]}>
        <Bathtub item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group userData={{ animUnit: true }}>
        <AltappenRugField />
      </group>
      <group position={[100, 0, -178]} userData={{ animUnit: true }}>
        <Viggja item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[100, 0, -145]} userData={{ animUnit: true }}>
        <PottedPalm item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[260, 0, -250]} userData={{ animUnit: true }}>
        <JoggingSuit item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[180, 0, -120]} rotation={[0, -Math.PI / 4, 0]}
             userData={{ hoverAction: { label: 'Shiba Inu', actionId: 'shiba-replay' } }}>
        <ShibaInu />
      </group>
      <group position={[250, 0, -330]} rotation={[0, Math.PI, 0]}
             userData={{ hoverAction: { label: 'Tente Quechua 2 Seconds 2P' } }}>
        <Tent item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[160, 0, -260]} rotation={[0, -Math.PI / 2, 0]}>
        <Vihals item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKPACKS — sacs à dos procéduraux
// ═══════════════════════════════════════════════════════════════════════════════

export function Backpacks() {
  return (
    <>
      <group position={[300 - 15 / 2, 160, 155]} rotation={[0, -Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <BackpackSmall item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[300 - 17 / 2, 160, 200]} rotation={[0, -Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <Backpack item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[17 / 2, 138, 258]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <Backpack item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRONA — boîtes DRONA standalone (hors cases Kallax)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Les Drona associés à des groupes sont gérés par leurs composants :
//   KallaxNE (7), KallaxSE (4), KallaxNW (4), KallaxCuisine (6), MackaparGroup (2)
// Ce bloc gère les 3 boîtes restantes : 2 sur meubles SDB, 1 sur congélateur.


const DF = 33;
const DRONA_STANDALONE = [
  { cx: DOOR_START - 31, cy: 60 + DF / 2 + 0.2, cz: KITCHEN_Z + 30, rotY: 0 },
  { cx: NICHE_X + 20,    cy: 60 + DF / 2 + 0.2, cz: KITCHEN_Z + 30, rotY: 0 },
  { cx: 24.5,            cy: 50 + DF / 2 + 0.2, cz: 269.5,           rotY: Math.PI / 2 },
];

export function DronaBoxes() {
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => setPhysicsEnabled((e as CustomEvent).detail.enabled as boolean);
    document.addEventListener('physics-toggle', handler);
    return () => document.removeEventListener('physics-toggle', handler);
  }, []);

  return (
    <group userData={{ animUnit: true }}>
      {DRONA_STANDALONE.map((p, i) => (
        <RigidBody key={i} type={physicsEnabled ? 'dynamic' : 'fixed'} colliders={false}
          position={[p.cx, p.cy, p.cz]}
          rotation={[0, p.rotY, 0]}
          restitution={0.2} friction={0.8}
        >
          <CuboidCollider args={[DF / 2, DF / 2, 19]} />
          <DroneCell />
        </RigidBody>
      ))}
    </group>
  );
}
