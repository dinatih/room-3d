import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import { doorRequested } from '../ai/navigation/doorRequests';
/**
 * Porte blanche intérieure — Refondue pour s'adapter aux ouvertures de 80cm.
 * 75cm (panneau) + 2.5cm * 2 (dormant) = 80cm total.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createDoorHandleGeometry } from './doorHandleGeometry';
import type { SceneItemProps } from '@shared/types';
import { WALL_THICKNESS, PARTITION_THICKNESS, DOOR_WHITE_WIDTH, DOOR_FRAME_OVERLAP } from '../wallData';
import { DOOR_CONFIGS, computeDoorDynamics, doorCollisionState, type DoorConfig } from '../doorObstacles';
import { useDoorOpen } from './useDoorOpen';
import { useDoorSpring } from './useDoorSpring';

const W  = DOOR_WHITE_WIDTH;     // Largeur panneau (ouvrant de 83 cm)
const H  = 204;    // Hauteur standard
const T  = 4;      // Épaisseur panneau



function makeLeftFrameShape(wallThickness: number) {
  const halfWT = wallThickness / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-(halfWT + 1.0), DOOR_FRAME_OVERLAP);
  shape.lineTo(-halfWT, DOOR_FRAME_OVERLAP);
  shape.lineTo(-halfWT, 0);
  shape.lineTo(halfWT, 0);
  shape.lineTo(halfWT, DOOR_FRAME_OVERLAP);
  shape.lineTo(halfWT + 1.0, DOOR_FRAME_OVERLAP);
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
  shape.moveTo(halfWT + 1.0, DOOR_FRAME_OVERLAP);
  shape.lineTo(halfWT + 1.0, -1.0);
  shape.lineTo(2.0, -1.0);
  shape.lineTo(2.0, -2.8);
  shape.lineTo(0.2, -2.8);
  shape.lineTo(0.2, -1.0);
  shape.lineTo(-(halfWT + 1.0), -1.0);
  shape.lineTo(-(halfWT + 1.0), DOOR_FRAME_OVERLAP);
  shape.lineTo(-halfWT, DOOR_FRAME_OVERLAP);
  shape.lineTo(-halfWT, 0);
  shape.lineTo(halfWT, 0);
  shape.lineTo(halfWT, DOOR_FRAME_OVERLAP);
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

interface DoorImplProps {
  actionKey: string;
  actionState: SceneItemProps['actionState'];
  pivotX: number;
  panelX: number;
  handleX: number;
  mancheDir: number;
  openAngle: number;
  onSize?: SceneItemProps['onSize'];
  wallThickness?: number;
  doorConfig: DoorConfig;
  doorStateKey: 'living' | 'bath';
  isPreview?: boolean;
  showFrame?: boolean;
}

const frameMaterial = new THREE.MeshStandardMaterial({ color: '#f0ede8', roughness: 0.35 });
const doorPanelMaterial = new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.4 });
const doorHandleMaterial = new THREE.MeshStandardMaterial({ color: '#999999', metalness: 0.85, roughness: 0.15 });
const wallMat = new THREE.MeshStandardMaterial({ color: '#f5f4ef', roughness: 0.85, metalness: 0.05 });

function DoorImpl({
  actionKey,
  actionState = {},
  pivotX,
  panelX,
  handleX,
  mancheDir,
  openAngle,
  onSize,
  wallThickness = WALL_THICKNESS,
  doorConfig,
  doorStateKey,
  isPreview = false,
  showFrame = true,
}: DoorImplProps) {
  const navigationEnabled = useNavigationEnabled() && !isPreview;
  const doorRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();
  const spring = useDoorSpring();
  const open = useDoorOpen(actionKey, isPreview, actionState);

  const handleGeo = useMemo(() => createDoorHandleGeometry(T, mancheDir), [mancheDir]);

  useLayoutEffect(() => {
    onSize?.(new THREE.Vector3(W, H, wallThickness + 2));
  }, [wallThickness, onSize]);

  useFrame((_, delta) => {
    const currentSigned = doorRef.current.rotation.y;
    const { allowed, push, minimum } = navigationEnabled ? computeDoorDynamics(doorConfig, currentSigned) : { allowed: doorConfig.maxAngle, push: 0, minimum: 0 };
    const target = Math.sign(openAngle) * Math.min(allowed, Math.max(minimum, push, open ? allowed : 0, navigationEnabled && doorRequested(doorStateKey) ? allowed : 0));
    const limit = Math.sign(openAngle) * allowed;
    const contact = Math.sign(openAngle) * minimum;
    const next = spring(currentSigned, target, delta, Math.min(contact, limit), Math.max(contact, limit));
    doorRef.current.rotation.y = next;
    if (next !== currentSigned) invalidate();
    if (navigationEnabled) doorCollisionState[doorStateKey].angle = doorRef.current.rotation.y;
  });

  return (
    <group position={[0, 0, 0]}>
      {showFrame && <DoorWhiteFrame wallThickness={wallThickness} />}

      <group ref={doorRef} position={[pivotX, 0, 0]}>
        {/* Panneau mobile */}
        <mesh position={[panelX, H / 2, 0]} material={doorPanelMaterial} castShadow receiveShadow>
          <boxGeometry args={[W, H, T]} />
        </mesh>

        {/* Poignées */}
        <mesh position={[handleX, 100, 0]} geometry={handleGeo} material={doorHandleMaterial} />
      </group>

      {/* Linteau au-dessus de la porte ajusté à l'ouverture exacte de 86cm (Y=204 à 250) */}
      <mesh position={[0, H + 23, 0]} material={wallMat} castShadow receiveShadow>
        <boxGeometry args={[86, 46, wallThickness]} />
      </mesh>
    </group>
  );
}

export function DoorLiving({ onSize, isPreview = false, actionState = {}, showFrame = true }: Partial<Omit<SceneItemProps, 'item'>> & { showFrame?: boolean }) {
  return (
    <DoorImpl
      actionKey="livingDoor"
      pivotX={W / 2}   panelX={-W / 2}   handleX={-W + 15}   mancheDir={1}
      openAngle={-Math.PI / 2}
      doorConfig={DOOR_CONFIGS.living}
      doorStateKey="living"
      showFrame={showFrame}
      actionState={actionState}
      onSize={onSize}
      isPreview={isPreview}
      wallThickness={PARTITION_THICKNESS}
    />
  );
}

export function DoorBath({ onSize, isPreview = false, actionState = {}, showFrame = true }: Partial<Omit<SceneItemProps, 'item'>> & { showFrame?: boolean }) {
  return (
    <DoorImpl
      actionKey="bathroomDoor"
      pivotX={-W / 2}  panelX={W / 2}    handleX={W - 15}    mancheDir={-1}
      openAngle={Math.PI / 2}
      doorConfig={DOOR_CONFIGS.bath}
      doorStateKey="bath"
      showFrame={showFrame}
      actionState={actionState}
      onSize={onSize}
      isPreview={isPreview}
      wallThickness={PARTITION_THICKNESS}
    />
  );
}

export function DoorWhiteFrame({ wallThickness = PARTITION_THICKNESS }: { wallThickness?: number }) {
  const geometry = useDoorFrameGeo(wallThickness);
  return <mesh geometry={geometry} material={frameMaterial} castShadow receiveShadow />;
}
