/**
 * GlbItems.tsx — placement monde des objets GLB.
 * Les composants items/ gèrent tout le setup GLB (scale, centre, matériaux, shadows).
 * Les fonctions *Placed ici ne font que le positionnement monde via group.
 */
import { useState, useEffect } from 'react';
import { Scooter }   from './items/Scooter';
import { Smorkull }  from './items/Smorkull';
import { LampOla }   from './items/LampOla';
import { Sunnersta } from './items/Sunnersta';
import { Mackapar }  from './items/Mackapar';
import { Salopette } from './items/Salopette';
import { BaseballCap } from './items/BaseballCap';
import { PizzaOven }  from './items/PizzaOven';
import { Sneakers }   from './items/Sneakers';

// @ts-ignore
import { ROOM_W, ROOM_D, NICHE_DEPTH } from '@config';

const NOOP_SIZE  = () => {};
const NOOP_ITEM  = {} as any;
const NOOP_STATE = {};

// Kallax constants (mirrored from Furniture.tsx)
const KALLAX_DEP = 39;
const KALLAX_TI  = 1.5;
const kallaxH2   = 76.5;  // th(2)
const kallaxW2   = 75.5;  // tw(2)

// Pizza oven — Kallax SW spec shelf top
// shelfTopY = h2 + h2/2 + TI/2 (top surface of the mid-shelf inside the spec 2×2)
const PIZZA_X = -NICHE_DEPTH + KALLAX_DEP / 2;       // 9.5
const PIZZA_Z = ROOM_D - kallaxW2 / 2;               // 362.25
const PIZZA_Y = kallaxH2 + kallaxH2 / 2 + KALLAX_TI / 2; // 115.5
const KALLAX_SE_Z   = ROOM_D - 60 - 40.5 / 2;  // 319.75
const KALLAX_SE_TOP = 2 * kallaxW2;             // 151
const MEUBLE_T_D   = 27.5;
const MEUBLE_T_H   = 55;
const MEUBLE_T_X   = ROOM_W - MEUBLE_T_D / 2;  // 286.25
const MEUBLE_T_Z   = KALLAX_SE_Z;              // 319.75
const MEUBLE_T_Y   = KALLAX_SE_TOP;            // 151

// Lampe orientée vers le centre du salon
const LAMP_ROT_Y = Math.atan2(ROOM_W / 2 - MEUBLE_T_X, ROOM_D / 2 - MEUBLE_T_Z);

// Centre monde du portant MACKAPÄR
// posX = -NICHE_DEPTH + PLINTHE + mackapar_depth/2 ≈ -10 + 3.5 + 38.5 = 32
// posZ = ROOM_D - kallaxW2 - 16 ≈ 308.5
const MACK_X = -NICHE_DEPTH + 3.5 + 38.5; // ≈ 32
const MACK_Z = ROOM_D - kallaxW2 - 16;    // ≈ 308.5
const RAIL_Y = 165;

// ── Trottinette Xiaomi ────────────────────────────────────────────────────────

function ScooterPlaced() {
  return (
    <group position={[282, 0, 460]} rotation-y={Math.PI}>
      <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Chaise SMÖRKULL ───────────────────────────────────────────────────────────

function SmorkullPlaced() {
  return (
    <group position={[30, 0, 151]} rotation-y={Math.PI / 2}>
      <Smorkull item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Lampe OLA ─────────────────────────────────────────────────────────────────

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

// ── Desserte SUNNERSTA ────────────────────────────────────────────────────────

function SunnerstaplPlaced() {
  return (
    <group position={[ROOM_W - 20, 0, 271.5]} rotation-y={Math.PI / 2}>
      <Sunnersta item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Portant MACKAPÄR + habits ─────────────────────────────────────────────────

function MackaparGroupPlaced() {
  return (
    <>
      {/* Portant — items/Mackapar gère scale + centre */}
      <group position={[MACK_X, 0, MACK_Z]} rotation-y={Math.PI / 2}>
        <Mackapar item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Salopette — items/Salopette gère scale + centre */}
      <group position={[MACK_X - 50, RAIL_Y - 120, MACK_Z]} rotation-y={Math.PI / 2}>
        <Salopette item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Casquettes baseball (mur B + mannequin Sunnersta) ────────────────────────

const SUNNERSTA_HEAD_TOP = 90 + 8 + 8 + 8.9 * 1.15; // ≈ 125.2 (world Y)

function BaseballCapsPlaced() {
  return (
    <>
      {/* Cap 1 — mur B au-dessus du lit (rx=π/2, rz=π/2) */}
      <group position={[297, 144, 173.5]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Cap 2 — tête mannequin Sunnersta (ry=π, scale×0.9) */}
      <group position={[282, SUNNERSTA_HEAD_TOP + 2, 271.5]} rotation-y={Math.PI}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// ── Four à pizza — Kallax SW spec, étagère supérieure ────────────────────────
// Fidèle à js/decor/decor.js : position monde (k25CX, shelfTopY, k25CZ)

function PizzaOvenPlaced() {
  return (
    <group position={[PIZZA_X, PIZZA_Y, PIZZA_Z]}>
      <PizzaOven item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Sneakers (2 paires devant mur D) ─────────────────────────────────────────

const MIRROR_CX = (130 + 190) / 2; // KITCHEN_X1=130, DOOR_START=190

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

// ── Export principal ──────────────────────────────────────────────────────────

export function GlbItems() {
  return (
    <>
      <ScooterPlaced />
      <SmorkullPlaced />
      <LampOlaPlaced />
      <SunnerstaplPlaced />
      <MackaparGroupPlaced />
      <BaseballCapsPlaced />
      <SneakersPlaced />
      <PizzaOvenPlaced />
    </>
  );
}

