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
import { Kallax2x1 }   from './Kallax2x1';
import { Kallax2x2 }   from './Kallax2x2';
import { DroneCell } from './Drona';
import { NOOP_STATE, NOOP_SIZE } from '@shared/utils/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const h1 = th(1); // 41
const h2 = th(2); // 76.5
const DF = 33;    // Drona box size

function k(id: string) { return { id } as any; }

// ── Drona (7 boîtes) ──────────────────────────────────────────────────────────


// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxNE({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* 2×1 bas — spans Y ∈ [0, h1] */}
      <group position={[0, h1, 0]}>
        <Kallax2x1 item={k('kallax-ne-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        {/* 2 Drona : cellules gauche/droite (Y=-20.5), X=±17.5 */}
        {([-17.5, 17.5] as const).map(x => (
          <group key={x} position={[x, -20.5, 0]} rotation-y={Math.PI / 2}>
            <DroneCell />
          </group>
        ))}
      </group>
      {/* 2×2 haut — spans Y ∈ [h1, h1+h2] */}
      <group position={[0, h1 + h2, 0]}>
        <Kallax2x2 item={k('kallax-ne-2x2')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        {/* 4 Drona : cellules rangée haute (Y=-20.5) et basse (Y=-56), X=±17.5 */}
        {([-17.5, 17.5] as const).flatMap(x =>
          ([-20.5, -56] as const).map(y => (
            <group key={`${x}${y}`} position={[x, y, 0]} rotation-y={Math.PI / 2}>
              <DroneCell />
            </group>
          ))
        )}
      </group>
      {/* Drona sur le dessus de la tour — z_local=-1.5 évite z-fighting mur est */}
      <group position={[-18.25, h1 + h2 + DF / 2 + 0.2, -1.5]} rotation-y={Math.PI}>
        <DroneCell />
      </group>
    </group>
  );
}
