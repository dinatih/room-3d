/**
 * KallaxSE.tsx — Tour Kallax sud-est (mur B, 60 cm avant mur D).
 * Composant auto-contenu : 2× Kallax 2×1 posés sur le côté + 4 boîtes Drona.
 *
 * Les Kallax sont pivotés rotZ=π/2 (largeur devient hauteur).
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=+π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Kallax2x1 }    from './Kallax2x1';
import { MeubleT }      from './MeubleT';
import { ShoeHatRack }  from './ShoeHatRack';
import { useDronaGeo }  from './Drona';
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
const MEUBLE_T_D = 27.5;

function k(id: string) { return { id } as any; }

// ── Drona (4 boîtes) ──────────────────────────────────────────────────────────
// Positions locales dans le repère du stack (après application des rotations
// kallaxG.rotZ=π/2 sur les offsets de cellule).
//
// Pour rotZ(π/2) appliqué à (x, 0, 0) : (x, 0, 0) → (0, x, 0) — voir calcul analytique.
// k1 center (local Y) = w2/2 = 37.75  ; k2 center = w2 + w2/2 = 113.25
// cell offsets (2×1) : ±17.5 → ∓17.5 in Y → centers ± 17.5
//   k1 : (0, 20.25, 0) et (0, 55.25, 0)
//   k2 : (0, 95.75, 0) et (0, 130.75, 0)

const redFront = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.FrontSide });
const redBack  = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.9, side: THREE.BackSide });

function DronaLayer() {
  const geo = useDronaGeo();

  const matrices = useMemo(() => {
    const rotPI = new THREE.Matrix4().makeRotationY(Math.PI);
    const positions: [number, number, number][] = [
      [0, w2 / 2 - 17.5, 0], // k1 cell 0
      [0, w2 / 2 + 17.5, 0], // k1 cell 1
      [0, w2 + w2 / 2 - 17.5, 0], // k2 cell 0
      [0, w2 + w2 / 2 + 17.5, 0], // k2 cell 1
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

export function KallaxSE({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);
  const px = -h1 / 2; // -20.5 : center the pivoted Kallax at X=0

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* k1 — premier 2×1 pivoté, Y ∈ [0, w2] */}
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-se-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* k2 — deuxième 2×1 pivoté, Y ∈ [w2, 2×w2] */}
      <group position={[px, w2 / 2 + w2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-se-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <DronaLayer />

      {/* MeubleT — posé sur le dessus du stack (Y = 2×w2), flush mur B */}
      {/* local: x = stack_z − z_world = 0, z = x_world − stack_x = DEP/2 − MEUBLE_T_D/2 */}
      <group position={[0, 2 * w2, DEP / 2 - MEUBLE_T_D / 2]} rotation-y={-Math.PI}>
        <MeubleT item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* ShoeHatRack — au sol, côté mur D, flush mur B */}
      {/* local: x = stack_z − z_world = −w1/2, z = x_world − stack_x = DEP/2 */}
      <group position={[-w1 / 2, 0, DEP / 2]} rotation-y={-Math.PI}>
        <ShoeHatRack item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
