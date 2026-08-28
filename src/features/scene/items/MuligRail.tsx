import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Mulig30179435 } from './Mulig30179435';
import { Spruttig20317079 } from './Spruttig20317079';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── 6 cintres Spruttig sur la tringle Mulig ──────────────────────────────────
const HANGER_Z   = [-20, -12, -4, 4, 12, 20];
const HANGER_ROTS = [0.04, -0.03, 0.05, -0.02, 0.03, -0.04];
// Barre Mulig à ~15.5 cm de hauteur (15.5 - 19 cm hook height = -3.5 cm)
// Barre avancée à X = 10.5 cm par rapport au centre de Mulig
const RAIL_X = 10.5;
const RAIL_Y = 15.5 - 19;

export function MuligRail({ onSize, ...props }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize?.(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, [onSize]);

  return (
    <group ref={ref} {...props}>
      <group userData={{ animUnit: true, isIkea: true }}>
        <Mulig30179435 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* 6 cintres Spruttig sur la tringle Mulig */}
      {HANGER_Z.map((z, i) => (
        <group
          key={`mulig-hanger-${i}`}
          position={[RAIL_X, RAIL_Y, z]}
          rotation={[0, HANGER_ROTS[i], 0]}
          userData={{ animUnit: true, isIkea: true, itemName: `Cintre Spruttig Mulig ${i + 1}` }}
        >
          <Spruttig20317079 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
    </group>
  );
}

