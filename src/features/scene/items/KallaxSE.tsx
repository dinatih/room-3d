/**
 * KallaxSE.tsx — Tour Kallax sud-est avec congélateur et porte-chaussures accolés.
 * Composant auto-contenu : 2× Kallax 2×1 posés sur le côté + 4 boîtes Drona.
 *
 * Les Kallax sont pivotés rotZ=π/2 (largeur devient hauteur).
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=+π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Kallax2x1 }      from './Kallax2x1';
import { ShoeHatRack }    from './ShoeHatRack';
import { DroneCell } from './Drona';
import { Freezer }        from './Freezer';
import type { SceneItemProps } from '@shared/types';
import { SlidingDrona } from './SlidingDrona';
import { KALLAX_SE_DRONA_POSITIONS, DRONA_SE_ITEMS } from './kallaxSeDrona';
import { DRONA_SPECIAL_ITEMS, SPECIAL_DRONA_SLIDE_DURATION } from './dronaStorage';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34, NW_K = 33.5;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const tw = (cols: number) => cols * NW_K + 2 * TF + (cols - 1) * TI;
const w2 = tw(2); // 75.5
const h1 = th(1); // 41  ← devient la profondeur visuelle une fois pivoté
const FREEZER_H = 50; // Hauteur du congélateur CHIQ au sol

// Positions en espace root (rotY=π/2).
// k1 center Y = FREEZER_H + w2/2 ; k2 center Y = FREEZER_H + w2 + w2/2 ; cells ±17.5

const DRONA_ITEMS = Object.entries({ ...DRONA_SE_ITEMS, 'drona-se-care': { ...DRONA_SPECIAL_ITEMS['drona-se-care'], duration: SPECIAL_DRONA_SLIDE_DURATION } });

export function KallaxSEDrona({ isPreview = false, actionState = {} }: { isPreview?: boolean; actionState?: Record<string, any> } = {}) {
  return (
    <>
      {/* DRONA Instances individuelles pour animation */}
      {KALLAX_SE_DRONA_POSITIONS.map((position, i) => {
        const target = DRONA_ITEMS.find(([, item]) => item.index === i);
        return (
          <group key={i} name={`drona-se-cell-${i}`} position={position} userData={{ sceneItemRoot: true }}>
            {target ? <SlidingDrona objectId={target[0]} duration={target[1].duration} isPreview={isPreview} actionState={actionState} /> : <DroneCell />}
          </group>
        );
      })}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxSE({ onSize, noDrona, noCaps, isPreview = false, actionState }: SceneItemProps & { noDrona?: boolean; noCaps?: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const px = (-h1 / 2) + 3; // -20.5 : center the pivoted Kallax at X=0

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref} rotation-y={isPreview ? Math.PI : 0}>
      {/* Congélateur CHIQ au sol sous la tour Kallax (Y = 0, pivoté de +90°) */}
      <group position={[0, 0, 0]} rotation-y={Math.PI / 2} userData={{ sceneItemRoot: true }}>
        <Freezer />
      </group>

      {/* k1 — premier 2×1 pivoté, posé sur le congélateur Y ∈ [FREEZER_H, FREEZER_H + w2] */}
      <group position={[px, FREEZER_H + w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]} userData={{ sceneItemRoot: true }}>
        <Kallax2x1 />
      </group>

      {/* k2 — deuxième 2×1 pivoté, posé sur k1 Y ∈ [FREEZER_H + w2, FREEZER_H + 2×w2] */}
      <group position={[px, FREEZER_H + w2 / 2 + w2, 0]} rotation={[0, 0, Math.PI / 2]} userData={{ sceneItemRoot: true }}>
        <Kallax2x1 />
      </group>

      {!noDrona && <KallaxSEDrona isPreview={isPreview} actionState={actionState} />}

      {/* Porte-chaussures bord à bord avec le congélateur (profondeur 47,37 cm). */}
      <group position={[-47.37 / 2, 0, 45 / 2]} rotation-y={-Math.PI} userData={{ sceneItemRoot: true }}>
        <ShoeHatRack noCaps={noCaps} />
      </group>
    </group>
  );
}
