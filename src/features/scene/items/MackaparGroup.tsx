import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Mackapar50530988 } from './Mackapar50530988';
import { Spruttig20317079 } from './Spruttig20317079';
// import { Salopette }   from './Salopette';
import { DroneCell } from './Drona';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes ────────────────────────────────────────────────────────────────
// Hauteurs des tringles de penderie MACKAPÄR
const TOP_RAIL_Y    = 182; // 183 - 1 cm
const BOTTOM_RAIL_Y = 106; // 107 - 1 cm
const HANGER_Z      = [-25, -15, -5, 5, 15, 25];
const HANGER_ROTS   = [0.03, -0.04, 0.02, -0.03, 0.05, -0.02];

const DF     = 33;  // taille boîte Drona

// ── Drona (2 boîtes sur le dessus) ───────────────────────────────────────────
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
      <group userData={{ animUnit: true, isIkea: true }}>
        <Mackapar50530988 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* 6 cintres Spruttig sur le portant supérieur */}
      {HANGER_Z.map((z, i) => (
        <group
          key={`top-hanger-${i}`}
          position={[0, TOP_RAIL_Y, z]}
          rotation={[0, HANGER_ROTS[i], 0]}
          userData={{ animUnit: true, isIkea: true, itemName: `Cintre Spruttig Haut ${i + 1}` }}
        >
          <Spruttig20317079 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}

      {/* 6 cintres Spruttig sur le portant inférieur */}
      {HANGER_Z.map((z, i) => (
        <group
          key={`bottom-hanger-${i}`}
          position={[0, BOTTOM_RAIL_Y, z]}
          rotation={[0, -HANGER_ROTS[i], 0]}
          userData={{ animUnit: true, isIkea: true, itemName: `Cintre Spruttig Bas ${i + 1}` }}
        >
          <Spruttig20317079 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}

      {/* Salopette suspendue à la barre */}
      {/* <group userData={{ animUnit: true, isIkea: true }}>
        <group position={[0, RAIL_Y - 120, 0]}>
          <Salopette item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group> */}
      {dronaMatrices.map((m, i) => {
        const p = new THREE.Vector3().setFromMatrixPosition(m);
        const q = new THREE.Quaternion().setFromRotationMatrix(m);
        return (
          <group key={i} userData={{ animUnit: true, isIkea: true }}>
            <group position={p} quaternion={q}>
              <DroneCell />
            </group>
          </group>
        );
      })}
    </group>
  );
}

