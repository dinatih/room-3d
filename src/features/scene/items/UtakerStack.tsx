/**
 * UtakerStack.tsx — Paire complète de lits Utåker (bas + haut empilés).
 * Pour la preview inventaire de l'item 'utaker-stack'.
 * Actions :
 *   bed-toggle → true = lits désempilés (côte à côte), false = empilés
 *   bed-sofa   → true = configuration canapé (haut retourné contre le bas)
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { UtakerFrame } from './UtakerFrame';
import { NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

const LOWER_TOP_Y = 23;  // hauteur du cadre bas (= GLB max Y ≈ 23.3 cm)
const BED_WIDTH_Z = 83;
const SOFA_GAP_Z  = 233; // distance entre lits en mode canapé (= ROOM_W - 83 dans Placements)
const SOFA_X_OFFSET = 46;

export function UtakerStack({ actionState, onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const unstacked = !!actionState['bed-toggle'];
  const sofa      = !!actionState['bed-sofa'];

  const stacked = !unstacked && !sofa;
  const upperPos: [number, number, number] = sofa
    ? [SOFA_X_OFFSET, 0, -SOFA_GAP_Z]
    : stacked
      ? [0, LOWER_TOP_Y, 0]
      : [0, 0, -BED_WIDTH_Z];
  const upperRot: [number, number, number] = [0, 0, 0];

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, [unstacked, sofa]);

  return (
    <group ref={groupRef}>
      <UtakerFrame item={{ id: 'utaker-lower' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      <group position={upperPos} rotation={upperRot}>
        <UtakerFrame item={{ id: 'utaker-upper' } as any} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
