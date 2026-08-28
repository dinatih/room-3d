/**
 * RaskogLargeGroup.tsx — Desserte RÅSKOG grande + tête de mannequin + casquette.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Raskog30586783 } from './Raskog30586783';
import { MannequinHead } from './MannequinHead';
import { BaseballCap }   from './BaseballCap';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// Hauteur tête (base → sommet) : 8 + 8 + 8.9 × scale 1.15
const HEAD_HEIGHT = 45;
const DESSERTE_TOP = 77; // RÅSKOG grande height is 77 cm

export function RaskogLargeGroup({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);
  const top = DESSERTE_TOP - 8;

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize?.(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, [onSize]);

  return (
    <group ref={ref}>
      <Raskog30586783 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      <group position={[5, top + HEAD_HEIGHT - 9, -2]} rotation={[0.15, Math.PI / 2, 0]}>
        <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* Tête de mannequin — toujours visible */}
      <group position={[0, top, -2]} rotation-y={Math.PI / 2}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
