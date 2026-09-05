/**
 * UtakerStack.tsx — Paire complète de lits Utåker.
 * Pour la preview inventaire de l'item 'utaker-stack'.
 * Actions :
 *   bed-double → true = lit double (collés bord à bord), false = lits simples séparés (avec espace)
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { UtakerFrame } from './UtakerFrame';
import { NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

const BED_WIDTH_Z = 83;
const SEPARATED_GAP = 100; // espace visible entre les lits en mode simple

export function UtakerStack({ actionState, onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const isDouble = !!actionState['bed-double'];

  // En mode double : collés bord à bord [0, 0, -BED_WIDTH_Z]
  // En mode simple séparé : espacés pour bien distinguer les deux lits 1p
  const upperPos: [number, number, number] = isDouble
    ? [0, 0, -BED_WIDTH_Z]
    : [0, 0, -(BED_WIDTH_Z + SEPARATED_GAP)];

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, [isDouble]);

  return (
    <group ref={groupRef}>
      <UtakerFrame item={{ id: 'utaker-lower' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      <group position={upperPos}>
        <UtakerFrame item={{ id: 'utaker-upper' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
