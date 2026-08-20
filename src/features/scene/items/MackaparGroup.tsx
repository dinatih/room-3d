/**
 * MackaparGroup.tsx — Mackapär + salopette + 2 boîtes Drona sur le dessus.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Placements.tsx (GlbPlacements)
 *   → position=[MACK_X, 0, MACK_Z], rotation-y={Math.PI / 2}
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Mackapar }    from './Mackapar';
// import { Salopette }   from './Salopette';
import { DroneCell } from './Drona';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes ────────────────────────────────────────────────────────────────
// const RAIL_Y = 165; // hauteur de la barre porte-vêtements
const DF     = 33;  // taille boîte Drona

// ── Drona (2 boîtes sur le dessus) ───────────────────────────────────────────
// Positions locales dérivées depuis DronaBoxes.tsx addSingle() :
//   world (mpCX ± 20, 200+DF/2+0.2, mpCZ+0.5), rotY=π/2
//   wrapper rotY=π/2 → x_local = dz, z_local = −dx
//   → (0.5, 200+DF/2+0.2, ±20), rotY=0

const dronaMatrices = (() => {
  const dummy = new THREE.Object3D();
  const dronaY = 200 + DF / 2 + 0.2;
  return [20, -20].map(z => {
    dummy.position.set(0.5, dronaY, z);
    dummy.rotation.set(0, -Math.PI / 2, 0);
    dummy.updateMatrix();
    return dummy.matrix.clone();
  });
})();

// ── Composant principal ───────────────────────────────────────────────────────

export function MackaparGroup({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      <group userData={{ animUnit: true }}>
        <Mackapar item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Salopette suspendue à la barre */}
      {/* <group userData={{ animUnit: true }}>
        <group position={[0, RAIL_Y - 120, 0]}>
          <Salopette item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group> */}
      {dronaMatrices.map((m, i) => {
        const p = new THREE.Vector3().setFromMatrixPosition(m);
        const q = new THREE.Quaternion().setFromRotationMatrix(m);
        return (
          <group key={i} userData={{ animUnit: true }}>
            <group position={p} quaternion={q}>
              <DroneCell />
            </group>
          </group>
        );
      })}
    </group>
  );
}
