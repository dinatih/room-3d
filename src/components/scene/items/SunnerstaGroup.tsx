/**
 * SunnerstaGroup.tsx — desserte Sunnersta + tête de mannequin + casquette.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Placements.tsx (GlbPlacements)
 *   → position=[ROOM_W − 20, 0, 271.5], rotation-y={Math.PI / 2}
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Sunnersta }     from './Sunnersta';
import { MannequinHead } from './MannequinHead';
import { BaseballCap }   from './BaseballCap';
import { GlbSubGroup }  from '../GlbContext';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '../../../utils/sceneItem';
import type { SceneItemProps } from '../../../types';

// Hauteur du plateau supérieur Sunnersta (90 trolley + 8 + 8 + 8.9 × scale)
const SUNNERSTA_HEAD_TOP = 90 + 8 + 8 + 8.9 * 1.15;

// ── Composant ─────────────────────────────────────────────────────────────────
// Composite : GLB (Sunnersta + casquette) + procédural (MannequinHead toujours visible).
// Positions locales (wrapper rotY=+π/2 → x_local = dz, z_local = −dx) :
//   MannequinHead  world (282, 90, 271.5)     → local (0, 90, −2), rotY=−π/2
//   BaseballCap    world (282, HEAD_TOP+2, …) → local (0, HEAD_TOP+2, −2), rotY=+π/2

export function SunnerstaGroup({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* Sous-groupe GLB — masqué par le toggle GLB */}
      <GlbSubGroup>
        <Sunnersta item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        {/* Casquette : GLB toggle → disparaît avec la desserte */}
        <group position={[0, SUNNERSTA_HEAD_TOP + 2, -2]} rotation-y={Math.PI / 2}>
          <BaseballCap item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </GlbSubGroup>
      {/* Tête de mannequin — toujours visible */}
      <group position={[0, 90, -2]} rotation-y={-Math.PI / 2}>
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
