/**
 * DoorsPlaced.tsx — portes placées en coordonnées monde.
 * Utilise les composants items/ (DoorLiving, DoorSdb, DoorEntry) et les
 * place aux positions exactes de la scène, en écoutant les toggles studio.
 *
 * Remplace structure/Doors.tsx (supprimé).
 *
 * Calcul de placement (wrapper rotY=θ, item pivot local = [px, -H/2, 0]) :
 *   world_hinge = wrapper_pos + R_y(θ) * [px, -H/2, 0]
 *   → wrapper_pos = [hx - px*cosθ, H/2, hz - px*sinθ]  (wy = H/2 car world_hinge_y = 0)
 *
 *   DoorLiving : pivotX=+W/2, θ=0      → wrapper=(DOOR_END−W/2+6,  H/2, ROOM_D+4.5)
 *   DoorSdb    : pivotX=−W/2, θ=+π/2  → wrapper=(WALL_X,         H/2, hingeZ−W/2)
 *   DoorEntry  : pivotX=−W/2, θ=diagRotY−π/2 → calculé dans useMemo
 *               (items/ panel extends +X, structure/ expected +Z → −π/2 correction)
 */
import { useState, useEffect, useMemo } from 'react';
import { DoorLiving, DoorSdb } from './items/DoorWhite';
import { DoorEntry }            from './items/DoorEntry';
import { NOOP_ITEM, NOOP_SIZE } from '@shared/utils/sceneItem';

import {
  ROOM_D, DOOR_END, DOOR_START, SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

const W_D   = 83;   // largeur porte blanche (DOOR_W)
const W_E   = 90;   // largeur porte entrée (ENTRY_DOOR_W)
const H_D   = 204;  // hauteur commune (DOOR_H)
const WALL_X = DOOR_START - 5; // X du mur SDB = 185

// ── Porte séjour ─────────────────────────────────────────────────────────────

function LivingDoorPlaced() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== 'livingDoor') return;
      setAs(prev => ({ ...prev, 'living-door-toggle': !prev['living-door-toggle'] }));
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  return (
    <group
      position={[DOOR_END - W_D / 2 + 6, H_D / 2, ROOM_D + 4.5]}
      userData={{ hoverAction: { label: 'Porte séjour', actionId: 'livingDoor' } }}>
      <DoorLiving item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Porte SDB ─────────────────────────────────────────────────────────────────
// pivotX = −W/2, wrapper rotY = +π/2 → world hinge Z = wz + W/2
// hingeZ = SDB_Z_END − 10 = 590 → wz = 590 − W/2 = 548.5

function BathroomDoorPlaced() {
  const [as, setAs] = useState<Record<string, boolean>>({});
  const hingeZ = SDB_Z_END - 10;
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== 'bathroomDoor') return;
      setAs(prev => ({ ...prev, 'bathroom-door-toggle': !prev['bathroom-door-toggle'] }));
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);
  return (
    <group
      position={[WALL_X, H_D / 2, hingeZ - W_D / 2]}
      rotation-y={Math.PI / 2}
      userData={{ hoverAction: { label: 'Porte SDB', actionId: 'bathroomDoor' } }}>
      <DoorSdb item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Porte entrée ──────────────────────────────────────────────────────────────
// Positionnement sur le mur diagonal — même calcul que l'ancien Doors.tsx.

function EntryDoorPlaced() {
  const [as, setAs] = useState<Record<string, boolean>>({});

  const { wx, wy, wz, diagRotY } = useMemo(() => {
    const diagDX  = DIAG_CX - DIAG_AX;
    const diagDZ  = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ    = diagDX / diagLen;
    const cosθ    = diagDZ / diagLen;
    const originX = DIAG_AX + 5 * cosθ;
    const originZ = DIAG_AZ - 5 * sinθ;
    const dR      = Math.atan2(diagDX, diagDZ);
    const cosR    = Math.cos(dR);
    const sinR    = Math.sin(dR);
    const E_DOOR_START = 10;
    const hingeX  = originX + E_DOOR_START * sinθ;
    const hingeZ  = originZ + E_DOOR_START * cosθ;
    // items/DoorEntry panel extends in local +X; structure/ expected +Z → wrapper rotY = dR − π/2
    // R_y(dR−π/2)·[−W/2,−H/2,0] = [−W/2·sinR, −H/2, −W/2·cosR]
    // wrapper_pos = [hingeX + W/2·sinR, H/2, hingeZ + W/2·cosR]
    return {
      wx:      hingeX + W_E / 2 * sinR,
      wy:      H_D / 2,
      wz:      hingeZ + W_E / 2 * cosR,
      diagRotY: dR - Math.PI / 2,
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== 'entryDoor') return;
      setAs(prev => ({ ...prev, 'entry-door-toggle': !prev['entry-door-toggle'] }));
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  return (
    <group
      position={[wx, wy, wz]}
      rotation-y={diagRotY}
      userData={{ hoverAction: { label: 'Porte entrée', actionId: 'entryDoor' } }}>
      <DoorEntry item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
    </group>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function DoorsPlaced() {
  return (
    <>
      <LivingDoorPlaced />
      <BathroomDoorPlaced />
      <EntryDoorPlaced />
    </>
  );
}
