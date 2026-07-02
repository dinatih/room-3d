/**
 * Porte blanche intérieure — Refondue pour s'adapter aux ouvertures de 80cm.
 * 75cm (panneau) + 2.5cm * 2 (dormant) = 80cm total.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { SceneItemProps } from '@shared/types';
import { WALL_THICKNESS, PARTITION_THICKNESS } from '../wallData';

const W  = 83;     // Largeur panneau (ouvrant de 83 cm)
const H  = 204;    // Hauteur standard
const T  = 4;      // Épaisseur panneau
const R  = 1.3;    // Rayon poignée

const DT = 2.5;    // Épaisseur dormant
const WW = WALL_THICKNESS;   // Profondeur dormant (épaisseur mur)
const CW = 4.0;    // Largeur chambranle (casing)
const CT = 1.0;    // Épaisseur chambranle
const GAP = 0.1;   // Petit jeu pour éviter le z-fighting (1mm)

function useDoorFrameGeo(wallThickness: number = 10.0) {
  return useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      geo.translate(x, y, z);
      geos.push(geo);
    };

    // ── Dormant ──
    addBox(DT, H, wallThickness - 0.02, -(W / 2 + DT / 2), H / 2, 0);
    addBox(DT, H, wallThickness - 0.02,  (W / 2 + DT / 2), H / 2, 0);
    addBox(W, DT, wallThickness - 0.02, 0, H + DT / 2, 0);

    // ── Chambranles ──
    for (const sign of [-1, 1]) {
      const z = sign * (wallThickness / 2 + CT / 2 + GAP);
      addBox(CW, H + DT, CT, -(W / 2 + DT + CW / 2 - 1), (H + DT) / 2, z);
      addBox(CW, H + DT, CT,  (W / 2 + DT + CW / 2 - 1), (H + DT) / 2, z);
      addBox(W + DT * 2 + CW - 2, CW, CT, 0, H + DT + CW / 2 - 1, z);
    }

    const merged = mergeGeometries(geos, false);
    return merged;
  }, [wallThickness]);
}

function useHandleGeo(mancheDir: number = 1) {
  return useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const addRotatedCylinder = (
      r: number, h: number,
      x: number, y: number, z: number,
      rx: number, ry: number, rz: number
    ) => {
      const geo = new THREE.CylinderGeometry(r, r, h, 16);
      geo.rotateX(rx);
      geo.rotateY(ry);
      geo.rotateZ(rz);
      geo.translate(x, y, z);
      geos.push(geo);
    };

    // Tige passant à travers la porte
    addRotatedCylinder(R, 8, 0, 0, 0, Math.PI / 2, 0, 0);

    // Placas de propreté (carrées de 5x5)
    for (const sign of [-1, 1]) {
      const pz = sign * 2.2;
      const plaque = new THREE.BoxGeometry(4.5, 4.5, 0.2);
      plaque.translate(0, 0, pz);
      geos.push(plaque);
    }

    // Béquilles (poignées de 11cm de long)
    for (const sign of [-1, 1]) {
      const pz = sign * 4.0;
      // axe de rotation (cylindre court vers l'extérieur)
      addRotatedCylinder(R * 0.9, 3, 0, 0, pz - sign * 1.5, Math.PI / 2, 0, 0);
      // poignée horizontale
      const px = -mancheDir * 5.5;
      addRotatedCylinder(R * 0.95, 11, px, 0, pz, 0, 0, Math.PI / 2);
    }

    return mergeGeometries(geos, false);
  }, [mancheDir]);
}

interface DoorImplProps {
  actionKey: string;
  pivotX: number;
  panelX: number;
  handleX: number;
  mancheDir: number;
  openAngle: number;
  actionState: Record<string, any>;
  onSize: (v: THREE.Vector3) => void;
  wallThickness?: number;
}

function DoorImpl({
  actionKey,
  pivotX,
  panelX,
  handleX,
  mancheDir,
  openAngle,
  actionState,
  onSize,
  wallThickness = WALL_THICKNESS
}: DoorImplProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen = !!actionState[actionKey];
  const { invalidate } = useThree();

  const frameGeo  = useDoorFrameGeo(wallThickness);
  const handleGeo = useHandleGeo(mancheDir);

  useLayoutEffect(() => {
    // Dimension totale pour l'inventaire/minimap (80cm de large hors chambranles)
    onSize(new THREE.Vector3(W + DT * 2, H + DT, wallThickness));
  }, [wallThickness]);

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

      <mesh geometry={frameGeo} castShadow receiveShadow>
        {dormMat}
      </mesh>

      <group ref={doorRef} position={[pivotX, 0, 0]}>
        {/* Panneau mobile */}
        <mesh position={[panelX, H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H, T]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
        </mesh>
        
        {/* Poignées */}
        <mesh position={[handleX, 100, 0]} geometry={handleGeo}>
          <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.15} />
        </mesh>
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
      wallThickness={PARTITION_THICKNESS}
    />
  );
}
