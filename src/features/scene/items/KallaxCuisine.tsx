/**
 * KallaxCuisine.tsx — Tour Kallax cuisine (niche mur Sud, coin mur Ouest).
 * Composant auto-contenu : 3 Kallax empilés + 4 boîtes Drona dans le bas.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ.
 * Placement monde : wrapper group dans Furniture.tsx.
 * Utilisé aussi dans l'inventaire (Espaces de rangement) via registry.ts.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Kallax2x1 }     from './Kallax2x1';
import { Kallax2x2 }     from './Kallax2x2';
import { Kallax2x2Spec } from './Kallax2x2Spec';
import { NinjaSP101 } from './NinjaSP101';
import { DroneCell } from './Drona';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes Kallax ─────────────────────────────────────────────────────────
const TF = 3.5, TI = 1.5, NH = 34;
const th   = (rows: number) => rows * NH  + 2 * TF + (rows - 1) * TI;
const h1   = th(1);              // 41
const h2   = th(2);              // 76.5
const DF   = 33;                 // Drona box size
const PIZZA_Y = h2 + h2 / 2 + TI / 2;  // 115.5 — position four pizza

function k(id: string) { return { id } as any; }


// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxCuisineDrona() {
  const dronaMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    
    // 4 dans le 2×2 bas (cases [0,0], [0,1], [1,0], [1,1])
    for (const x of [-17.5, 17.5]) {
      for (const y of [-20.5, -56]) {
        p.set(x, h2 + y, 0);
        matrices.push(new THREE.Matrix4().compose(p, q, s));
      }
    }
    
    // 2 sur le dessus (2×1 haut Y ∈ [2×h2+h1, 2×h2+h1+DF])
    const topY = 2 * h2 + h1 + DF / 2 + 0.2;
    for (const x of [-17.5, 17.5]) {
      p.set(x, topY, 0);
      matrices.push(new THREE.Matrix4().compose(p, q, s));
    }
    return matrices;
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

  return (
    <>
      {/* DRONA Instances individuelles pour animation (6 Drona : 4 dans le 2x2 bas + 2 sur le dessus) */}
      {dronaTransforms.map((t, i) => (
        <group key={i} position={t.p} quaternion={t.q} scale={t.s} userData={{ animUnit: true }}>
          <DroneCell />
        </group>
      ))}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function KallaxCuisine({ onSize, actionState, noDrona }: SceneItemProps & { noDrona?: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  return (
    <group ref={ref}>
      {/* 2×2 bas — PY = h2 */}
      <group position={[0, h2, 0]} userData={{ animUnit: true }}>
        <Kallax2x2 item={k('kallax-sw-2x2')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* 2×2 spec (sans barre haute) — PY = 2×h2 */}
      <group position={[0, h2 + h2, 0]} userData={{ animUnit: true }}>
        <Kallax2x2Spec item={k('kallax-sw-2x2-spec')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      {/* 2×1 haut — PY = 2×h2 + h1 */}
      <group position={[0, h2 + h2 + h1, 0]} userData={{ animUnit: true }}>
        <Kallax2x1 item={k('kallax-sw-2x1')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
      
      {!noDrona && <KallaxCuisineDrona />}

      {/* Mini four Ninja SP101EU — dans la case basse du 2×2 spec */}
      <group position={[-8, PIZZA_Y, 0]} rotation-y={Math.PI} userData={{ animUnit: true }}>
        <NinjaSP101 item={NOOP_ITEM} actionState={actionState} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
