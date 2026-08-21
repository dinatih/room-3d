/**
 * CuisineGroup.tsx — plan de travail, évier, plaques, frigo, meuble bas, meuble haut + 3 Drona.
 *
 * Coordonnées locales : Y=0 = sol, centré XZ autour de KITCHEN_X0.
 * Placement monde : wrapper group dans Furniture.tsx
 *   → position=[KITCHEN_X0, 0, ROOM_D] = [30, 0, 400], sans rotation
 * Utilisé aussi dans l'inventaire via registry.ts.
 */
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import { Counter }        from './Counter';
import { SinkBoholmen }   from './SinkBoholmen';
import { Stove }          from './Stove';
import { KitchenCabinet } from './KitchenCabinet';
import { Fridge }         from './Fridge';
import { DroneCell } from './Drona';
import { Lillhavet80461276 } from './Lillhavet80461276';
import { Snitta00287295 } from './Snitta00287295';
import { Fornuft40428482 } from './Fornuft40428482';
import { Fornuft10428488 } from './Fornuft10428488';
import { Fornuft90428489 } from './Fornuft90428489';
import { Fornuft80428475 } from './Fornuft80428475';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { SceneItemProps } from '@shared/types';

// ── Constantes ────────────────────────────────────────────────────────────────
// Wrapper world pos: (KITCHEN_X0=30, 0, ROOM_D=400)
// KIT_W = KITCHEN_X1 - KITCHEN_X0 = 100, KIT_D = KITCHEN_DEPTH = 60

const KIT_W       = 100;
const KIT_D       = 60;
const COUNTER_H   = 90;
const COUNTER_SLAB = 3;
const CABINET_W   = 40;
const FRIDGE_W    = 60;

// ── Meuble haut ───────────────────────────────────────────────────────────────

const METOD_WALL_GLB = 'items/METOD Rangement mural blanc 40x37x100 cm.glb';

function UpperCabinet() {
  const { scene } = useGLTFClone(METOD_WALL_GLB);
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    scene.rotation.set(-Math.PI / 2, 0, 0); // Z-up GLB → debout, -X flip profondeur vers salle
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);

    // Centre le scene debout : X/Z centré à 0, Y bas à 0
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    // Le group wrapper applique Rz(PI/2) → couche le cabinet sur le côté :
    //   scene X (largeur 40) → group Y (hauteur 40)
    //   scene Y (hauteur 100) → group -X → centré à KIT_W/2
    //   scene Z (profondeur 37) → group Z → dos flush fond niche
    const half_w  = (box.max.x - box.min.x) / 2;
    const height_h = box.max.y - box.min.y;
    const half_d  = (box.max.z - box.min.z) / 2;
    groupRef.current.position.set(
      KIT_W / 2 + height_h / 2,
      COUNTER_H + COUNTER_SLAB + 60 + half_w,
      KIT_D - half_d,
    );
  }, [scene]);

  return (
    <group ref={groupRef} rotation={[0, 0, Math.PI / 2]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(METOD_WALL_GLB);

// ── Drona (3 boîtes sur le meuble haut) ──────────────────────────────────────
// World: x=[46.75, 80, 113.25], y=211.7, z=440.5, rotY=π
// Local (wrapper at (30,0,400)): x=[16.75, 50, 83.25], y=211.7, z=40.5, rotY=π

const DF       = 33;
const rot90    = new THREE.Matrix4(); // Identité

const KIT_W_FULL = 100;
const gap        = (KIT_W_FULL - 3 * DF) / 4;  // 0.25

const DRONA_MATRICES = [0, 1, 2].map(i => {
  const x = gap + DF / 2 + i * (DF + gap);      // 16.75, 50, 83.25
  return rot90.clone().setPosition(x, 195 + DF / 2 + 0.2, KIT_D - 38 / 2 - 0.5);
  //                                                         40.5
});

// ── Composant principal ───────────────────────────────────────────────────────

const DRONA_TRANSFORMS = DRONA_MATRICES.map(m => {
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  m.decompose(p, q, s);
  return { p, q, s };
});

/** Drona layer seul — pour placement dans un layer séparé (furniture). */
export function CuisineDrona() {
  return (
    <>
      {DRONA_TRANSFORMS.map((t, i) => (
        <group key={i} position={t.p} quaternion={t.q} scale={t.s} userData={{ animUnit: true }}>
          <DroneCell />
        </group>
      ))}
    </>
  );
}

export function CuisineLillhavet() {
  return (
    <group position={[75, 155, 41]}>
      <Lillhavet80461276 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      <group position={[0, 4, -2]}>
        <group position={[1, 0, 1]} rotation={[0.2, 0, 0.1]}><Snitta00287295 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[-1, 0, -1]} rotation={[-0.2, 0.5, 0.1]}><Snitta00287295 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[2, 0, -2]} rotation={[0.1, 0, 0.2]}><Fornuft40428482 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[-2, 0, 2]} rotation={[-0.1, -0.5, -0.2]}><Fornuft40428482 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[0, 0, 2]} rotation={[0.3, 0.2, 0]}><Fornuft10428488 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[0, 0, -2]} rotation={[-0.3, 0.1, 0.1]}><Fornuft10428488 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[2, 0, 0]} rotation={[0.1, -0.2, 0.3]}><Fornuft90428489 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[-2, 0, 0]} rotation={[0.2, 0.3, -0.1]}><Fornuft90428489 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[1.5, 0, 1.5]} rotation={[0.1, 0, 0.1]}><Fornuft80428475 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
        <group position={[-1.5, 0, -1.5]} rotation={[-0.1, 0.1, -0.1]}><Fornuft80428475 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} /></group>
      </group>
    </group>
  );
}

export function CuisineGroup({ onSize, noDrona }: SceneItemProps & { noDrona?: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, []);

  // Local positions (wrapper at (KITCHEN_X0=30, 0, ROOM_D=400)):
  //   Counter      : (KIT_W/2, COUNTER_H, KIT_D/2)           = (50, 90, 30)
  //   Sink         : (CABINET_W/2, COUNTER_H+SLAB, KIT_D/2)  = (20, 93, 30)
  //   Stove        : (CABINET_W+FRIDGE_W/2, …, KIT_D/2)      = (70, 93, 30)
  //   KitchenCab   : (CABINET_W/2, 45, KIT_D/2)              = (20, 45, 30)
  //   Fridge       : (CABINET_W+FRIDGE_W/2, 45, KIT_D/2)     = (70, 45, 30)

  return (
    <group ref={ref}>
      {/* Plan de travail */}
      <group userData={{ animUnit: true, isIkea: true }}>
        <group position={[KIT_W / 2, COUNTER_H, KIT_D / 2]}>
          <Counter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>

      {/* Évier — bord arrière à 10.5 cm du fond de niche (Z=60) */}
      <group userData={{ animUnit: true, isIkea: true }}>
        <group position={[CABINET_W / 2, COUNTER_H + COUNTER_SLAB - 15, 26]}>
          <SinkBoholmen item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>

      {/* Plaques */}
      <group userData={{ animUnit: true, isIkea: true }}>
        <group position={[CABINET_W + FRIDGE_W / 2, COUNTER_H + COUNTER_SLAB - 4.5, KIT_D / 2]} rotation={[0, -Math.PI, 0]}>
          <Stove item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>

      {/* Meuble sous évier */}
      <group userData={{ animUnit: true, isIkea: true }}>
        <group position={[CABINET_W / 2, 10, KIT_D / 2]}>
          <KitchenCabinet item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>

      {/* Réfrigérateur */}
      <group userData={{ animUnit: true, isIkea: true }}>
        <group position={[CABINET_W + FRIDGE_W / 2, 0, KIT_D / 2]}>
          <Fridge item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>

      {/* Meuble haut */}
      <group userData={{ animUnit: true, isIkea: true }}>
        <UpperCabinet />
      </group>

      {/* 3 boîtes Drona sur le meuble haut */}
      {!noDrona && DRONA_TRANSFORMS.map((t, i) => (
        <group key={i} userData={{ animUnit: true, isIkea: true }}>
          <group position={t.p} quaternion={t.q} scale={t.s}>
            <DroneCell />
          </group>
        </group>
      ))}
    </group>
  );
}
