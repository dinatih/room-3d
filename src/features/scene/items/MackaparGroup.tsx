import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Mackapar50530988 } from './Mackapar50530988';
import { SpruttigInstances } from './Spruttig20317079';
import { TShirt } from './TShirt';
import { DroneCell, DF } from './Drona';
import type { SceneModelProps } from '@shared/types';

// ── Constantes ────────────────────────────────────────────────────────────────
// Hauteurs des tringles de penderie MACKAPÄR
const TOP_RAIL_Y    = 172; // 174 - 2 cm
const BOTTOM_RAIL_Y = 106; // 107 - 1 cm
const HANGER_Z      = [-25, -15, -5, 5, 15, 25];
const HANGER_ROTS   = [0.03, -0.04, 0.02, -0.03, 0.05, -0.02];

const MACKAPAR_HANGER_TRANSFORMS = [
  ...HANGER_Z.map((z, i) => ({
    position: [0, TOP_RAIL_Y, z] as [number, number, number],
    rotation: [0, HANGER_ROTS[i], 0] as [number, number, number],
  })),
  ...HANGER_Z.map((z, i) => ({
    position: [0, BOTTOM_RAIL_Y, z] as [number, number, number],
    rotation: [0, -HANGER_ROTS[i], 0] as [number, number, number],
  })),
];

export function MackaparHangers() {
  return (
    <>
      {/* 12 cintres Spruttig instanciés en un seul draw call */}
      <SpruttigInstances
        transforms={MACKAPAR_HANGER_TRANSFORMS}
        userData={{ sceneItemRoot: true, itemName: 'Cintres Spruttig Mackapär' }}
      />

      {/* T-shirt noir suspendu sur le cintre le plus à l'ouest de la barre basse (z = -25) */}
      <TShirt
        position={[0, BOTTOM_RAIL_Y, HANGER_Z[0]]}
        rotation={[0, -HANGER_ROTS[0], 0]}
      />
    </>
  );
}

export function MackaparDrona() {
  return (
    <>
      {[20, -20].map(z => (
        <group key={z} userData={{ sceneItemRoot: true }}>
          <group position={[0.5, 200 + DF / 2 + 0.2, z]} rotation-y={-Math.PI / 2}>
            <DroneCell />
          </group>
        </group>
      ))}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function MackaparGroup({ onSize, noDrona, noHangers }: SceneModelProps & { noDrona?: boolean; noHangers?: boolean }) {
  const ref = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    ref.current.updateMatrixWorld(true);
    onSize?.(new THREE.Box3().setFromObject(ref.current).getSize(new THREE.Vector3()));
  }, [onSize]);

  return (
    <group ref={ref}>
      <group userData={{ sceneItemRoot: true }}>
        <Mackapar50530988 />
      </group>

      {!noHangers && <MackaparHangers />}
      {!noDrona && <MackaparDrona />}
    </group>
  );
}

