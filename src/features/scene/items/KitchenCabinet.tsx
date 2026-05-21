/**
 * KitchenCabinet.tsx — Meuble bas cuisine METOD + porte RINGHULT + poignée KALLROR.
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 *
 * Porte animée (pivot charnière gauche) — deux chemins :
 *  - Main scene  : furniture-toggle { key: 'cabinet' }
 *  - Inventory   : actionState['cabinet-toggle'] (prop)
 *
 * scene.rotation.y = π → face avant à -Z local (cabFrontZ < 0).
 * Charnière -X local, openAngle = -π/2 → porte tourne vers +Z (vers la pièce). ✓
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB        = 'media/METOD Rangement blanc 40x60x80 cm.glb';
const DOOR_GLB   = 'media/RINGHULT Porte brillant gris clair 40x80 cm.glb';
const HANDLE_GLB = 'media/KALLROR Poignée acier inoxydable 213 mm.glb';

export function KitchenCabinet({ actionState, onSize }: SceneItemProps) {
  const { scene }         = useGLTFClone(GLB);
  const { scene: door }   = useGLTFClone(DOOR_GLB);
  const { scene: handle } = useGLTFClone(HANDLE_GLB);
  const pivotRef = useRef<THREE.Group>(null!);
  const openRef  = useRef(false);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    // ── Corps du meuble ──────────────────────────────────────────────────────
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI;
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));

    const cabHalfW  = (box.max.x - box.min.x) / 2;
    const cabFrontZ = -(box.max.z - box.min.z) / 2;

    // ── Porte RINGHULT 40×80 ─────────────────────────────────────────────────
    removeGlbLines(door);
    door.scale.setScalar(100);
    door.rotation.y = Math.PI;
    mergeGlbByMaterial(door);
    const dBox = glbLocalBBox(door);
    const doorOrigX = -(dBox.min.x + dBox.max.x) / 2;
    const doorOrigY = -dBox.min.y;
    const doorOrigZ = cabFrontZ - (dBox.min.z + dBox.max.z) / 2;

    // ── Poignée KALLROR 213 mm ───────────────────────────────────────────────
    removeGlbLines(handle);
    handle.scale.setScalar(100);
    handle.rotation.set(0, -Math.PI / 2, Math.PI / 2);
    mergeGlbByMaterial(handle);
    const hBox = glbLocalBBox(handle);
    const doorFrontZ  = cabFrontZ - (dBox.max.z - dBox.min.z) / 2;
    const handleOrigX =  (box.max.x - box.min.x) / 2 - hBox.max.x - 2;
    const handleOrigY =  box.max.y - box.min.y - hBox.max.y - 2;
    const handleOrigZ =  doorFrontZ - (hBox.min.z + hBox.max.z) / 2 - 1;

    // ── Pivot charnière gauche (hingeX = -cabHalfW) ──────────────────────────
    const hingeX = -cabHalfW;
    const pivot  = pivotRef.current;
    pivot.position.set(hingeX, 0, cabFrontZ);

    door.position.set(doorOrigX - hingeX,   doorOrigY,   doorOrigZ - cabFrontZ);
    handle.position.set(handleOrigX - hingeX, handleOrigY, handleOrigZ - cabFrontZ);

    const ha = { label: 'Meuble sous évier', actionId: 'cabinet' };
    scene.userData.hoverAction  = ha;
    door.userData.hoverAction   = ha;
    handle.userData.hoverAction = ha;
    pivot.userData.hoverAction  = ha;
  }, [scene, door, handle]);

  // Chemin inventory : actionState['cabinet-toggle'] (depuis InventoryPreview)
  useEffect(() => {
    openRef.current = !!(actionState['cabinet-toggle']);
    invalidate();
  }, [actionState['cabinet-toggle']]);

  // Chemin scène : furniture-toggle { key: 'cabinet' }
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key !== 'cabinet') return;
      openRef.current = !openRef.current;
      invalidate();
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate]);

  useFrame((_, delta) => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    const targetAngle = openRef.current ? -Math.PI / 2 : 0;
    const diff = targetAngle - pivot.rotation.y;
    if (Math.abs(diff) < 0.001) return;
    pivot.rotation.y += diff * Math.min(delta * 8, 1);
    invalidate();
  });

  return (
    <>
      <primitive object={scene} />
      <group ref={pivotRef}>
        <primitive object={door} />
        <primitive object={handle} />
      </group>
    </>
  );
}

useGLTF.preload(GLB);
useGLTF.preload(DOOR_GLB);
useGLTF.preload(HANDLE_GLB);
