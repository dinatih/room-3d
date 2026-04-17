/**
 * Cuisine — plan de travail, évier, plaques, meuble haut.
 * Le meuble évier et le frigo sont des items séparés (items/KitchenCabinet,
 * items/Fridge) placés par Furniture.tsx.
 */
import * as THREE from 'three';

// @ts-ignore
import { KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, ROOM_D } from '@config';

import { Counter }      from '../items/Counter';
import { SinkBoholmen } from '../items/SinkBoholmen';
import { Stove }        from '../items/Stove';

// ── Constantes ────────────────────────────────────────────────────────────────

const COUNTER_H    = 90;
const COUNTER_SLAB = 3;
const KIT_W        = KITCHEN_X1 - KITCHEN_X0;   // 100
const KIT_D        = KITCHEN_DEPTH;              // 60
const CABINET_W    = 40;
const FRIDGE_W     = 60;

// Stubs — seul id est utilisé, onSize no-op (taille déjà connue dans la scène)
const noop = () => {};
const stub = (id: string) => ({ id } as any);
const AS   = {};

// ── Meuble haut (ouvert, sans porte ni fond) ──────────────────────────────────

const hcMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35 });

function UpperCabinet() {
  const HC_W = KIT_W;   // 100
  const HC_H = 40;
  const HC_D = 40;
  const P    = 1.5;
  const y0   = COUNTER_H + COUNTER_SLAB + 60; // 153
  const cx   = KITCHEN_X0 + KIT_W / 2;         // 80
  const cz   = ROOM_D + KITCHEN_DEPTH - HC_D / 2; // 440

  return (
    <group>
      <mesh position={[cx, y0 + HC_H - P / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      <mesh position={[cx, y0 + P / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      <mesh position={[cx, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[HC_W, P, HC_D]} />
      </mesh>
      <mesh position={[cx - HC_W / 2 + P / 2, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[P, HC_H, HC_D]} />
      </mesh>
      <mesh position={[cx + HC_W / 2 - P / 2, y0 + HC_H / 2, cz]} castShadow material={hcMat}>
        <boxGeometry args={[P, HC_H, HC_D]} />
      </mesh>
    </group>
  );
}

// ── Export principal ──────────────────────────────────────────────────────────

export function Kitchen() {
  const counterCX = KITCHEN_X0 + KIT_W / 2;
  const counterY  = COUNTER_H;
  const counterCZ = ROOM_D + KIT_D / 2;

  const sinkCX = KITCHEN_X0 + CABINET_W / 2;
  const sinkY  = COUNTER_H + COUNTER_SLAB;
  const sinkCZ = ROOM_D + KIT_D / 2;

  const stoveCX = KITCHEN_X0 + CABINET_W + FRIDGE_W / 2;
  const stoveY  = COUNTER_H + COUNTER_SLAB;
  const stoveCZ = ROOM_D + KIT_D / 2;

  return (
    <>
      <group position={[counterCX, counterY, counterCZ]}>
        <Counter item={stub('counter')} actionState={AS} onSize={noop} />
      </group>

      <group position={[sinkCX, sinkY, sinkCZ]}>
        <SinkBoholmen item={stub('sink-boholmen')} actionState={AS} onSize={noop} />
      </group>

      <group position={[stoveCX, stoveY, stoveCZ]}>
        <Stove item={stub('stove')} actionState={AS} onSize={noop} />
      </group>

      <UpperCabinet />
    </>
  );
}
