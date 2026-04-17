/**
 * Placements.tsx — positionnement monde de tous les objets décoratifs.
 * Deux exports correspondant aux deux groupes de layers dans Studio.tsx :
 *  - FurniturePlacements  → group visible={layers.furniture}
 *  - GlbPlacements        → group visible={layers.glb}
 *
 * La distinction GLB / procédural est un artefact du port initial :
 * tous les items utilisent maintenant des composants items/ uniformes.
 */
import { useState, useEffect } from 'react';
import { AirPerformer }  from './items/AirPerformer';
import { BaseballCap }   from './items/BaseballCap';
import { Fniss }         from './items/Fniss';
import { LackShelf }     from './items/LackShelf';
import { LampOla }       from './items/LampOla';
import { Mackapar }      from './items/Mackapar';
import { MannequinHead } from './items/MannequinHead';
import { MeubleT }       from './items/MeubleT';
import { MuligRail }     from './items/MuligRail';
import { PizzaOven }     from './items/PizzaOven';
import { Salopette }     from './items/Salopette';
import { Scooter }       from './items/Scooter';
import { ShoeHatRack }   from './items/ShoeHatRack';
import { Smorkull }      from './items/Smorkull';
import { Sneakers }      from './items/Sneakers';
import { Sunnersta }     from './items/Sunnersta';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '../../utils/sceneItem';

// @ts-ignore
import { ROOM_W, ROOM_D, NICHE_Z_START, NICHE_DEPTH, KALLAX_DEPTH } from '@config';

// ── Constantes Kallax ─────────────────────────────────────────────────────────

const kallaxW1 = 40.5;
const kallaxW2 = 75.5;

const KALLAX_SE_Z   = ROOM_D - 60 - kallaxW1 / 2;  // 319.75
const KALLAX_SE_TOP = 2 * kallaxW2;                  // 151

// ── Constantes GlbItems ───────────────────────────────────────────────────────

const KALLAX_DEP = 39;
const KALLAX_TI  = 1.5;
const kallaxH2   = 76.5;

const PIZZA_X = -NICHE_DEPTH + KALLAX_DEP / 2;
const PIZZA_Z = ROOM_D - kallaxW2 / 2;
const PIZZA_Y = kallaxH2 + kallaxH2 / 2 + KALLAX_TI / 2;

const MEUBLE_T_D = 27.5;
const MEUBLE_T_H = 55;
const MEUBLE_T_X = ROOM_W - MEUBLE_T_D / 2;
const MEUBLE_T_Z = KALLAX_SE_Z;
const MEUBLE_T_Y = KALLAX_SE_TOP;

const LAMP_ROT_Y = Math.atan2(ROOM_W / 2 - MEUBLE_T_X, ROOM_D / 2 - MEUBLE_T_Z);

const MACK_X  = -NICHE_DEPTH + 3.5 + 38.5;
const MACK_Z  = ROOM_D - kallaxW2 - 16;
const RAIL_Y  = 165;

const MIRROR_CX        = (130 + 190) / 2;
const SUNNERSTA_HEAD_TOP = 90 + 8 + 8 + 8.9 * 1.15;

// ═══════════════════════════════════════════════════════════════════════════════
// FURNITURE PLACEMENTS  (layers.furniture)
// ═══════════════════════════════════════════════════════════════════════════════

function MeubleTPlaced() {
  const D  = 27.5;
  const wx = ROOM_W - D / 2;
  return (
    <group position={[wx, KALLAX_SE_TOP, KALLAX_SE_Z]} rotation={[0, -Math.PI / 2, 0]}>
      <MeubleT item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

function AirPerformerPlaced() {
  return (
    <group position={[287.5, 0, 230]}>
      <AirPerformer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

export function FurniturePlacements() {
  const lackY  = 187.5;
  const lackCX = 26 / 2;
  const lackCZ = NICHE_Z_START - 110 / 2;

  const lackTopY = lackY + 5;
  const mannRot  = Math.atan2(150 - lackCX, 200 - lackCZ);

  const MUL_D       = 26;
  const MUL_MOUNT_Y = 230;
  const MUL_RAIL_Y  = 60;
  const mulCZ       = NICHE_Z_START - 110 - 80 / 2;

  const k14Top    = kallaxW2 + kallaxW1 * 2;
  const k14CX     = KALLAX_DEPTH / 2;
  const k14CZ     = kallaxW1 / 2;
  const nwMannRot = Math.atan2(150 - k14CX, 200 - k14CZ) + Math.PI / 2;
  const nwMannWorld: [number, number, number] = [
    KALLAX_DEPTH / 2 - k14CZ,
    k14Top,
    kallaxW1 / 2 + k14CX,
  ];

  return (
    <>
      <group position={[lackCX, lackY, lackCZ]} rotation={[0, Math.PI / 2, 0]}>
        <LackShelf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[MUL_D, MUL_MOUNT_Y - MUL_RAIL_Y, mulCZ]}>
        <MuligRail item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[110, 0, 500]}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[286, 0, 202]}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[lackCX, lackTopY, lackCZ]} rotation={[0, mannRot, 0]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={nwMannWorld} rotation={[0, nwMannRot, 0]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[282, 90, 271.5]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <MeubleTPlaced />
      <AirPerformerPlaced />

      <group position={[300, 0, 340]} rotation={[0, -Math.PI / 2, 0]}>
        <ShoeHatRack item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLB PLACEMENTS  (layers.glb)
// ═══════════════════════════════════════════════════════════════════════════════

// pos 0 : devant bureau 2, face mur B (fenêtre)
// pos 1 : espace détente, face mur C (nord)
// pos 2 : séjour milieu
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

export function GlbPlacements() {
  return (
    <>
      <group position={[282, 0, 460]} rotation-y={Math.PI}>
        <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <SmorkullPlaced />

      <LampOlaPlaced />

      <group position={[ROOM_W - 20, 0, 271.5]} rotation-y={Math.PI / 2}>
        <Sunnersta item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <group position={[MACK_X, 0, MACK_Z]} rotation-y={Math.PI / 2}>
        <Mackapar item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[MACK_X - 50, RAIL_Y - 120, MACK_Z]} rotation-y={Math.PI / 2}>
        <Salopette item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Cap 1 — mur B au-dessus du lit */}
      <group position={[297, 144, 173.5]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Cap 2 — tête mannequin Sunnersta */}
      <group position={[282, SUNNERSTA_HEAD_TOP + 2, 271.5]} rotation-y={Math.PI}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <SneakersPlaced />

      <group position={[PIZZA_X, PIZZA_Y, PIZZA_Z]}>
        <PizzaOven item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}
