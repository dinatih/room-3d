/**
 * Porte blanche intérieure — 83×204cm, poignée L double face.
 * Inclut : dormant + sections murales latérales + linteau.
 *
 * Variantes :
 *   DoorLiving — charnière droite (+X), ouvre -90° (côté séjour)
 *   DoorSdb    — charnière gauche (-X), ouvre +90° (côté couloir)
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W  = 83;     // DOOR_W
const H  = 204;    // DOOR_H
const T  = 4;      // épaisseur panneau
const R  = 1.3;    // rayon poignée

const DT = 2.5;    // DORMANT_T — épaisseur des montants dormant
const WW = 10;     // WALL_W — épaisseur du mur / dormant en profondeur
const WH = 250;    // WALL_H — hauteur totale du mur
const PL = 20;     // largeur des sections murales latérales (visuelles)

const TOTAL_W  = W + DT * 2 + PL * 2;
const LINTEAU_H = WH - H;

/** Sections murales + dormant autour du vide de porte */
function WallSurround() {
  const wallMat  = <meshStandardMaterial color="#e8e4dc" roughness={0.9} />;
  const dormMat  = <meshStandardMaterial color="#f0ede8" roughness={0.35} />;

  return (
    <>
      {/* Sections murales latérales */}
      <mesh position={[-(W / 2 + DT + PL / 2), WH / 2, 0]}>
        <boxGeometry args={[PL, WH, WW]} />{wallMat}
      </mesh>
      <mesh position={[ (W / 2 + DT + PL / 2), WH / 2, 0]}>
        <boxGeometry args={[PL, WH, WW]} />{wallMat}
      </mesh>

      {/* Linteau au-dessus de la porte */}
      <mesh position={[0, H + LINTEAU_H / 2, 0]}>
        <boxGeometry args={[TOTAL_W, LINTEAU_H, WW]} />{wallMat}
      </mesh>

      {/* Montant gauche dormant */}
      <mesh position={[-(W / 2 + DT / 2), H / 2, 0]}>
        <boxGeometry args={[DT, H, WW]} />{dormMat}
      </mesh>
      {/* Montant droit dormant */}
      <mesh position={[ (W / 2 + DT / 2), H / 2, 0]}>
        <boxGeometry args={[DT, H, WW]} />{dormMat}
      </mesh>
      {/* Traverse supérieure dormant */}
      <mesh position={[0, H + DT / 2, 0]}>
        <boxGeometry args={[W, DT, WW]} />{dormMat}
      </mesh>
    </>
  );
}

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

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(TOTAL_W, WH, WW));
  }, []);

  useFrame(() => {
    const target = isOpen ? openAngle : 0;
    doorRef.current.rotation.y += (target - doorRef.current.rotation.y) * 0.12;
  });

  return (
    <group position={[0, -WH / 2, 0]}>

      <WallSurround />

      <group ref={doorRef} position={[pivotX, 0, 0]}>
        {/* Panneau */}
        <mesh position={[panelX, H / 2, 0]}>
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
export function DoorSdb({ actionState, onSize }: SceneItemProps) {
  return (
    <DoorImpl
      actionKey="bathroom-door-toggle"
      pivotX={-W / 2}  panelX={W / 2}    handleX={W - 15}    mancheDir={-1}
      openAngle={Math.PI / 2}
      actionState={actionState} onSize={onSize}
    />
  );
}
