/**
 * KallaxNW.tsx — Tour Kallax nord-ouest (mur Ouest + mur Nord).
 * Composant auto-contenu : 2×1 + 1×1 + 1×1 pivotés + 4 boîtes Drona.
 *
 * Les Kallax sont pivotés rotZ=π/2 (largeur devient hauteur).
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx  → rotY=−π/2
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Kallax2x1 }      from './Kallax2x1';
import { Kallax1x1 }      from './Kallax1x1';
import { MannequinHead }  from './MannequinHead';
import { DroneCell } from './Drona';
import { Variera32x13 }   from './Variera32x13';
import { MeubleT }        from './MeubleT';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34, NW_K = 33.5;
const th = (rows: number) => rows * NH + 2 * TF + (rows - 1) * TI;
const tw = (cols: number) => cols * NW_K + 2 * TF + (cols - 1) * TI;
const w1 = tw(1); // 40.5
const w2 = tw(2); // 75.5
const h1 = th(1); // 41  ← devient la profondeur visuelle une fois pivoté
const DEP = 39;   // Kallax depth (KALLAX_DEPTH)
const VAR_W = 32, VAR_D = 13; // VARIERA demi-étag dims (L × P)

// Positions en espace root (rotY=π/2 — même orientation que KallaxNE).
// nwB (2×1) cells ±17.5 → Y = w2/2 ∓ 17.5
// nwM (1×1) centre = w2 + w1/2 = 95.75
// nwT (1×1) centre = w2 + w1 + w1/2 = 136.25
const DRONA_POSITIONS: [number, number, number][] = [
  [0, w2 / 2 - 17.5,       0], // nwB cell 0
  [0, w2 / 2 + 17.5,       0], // nwB cell 1
  [0, w2 + w1 / 2,         0], // nwM cell
  [0, w2 + w1 + w1 / 2,    0], // nwT cell
];

function k(id: string) { return { id } as any; }

// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxNW({ onSize }: SceneItemProps) {
  const ref = useRef<THREE.Group>(null!);
  const px = -h1 / 2; // -20.5 : center the pivoted Kallax at X=0

  const dronaMatrices = useMemo(() => {
    const rot = new THREE.Matrix4().makeRotationY(Math.PI / 2);
    return DRONA_POSITIONS.map(([x, y, z]) => rot.clone().setPosition(x, y, z));
  }, []);

  const dronaTransforms = useMemo(() => {
    return dronaMatrices.map(m => {
      const p = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3();
      m.decompose(p, q, s);
      return { p, q, s };
    });
  }, [dronaMatrices]);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* Sous-groupe GLB — masqué par le toggle GLB, visible par défaut */}
      {/* nwB 2×1 pivoté, Y ∈ [0, w2] */}
      <group position={[px, w2 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax2x1 item={k('kallax-nw-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* nwM 1×1 pivoté, Y ∈ [w2, w2+w1] */}
      <group position={[px, w2 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax1x1 item={k('kallax-nw-1x1-a')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* nwT 1×1 pivoté, Y ∈ [w2+w1, w2+2×w1] */}
      <group position={[px, w2 + w1 + w1 / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Kallax1x1 item={k('kallax-nw-1x1-b')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* DRONA Instances individuelles pour animation */}
      {dronaTransforms.map((t, i) => (
        <group key={i} position={t.p} quaternion={t.q} scale={t.s}>
          <DroneCell />
        </group>
      ))}

      {/* MannequinHead centré sur sommet tour, pivoté 45° vers centre pièce.
          Head forward = +Z local. rotY=3π/4 → world +X+Z (diagonale corner→centre). */}
      <group
        position={[0, w2 + 2 * w1, 6]}
        rotation-y={(3 * Math.PI) / 4}
      >
        <MannequinHead item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* VARIERA demi-étagère sur sommet tour, longueur plaquée contre mur Nord.
          rotY=-π/2 : grand axe (32) le long de Z, profondeur (13) le long de X.
          Back panel contre mur Nord en local -X. Opening face pièce (+Z). */}
      <group
        position={[-h1 / 2 + VAR_D / 2, w2 + 2 * w1 + .5, DEP / 2 - VAR_W / 2]}
        rotation-y={-Math.PI / 2}
      >
        <Variera32x13 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* MeubleT — au sol (Y = 0) à gauche des meubles Kallax, plaqué contre la glace des miroirs */}
      <group position={[75, 0, 0.75]} rotation-y={0}>
        <MeubleT item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
