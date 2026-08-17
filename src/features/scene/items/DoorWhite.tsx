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



function makeLeftFrameShape(wallThickness: number) {
  const halfWT = wallThickness / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-(halfWT + 1.0), 3.0);
  shape.lineTo(-halfWT, 3.0);
  shape.lineTo(-halfWT, 0);
  shape.lineTo(halfWT, 0);
  shape.lineTo(halfWT, 3.0);
  shape.lineTo(halfWT + 1.0, 3.0);
  shape.lineTo(halfWT + 1.0, -1.0);
  shape.lineTo(-0.2, -1.0);
  shape.lineTo(-0.2, -2.8);
  shape.lineTo(-2.0, -2.8);
  shape.lineTo(-2.0, -1.0);
  shape.lineTo(-(halfWT + 1.0), -1.0);
  shape.closePath();
  return shape;
}

function makeRightFrameShape(wallThickness: number) {
  const halfWT = wallThickness / 2;
  const shape = new THREE.Shape();
  shape.moveTo(halfWT + 1.0, 3.0);
  shape.lineTo(halfWT + 1.0, -1.0);
  shape.lineTo(2.0, -1.0);
  shape.lineTo(2.0, -2.8);
  shape.lineTo(0.2, -2.8);
  shape.lineTo(0.2, -1.0);
  shape.lineTo(-(halfWT + 1.0), -1.0);
  shape.lineTo(-(halfWT + 1.0), 3.0);
  shape.lineTo(-halfWT, 3.0);
  shape.lineTo(-halfWT, 0);
  shape.lineTo(halfWT, 0);
  shape.lineTo(halfWT, 3.0);
  shape.closePath();
  return shape;
}

function useDoorFrameGeo(wallThickness: number = 10.0) {
  return useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];

    const leftShape = makeLeftFrameShape(wallThickness);
    const rightShape = makeRightFrameShape(wallThickness);

    // Left Jamb
    const leftGeo = new THREE.ExtrudeGeometry(leftShape, { depth: H, bevelEnabled: false });
    leftGeo.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2, 'XYZ')));
    leftGeo.translate(-W / 2, 0, 0);
    geos.push(leftGeo);

    // Right Jamb
    const rightGeo = new THREE.ExtrudeGeometry(rightShape, { depth: H, bevelEnabled: false });
    rightGeo.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2, 'XYZ')));
    rightGeo.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0, 'XYZ')));
    rightGeo.translate(W / 2, 0, 0);
    geos.push(rightGeo);

    // Header
    const headerGeo = new THREE.ExtrudeGeometry(leftShape, { depth: W, bevelEnabled: false });
    headerGeo.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0, 'XYZ')));
    headerGeo.translate(-W / 2, H, 0);
    geos.push(headerGeo);

    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    return merged;
  }, [wallThickness]);
}

function useHandleGeo(mancheDir: number = 1) {
  return useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const addGeo = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
      if (rx) geo.rotateX(rx);
      if (ry) geo.rotateY(ry);
      if (rz) geo.rotateZ(rz);
      geo.translate(x, y, z);
      geos.push(geo);
    };

    const halfT = T / 2;

    for (const sign of [-1, 1]) {
      const zBase = sign * (halfT + 0.5);
      const zMid  = sign * (halfT + 3.5);
      const zEnd  = sign * (halfT + 6);

      // Rose (circular plate)
      addGeo(new THREE.CylinderGeometry(3, 3, 1, 12), 0, 0, zBase, Math.PI / 2, 0, 0);
      
      // Tige
      addGeo(new THREE.CylinderGeometry(R, R, 5, 8), 0, 0, zMid, Math.PI / 2, 0, 0);

      // Manche (horizontal lever)
      addGeo(new THREE.CylinderGeometry(R, R, 14, 8), mancheDir * 7, 0, zEnd, 0, 0, Math.PI / 2);

      // Spheres (rounded ends)
      addGeo(new THREE.SphereGeometry(R, 8, 6), 0, 0, zEnd);
      addGeo(new THREE.SphereGeometry(R, 8, 6), mancheDir * 14, 0, zEnd);
    }

    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    return merged;
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

const frameMaterial = new THREE.MeshStandardMaterial({ color: '#f0ede8', roughness: 0.35 });
const doorPanelMaterial = new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.4 });
const doorHandleMaterial = new THREE.MeshStandardMaterial({ color: '#999999', metalness: 0.85, roughness: 0.15 });

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
  const isOpen = actionState[actionKey] ?? false;
  const { invalidate } = useThree();

  const frameGeo  = useDoorFrameGeo(wallThickness);
  const handleGeo = useHandleGeo(mancheDir);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, wallThickness + 2));
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

  return (
    <group position={[0, -H / 2, 0]}>
      <mesh geometry={frameGeo} material={frameMaterial} castShadow receiveShadow />

      <group ref={doorRef} position={[pivotX, 0, 0]}>
        {/* Panneau mobile */}
        <mesh position={[panelX, H / 2, 0]} material={doorPanelMaterial} castShadow receiveShadow>
          <boxGeometry args={[W, H, T]} />
        </mesh>
        
        {/* Poignées */}
        <mesh position={[handleX, 100, 0]} geometry={handleGeo} material={doorHandleMaterial} />
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
      wallThickness={PARTITION_THICKNESS}
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
