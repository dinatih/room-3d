/**
 * KallaxSE.tsx — Tour Kallax sud-est (mur B, 60 cm avant mur D).
 * Composant auto-contenu : 2× Kallax 2×1 posés sur le côté + 4 boîtes Drona.
 *
 * Les Kallax sont pivotés rotZ=π/2 (largeur devient hauteur).
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=+π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Kallax2x1 }      from './Kallax2x1';
import { MeubleT }        from './MeubleT';
import { ShoeHatRack }    from './ShoeHatRack';
import { DronaInstances } from './Drona';
import { Freezer }        from './Freezer';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34, NW_K = 33.5;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const tw = (cols: number) => cols * NW_K + 2 * TF + (cols - 1) * TI;
const w1 = tw(1); // 40.5
const w2 = tw(2); // 75.5
const h1 = th(1); // 41  ← devient la profondeur visuelle une fois pivoté
const DEP = 39;   // Kallax depth (KALLAX_DEPTH)
const MEUBLE_T_D = 27.5;
const FREEZER_H = 50; // Hauteur du congélateur CHIQ au sol

// Positions en espace root (rotY=π/2).
// k1 center Y = FREEZER_H + w2/2 ; k2 center Y = FREEZER_H + w2 + w2/2 ; cells ±17.5
const DRONA_POSITIONS: [number, number, number][] = [
  [0, FREEZER_H + w2 / 2 - 17.5,       0], // k1 cell 0
  [0, FREEZER_H + w2 / 2 + 17.5,       0], // k1 cell 1
  [0, FREEZER_H + w2 + w2 / 2 - 17.5,  0], // k2 cell 0
  [0, FREEZER_H + w2 + w2 / 2 + 17.5,  0], // k2 cell 1
];

function k(id: string) { return { id } as any; }

// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxSE({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);
  const px = -h1 / 2; // -20.5 : center the pivoted Kallax at X=0

  const dronaMatrices = useMemo(() => {
    const rot = new THREE.Matrix4().makeRotationY(Math.PI / 2);
    return DRONA_POSITIONS.map(([x, y, z]) => rot.clone().setPosition(x, y, z));
  }, []);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* Congélateur CHIQ au sol sous la tour Kallax (Y = 0, pivoté de -90°) */}
      <group position={[0, 0, 0]} rotation-y={-Math.PI / 2}>
        <Freezer item={k('freezer')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* k1 — premier 2×1 pivoté, posé sur le congélateur Y ∈ [FREEZER_H, FREEZER_H + w2] */}
      <group position={[px, FREEZER_H + w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-se-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* k2 — deuxième 2×1 pivoté, posé sur k1 Y ∈ [FREEZER_H + w2, FREEZER_H + 2×w2] */}
      <group position={[px, FREEZER_H + w2 / 2 + w2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-se-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      <DronaInstances matrices={dronaMatrices} />

      {/* MeubleT — posé sur le dessus du stack (Y = FREEZER_H + 2×w2), flush mur B */}
      {/* local: x = stack_z − z_world = 0, z = x_world − stack_x = DEP/2 − MEUBLE_T_D/2 */}
      <group position={[0, FREEZER_H + 2 * w2, DEP / 2 - MEUBLE_T_D / 2]} rotation-y={-Math.PI}>
        <MeubleT item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* ShoeHatRack — au sol, côté mur D, flush mur B */}
      {/* local: x = stack_z − z_world = −w1/2, z = x_world − stack_x = DEP/2 */}
      <group position={[-w1 / 2, 0, DEP / 2]} rotation-y={-Math.PI}>
        <ShoeHatRack item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
