/**
 * KitchenCabinet.tsx — Meuble bas cuisine METOD + porte RINGHULT + poignée KALLROR.
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB        = 'media/METOD Rangement blanc 40x60x80 cm.glb';
const DOOR_GLB   = 'media/RINGHULT Porte brillant gris clair 40x80 cm.glb';
const HANDLE_GLB = 'media/KALLROR Poignée acier inoxydable 213 mm.glb';

export function KitchenCabinet({ onSize }: SceneItemProps) {
  const { scene }          = useGLTFClone(GLB);
  const { scene: door }    = useGLTFClone(DOOR_GLB);
  const { scene: handle }  = useGLTFClone(HANDLE_GLB);

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

    // Face avant du meuble après centrage = Z le plus négatif
    const cabFrontZ = -(box.max.z - box.min.z) / 2;

    // ── Porte RINGHULT 40×80 cm ──────────────────────────────────────────────
    removeGlbLines(door);
    door.scale.setScalar(100);
    door.rotation.y = Math.PI;
    mergeGlbByMaterial(door);
    const dBox = glbLocalBBox(door);
    door.position.set(
      -(dBox.min.x + dBox.max.x) / 2,          // centré X
      -dBox.min.y,                               // Y bas à 0
      cabFrontZ - (dBox.min.z + dBox.max.z) / 2, // centré sur face avant meuble
    );

    // ── Poignée KALLROR 213 mm — verticale, gauche ──────────────────────────
    removeGlbLines(handle);
    handle.scale.setScalar(100);
    handle.rotation.set(0, -Math.PI / 2, Math.PI / 2);  // vertical + Ry -90°
    mergeGlbByMaterial(handle);
    const hBox = glbLocalBBox(handle);
    const doorFrontZ = cabFrontZ - (dBox.max.z - dBox.min.z) / 2;
    handle.position.set(
      (box.max.x - box.min.x) / 2 - hBox.max.x - 2,               // 2cm depuis bord droit
      box.max.y - box.min.y - hBox.max.y - 2,                      // 2cm depuis bord haut
      doorFrontZ - (hBox.min.z + hBox.max.z) / 2 - 1,             // recul 1cm
    );
  }, [scene, door, handle]);

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
