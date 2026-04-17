/**
 * MackaparGroup.tsx — Mackapär + salopette + 2 boîtes Drona sur le dessus.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Placements.tsx (GlbPlacements)
 *   → position=[MACK_X, 0, MACK_Z], rotation-y={Math.PI / 2}
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Mackapar }    from './Mackapar';
import { Salopette }   from './Salopette';
import { useDronaGeo } from './Drona';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '../../../utils/sceneItem';
import type { SceneItemProps } from '../../../types';

// ── Constantes ────────────────────────────────────────────────────────────────
const RAIL_Y = 165; // hauteur de la barre porte-vêtements
const DF     = 33;  // taille boîte Drona

// ── Drona (2 boîtes sur le dessus) ───────────────────────────────────────────
// Positions locales dérivées depuis DronaBoxes.tsx addSingle() :
//   world (mpCX ± 20, 200+DF/2+0.2, mpCZ+0.5), rotY=π/2
//   wrapper rotY=π/2 → x_local = dz, z_local = −dx
//   → (0.5, 200+DF/2+0.2, ±20), rotY=0

const redFront = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.FrontSide });
const redBack  = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.9, side: THREE.BackSide });

function DronaLayer() {
  const geo = useDronaGeo();

  const matrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const dronaY = 200 + DF / 2 + 0.2;
    return [20, -20].map(z => {
      dummy.position.set(0.5, dronaY, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      return dummy.matrix.clone();
    });
  }, []);

  const N = matrices.length; // 2
  const apply = (mesh: THREE.InstancedMesh) => {
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };

  return (
    <>
      <instancedMesh args={[geo, redFront, N]} castShadow receiveShadow onUpdate={apply} />
      <instancedMesh args={[geo, redBack,  N]} onUpdate={apply} />
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function MackaparGroup({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      <Mackapar item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      {/* Salopette suspendue à la barre */}
      <group position={[0, RAIL_Y - 120, 0]}>
        <Salopette item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <DronaLayer />
    </group>
  );
}
