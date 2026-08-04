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
import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';


import { KallaxNE }      from './items/KallaxNE';
import { KallaxSE }      from './items/KallaxSE';
import { KallaxNW }      from './items/KallaxNW';
import { KallaxCuisine } from './items/KallaxCuisine';
import { CuisineGroup, CuisineDrona, CuisineLillhavet } from './items/CuisineGroup';
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

import { Grejig }        from './items/Grejig';
import { PalmLeaf }      from './items/PalmLeaf';
import { Laptop }        from './items/Laptop';
import { Phone }         from './items/Phone';
import { Mug }           from './items/Mug';
import { Backpack } from './items/Backpack';
// Garden items

import { Vihals }        from './items/Vihals';
import { Rebound }       from './items/Rebound';
import { Linky }         from './items/Linky';
import { LaserDistanceMaster } from './items/LaserDistanceMaster';

import { ArmrestSofa }  from './items/ArmrestSofa';
import { ArmlessSofa }  from './items/ArmlessSofa';
import { Bathtub }      from './items/Bathtub';
import { ChestBench }   from './items/ChestBench';
import { PottedPalm }   from './items/PottedPalm';

import { JoggingSuit }  from './items/JoggingSuit';
import { ShibaInu }    from './items/ShibaInu';
import { Tisken }        from './items/Tisken';
import { Tackan }        from './items/Tackan';
import { Vathult }       from './items/Vathult';
import { DroneCell } from './items/Drona';
import { Dimpa10056770 } from './items/Dimpa10056770';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { useFurnitureToggles } from './utils/useFurnitureToggles';
import { positionState } from '@features/scene/positionState';
import { PositionTransition } from './utils/PositionTransition';

import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_X, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  BATH_Z_END, DOOR_START,
} from '@config';
import { PARTITION_THICKNESS } from './wallData';

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
  { x: 73.5, z: 18,   ry: 0           },
  { x: 22,   z: 74.5, ry: Math.PI / 2 },
  { x: 40,  z: 60,  ry: Math.PI     },
] as const;

const DESK2_POSITIONS = [
  { x: 200, z: 170, ry: Math.PI     },
  { x: 85,  z: 151, ry: Math.PI / 2 },
] as const;

const SMORKULL_POSITIONS = [
  { x: 85,  z: 272, ry: Math.PI / 2  }, // entre le lit Ouest et le Mackapar (avancé de +50X)
  { x: 150, z: 100, ry: Math.PI      },
  { x: 150, z: 300, ry: Math.PI      },
  { x: 240, z: 38,  ry: -Math.PI / 2 }, // devant KallaxNE
];

const AIRPERFORMER_POSITIONS = [
  { x: 261, z: w2 - 10, ry: 0 }, // devant KallaxNE (face x=277, centre z=37.75) — par défaut
  { x: 200, z: 100,    ry: 0 },
];

import { MergedStaticGroup } from './Building';

// ═══════════════════════════════════════════════════════════════════════════════
// EQUIPMENT (Layer 1)
// ═══════════════════════════════════════════════════════════════════════════════

export function Equipment() {
  const as = useFurnitureToggles({ 
    lampSdb: 'lamp-sdb-toggle', 
    lampCouloir: 'lamp-couloir-toggle',
    corrDoors: 'corr-doors-toggle',
    sdbClosetL: 'sdb-closet-l-toggle',
    sdbClosetR: 'sdb-closet-r-toggle',
  });
  const HW_R = 28, HW_H = 65;
  const SDB_CX  = (NICHE_X + DOOR_START) / 2;
  const SDB_CZ  = (KITCHEN_Z + PARTITION_THICKNESS + BATH_Z_END) / 2;
  const CORR_CX = (DOOR_START + ROOM_W) / 2;
  const CORR_CZ = (ROOM_D + KITCHEN_Z) / 2;
  return (
    <>
      <group position={[NICHE_X + HW_R, WALL_H - 10 - HW_H / 2, KITCHEN_Z + 20 + HW_R]} rotation-y={Math.PI / 2} userData={{ side: 'west' }}>
        <WaterHeater item={stub('water-heater')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[KITCHEN_X0, 0, ROOM_D]} userData={{ isIkea: true }}>
        <CuisineGroup item={stub('cuisine-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} noDrona />
      </group>
      <group position={[DOOR_START - 84, 14, KITCHEN_Z + PARTITION_THICKNESS + 24.5]} userData={{ animUnit: true, isIkea: true }}>
        <VasqueSdb item={stub('vasque-sdb')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[NICHE_X + 60, 0, KITCHEN_Z + PARTITION_THICKNESS + 36.5]} userData={{ animUnit: true, isIkea: true }}>
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
      {/* VÅTHULT — bandeau LED 35 cm au-dessus du miroir vasque (top miroir = 174) */}
      <group position={[DOOR_START - 84, 176, KITCHEN_Z + PARTITION_THICKNESS + 2.1]}>
        <Vathult item={stub('vathult-350')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Niche douche 70×70cm : Centre : KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2 + 35 */}
      <group position={[NICHE_X + 35, 0, KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2 + 35]} userData={{ animUnit: true, isIkea: true }}>
        <Shower item={stub('shower')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Gaine plastique couloir mur est — 25.5×6.5 cm, sol au plafond,
          début Z=500 (5m du nord). Linky Enedis monté en façade. */}
      <LinkyGaine />
      <group position={[(KITCHEN_X1 + DOOR_START) / 2, 0, (ROOM_D + 10 + KITCHEN_Z) / 2]}>
        <CorridorCloset item={stub('corridor-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[130.3, 0, BATH_Z_END]}>
        <SdbCloset item={stub('sdb-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ─── LinkyGaine ─────────────────────────────────────────────────────────────
// Coffrage plastique vertical 25.5×6.5×WALL_H, contre mur est du couloir,
// début Z=ROOM_D+5 (5 cm du mur nord du couloir = mur sud séjour).
// Linky Enedis monté en façade à ~130 cm du sol.
const LINKY_GAINE_W   = 6.5;            // X — profondeur (depuis mur est)
const LINKY_GAINE_L   = 25.5;           // Z — largeur le long du mur
const LINKY_GAINE_Z0  = ROOM_D + 10 + 6; // 416 — 6 cm de la face couloir du mur sud séjour (Z=ROOM_D+W=410)
const LINKY_GAINE_X1  = ROOM_W;         // colle au mur est (X=316)
const LINKY_GAINE_X0  = ROOM_W - LINKY_GAINE_W;
const LINKY_GAINE_CX  = (LINKY_GAINE_X0 + LINKY_GAINE_X1) / 2; // 312.75
const LINKY_GAINE_CZ  = LINKY_GAINE_Z0 + LINKY_GAINE_L / 2;    // 512.75
const LINKY_MOUNT_Y   = 170;            // hauteur base du Linky (bas du compteur)
const linkyGaineMat   = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.7, metalness: 0.05 });

function LinkyGaine() {
  return (
    <>
      {/* Coffrage plastique sol→plafond */}
      <mesh position={[LINKY_GAINE_CX, WALL_H / 2, LINKY_GAINE_CZ]} castShadow receiveShadow material={linkyGaineMat}>
        <boxGeometry args={[LINKY_GAINE_W, WALL_H, LINKY_GAINE_L]} />
      </mesh>
      {/* Linky face -X (vers le couloir). GLB front +Z → rotation-y = -π/2.
          Profondeur GLB ≈ 7.1 cm → recule Linky pour que son dos affleure la gaine. */}
      <group position={[LINKY_GAINE_X0 - 7.1 / 2, LINKY_MOUNT_Y, LINKY_GAINE_CZ]} rotation={[0, -Math.PI / 2, 0]}>
        <Linky item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FURNITURE (Layer 2)
// ═══════════════════════════════════════════════════════════════════════════════

export function Furniture() {
  const as = useFurnitureToggles({
    cbnWest:       'cbn-west-toggle',
    cbnEast:       'cbn-east-toggle',
    ninja:         'ninja-toggle',
    'bin-toggle':  'bin-toggle',
  });
  const cbZ = KITCHEN_Z + PARTITION_THICKNESS + 1 + 18.5; // 486.7
  return (
    <>
      <MergedStaticGroup name="merged-furniture">
      <group position={[KALLAX_DEPTH / 2, 0, w1 / 2]} rotation={[0, -Math.PI / 2, 0]} userData={{ isIkea: true }}>
        <KallaxNW item={stub('kallax-nw-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, w2 / 2]} rotation={[0, Math.PI / 2, 0]} userData={{ isIkea: true }}>
        <KallaxNE item={stub('kallax-ne-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* JBL Charge 3 — debout sur le dessus du KallaxNE (h1+h2+Variera=133.5), côté lit */}
      <group position={[ROOM_W - KALLAX_DEPTH / 2, 118, w2 - 11]}>
        <JblCharge3 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* 2 sacs DIMPA contre le mur Ouest, entre le MeubleT et la Drona */}
      <group position={[16, 0, 150]} rotation-y={Math.PI / 2} userData={{ isIkea: true }}>
        <Dimpa10056770 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[16, 0, 205]} rotation-y={Math.PI / 2} userData={{ isIkea: true }}>
        <Dimpa10056770 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[NICHE_X + KALLAX_DEPTH / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]} userData={{ isIkea: true }}>
        <KallaxCuisine item={stub('kallax-sw-stack')} actionState={as} onSize={NOOP_SIZE} />
        {/* Télémètre Laserliner couché à plat dans la Drona bas-droite du 2×2 bas */}
        <group position={[17.5, 6.25, -5]} rotation={[Math.PI / 2, 0, 0]}>
          <LaserDistanceMaster item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>
      {/* Poubelle TATAY — angle KallaxCuisine × Mackapar */}
      <group position={[NICHE_X + KALLAX_DEPTH + 18, 0, MACK_Z + w2 / 2 - 6]} rotation-y={Math.PI / 2}>
        <TrashBin item={stub('trash-bin')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[ROOM_W - KALLAX_DEPTH / 2, 0, ROOM_D - 60 - w1 / 2]} rotation={[0, Math.PI / 2, 0]} userData={{ isIkea: true }}>
        <KallaxSE item={stub('kallax-se-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[(NICHE_X + DOOR_START) / 2 - 5, 0, BATH_Z_END - 53]}>
        <GrassRug item={stub('grass-rug')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[KITCHEN_X0, 0, ROOM_D]} userData={{ isIkea: true }}>
        <CuisineDrona />
      </group>
      <group position={[NICHE_X + 20, 0, cbZ]} userData={{ animUnit: true, isIkea: true }}>
        <BathroomCabinetWest item={stub('bathroom-cabinet-west')} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group position={[DOOR_START - 31, 0, cbZ]} userData={{ animUnit: true, isIkea: true }}>
        <BathroomCabinetEast item={stub('bathroom-cabinet-east')} actionState={as} onSize={NOOP_SIZE} />
      </group>

    </MergedStaticGroup>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FURNISHINGS — meubles avec état animé (lit, bureaux, TV)
// ═══════════════════════════════════════════════════════════════════════════════

function Beds() {
  return (
    <>
      {/* Lit Ouest (haut, principal) — au sol (Y = 0), contre la Drona qui est contre le Mackapar (Z = 137) */}
      <group position={[74, 0, 137]} rotation-y={Math.PI / 2} userData={{ animUnit: true, isIkea: true, hoverAction: { label: 'Lit Utåker Ouest (Principal)' } }}>
        <UtakerFrame item={{ id: 'utaker-upper' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Lit Est (bas, secondaire, amour) — au sol (Y = 0), position fixe mur Est (Z = 190 cm) */}
      <group position={[ROOM_W - 4 - 83 / 2, 0, 190]} rotation-y={Math.PI / 2} userData={{ animUnit: true, isIkea: true, hoverAction: { label: 'Lit Utåker Est (Secondaire)' } }}>
        <UtakerFrame item={{ id: 'utaker-lower' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

function Desks() {
  const [d1H,   setD1H]   = useState(SIT_H);
  const [d2H,   setD2H]   = useState(STAND_H);
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

  useEffect(() => { positionState['desk1-position'] = { idx: d1Pos, total: DESK1_POSITIONS.length }; }, [d1Pos]);
  useEffect(() => { positionState['desk2-position'] = { idx: d2Pos, total: DESK2_POSITIONS.length }; }, [d2Pos]);

  const p1 = DESK1_POSITIONS[d1Pos];
  const p2 = DESK2_POSITIONS[d2Pos];

  return (
    <>
      <PositionTransition x={p1.x} z={p1.z} ry={p1.ry}>
        <group userData={{ animUnit: true, isIkea: true, hoverAction: { label: 'Bureau 1', actions: ['desk1-toggle', 'desk1-position'] } }}>
          <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d1H} />
        </group>
      </PositionTransition>
      <PositionTransition x={p2.x} z={p2.z} ry={p2.ry}>
        <group userData={{ hoverAction: { label: 'Bureau 2', actions: ['desk2-toggle', 'desk2-position'] } }}>
          <group userData={{ animUnit: true, isIkea: true }}>
            <BollsidanDesk item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} height={d2H} />
          </group>
          <group position={[0, d2H, 0]} rotation={[0, Math.PI, 0]}>
            <group userData={{ animUnit: true, isIkea: true }}>
              <Laptop item={{} as any} actionState={{}} onSize={() => {}} />
            </group>
            <group userData={{ animUnit: true, isIkea: true }}>
              <group position={[22, 0, 2]} rotation={[0, 0.15, 0]}>
                <Phone item={{} as any} actionState={{}} onSize={() => {}} />
              </group>
            </group>
            <group userData={{ animUnit: true, isIkea: true }}>
              <group position={[-22, 0, -7]}>
                <Mug item={{} as any} actionState={{}} onSize={() => {}} />
              </group>
            </group>
          </group>
        </group>
      </PositionTransition>
    </>
  );
}

export function Furnishings() {
  const TV_Y = WALL_H - 10 - TV_H / 2;
  const as = useFurnitureToggles({ tvOn: 'tv-toggle' });
  return (
    <>
      <Beds />
      <Desks />
      <>
        <group position={[ROOM_W - 28, TV_Y, 50]} rotation-order="YXZ"
          rotation={[-Math.PI / 36, (3 * Math.PI) / 4, 0]}>
          <TV item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
        </group>
        {/* TACKAN douche — mur fond niche, à côté du mitigeur (y=90) */}
        <group position={[NICHE_X + 40, 80, BATH_Z_END + 69]}>
          <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
        {/* TACKAN lavabo — plan vasque (y=83), contre le miroir */}
        <group position={[DOOR_START - 84 + 15, 83, KITCHEN_Z + PARTITION_THICKNESS + 5]}>
          <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
        {/* TACKAN évier — plan cuisine (y=93), fond à droite de la niche */}
        <group position={[KITCHEN_X0 + 5, 93, KITCHEN_Z - 5]}>
          <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
        {/* LILLHAVET — égouttoir dans le meuble haut cuisine */}
        <group position={[KITCHEN_X0, 0, ROOM_D]}>
          <CuisineLillhavet />
        </group>
        {/* Mini PC MLLSE G2 Pro — sur le bureau 2 */}
        <group position={[ROOM_W - 25, 40, 30]}>
          <MllseG2Pro item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
        {/* TISKEN sur miroir vasque — mi-hauteur, bord gauche et droit */}
        <group position={[DOOR_START - 84 - 22, 129, KITCHEN_Z + PARTITION_THICKNESS + 2.1]} rotation={[Math.PI / 2, 0, 0]}>
          <Tisken item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
        <group position={[DOOR_START - 84 + 22, 129, KITCHEN_Z + PARTITION_THICKNESS + 2.1]} rotation={[Math.PI / 2, 0, 0]}>
          <Tisken item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </>
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
  useEffect(() => { positionState['smorkull-position'] = { idx: posIdx, total: SMORKULL_POSITIONS.length }; }, [posIdx]);
  const p = SMORKULL_POSITIONS[posIdx];
  return (
    <PositionTransition x={p.x} z={p.z} ry={p.ry}>
      <group userData={{ skipMerge: true, animUnit: true, hoverAction: { label: 'Smörkull', actionId: 'smorkull-position' } }}>
        <Smorkull item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </PositionTransition>
  );
}

function AirPerformer_() {
  const [posIdx, setPosIdx] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      if (key === 'airperformer-position') setPosIdx(i => (i + 1) % AIRPERFORMER_POSITIONS.length);
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  useEffect(() => { positionState['airperformer-position'] = { idx: posIdx, total: AIRPERFORMER_POSITIONS.length }; }, [posIdx]);
  const p = AIRPERFORMER_POSITIONS[posIdx];
  return (
    <PositionTransition x={p.x} z={p.z} ry={p.ry}>
      <group userData={{ skipMerge: true, animUnit: true, hoverAction: { label: 'Air Performer', actions: ['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed', 'airperformer-position'] } }}>
        <AirPerformer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </PositionTransition>
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
      userData={{ skipMerge: true, animUnit: true, hoverAction: { label: 'Lampe OLA', actionId: 'lamp-toggle' } }}>
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
  const placements = useMemo(() => Array.from({ length: 1 }, () => ({
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
    <MergedStaticGroup name="merged-decor">
      <group position={[lackCX, lackTopY, lackCZ]} rotation={[0, mannRot, 0]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <AirPerformer_ />{/* PERF TEST — remettre pour réactiver */}
      {/* Google Nest Mini — mur EST (B) en son centre, à plat contre le mur */}
      <group position={[ROOM_W - 5, WALL_H / 2, ROOM_D / 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <GoogleNestMini item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[lackCX, lackY, lackCZ]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true, isIkea: true }}>
        <LackShelf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[MUL_D, 222, mulCZ]} rotation={[0, 0, 0]} userData={{ animUnit: true, isIkea: true }}>
        <MuligRail item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[110, 0.5, 500]} userData={{ animUnit: true, isIkea: true }}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[NICHE_X + KALLAX_DEPTH - 10, 0.5, MACK_Z + 15]} userData={{ animUnit: true, isIkea: true }}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[298, 0, 470]} rotation-y={Math.PI} userData={{ animUnit: true, isIkea: true }}>
        <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <Smorkull_ />
      <LampOla_ />
      <group position={[MACK_X, 0, MACK_Z]} rotation-y={Math.PI / 2} userData={{ isIkea: true }}>
        <MackaparGroup item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
            <SneakersPair />
      <CeilingPalmLeaves />
      <>
        {[0, 18, 36].map(y => (
          <group key={y} position={[MIRROR_CX, y, ROOM_D - 14]} userData={{ animUnit: true, isIkea: true }}>
            <Grejig item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        ))}
      </>
    </MergedStaticGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GARDEN — jardin / terrasse
// ═══════════════════════════════════════════════════════════════════════════════

export function Garden() {
  const as = useFurnitureToggles({
    sofaArmLeft: 'sofa-arm-left',
    sofaArmRight: 'sofa-arm-right',
  });
  return (
    <MergedStaticGroup name="merged-garden">
      <group position={[270, 0, -110]} rotation={[0, Math.PI, 0]}
             userData={{ skipMerge: true, hoverAction: { label: 'Canapé de jardin', actions: ['sofa-arm-left', 'sofa-arm-right'] } }}>
        <ArmrestSofa item={{} as any} actionState={as} onSize={() => {}} />
      </group>
      <group position={[100, 0, -80]} rotation={[0, Math.PI, 0]} userData={{ animUnit: true }}>
        <ArmlessSofa item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[40, 0, -90]} userData={{ animUnit: true }}>
        <ChestBench item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[120, 0, -250]} rotation={[0, 1, 0]} userData={{ animUnit: true }}>
        <Bathtub item={{} as any} actionState={{}} onSize={() => {}} />
      </group>

      <group position={[100, 0, -145]} userData={{ animUnit: true }}>
        <PottedPalm item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[240, 0, -400]} userData={{ animUnit: true }}>
        <JoggingSuit item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
      <group position={[180, 0, -120]} rotation={[0, -Math.PI / 4, 0]}
             userData={{ hoverAction: { label: 'Shiba Inu', actionId: 'shiba-replay' } }}>
        <ShibaInu />
      </group>
      <group position={[52, 0, 326]} rotation={[0, 0, 0]}>
        <Vihals item={{} as any} actionState={{ 'vihals-toggle': true }} onSize={() => {}} />
      </group>
      <group position={[210, -3.48, -200]} rotation={[0, -Math.PI / 5, 0]} userData={{ animUnit: true }}>
        <Rebound item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
    </MergedStaticGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKPACKS — sacs à dos procéduraux
// ═══════════════════════════════════════════════════════════════════════════════

export function Backpacks() {
  return (
    <>
      <group position={[17 / 2, 138, 258]} rotation={[0, Math.PI / 2, 0]} userData={{ animUnit: true }}>
        <Backpack item={{} as any} actionState={{}} onSize={() => {}} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRONA — boîtes DRONA standalone (hors cases Kallax)
// ═══════════════════════════════════════════════════════════════════════════════

const DF = 33;

export function DronaBoxes() {
  const cbZ = KITCHEN_Z + PARTITION_THICKNESS + 1 + 18.5; // 486.7
  const standalone = [
    { cx: DOOR_START - 31, cy: 60 + DF / 2 + 0.2, cz: cbZ, rotY: 0 },
    { cx: NICHE_X + 20,    cy: 60 + DF / 2 + 0.2, cz: cbZ, rotY: 0 },
    { cx: 16.5,            cy: 0 + DF / 2 + 0.2,  cz: 253.5, rotY: Math.PI / 2 },
  ];
  return (
    <group userData={{ isIkea: true }}>
      {standalone.map((p, i) => (
        <group key={i} position={[p.cx, p.cy, p.cz]} rotation={[0, p.rotY, 0]} userData={{ animUnit: true }}>
          <DroneCell />
        </group>
      ))}
    </group>
  );
}
