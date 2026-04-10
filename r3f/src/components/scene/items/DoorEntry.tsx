/**
 * Porte d'entrée rouge — 90×204cm, charnière gauche, ouvre à -120°.
 * Inclut : encadrement rouge (extérieur) + blanc (intérieur) + sections murales.
 * La porte est dans le mur diagonal, ici simplifié en section rectangulaire.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W  = 90;    // ENTRY_DOOR_W
const H  = 204;   // DOOR_H
const T  = 4;     // épaisseur panneau
const R  = 1.3;

const FW = 3;     // largeur encadrement (chambranle)
const WW = 10;    // épaisseur mur
const WH = 250;   // hauteur mur
const PL = 20;    // largeur sections murales

const TOTAL_W  = W + FW * 2 + PL * 2;
const LINTEAU_H = WH - H;

/** Sections murales + encadrement autour du vide */
function WallSurround() {
  const wallMat = <meshStandardMaterial color="#e8e4dc" roughness={0.9} />;
  const redMat  = <meshStandardMaterial color="#cc0000" roughness={0.5} />;
  const whtMat  = <meshStandardMaterial color="#f5f5f0" roughness={0.3} />;

  return (
    <>
      {/* Mur latéral gauche */}
      <mesh position={[-(W / 2 + FW + PL / 2), WH / 2, 0]}>
        <boxGeometry args={[PL, WH, WW]} />{wallMat}
      </mesh>
      {/* Mur latéral droit */}
      <mesh position={[ (W / 2 + FW + PL / 2), WH / 2, 0]}>
        <boxGeometry args={[PL, WH, WW]} />{wallMat}
      </mesh>
      {/* Linteau */}
      <mesh position={[0, H + LINTEAU_H / 2, 0]}>
        <boxGeometry args={[TOTAL_W, LINTEAU_H, WW]} />{wallMat}
      </mesh>

      {/* ── Encadrement extérieur rouge (face -Z) ── */}
      <mesh position={[-(W / 2 + FW / 2), H / 2, -(WW / 2 + 0.5)]}>
        <boxGeometry args={[FW, H, 1]} />{redMat}
      </mesh>
      <mesh position={[ (W / 2 + FW / 2), H / 2, -(WW / 2 + 0.5)]}>
        <boxGeometry args={[FW, H, 1]} />{redMat}
      </mesh>
      <mesh position={[0, H + FW / 2, -(WW / 2 + 0.5)]}>
        <boxGeometry args={[W + FW * 2, FW, 1]} />{redMat}
      </mesh>

      {/* ── Encadrement intérieur blanc (face +Z) ── */}
      <mesh position={[-(W / 2 + FW / 2), H / 2, WW / 2 + 0.5]}>
        <boxGeometry args={[FW, H, 1]} />{whtMat}
      </mesh>
      <mesh position={[ (W / 2 + FW / 2), H / 2, WW / 2 + 0.5]}>
        <boxGeometry args={[FW, H, 1]} />{whtMat}
      </mesh>
      <mesh position={[0, H + FW / 2, WW / 2 + 0.5]}>
        <boxGeometry args={[W + FW * 2, FW, 1]} />{whtMat}
      </mesh>
    </>
  );
}

export function DoorEntry({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState['entry-door-toggle'] ?? false;
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(TOTAL_W, WH, WW));
  }, []);

  useFrame(() => {
    const target = isOpen ? -(2 * Math.PI / 3) : 0;
    const delta = target - doorRef.current.rotation.y;
    if (Math.abs(delta) > 0.001) {
      doorRef.current.rotation.y += delta * 0.12;
      invalidate();
    } else {
      doorRef.current.rotation.y = target;
    }
  });

  // Handle L : 70cm depuis charnière (gauche = -W/2)
  const hz = 70, hy = 100;
  const fZ = T / 2; // face intérieure (vers camera)

  return (
    <group position={[0, -WH / 2, 0]}>

      <WallSurround />

      <group ref={doorRef} position={[-W / 2, 0, 0]}>

        {/* Panneau rouge */}
        <mesh position={[W / 2, H / 2, 0]}>
          <boxGeometry args={[W, H, T]} />
          <meshStandardMaterial color="#cc0000" roughness={0.5} metalness={0.1} />
        </mesh>

        {/* ── Poignée intérieure L (face +Z) ── */}
        <mesh position={[hz, hy, fZ + 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3, 3, 1, 12]} />
          <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[hz, hy, fZ + 3.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R, R, 5, 8]} />
          <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[hz - 7, hy, fZ + 6]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[R, R, 14, 8]} />
          <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.15} />
        </mesh>
        {([hz, hz - 14] as const).map((bx, i) => (
          <mesh key={i} position={[bx, hy, fZ + 6]}>
            <sphereGeometry args={[R, 8, 6]} />
            <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.15} />
          </mesh>
        ))}

        {/* Knob rouge extérieur (face -Z) */}
        <mesh position={[W / 2, H / 2, -T / 2 - 5]}>
          <sphereGeometry args={[5, 16, 12]} />
          <meshStandardMaterial color="#cc0000" metalness={0.3} roughness={0.4} />
        </mesh>

      </group>

    </group>
  );
}
