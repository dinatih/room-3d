import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import { doorRequested } from '../ai/navigation/doorRequests';
/**
 * Porte d'entrée rouge — 90×204cm, charnière gauche, ouvre à -120°.
 * Encadrement rouge (extérieur) + blanc (intérieur).
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createDoorHandleGeometry } from './doorHandleGeometry';
import type { SceneItemProps } from '@shared/types';
import { DOOR_CONFIGS, computeDoorDynamics, doorCollisionState } from '../doorObstacles';
import { useDoorOpen } from './useDoorOpen';
import { useDoorSpring } from './useDoorSpring';
import { DoorEntryFrame } from './DoorFrame';

export const ENTRY_W = 90;
const W  = ENTRY_W;
const H  = 204;   // DOOR_H
const T  = 4;     // épaisseur panneau

const WW = 10;    // épaisseur du mur (profondeur Z)

const redPanelMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.5, metalness: 0.1 });
const metalHandleMaterial = new THREE.MeshStandardMaterial({ color: '#999999', metalness: 0.85, roughness: 0.15 });
const knobMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000', metalness: 0.3, roughness: 0.4 });
const wallMat = new THREE.MeshStandardMaterial({ color: '#f5f4ef', roughness: 0.85, metalness: 0.05 });

export function DoorEntry({ onSize, isPreview = false, showFrame = true, actionState = {} }: Partial<Omit<SceneItemProps, 'item'>> & { showFrame?: boolean }) {
  const navigationEnabled = useNavigationEnabled() && !isPreview;
  const doorRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();
  const spring = useDoorSpring();
  const open = useDoorOpen('entryDoor', isPreview, actionState);

  const handle = useMemo(() => createDoorHandleGeometry(T, -1, [1]), []);

  useLayoutEffect(() => {
    onSize?.(new THREE.Vector3(W + 5, H + 1, WW + 2));
  }, [onSize]);

  useFrame((_, delta) => {
    const current = doorRef.current.rotation.y;
    const { allowed, push, minimum } = navigationEnabled ? computeDoorDynamics(DOOR_CONFIGS.entry, current) : { allowed: DOOR_CONFIGS.entry.maxAngle, push: 0, minimum: 0 };
    const target = -Math.min(allowed, Math.max(minimum, push, open ? allowed : 0, navigationEnabled && doorRequested('entry') ? allowed : 0));
    const next = spring(current, target, delta, -allowed, -minimum);
    doorRef.current.rotation.y = next;
    if (next !== current) invalidate();
    if (navigationEnabled) doorCollisionState.entry.angle = doorRef.current.rotation.y;
  });

  return (
    <group position={[0, 0, 0]}>
      {showFrame && <DoorEntryFrame />}

      <group ref={doorRef} position={[-W / 2, 0, 0]}>
        {/* Panneau rouge */}
        <mesh position={[W / 2, (H - 1) / 2, 0]} material={redPanelMaterial} castShadow receiveShadow>
          {/* La feuillure du dormant occupe 1 cm de chaque côté et sous la traverse. */}
          <boxGeometry args={[W - 2, H - 1, T]} />
        </mesh>

        {/* Poignée intérieure */}
        <mesh position={[70, 100, 0]} geometry={handle} material={metalHandleMaterial} />

        {/* Knob rouge extérieur (face -Z) */}
        <mesh position={[W / 2, H / 2, -T / 2 - 5]} material={knobMaterial}>
          <sphereGeometry args={[5, 16, 12]} />
        </mesh>
      </group>

      {/* Linteau au-dessus de la porte d'entrée ajusté à l'ouverture exacte de 90cm (Y=204 à 250) */}
      <mesh position={[0, H + 23, 0]} material={wallMat} castShadow receiveShadow>
        <boxGeometry args={[W, 46, WW]} />
      </mesh>
    </group>
  );
}
