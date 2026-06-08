/**
 * SunnerstaGroup.tsx — desserte (Sunnersta ou RÅSKOG) + tête de mannequin + casquette.
 *
 * `variant` : 0 = Sunnersta (90cm), 1 = RÅSKOG grande (77cm), 2 = RÅSKOG petite (61cm).
 * La tête de mannequin et la casquette se repositionnent sur le plateau du modèle choisi.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Placements.tsx (Sunnersta_)
 *   → position SUNNERSTA_POSITIONS, rotation-y={Math.PI / 2}
 * Utilisé aussi dans l'inventaire via registry.ts (variant 0 par défaut).
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Sunnersta }     from './Sunnersta';
import { RaskogLarge, RaskogSmall } from './Raskog';
import { MannequinHead } from './MannequinHead';
import { BaseballCap }   from './BaseballCap';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// Hauteur tête (base → sommet) : 8 + 8 + 8.9 × scale 1.15
const HEAD_HEIGHT = 45;

// Plateau supérieur par variant + composant desserte associé
const DESSERTE_TOP = [90, 77, 61];
const DESSERTE_EL  = [Sunnersta, RaskogLarge, RaskogSmall];

export function SunnerstaGroup({ onSize, variant = 0 }: SceneItemProps & { variant?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const v = variant % DESSERTE_EL.length;
  const Desserte = DESSERTE_EL[v];
  const top = DESSERTE_TOP[v] - 8;

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, [variant]);

  return (
    <group ref={ref}>
      <Desserte item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
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
