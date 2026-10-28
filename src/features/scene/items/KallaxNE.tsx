/**
 * KallaxNE.tsx — Tour Kallax nord-est (mur B + mur C).
 * Composant auto-contenu : 2×1 bas + 2×2 haut + 7 boîtes Drona.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=+π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox } from '../glbUtils';
import { Kallax2x1 }   from './Kallax2x1';
import { Kallax2x2 }   from './Kallax2x2';
import { DroneCell, DF } from './Drona';
import { Variera60136623 } from './Variera60136623';
import type { SceneItemProps } from '@shared/types';
import { SlidingDrona } from './SlidingDrona';
import { DRONA_CATCHALL_POSITION, DRONA_CATCHALL_SLIDE_DURATION } from './kallaxNeDrona';
import { DRONA_SPECIAL_ITEMS, SPECIAL_DRONA_SLIDE_DURATION } from './dronaStorage';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const h1 = th(1); // 41
const h2 = th(2); // 76.5
const W2_HALF = 37.75; // 2×Kallax half-width (w2/2)
const DEP_HALF = 19.5; // Kallax depth/2
const VAR2_W = 32, VAR2_D = 28, VAR2_H = 16; // VARIERA 32×28×16 demi-étag

const DRONA_POSITIONS = [
  ...[-17.5, 17.5].map(x => new THREE.Vector3(x, h1 - 20.5, 0)),
  ...[-17.5, 17.5].flatMap(x => [-20.5, -56].map(y => new THREE.Vector3(x, h1 + h2 + y, 0))),
  // La boîte sur la VARIERA est la seule tournée de 180°.
  new THREE.Vector3(W2_HALF - VAR2_W / 2 - 4, h1 + h2 + VAR2_H + DF / 2, DEP_HALF - VAR2_D / 2 - 10),
];

export function KallaxNEDrona({ isPreview = false, actionState = {} }: { isPreview?: boolean; actionState?: Record<string, any> } = {}) {
  return (
    <>
      {/* DRONA Instances individuelles pour animation */}
      {DRONA_POSITIONS.map((position, i) => (
        <group key={i} name={`drona-ne-cell-${i}`} position={position} rotation-y={i === DRONA_POSITIONS.length - 1 ? Math.PI : 0} userData={{ sceneItemRoot: true }}>
          {position.x === DRONA_CATCHALL_POSITION[0] && position.y === DRONA_CATCHALL_POSITION[1]
            ? <SlidingDrona objectId="drona-ne-catchall" duration={DRONA_CATCHALL_SLIDE_DURATION} isPreview={isPreview} actionState={actionState} />
            : i === DRONA_SPECIAL_ITEMS['drona-ne-catchall2'].index
              ? <SlidingDrona objectId="drona-ne-catchall2" duration={SPECIAL_DRONA_SLIDE_DURATION} isPreview={isPreview} actionState={actionState} />
              : <DroneCell />}
        </group>
      ))}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxNE({ onSize, noDrona, isPreview = false, actionState = {} }: Partial<Omit<SceneItemProps, 'item'>> & { noDrona?: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    onSize?.(glbLocalBBox(ref.current).getSize(new THREE.Vector3()));
  }, [onSize]);

  return (
    <group ref={ref} rotation-y={isPreview ? Math.PI : 0}>
      {/* 2×1 bas — spans Y ∈ [0, h1] */}
      <group position={[0, h1, 0]} userData={{ sceneItemRoot: true }}>
        <Kallax2x1 />
      </group>
      
      {/* 2×2 haut — spans Y ∈ [h1, h1+h2] */}
      <group position={[0, h1 + h2, 0]} userData={{ sceneItemRoot: true }}>
        <Kallax2x2 />
      </group>
      
      {!noDrona && <KallaxNEDrona isPreview={isPreview} actionState={actionState} />}

      {/* VARIERA 32×28 sur sommet 2×2, coin Nord-Est (local +X=mur Nord, +Z=mur Est).
          rotY=0 : grand axe (32) le long X (= world Z, parallèle mur Est).
          Back panel (local +Z) contre mur Est. Opening face pièce (world -X). */}
      <group position={[W2_HALF - VAR2_W / 2 - 4, h1 + h2, DEP_HALF - VAR2_D / 2 - 10]} userData={{ sceneItemRoot: true }}>
        <Variera60136623 />
      </group>
    </group>
  );
}
