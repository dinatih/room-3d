/**
 * CuisineGroup.tsx — plan de travail, évier, plaques, frigo, meuble bas, meuble haut + 3 Drona.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ autour de KITCHEN_X0.
 * Placement monde : wrapper group dans Furniture.tsx
 *   → position=[KITCHEN_X0, 0, ROOM_D] = [30, 0, 400], sans rotation
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Counter }        from './Counter';
import { SinkBoholmen }   from './SinkBoholmen';
import { Stove }          from './Stove';
import { KitchenCabinet } from './KitchenCabinet';
import { Fridge }         from './Fridge';
import { DronaInstances } from './Drona';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/utils/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes ────────────────────────────────────────────────────────────────
// Wrapper world pos: (KITCHEN_X0=30, 0, ROOM_D=400)
// KIT_W = KITCHEN_X1 - KITCHEN_X0 = 100, KIT_D = KITCHEN_DEPTH = 60

const KIT_W       = 100;
const KIT_D       = 60;
const COUNTER_H   = 90;
const COUNTER_SLAB = 3;
const CABINET_W   = 40;
const FRIDGE_W    = 60;

// ── Meuble haut ───────────────────────────────────────────────────────────────

const hcMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35 });

function UpperCabinet() {
  const HC_W = KIT_W;
  const HC_H = 40;
  const HC_D = 40;
  const P    = 1.5;
  // Local coords (wrapper at (30, 0, 400)):
  //   world cx=80, cz=440  → local cx=50, cz=40
  const y0  = COUNTER_H + COUNTER_SLAB + 60; // 153
  const cx  = KIT_W / 2;                      // 50
  const cz  = KIT_D - HC_D / 2;               // 40

  return (
    <group>
      {/* Dessus */}
      <mesh position={[cx, y0 + HC_H - P / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      {/* Dessous */}
      <mesh position={[cx, y0 + P / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      {/* Tablette milieu */}
      <mesh position={[cx, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      {/* Côté gauche */}
      <mesh position={[cx - HC_W / 2 + P / 2, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[P, HC_H, HC_D]} />
      </mesh>
      {/* Côté droit */}
      <mesh position={[cx + HC_W / 2 - P / 2, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[P, HC_H, HC_D]} />
      </mesh>
    </group>
  );
}

// ── Drona (3 boîtes sur le meuble haut) ──────────────────────────────────────
// World: x=[46.75, 80, 113.25], y=211.7, z=440.5, rotY=π
// Local (wrapper at (30,0,400)): x=[16.75, 50, 83.25], y=211.7, z=40.5, rotY=π

const DF       = 33;
const rot90    = new THREE.Matrix4().makeRotationY(Math.PI / 2);

const KIT_W_FULL = 100;
const gap        = (KIT_W_FULL - 3 * DF) / 4;  // 0.25

const DRONA_MATRICES = [0, 1, 2].map(i => {
  const x = gap + DF / 2 + i * (DF + gap);      // 16.75, 50, 83.25
  return rot90.clone().setPosition(x, 195 + DF / 2 + 0.2, KIT_D - 38 / 2 - 0.5);
  //                                                         40.5
});

// ── Composant principal ───────────────────────────────────────────────────────

/** Drona layer seul — pour placement dans un layer séparé (furniture). */
export function CuisineDrona() {
  return <DronaInstances matrices={DRONA_MATRICES} />;
}

export function CuisineGroup({ onSize, noDrona }: SceneItemProps & { noDrona?: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  // Local positions (wrapper at (KITCHEN_X0=30, 0, ROOM_D=400)):
  //   Counter      : (KIT_W/2, COUNTER_H, KIT_D/2)           = (50, 90, 30)
  //   Sink         : (CABINET_W/2, COUNTER_H+SLAB, KIT_D/2)  = (20, 93, 30)
  //   Stove        : (CABINET_W+FRIDGE_W/2, …, KIT_D/2)      = (70, 93, 30)
  //   KitchenCab   : (CABINET_W/2, 45, KIT_D/2)              = (20, 45, 30)
  //   Fridge       : (CABINET_W+FRIDGE_W/2, 45, KIT_D/2)     = (70, 45, 30)

  return (
    <group ref={ref}>
      {/* Plan de travail */}
      <group position={[KIT_W / 2, COUNTER_H, KIT_D / 2]}>
        <Counter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Évier — bord arrière à 10.5 cm du fond de niche (Z=60) */}
      <group position={[CABINET_W / 2, COUNTER_H + COUNTER_SLAB - 15, 26]}>
        <SinkBoholmen item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Plaques */}
      <group position={[CABINET_W + FRIDGE_W / 2, COUNTER_H + COUNTER_SLAB - 4.5, KIT_D / 2]} rotation={[0, -Math.PI, 0]}>
        <Stove item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Meuble sous évier */}
      <group position={[CABINET_W / 2, 10, KIT_D / 2]}>
        <KitchenCabinet item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Réfrigérateur */}
      <group position={[CABINET_W + FRIDGE_W / 2, 0, KIT_D / 2]}>
        <Fridge item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* Meuble haut */}
      <UpperCabinet />

      {/* 3 boîtes Drona sur le meuble haut */}
      {!noDrona && <DronaInstances matrices={DRONA_MATRICES} />}
    </group>
  );
}
