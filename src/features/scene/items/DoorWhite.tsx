/**
 * Porte blanche intérieure — Refondue pour s'adapter aux ouvertures de 80cm.
 * 75cm (panneau) + 2.5cm * 2 (dormant) = 80cm total.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W  = 75;     // Largeur panneau (ajusté pour trou de 80cm)
const H  = 204;    // Hauteur standard
const T  = 4;      // Épaisseur panneau
const R  = 1.3;    // Rayon poignée

const DT = 2.5;    // Épaisseur dormant
const WW = 10.0;   // Profondeur dormant (épaisseur mur)
const CW = 4.0;    // Largeur chambranle (casing)
const CT = 1.0;    // Épaisseur chambranle
const GAP = 0.1;   // Petit jeu pour éviter le z-fighting (1mm)

/** Poignée L double face (±Z) */
function LHandle({ handleX, mancheDir }: { handleX: number; mancheDir: 1 | -1 }) {
  const hy = 100;
  const hMat = <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.15} />;
  return (
    <>
      {([-1, 1] as const).map(sign => (
        <group key={sign}>
          <mesh position={[handleX, hy, sign * (T / 2 + 0.5)]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3, 3, 1, 12]} />{hMat}
          </mesh>
          <mesh position={[handleX, hy, sign * (T / 2 + 3.5)]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[R, R, 5, 8]} />{hMat}
          </mesh>
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
    // Dimension totale pour l'inventaire/minimap (80cm de large hors chambranles)
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

      {/* ── Dormant (fixe dans le mur) ── */}
      <mesh position={[-(W / 2 + DT / 2), H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DT, H, WW - 0.02]} />{dormMat}
      </mesh>
      <mesh position={[ (W / 2 + DT / 2), H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DT, H, WW - 0.02]} />{dormMat}
      </mesh>
      <mesh position={[0, H + DT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, DT, WW - 0.02]} />{dormMat}
      </mesh>

      {/* ── Chambranles (habillage des deux côtés) ── */}
      {([-1, 1] as const).map(sign => (
        <group key={sign} position={[0, 0, sign * (WW / 2 + CT / 2 + GAP)]}>
          {/* Montants verticaux */}
          <mesh position={[-(W / 2 + DT + CW / 2 - 1), (H + DT) / 2, 0]} castShadow>
            <boxGeometry args={[CW, H + DT, CT]} />{dormMat}
          </mesh>
          <mesh position={[ (W / 2 + DT + CW / 2 - 1), (H + DT) / 2, 0]} castShadow>
            <boxGeometry args={[CW, H + DT, CT]} />{dormMat}
          </mesh>
          {/* Traverse haute */}
          <mesh position={[0, H + DT + CW / 2, 0]} castShadow>
            <boxGeometry args={[W + (DT + CW) * 2 - 2, CW, CT]} />{dormMat}
          </mesh>
        </group>
      ))}

      <group ref={doorRef} position={[pivotX, 0, 0]}>
        {/* Panneau mobile */}
        <mesh position={[panelX, H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H, T]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
        </mesh>
        <LHandle handleX={handleX} mancheDir={mancheDir} />
      </group>

    </group>
  );
}

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
