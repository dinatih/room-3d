/**
 * BathroomCabinet.tsx — Meuble mural SDB METOD + porte RINGHULT + poignée KALLROR.
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 *
 * Porte animée (pivot sur chant) : état cbnWest/cbnEast du store dans la scène,
 * actionState isolé en preview, suivi de lecture pour les gestes des PNJ.
 *
 * Pivot :
 *  West (mirrorHandle=false) : charnière -X, openAngle = -π/2 (porte vers +Z)
 *  East (mirrorHandle=true)  : charnière +X, openAngle = +π/2 (porte vers +Z)
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { getObjectActionIds } from '../objectActions';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';
import { useSceneStore } from '../store/useSceneStore';

const GLB        = 'items/metod10205534/Metod10205534.glb';
const DOOR_GLB   = 'items/ringhult60327137/Ringhult60327137-40x60.glb';
const HANDLE_GLB = 'items/kallror50357002/Kallror50357002.glb';

function MetodCabinet({ actionState = {}, onSize, mirrorHandle = false, openKey, hoverLabel, hoverObjectId, isPreview = false }:
  SceneItemProps & { mirrorHandle?: boolean; openKey: 'cbnWest' | 'cbnEast'; hoverLabel: string; hoverObjectId: string; isPreview?: boolean }) {

  const { scene }         = useGLTFClone(GLB);
  const { scene: door }   = useGLTFClone(DOOR_GLB);
  const { scene: handle } = useGLTFClone(HANDLE_GLB);
  const pivotRef = useRef<THREE.Group>(null!);
  const openRef  = useRef(false);
  const { invalidate } = useThree();
  const sceneOpen = useSceneStore(s => s.furniture[openKey]);
  const wantOpen = isPreview ? !!actionState[openKey] : sceneOpen;

  useLayoutEffect(() => {
    // ── Corps du meuble ──────────────────────────────────────────────────────
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.x = Math.PI / 2;
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));

    const cabHalfW  = (box.max.x - box.min.x) / 2;
    const cabFrontZ = (box.max.z - box.min.z) / 2;

    // ── Porte RINGHULT ───────────────────────────────────────────────────────
    door.scale.set(1, 1, 1);
    removeGlbLines(door);
    door.scale.setScalar(100);
    mergeGlbByMaterial(door);
    const dBox = glbLocalBBox(door);
    const doorOrigX = -(dBox.min.x + dBox.max.x) / 2;
    const doorOrigY = -dBox.min.y;
    const doorOrigZ = cabFrontZ - (dBox.min.z + dBox.max.z) / 2;

    // ── Poignée KALLROR ──────────────────────────────────────────────────────
    handle.scale.set(1, 1, 1);
    removeGlbLines(handle);
    handle.scale.setScalar(100);
    handle.rotation.set(0, Math.PI / 2, Math.PI / 2);
    mergeGlbByMaterial(handle);
    const hBox = glbLocalBBox(handle);
    const doorFrontZ  = cabFrontZ + (dBox.max.z - dBox.min.z) / 2;
    const handleOrigX = mirrorHandle
      ? -(box.max.x - box.min.x) / 2 - hBox.min.x + 2
      :  (box.max.x - box.min.x) / 2 - hBox.max.x - 2;
    const handleOrigY = box.max.y - box.min.y - hBox.max.y - 2;
    const handleOrigZ = doorFrontZ - (hBox.min.z + hBox.max.z) / 2 + 1;

    // ── Pivot charnière ──────────────────────────────────────────────────────
    const hingeX = mirrorHandle ? cabHalfW : -cabHalfW;
    const pivot  = pivotRef.current;
    pivot.position.set(hingeX, 0, cabFrontZ);

    door.position.set(doorOrigX - hingeX, doorOrigY,   doorOrigZ - cabFrontZ);
    handle.position.set(handleOrigX - hingeX, handleOrigY, handleOrigZ - cabFrontZ);

    if (hoverLabel && hoverObjectId) {
      const ha = { label: hoverLabel, actions: [
        ...getObjectActionIds(hoverObjectId),
        ...(!isPreview ? SMART_OBJECTS[hoverObjectId].slots.map(slot => `smart-object:::${hoverObjectId}:::${slot.slotId}`) : []),
      ] };
      scene.userData.hoverAction  = ha;
      door.userData.hoverAction   = ha;
      handle.userData.hoverAction = ha;
      pivot.userData.hoverAction  = ha;
    }
  }, [scene, door, handle, mirrorHandle, hoverLabel, hoverObjectId, isPreview]);

  // Réagit à actionState (inventory + scene via useFurnitureToggles dans Placements)
  useEffect(() => {
    openRef.current = wantOpen;
    invalidate();
  }, [wantOpen, invalidate]);

  useFrame((_, delta) => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    const targetAngle = openRef.current ? (mirrorHandle ? Math.PI / 2 : -Math.PI / 2) : 0;
    if (pivot.rotation.y === targetAngle) return;
    const diff = targetAngle - pivot.rotation.y;
    if (Math.abs(diff) < 0.001) {
      pivot.rotation.y = targetAngle;
      invalidate();
      return;
    }
    pivot.rotation.y += diff * Math.min(delta * 8, 1);
    invalidate();
  });

  return (
    <group name={hoverObjectId}>
      <primitive object={scene} />
      <group ref={pivotRef} name={`${hoverObjectId}-door`}>
        <primitive object={door} />
        <primitive object={handle} />
      </group>
    </group>
  );
}

useGLTF.preload(GLB);
useGLTF.preload(DOOR_GLB);
useGLTF.preload(HANDLE_GLB);

export function BathroomCabinetWest(props: SceneItemProps & { isPreview?: boolean }) {
  return <MetodCabinet {...props} openKey="cbnWest" hoverLabel="Armoire SDB Ouest" hoverObjectId="bathroom-cabinet-west" />;
}

export function BathroomCabinetEast(props: SceneItemProps & { isPreview?: boolean }) {
  return <MetodCabinet {...props} mirrorHandle openKey="cbnEast" hoverLabel="Armoire SDB Est" hoverObjectId="bathroom-cabinet-east" />;
}
