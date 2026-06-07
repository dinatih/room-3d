/**
 * Porte blanche intérieure — 83×204cm, poignée L double face.
 *
 * Variantes :
 *   DoorLiving — charnière droite (+X), ouvre -90° (côté séjour)
 *   DoorBath    — charnière gauche (-X), ouvre +90° (côté couloir)
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W  = 83;     // DOOR_W
const H  = 204;    // DOOR_H
const T  = 4;      // épaisseur panneau
const R  = 1.3;    // rayon poignée

const DT = 2.5;    // épaisseur des montants du dormant
const WW = 10;     // épaisseur du dormant (profondeur Z)


/** Poignée L double face (±Z) */
function LHandle({ handleX, mancheDir }: { handleX: number; mancheDir: 1 | -1 }) {
  const hy = 100;
  const hMat = <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.15} />;
  return (
    <>
      {([-1, 1] as const).map(sign => (
        <group key={sign}>
          {/* Rose */}
          <mesh position={[handleX, hy, sign * (T / 2 + 0.5)]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3, 3, 1, 12]} />{hMat}
          </mesh>
          {/* Tige */}
          <mesh position={[handleX, hy, sign * (T / 2 + 3.5)]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[R, R, 5, 8]} />{hMat}
          </mesh>
          {/* Manche (vers charnière) */}
          <mesh position={[handleX + mancheDir * 7, hy, sign * (T / 2 + 6)]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[R, R, 14, 8]} />{hMat}
          </mesh>
          {([0, mancheDir * 14] as const).map((dx, i) => (
            <mesh key={i} position={[handleX + dx, hy, sign * (T / 2 + 6)]}>
              <sphereGeometry args={[R, 8, 6]} />{hMat}
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function DoorImpl({
  actionKey, pivotX, panelX, handleX, mancheDir, openAngle, actionState, onSize,
}: {
  actionKey: string;
  pivotX: number; panelX: number; handleX: number; mancheDir: 1 | -1;
  openAngle: number;
  actionState: Record<string, boolean>;
  onSize: (s: THREE.Vector3) => void;
}) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState[actionKey] ?? false;
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W + DT * 2, H + DT, WW));
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

  const dormMat = <meshStandardMaterial color="#f0ede8" roughness={0.35} />;

  return (
    <group position={[0, -H / 2, 0]}>

      {/* Dormant (contour fixe) */}
      <mesh position={[-(W / 2 + DT / 2), H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DT, H, WW]} />{dormMat}
      </mesh>
      <mesh position={[ (W / 2 + DT / 2), H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DT, H, WW]} />{dormMat}
      </mesh>
      <mesh position={[0, H + DT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, DT, WW]} />{dormMat}
      </mesh>

      <group ref={doorRef} position={[pivotX, 0, 0]}>
        {/* Panneau */}
        <mesh position={[panelX, H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H, T]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
        </mesh>
        <LHandle handleX={handleX} mancheDir={mancheDir} />
      </group>

    </group>
  );
}

/** Porte séjour — charnière droite, ouvre -90° vers le séjour */
export function DoorLiving({ actionState, onSize }: SceneItemProps) {
  return (
    <DoorImpl
      actionKey="living-door-toggle"
      pivotX={W / 2}   panelX={-W / 2}   handleX={-W + 15}   mancheDir={1}
      openAngle={-Math.PI / 2}
      actionState={actionState} onSize={onSize}
    />
  );
}

/** Porte SDB — charnière gauche, ouvre +90° vers la SDB */
export function DoorBath({ actionState, onSize }: SceneItemProps) {
  return (
    <DoorImpl
      actionKey="bathroom-door-toggle"
      pivotX={-W / 2}  panelX={W / 2}    handleX={W - 15}    mancheDir={-1}
      openAngle={Math.PI / 2}
      actionState={actionState} onSize={onSize}
    />
  );
}
