/**
 * Shower.tsx — Receveur de douche + équipements VALLAMOSSE IKEA.
 * Shower tray 90x90cm.glb
 * VALLAMOSSE Barre avec douchette haut réglable chromé.glb
 * VALLAMOSSE Mitigeur thermostatique pour douche chromé 150 mm.glb
 * GLBs en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 *
 * Bar   : longueur portée par Z dans le GLB. applyGeomRotX(+π/2) redresse (Z→haut).
 *         applyGeomRotY(π) corrige le sens avant/arrière.
 * Door  : en pouces, couchée XZ. setupScene(2.54) centre et pose à plat,
 *         puis le wrapper doorRef est relevé via rotation.x=-π/2 et position.y=halfH
 *         (imperatif dans useLayoutEffect, donc jamais écrasé par R3F).
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const GLB_TRAY   = 'media/Shower tray 90x90cm.glb';
const GLB_BAR    = 'media/VALLAMOSSE Barre avec douchette haut réglable chromé.glb';
const GLB_FAUCET = 'media/VALLAMOSSE Mitigeur thermostatique pour douche chromé 150 mm.glb';
const GLB_DOOR   = 'media/Shower door.glb';

const TRAY_SCALE = 70 / 90;
const TRAY_HALF  = 35;

// Hauteur de la porte une fois debout : Z_max(inches) × 2.54
const DOOR_HALF_H = 77.62 / 2 * 2.54; // ≈ 98.6 cm

/** Applique une rotation X aux sommets de toutes les géométries (baking). */
function applyGeomRotX(scene: THREE.Group, angle: number) {
  const m4 = new THREE.Matrix4().makeRotationX(angle);
  scene.traverse(c => {
    const mesh = c as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    mesh.geometry = mesh.geometry.clone();
    mesh.geometry.applyMatrix4(m4);
  });
}

/** Applique une rotation Y aux sommets de toutes les géométries (baking). */
function applyGeomRotY(scene: THREE.Group, angle: number) {
  const m4 = new THREE.Matrix4().makeRotationY(angle);
  scene.traverse(c => {
    const mesh = c as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    mesh.geometry = mesh.geometry.clone();
    mesh.geometry.applyMatrix4(m4);
  });
}

function setupScene(scene: THREE.Group, scale = 100) {
  removeGlbLines(scene);
  scene.scale.setScalar(scale);
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  scene.position.set(
    -(box.min.x + box.max.x) / 2,
    -box.min.y,
    -(box.min.z + box.max.z) / 2,
  );
  scene.traverse(c => {
    if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
  });
}

export function Shower({ onSize }: SceneItemProps) {
  const { scene: tray   } = useGLTFClone(GLB_TRAY);
  const { scene: bar    } = useGLTFClone(GLB_BAR);
  const { scene: faucet } = useGLTFClone(GLB_FAUCET);
  const { scene: door   } = useGLTFClone(GLB_DOOR);
  const groupRef  = useRef<THREE.Group>(null!);
  const doorRef   = useRef<THREE.Group>(null!);  // wrapper relevé par impératif

  useLayoutEffect(() => {
    setupScene(tray);

    // Barre : Z→Y (+π/2), puis flip 180° sur Y pour corriger le sens avant/arrière
    applyGeomRotX(bar, Math.PI / 2);
    applyGeomRotY(bar, Math.PI);
    setupScene(bar);

    setupScene(faucet);

    // Porte : inches→cm, pose à plat (no rotation dans setup)
    // Le wrapper doorRef sera relevé impérativement ci-dessous.
    setupScene(door, 2.54);

    // Wrapper porte : rotation.x=-π/2 relève la porte (Z local → Y monde).
    // position.y = DOOR_HALF_H compense le centrage en Z pour avoir le bas au sol.
    doorRef.current.rotation.x = -Math.PI / 2;
    doorRef.current.position.set(0, DOOR_HALF_H, -(TRAY_HALF + 2));

    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, [tray, bar, faucet, door]);

  return (
    <group ref={groupRef}>
      {/* Receveur scalé à 70×70 */}
      <group scale={[TRAY_SCALE, TRAY_SCALE, TRAY_SCALE]}>
        <primitive object={tray} />
      </group>

      {/* Barre douchette — mur arrière (+Z) */}
      <group position={[-5, 0, TRAY_HALF + 24]}>
        <primitive object={bar} />
      </group>

      {/* Mitigeur thermostatique */}
      <group position={[-5, 90, 70]} rotation-x={-Math.PI / 2} rotation-y={Math.PI}>
        <primitive object={faucet} />
      </group>

      {/* Porte de douche — wrapper relevé impérativement, pas de props JSX ici */}
      <group ref={doorRef}>
        <primitive object={door} />
      </group>
    </group>
  );
}

useGLTF.preload(GLB_TRAY);
useGLTF.preload(GLB_BAR);
useGLTF.preload(GLB_FAUCET);
useGLTF.preload(GLB_DOOR);
