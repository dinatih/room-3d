/**
 * Porte-fenêtre double battant PVC blanc — 160×210cm total (seuil 20cm).
 * V2 : Deux battants ouvrants individuels, logique de dépendance physique,
 *      coffrage de volet roulant (H=22, P=15), et tablier de lames de volet roulant animées.
 * Optimisé : géométries fusionnées pour réduire les draw calls.
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { SceneItemProps } from '@shared/types';

const W_TOTAL   = 160;
const SILL_H    = 20;
const GLASS_H   = 190;
const GLASS_TOP = SILL_H + GLASS_H;
const WW  = 10;

const FRAME = 5;
const FRAME_D_V2 = 6;
const BOX_H = 22;
const BOX_D = 15;
const BOX_W = 170;

const PANEL_FRAME_W = 8;
const PANEL_FRAME_D = 5.5;

function useStaticFrameGeo() {
  return useMemo(() => {
    const pvcGeos: THREE.BufferGeometry[] = [];
    const darkMetalGeos: THREE.BufferGeometry[] = [];

    const addBox = (geos: THREE.BufferGeometry[], w: number, h: number, d: number, x: number, y: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      geo.translate(x, y, z);
      geos.push(geo);
    };

    // ── Dormant ──
    const W_INNER = W_TOTAL - FRAME * 2;
    addBox(pvcGeos, FRAME, 200, FRAME_D_V2, -W_TOTAL / 2 + FRAME / 2, 25 + 200 / 2, 0);
    addBox(pvcGeos, FRAME, 200, FRAME_D_V2,  W_TOTAL / 2 - FRAME / 2, 25 + 200 / 2, 0);
    addBox(pvcGeos, W_INNER, FRAME, FRAME_D_V2, 0, 225 - FRAME / 2, 0);
    addBox(pvcGeos, W_INNER, FRAME, FRAME_D_V2, 0, 25 + FRAME / 2, 0);

    // ── Coulisses volet ──
    addBox(darkMetalGeos, 1.5, 200, 1.5, -W_INNER / 2 - 0.5, 25 + 200 / 2, -4);
    addBox(darkMetalGeos, 1.5, 200, 1.5,  W_INNER / 2 + 0.5, 25 + 200 / 2, -4);

    // ── Coffrage ──
    addBox(pvcGeos, BOX_W, BOX_H, BOX_D, 0, 225 + BOX_H / 2, BOX_D / 2);
    addBox(pvcGeos, BOX_W - 2, 0.2, 0.1, 0, 225 + 0.5, BOX_D / 2 + 0.05);

    // ── Chambranles ──
    addBox(pvcGeos, 5, 200, 1.2, -W_TOTAL / 2 - 2.5, 25 + 200 / 2, 0.6);
    addBox(pvcGeos, 5, 200, 1.2,  W_TOTAL / 2 + 2.5, 25 + 200 / 2, 0.6);
    addBox(pvcGeos, W_TOTAL + 10, 4, 1.2, 0, 225 + 2, 0.6);
    addBox(pvcGeos, W_TOTAL + 10, 5, 1.2, 0, 25 - 2.5, 0.6);

    const pvc = mergeGeometries(pvcGeos, false);
    const darkMetal = mergeGeometries(darkMetalGeos, false);
    pvcGeos.forEach(g => g.dispose());
    darkMetalGeos.forEach(g => g.dispose());
    return { pvc, darkMetal };
  }, []);
}

function usePanelFrameGeo(width: number, height: number) {
  return useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      geo.translate(x, y, z);
      geos.push(geo);
    };
    addBox(width, PANEL_FRAME_W, PANEL_FRAME_D, 0, height / 2 - PANEL_FRAME_W / 2, 0);
    addBox(width, PANEL_FRAME_W, PANEL_FRAME_D, 0, -height / 2 + PANEL_FRAME_W / 2, 0);
    addBox(PANEL_FRAME_W, height - PANEL_FRAME_W * 2, PANEL_FRAME_D, -width / 2 + PANEL_FRAME_W / 2, 0, 0);
    addBox(PANEL_FRAME_W, height - PANEL_FRAME_W * 2, PANEL_FRAME_D,  width / 2 - PANEL_FRAME_W / 2, 0, 0);

    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    return merged;
  }, [width, height]);
}

function useHingeGeo() {
  return useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const cyl = (y: number) => {
      const geo = new THREE.CylinderGeometry(0.7, 0.7, 3, 8);
      geo.rotateX(Math.PI / 2);
      geo.translate(0, y, 0);
      geos.push(geo);
    };
    cyl(60); cyl(125); cyl(190);
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    return merged;
  }, []);
}

export function GlassDoor({ actionState, onSize }: SceneItemProps) {
  const { invalidate } = useThree();
  const rightDoorRef = useRef<THREE.Group>(null!);
  const leftDoorRef = useRef<THREE.Group>(null!);
  const handleRef = useRef<THREE.Group>(null!);
  const instancedShutterRef = useRef<THREE.InstancedMesh>(null!);
  const shutterPercentRef = useRef(0);
  const rightRotRef = useRef(0);
  const leftRotRef = useRef(0);

  const staticFrames = useStaticFrameGeo();
  const panelFrameGeo = usePanelFrameGeo(W_TOTAL / 2 - FRAME, 190);
  const hingeGeo = useHingeGeo();

  const stateRef = useRef({ isOpenRight: false, isOpenLeft: false, targetShutter: 0 });
  stateRef.current.isOpenRight = !!actionState['east-glass-door-toggle'];
  stateRef.current.isOpenLeft = !!actionState['glass-door-v2-left-open'];
  stateRef.current.targetShutter = actionState['glass-door-v2-shutter-pos'] ?? 0;

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W_TOTAL, GLASS_TOP, WW));
  }, [onSize]);

  useFrame(() => {
    const s = stateRef.current;
    let moved = false;
    const actualLeftOpen = s.isOpenRight && s.isOpenLeft;
    const isRightOpenEnough = rightRotRef.current > 0.25;
    const leftTarget = (actualLeftOpen && isRightOpenEnough) ? -Math.PI / 2 : 0;
    const isLeftOpen = Math.abs(leftRotRef.current) > 0.05;
    const rightTarget = s.isOpenRight ? Math.PI / 2 : (isLeftOpen ? Math.PI / 2 : 0);

    const dLeft = leftTarget - leftRotRef.current;
    if (Math.abs(dLeft) > 0.001) { leftRotRef.current += dLeft * 0.12; moved = true; }
    else leftRotRef.current = leftTarget;

    const dRight = rightTarget - rightRotRef.current;
    if (Math.abs(dRight) > 0.001) { rightRotRef.current += dRight * 0.12; moved = true; }
    else rightRotRef.current = rightTarget;

    rightDoorRef.current.rotation.y = rightRotRef.current;
    leftDoorRef.current.rotation.y = leftRotRef.current;

    if (handleRef.current) {
      const maxTilt = 35 * (Math.PI / 180);
      let handleTilt = 0;
      if (rightRotRef.current > 0 && rightRotRef.current < 0.3) {
        handleTilt = -Math.sin((rightRotRef.current / 0.3) * Math.PI) * maxTilt;
      }
      handleRef.current.rotation.z = handleTilt;
    }

    const dShutter = s.targetShutter - shutterPercentRef.current;
    if (Math.abs(dShutter) > 0.1) { shutterPercentRef.current += dShutter * 0.08; moved = true; }
    else shutterPercentRef.current = s.targetShutter;

    if (instancedShutterRef.current) {
      const currentHeight = (200 * shutterPercentRef.current) / 100;
      instancedShutterRef.current.count = Math.max(0, Math.min(50, Math.ceil(currentHeight / 4)));
    }
    if (moved) invalidate();
  });

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 50; i++) {
      dummy.position.set(0, 25 + 200 - i * 4 - 2, -4);
      dummy.updateMatrix();
      instancedShutterRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedShutterRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const pvcMat = <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.05} />;
  const glass = (
    <meshPhysicalMaterial
      color="#b2e0ff" transparent opacity={0.15} roughness={0.01} metalness={0.1}
      transmission={0.9} thickness={1.2} side={THREE.DoubleSide} depthWrite={false}
    />
  );
  const metalMat = <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />;

  const W_INNER = W_TOTAL - FRAME * 2;
  const PANEL_W = W_INNER / 2;
  const gw = PANEL_W - PANEL_FRAME_W * 2;
  const gh = 190 - PANEL_FRAME_W * 2;

  return (
    <group position={[0, -GLASS_TOP / 2, 0]}>
      <mesh geometry={staticFrames.pvc} castShadow receiveShadow>{pvcMat}</mesh>
      <mesh geometry={staticFrames.darkMetal} castShadow receiveShadow>
        <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Battant Gauche */}
      <group ref={leftDoorRef} position={[-W_INNER / 2, 0, 0]}>
        <group position={[PANEL_W / 2, 0, 0]}>
          <mesh position={[0, 30 + 190 / 2, 0]} geometry={panelFrameGeo} castShadow>{pvcMat}</mesh>
          <mesh position={[0, 30 + 190 / 2, 0]}><boxGeometry args={[gw, gh, 0.8]} />{glass}</mesh>
          <mesh position={[PANEL_W / 2 + 0.5, 30 + 190 / 2, 0.5]} castShadow>
            <boxGeometry args={[2.5, 190, FRAME_D_V2 + 0.4]} />{pvcMat}
          </mesh>
        </group>
        <mesh position={[0, 0, 0]} geometry={hingeGeo}>{metalMat}</mesh>
      </group>

      {/* Battant Droit */}
      <group ref={rightDoorRef} position={[W_INNER / 2, 0, 0]}>
        <group position={[-PANEL_W / 2, 0, 0]}>
          <mesh position={[0, 30 + 190 / 2, 0]} geometry={panelFrameGeo} castShadow>{pvcMat}</mesh>
          <mesh position={[0, 30 + 190 / 2, 0]}><boxGeometry args={[gw, gh, 0.8]} />{glass}</mesh>
          
          <group position={[-PANEL_W / 2 + 6, 125, FRAME_D_V2 / 2 + 0.1]}>
            <mesh position={[0, 0, 0.1]}><boxGeometry args={[2.5, 4.5, 0.2]} />{metalMat}</mesh>
            <mesh position={[0, 0, 0.4]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.4, 0.4, 0.6, 8]} />{metalMat}</mesh>
            <group ref={handleRef} position={[0, 0, 0.7]}>
              <mesh position={[4.5, 0, 0.1]}><boxGeometry args={[9, 0.9, 0.5]} />{metalMat}</mesh>
            </group>
          </group>
        </group>
        <mesh position={[0, 0, 0]} geometry={hingeGeo}>{metalMat}</mesh>
      </group>

      <instancedMesh ref={instancedShutterRef} args={[null as any, null as any, 50]}>
        <boxGeometry args={[W_INNER + 2, 3.8, 1.2]} />
        <meshStandardMaterial color="#dcdcdc" roughness={0.4} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}
