/**
 * BathroomCabinet.tsx — Meuble mural SDB METOD + porte RINGHULT + poignée KALLROR.
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB        = 'media/METOD Rangement mural blanc 40x37x60 cm.glb';
const DOOR_GLB   = 'media/RINGHULT Porte brillant gris clair 40x60 cm.glb';
const HANDLE_GLB = 'media/KALLROR Poignée acier inoxydable 213 mm.glb';
function MetodCabinet({ onSize, mirrorHandle = false }: SceneItemProps & { mirrorHandle?: boolean }) {
  const { scene }          = useGLTFClone(GLB);
  const { scene: door }    = useGLTFClone(DOOR_GLB);
  const { scene: handle }  = useGLTFClone(HANDLE_GLB);

  useLayoutEffect(() => {
    // ── Corps du meuble ──────────────────────────────────────────────────────
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.x = Math.PI / 2; // Z-up GLB → debout
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));

    const cabFrontZ = (box.max.z - box.min.z) / 2;

    // ── Porte RINGHULT 40×60 cm ──────────────────────────────────────────────
    removeGlbLines(door);
    door.scale.setScalar(100);
    mergeGlbByMaterial(door);
    const dBox = glbLocalBBox(door);
    door.position.set(
      -(dBox.min.x + dBox.max.x) / 2,
      -dBox.min.y,
      cabFrontZ - (dBox.min.z + dBox.max.z) / 2,
    );

    // ── Poignée KALLROR 213 mm — verticale, droite, en haut ─────────────────
    removeGlbLines(handle);
    handle.scale.setScalar(100);
    handle.rotation.set(0, Math.PI / 2, Math.PI / 2);
    mergeGlbByMaterial(handle);
    const hBox = glbLocalBBox(handle);
    const doorFrontZ = cabFrontZ + (dBox.max.z - dBox.min.z) / 2;
    const handleX = mirrorHandle
      ? -(box.max.x - box.min.x) / 2 - hBox.min.x + 2   // 2cm depuis bord gauche
      :  (box.max.x - box.min.x) / 2 - hBox.max.x - 2;  // 2cm depuis bord droit
    handle.position.set(
      handleX,
      box.max.y - box.min.y - hBox.max.y - 2,
      doorFrontZ - (hBox.min.z + hBox.max.z) / 2 + 1,
    );

  }, [scene, door, handle, mirrorHandle]);

  return (
    <>
      <primitive object={scene} />
      <primitive object={door} />
      <primitive object={handle} />
    </>
  );
}

useGLTF.preload(GLB);
useGLTF.preload(DOOR_GLB);
useGLTF.preload(HANDLE_GLB);

export function BathroomCabinetWest(props: SceneItemProps) {
  return <MetodCabinet {...props} />;
}

export function BathroomCabinetEast(props: SceneItemProps) {
  return <MetodCabinet {...props} mirrorHandle />;
}
