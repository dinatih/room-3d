/**
 * KallaxNE.tsx — Tour Kallax nord-est (mur B + mur C).
 * Composant auto-contenu : 2×1 bas + 2×2 haut + 7 boîtes Drona.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=+π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Kallax }      from './Kallax';
import { useDronaGeo } from './Drona';
import { NOOP_STATE, NOOP_SIZE } from '../../../utils/sceneItem';
import type { SceneItemProps } from '../../../types';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34, NW_K = 33.5;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const tw = (cols: number) => cols * NW_K + 2 * TF + (cols - 1) * TI;
const h1 = th(1); // 41
const h2 = th(2); // 76.5
const DF = 33;    // Drona box size

function k(id: string) { return { id } as any; }

// ── Drona (7 boîtes) ──────────────────────────────────────────────────────────
const redFront = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8, side: THREE.FrontSide });
const redBack  = new THREE.MeshStandardMaterial({ color: 0x991100, roughness: 0.9, side: THREE.BackSide });

function DronaLayer() {
  const geo = useDronaGeo();

  const matrices = useMemo(() => {
    const rotPI = new THREE.Matrix4().makeRotationY(Math.PI);

    // 2×1 base : Kallax center at h1/2 = 20.5
    //   cellPositions(2,1) → [(-17.5, 0, 0), (17.5, 0, 0)]
    const k21 = [[-17.5, h1 / 2, 0], [17.5, h1 / 2, 0]];

    // 2×2 haut : Kallax center at h1 + h2/2 = 79.25
    //   cellPositions(2,2) → [±17.5, ±17.75, 0]
    const cy22 = h1 + h2 / 2;
    const k22 = [
      [-17.5, cy22 + 17.75, 0], [17.5, cy22 + 17.75, 0],
      [-17.5, cy22 - 17.75, 0], [17.5, cy22 - 17.75, 0],
    ];

    // 1 sur le dessus — z_local=-1.5 pour éviter z-fighting avec mur est
    // (face arrière Drona à local z=−1.5+19=17.5, world x=298.0, gap 2cm)
    const top = [[-18.25, h1 + h2 + DF / 2 + 0.2, -1.5]];

    return [...k21, ...k22, ...top].map(([x, y, z]) =>
      rotPI.clone().setPosition(x, y, z),
    );
  }, []);

  const N = matrices.length; // 7
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

export function KallaxNE({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* 2×1 bas — spans Y ∈ [0, h1] */}
      <group position={[0, h1, 0]}>
        <Kallax item={k('kallax-ne-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* 2×2 haut — spans Y ∈ [h1, h1+h2] */}
      <group position={[0, h1 + h2, 0]}>
        <Kallax item={k('kallax-ne-2x2')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      <DronaLayer />
    </group>
  );
}
