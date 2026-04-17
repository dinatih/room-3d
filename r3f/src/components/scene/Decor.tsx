/**
 * Decor.tsx — objets décoratifs procéduraux.
 * Port de js/decor/decor.js, js/furniture/meubleT.js,
 * js/furniture/airPerformer.js, js/decor/shoehatrack.js.
 */
import { AirPerformer }  from './items/AirPerformer';
import { Fniss }         from './items/Fniss';
import { LackShelf }     from './items/LackShelf';
import { MannequinHead } from './items/MannequinHead';
import { MeubleT }       from './items/MeubleT';
import { MuligRail }     from './items/MuligRail';
import { ShoeHatRack }   from './items/ShoeHatRack';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '../../utils/sceneItem';

// @ts-ignore
import {
  ROOM_W, ROOM_D,
  NICHE_Z_START,
  KALLAX_DEPTH,
} from '@config';

// Constantes issues de kallax.js
const kallaxW1 = 40.5;  // kallaxW(1)
const kallaxW2 = 75.5;  // kallaxW(2)
const KALLAX_SE_Z   = ROOM_D - 60 - kallaxW1 / 2;  // 319.75
const KALLAX_SE_TOP = 2 * kallaxW2;                  // 151

// ── Meuble TV (BESTÅ bloc) — posé sur Kallax SE ───────────────────────────────

function MeubleTPlaced() {
  const D  = 27.5;
  const wx = ROOM_W - D / 2;  // 286.25
  return (
    <group position={[wx, KALLAX_SE_TOP, KALLAX_SE_Z]} rotation={[0, -Math.PI / 2, 0]}>
      <MeubleT item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Purificateur d'air (Philips Air Performer) ────────────────────────────────

function AirPerformerPlaced() {
  return (
    <group position={[287.5, 0, 230]}>
      <AirPerformer item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Decor() {
  // Étagère LACK (mur A) : profondeur 26cm, largeur 110cm, Y bas = 187.5
  const lackY  = 187.5;
  const lackCX = 26 / 2;                    // 13 — centre de profondeur
  const lackCZ = NICHE_Z_START - 110 / 2;  // 225 — centre de largeur

  // Mannequin posé sur LACK (top = 192.5)
  const lackTopY = lackY + 5;
  const mannRot  = Math.atan2(150 - lackCX, 200 - lackCZ);

  // Tringle MULIG : barre à X=26, Y=230 (WALL_H-20), Z=130
  // items/MuligRail : barre à local (0, RAIL_Y=60, 0) → groupe à (26, 230-60, 130)
  const MUL_D       = 26;
  const MUL_MOUNT_Y = 230;  // WALL_H - 20
  const MUL_RAIL_Y  = 60;   // offset interne MuligRail
  const mulCZ       = NICHE_Z_START - 110 - 80 / 2;  // 130

  // Mannequin sur Kallax NW
  const k14Top    = kallaxW2 + kallaxW1 * 2;  // 121.5
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
      {/* ── Étagère LACK (mur A) ── */}
      {/* items/LackShelf : X=largeur(110), Z=profondeur(26) → rotation-y π/2 */}
      <group position={[lackCX, lackY, lackCZ]} rotation={[0, Math.PI / 2, 0]}>
        <LackShelf item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* ── Tringle MULIG ── */}
      {/* items/MuligRail : barre à local X=0, côté mur à local X=-MUL_D */}
      <group position={[MUL_D, MUL_MOUNT_Y - MUL_RAIL_Y, mulCZ]}>
        <MuligRail item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* ── Corbeilles FNISS ── */}
      <group position={[110, 0, 500]}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[286, 0, 202]}>
        <Fniss item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* ── Mannequins ── */}
      <group position={[lackCX, lackTopY, lackCZ]} rotation={[0, mannRot, 0]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={nwMannWorld} rotation={[0, nwMannRot, 0]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <group position={[282, 90, 271.5]}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* ── Meuble TV + Purificateur d'air ── */}
      <MeubleTPlaced />
      <AirPerformerPlaced />

      {/* ── Range-chaussures/chapeaux ── */}
      <group position={[300, 0, 340]} rotation={[0, -Math.PI / 2, 0]}>
        <ShoeHatRack item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}
