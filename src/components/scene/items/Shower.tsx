/**
 * Shower.tsx — Receveur de douche + équipements VALLAMOSSE IKEA.
 *
 * Toutes les orientations/échelles sont gérées par des wrappers JSX — aucune
 * mutation de géométrie (applyGeomRotX) ni de node-transform (bakeRotXToChildren).
 *
 * GLB tray  : mètres, bbox POSITION = X 0→0.9, Y 0→0.15, Z -0.9→0.
 *             TRAY_CM = 50 → scale = 50/0.9 ≈ 55.6.
 *             Centrage via wrapper JSX : position = (-TRAY_CM/2, 0, +TRAY_CM/2).
 *
 * GLB bar   : mètres, longueur le long de Z. setupScene + wrappers rotation.
 *
 * GLB door  : pouces (scale ×2.54), couchée XZ (Z=hauteur 0→78.74in=200cm,
 *             X=largeur 0→35.43in=90cm, Y=épaisseur ±1.5in≈4cm).
 *             Debout via wrapper rotation-x={-π/2} (Z→Y).
 *             Centrage X (0→90cm) : inner wrapper position-x={-45}.
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const GLB_TRAY   = 'media/Shower tray 90x90cm.glb';
const GLB_BAR    = 'media/VALLAMOSSE Barre avec douchette haut réglable chromé.glb';
const GLB_FAUCET = 'media/VALLAMOSSE Mitigeur thermostatique pour douche chromé 150 mm.glb';
const GLB_DOOR   = 'media/Shower door.glb';

// Niche douche : X -10→60 (70cm), Z 600→670 (70cm). Tray 68cm → 1cm marge/côté.
const TRAY_CM   = 50;
const TRAY_HALF = TRAY_CM / 2;  // 34

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

// Porte : pouces. Bbox POSITION mesurée : X 0→35.43in, Y -1.57→1.18in, Z 0→78.74in.
// Largeur en cm : 35.43 × 2.54 = 90cm. Pour centrer : offset = -45.
const DOOR_SCALE  = 2.54;
const DOOR_X_HALF = (35.4331 * 2.54) / 2;  // ≈ 45 cm

export function Shower({ onSize }: SceneItemProps) {
  const { scene: tray   } = useGLTFClone(GLB_TRAY);
  const { scene: bar    } = useGLTFClone(GLB_BAR);
  const { scene: faucet } = useGLTFClone(GLB_FAUCET);
  const { scene: door   } = useGLTFClone(GLB_DOOR);
  const groupRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    // Tray : scale seule gérée ici ; position dans le wrapper JSX ci-dessous.
    // GLB bbox : X 0→0.9m, Y 0→0.15m, Z -0.9→0m. Toutes transformations nœuds = identity.
    const trayScale = TRAY_CM / 0.9;
    removeGlbLines(tray);
    tray.scale.setScalar(trayScale);
    tray.traverse(c => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } });

    // Bar : Z→Y, puis flip sens avant/arrière
    applyGeomRotX(bar, Math.PI / 2);
    applyGeomRotY(bar, Math.PI);
    setupScene(bar);

    setupScene(faucet);

    // Door : scale uniquement. Orientation et centrage gérés par wrappers JSX.
    removeGlbLines(door);
    door.scale.setScalar(DOOR_SCALE);
    door.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });

    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
    invalidate();
  }, [tray, bar, faucet, door, invalidate]);

  return (
    <group ref={groupRef}>
      {/* Receveur : scale bakée dans useLayoutEffect, position ajustable ici.
          GLB bbox X 0→0.9m, Z -0.9→0m → coin bas-gauche à l'origine.
          Décalage (-TRAY_CM/2, 0, +TRAY_CM/2) centre le bac autour de (0,0,0). */}
      <group position={[-TRAY_CM / 2 + 25, 0, TRAY_CM / 2 - 25]}>
        <primitive object={tray} />
      </group>

      {/* Barre douchette — mur arrière (+Z) */}
      <group position={[-5, 0, TRAY_HALF]}>
        <primitive object={bar} />
      </group>

      {/* Mitigeur thermostatique */}
      <group position={[-5, 90, 40]} rotation-x={-Math.PI / 2} rotation-y={Math.PI}>
        <primitive object={faucet} />
      </group>

      {/*
       * Porte : GLB couchée, Z=hauteur (0→200cm), X=largeur (0→90cm).
       * Outer wrapper : rotation-x={-π/2} redresse Z→Y (porte debout).
       * Inner wrapper : décale X de -DOOR_X_HALF pour centrer la largeur 0→90cm.
       * Résultat : porte debout, centrée en X, bas à Y=0.
       */}
      <group position={[0, 0, -(TRAY_HALF + 2)]} rotation={[-Math.PI / 2, 0, 0]}>
        <group position={[-DOOR_X_HALF, 0, 0]}>
          <primitive object={door} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(GLB_TRAY);
useGLTF.preload(GLB_BAR);
useGLTF.preload(GLB_FAUCET);
useGLTF.preload(GLB_DOOR);
