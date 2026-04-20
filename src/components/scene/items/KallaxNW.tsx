/**
 * KallaxNW.tsx — Tour Kallax nord-ouest (mur A + mur C).
 * Composant auto-contenu : 2×1 + 1×1 + 1×1 pivotés + 4 boîtes Drona.
 *
 * Les Kallax sont pivotés rotZ=π/2 (largeur devient hauteur).
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=−π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Kallax }        from './Kallax';
import { MannequinHead } from './MannequinHead';
import { useDronaGeo }   from './Drona';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '../../../utils/sceneItem';
import type { SceneItemProps } from '../../../types';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34, NW_K = 33.5;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const tw = (cols: number) => cols * NW_K + 2 * TF + (cols - 1) * TI;
const w1 = tw(1); // 40.5
const w2 = tw(2); // 75.5
const h1 = th(1); // 41  ← devient la profondeur visuelle une fois pivoté
const DF = 33;
const DEP = 39;   // Kallax depth (KALLAX_DEPTH)

function k(id: string) { return { id } as any; }

// ── Drona (4 boîtes) ──────────────────────────────────────────────────────────
// Positions locales après application de rotZ=π/2 sur les offsets de cellule.
//
// nwB (2×1) center = w2/2 = 37.75 → cells ±17.5 → (0, 20.25, 0) et (0, 55.25, 0)
// nwM (1×1) center = w2 + w1/2 = 95.75 → cell (0, 0, 0) → (0, 95.75, 0)
// nwT (1×1) center = w2 + w1 + w1/2 = 136.25 → cell → (0, 136.25, 0)

const redFront = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.FrontSide });
const redBack  = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.9, side: THREE.BackSide });

function DronaLayer() {
  const geo = useDronaGeo();

  const matrices = useMemo(() => {
    const rotPI = new THREE.Matrix4().makeRotationY(Math.PI);
    const positions: [number, number, number][] = [
      [0, w2 / 2 - 17.5,              0], // nwB cell 0
      [0, w2 / 2 + 17.5,              0], // nwB cell 1
      [0, w2 + w1 / 2,                0], // nwM cell
      [0, w2 + w1 + w1 / 2,           0], // nwT cell
    ];
    return positions.map(([x, y, z]) => rotPI.clone().setPosition(x, y, z));
  }, []);

  const N = matrices.length; // 4
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

export function KallaxNW({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);
  const px = -h1 / 2; // -20.5 : center the pivoted Kallax at X=0

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* nwB 2×1 pivoté, Y ∈ [0, w2] */}
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={k('kallax-nw-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* nwM 1×1 pivoté, Y ∈ [w2, w2+w1] */}
      <group position={[px, w2 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={k('kallax-nw-1x1-a')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* nwT 1×1 pivoté, Y ∈ [w2+w1, w2+2×w1] */}
      <group position={[px, w2 + w1 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax item={k('kallax-nw-1x1-b')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <DronaLayer />

      {/* MannequinHead — sur le dessus du stack NW (Y = w2 + 2×w1) */}
      {/* local: x = z_world − stack_z = DEP/2, z = stack_x − x_world = w1/2  */}
      {/* rotY_local = atan2(150 − DEP/2, 200 − w1/2) + π  (nwMannRot + π/2) */}
      <group
        position={[DEP / 2, w2 + 2 * w1, w1 / 2]}
        rotation-y={Math.atan2(150 - DEP / 2, 200 - w1 / 2) + Math.PI}
      >
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
