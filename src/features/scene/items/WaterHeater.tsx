/**
 * Ballon d'eau chaude 100L — GLB items/water-heater/water-heater.glb.
 * Coordonnées locales : centré XYZ, Y=0 = centre du ballon (suspendu au mur).
 *
 * GLB en pouces (ImageToStl, all nodes identity) :
 *   Y=[0, 32.92] hauteur, X=[0, 13.78] ⌀, Z=[-13.98, 0.05] ⌀
 * Dimensions réelles du ballon : ⌀56 × H65 cm → scale per-axe.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/water-heater/water-heater.glb';

// Vertex bounds measured from GLB (all node transforms identity, units = inches)
const GLB_SY = 32.919;  // hauteur (Y)
const GLB_SX = 13.780;  // diamètre X
const GLB_SZ = 14.021;  // diamètre Z
const GLB_CX = 6.890;   // centre X
const GLB_CY = 16.460;  // centre Y
const GLB_CZ = -6.966;  // centre Z

export const WH_W = 56;  // ⌀56 cm
export const WH_D = 56;  // ⌀56 cm
export const WH_H = 65;  // hauteur 65 cm

export function WaterHeater({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    const sx = WH_W / GLB_SX;
    const sy = WH_H / GLB_SY;
    const sz = WH_D / GLB_SZ;
    scene.scale.set(sx, sy, sz);
    mergeGlbByMaterial(scene);
    scene.position.set(-GLB_CX * sx, -GLB_CY * sy, -GLB_CZ * sz);
    onSize(new THREE.Vector3(WH_W, WH_H, WH_D));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
