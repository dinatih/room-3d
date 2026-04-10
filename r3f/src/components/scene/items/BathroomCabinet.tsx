/**
 * Meuble mural SDB (METOD 40×37×60 cm) — géométrie fidèle à bathroom.js
 * Deux variantes : West (charnière gauche, ouvre -90°) et East (charnière droite, +90°)
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W  = 40;   // largeur X (CBN_W)
const D  = 37;   // profondeur Z (CBN_BODY_D)
const H  = 60;   // hauteur Y (CBN_H)
const DT = 2;    // épaisseur porte (CBN_DOOR_D)

function CabinetImpl({
  actionKey, pivotX, panelX, handleX, openAngle, actionState, onSize,
}: {
  actionKey: string;
  pivotX: number;
  panelX: number;
  handleX: number;
  openAngle: number;
  actionState: Record<string, boolean>;
  onSize: (s: THREE.Vector3) => void;
}) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState[actionKey] ?? false;
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  useFrame(() => {
    const target = isOpen ? openAngle : 0;
    const delta = target - doorRef.current.rotation.y;
    if (Math.abs(delta) > 0.001) {
      doorRef.current.rotation.y += delta * 0.12;
      invalidate();
    } else {
      doorRef.current.rotation.y = target;
    }
  });

  const pvcMat  = { color: '#f0f0f0', roughness: 0.3 } as const;
  const insMat  = { color: '#eeeeee', roughness: 0.4 } as const;

  return (
    <group position={[0, -H / 2, 0]}>

      {/* ── Corps ── */}
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial {...pvcMat} />
      </mesh>

      {/* Fond intérieur (visible portes ouvertes) */}
      <mesh position={[0, H / 2, D / 2 - 0.4]}>
        <boxGeometry args={[W - DT * 2, H - DT * 2, 0.5]} />
        <meshStandardMaterial {...insMat} />
      </mesh>

      {/* Tablette centrale */}
      <mesh position={[0, H * 0.5, 0]}>
        <boxGeometry args={[W - DT * 2 - 2, DT, D - DT * 2]} />
        <meshStandardMaterial {...insMat} />
      </mesh>

      {/* ── Porte ── */}
      <group ref={doorRef} position={[pivotX, 0, -(D / 2 + DT / 2)]}>

        {/* Panneau */}
        <mesh position={[panelX, H / 2, 0]}>
          <boxGeometry args={[W - 2, H - 2, DT]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.2} />
        </mesh>

        {/* Poignée */}
        <mesh position={[handleX, H * 0.6, DT / 2 + 0.75]}>
          <boxGeometry args={[2, 12, 1.5]} />
          <meshStandardMaterial color="#999999" metalness={0.5} roughness={0.3} />
        </mesh>

      </group>

    </group>
  );
}

export function BathroomCabinetWest({ actionState, onSize }: SceneItemProps) {
  return (
    <CabinetImpl
      actionKey="cbn-west-toggle"
      pivotX={-W / 2}   panelX={W / 2}    handleX={W - 6}
      openAngle={-Math.PI / 2}
      actionState={actionState} onSize={onSize}
    />
  );
}

export function BathroomCabinetEast({ actionState, onSize }: SceneItemProps) {
  return (
    <CabinetImpl
      actionKey="cbn-east-toggle"
      pivotX={W / 2}    panelX={-W / 2}   handleX={-(W - 6)}
      openAngle={Math.PI / 2}
      actionState={actionState} onSize={onSize}
    />
  );
}
