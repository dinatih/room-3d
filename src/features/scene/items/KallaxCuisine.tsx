/**
 * KallaxCuisine.tsx — Tour Kallax cuisine (niche mur Sud, coin mur Ouest).
 * Composant auto-contenu : 3 Kallax empilés + 4 boîtes Drona dans le bas.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx.
 * Utilisé aussi dans l'inventaire (Espaces de rangement) via registry.ts.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Kallax2x1 }     from './Kallax2x1';
import { Kallax2x2 }     from './Kallax2x2';
import { Kallax2x2Spec } from './Kallax2x2Spec';
import { NinjaSP101 } from './NinjaSP101';
import { DroneCell } from './Drona';
import { SlidingDrona } from './SlidingDrona';
import { LaserDistanceMaster } from './LaserDistanceMaster';
import { KALLAX_CUISINE_DRONA_POSITIONS, KITCHEN_DRONA_ITEMS } from './kallaxCuisineDrona';
import { SPECIAL_DRONA_SLIDE_DURATION } from './dronaStorage';
import { NOOP_ITEM, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34;
const th   = (rows: number) => rows * NH  + 2 * TF + (rows - 1) * TI;
const h1   = th(1);              // 41
const h2   = th(2);              // 76.5
const PIZZA_Y = h2 + h2 / 2 + TI / 2;  // 115.5 — position four pizza

// ── Composant principal ───────────────────────────────────────────────────────

const DRONA_ITEMS = Object.entries(KITCHEN_DRONA_ITEMS);

export function KallaxCuisineDrona({ isPreview = false, actionState = {} }: { isPreview?: boolean; actionState?: Record<string, any> } = {}) {
  return (
    <>
      {/* DRONA Instances individuelles pour animation (6 Drona : 4 dans le 2x2 bas + 2 sur le dessus) */}
      {KALLAX_CUISINE_DRONA_POSITIONS.map((position, i) => {
        const target = DRONA_ITEMS.find(([, item]) => item.index === i);
        return (
          <group key={i} name={`drona-kitchen-cell-${i}`} position={position} userData={{ sceneItemRoot: true }}>
            {target ? <SlidingDrona objectId={target[0]} label={target[1].label} actionId={target[1].action} duration={SPECIAL_DRONA_SLIDE_DURATION} isPreview={isPreview} actionState={actionState}>
              {target[0] === 'drona-kitchen-old-it' && <group name="drona-kitchen-old-it-laser" position={[0, 6.25 - position[1], -5]} rotation={[Math.PI / 2, 0, 0]} userData={{ sceneItemRoot: true, itemName: 'Télémètre Laserliner' }}>
                <LaserDistanceMaster />
              </group>}
            </SlidingDrona> : <DroneCell />}
          </group>
        );
      })}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxCuisine({ onSize, actionState, noDrona, isPreview = false }: SceneItemProps & { noDrona?: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref} rotation-y={isPreview ? Math.PI : 0}>
      {/* 2×2 bas — PY = h2 */}
      <group position={[0, h2, 0]} userData={{ sceneItemRoot: true }}>
        <Kallax2x2 />
      </group>
      {/* 2×2 spec (sans barre haute) — PY = 2×h2 */}
      <group position={[0, h2 + h2, 0]} userData={{ sceneItemRoot: true }}>
        <Kallax2x2Spec />
      </group>
      {/* 2×1 haut — PY = 2×h2 + h1 */}
      <group position={[0, h2 + h2 + h1, 0]} userData={{ sceneItemRoot: true }}>
        <Kallax2x1 />
      </group>
      
      {!noDrona && <KallaxCuisineDrona isPreview={isPreview} actionState={actionState} />}

      {/* Mini four Ninja SP101EU — dans la case basse du 2×2 spec */}
      <group position={[-8, PIZZA_Y, 0]} rotation-y={Math.PI} userData={{ sceneItemRoot: true }}>
        <NinjaSP101 item={NOOP_ITEM} actionState={actionState} onSize={NOOP_SIZE} isPreview={isPreview} />
      </group>
    </group>
  );
}
