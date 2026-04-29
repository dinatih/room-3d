/**
 * Shower.tsx — Receveur de douche + équipements VALLAMOSSE IKEA.
 *
 * Toutes les orientations/échelles sont gérées par des wrappers JSX — aucune
 * mutation de géométrie (applyGeomRotX) ni de node-transform (bakeRotXToChildren).
 *
 * GLB tray  : mètres, modifié par script Python (bake matrices, scale 68cm, centré).
 *             Bbox finale : ±0.34m XZ, Y 0→0.163m → scale=100 → 68×68cm, Y=0 sol.
 *             setupScene(scale=100) utilisé avec détachement parent temporaire
 *             (Box3.setFromObject travaille en world-space, parent hors origine).
 *             Groupe au centre de la niche (world 25,0,635).
 *
 * GLB bar   : mètres, longueur le long de Z. setupScene + wrappers rotation.
 *
 * Porte     : procédurale (vitre + cadre aluminium), pas de GLB.
 *             DOOR_W × DOOR_H cm, centrée en X sur le bac.
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

// Bac GLB recentré (script Python) : bbox ±0.34m → scale=100 → 68×68cm centré à l'origine.
// Groupe au centre niche (world 25,0,635). TRAY_HALF = demi-étendue = 34cm.
const TRAY_CM   = 68;
const TRAY_HALF = TRAY_CM / 2;  // 34

// Porte procédurale
const DOOR_W = 68;   // largeur cm
const DOOR_H = 200;  // hauteur cm
const DOOR_T = 0.8;  // épaisseur vitre cm
const FRAME  = 2.0;  // section profil aluminium cm

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

// Matériaux porte (module-level, partagés entre instances)
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xd0eaf5,
  transparent: true,
  opacity: 0.35,
  roughness: 0.04,
  metalness: 0.05,
  envMapIntensity: 1.2,
  side: THREE.DoubleSide,
});
const frameMat = new THREE.MeshStandardMaterial({
  color: 0xd8d8d8,
  metalness: 0.85,
  roughness: 0.15,
});

/** Porte de douche procédurale : vitre + cadre alu + poignée. */
function ShowerDoor() {
  const hw = DOOR_W / 2;
  const hf = FRAME / 2;
  return (
    <group>
      {/* Vitre */}
      <mesh material={glassMat} position={[0, DOOR_H / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W - FRAME * 2, DOOR_H - FRAME * 2, DOOR_T]} />
      </mesh>

      {/* Profil bas */}
      <mesh material={frameMat} position={[0, hf, 0]} castShadow receiveShadow>
        <boxGeometry args={[DOOR_W, FRAME, FRAME]} />
      </mesh>
      {/* Profil haut */}
      <mesh material={frameMat} position={[0, DOOR_H - hf, 0]} castShadow>
        <boxGeometry args={[DOOR_W, FRAME, FRAME]} />
      </mesh>
      {/* Profil gauche */}
      <mesh material={frameMat} position={[-hw + hf, DOOR_H / 2, 0]} castShadow>
        <boxGeometry args={[FRAME, DOOR_H, FRAME]} />
      </mesh>
      {/* Profil droit */}
      <mesh material={frameMat} position={[hw - hf, DOOR_H / 2, 0]} castShadow>
        <boxGeometry args={[FRAME, DOOR_H, FRAME]} />
      </mesh>

      {/* Poignée — barre verticale côté droit, face extérieure */}
      <mesh material={frameMat} position={[hw - FRAME - 3, DOOR_H / 2, DOOR_T + 1.5]} castShadow>
        <boxGeometry args={[1.5, 22, 1.5]} />
      </mesh>
    </group>
  );
}

export function Shower({ onSize }: SceneItemProps) {
  const { scene: tray   } = useGLTFClone(GLB_TRAY);
  const { scene: bar    } = useGLTFClone(GLB_BAR);
  const { scene: faucet } = useGLTFClone(GLB_FAUCET);
  const groupRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    // Tray : setupScene centre la bbox et pose au sol, mais Box3.setFromObject
    // travaille en world-space. On détache temporairement du parent pour que
    // world = local lors du calcul → position correcte ensuite.
    const trayParent = tray.parent;
    trayParent?.remove(tray);
    setupScene(tray, 100);
    trayParent?.add(tray);

    // Bar : Z→Y, puis flip sens avant/arrière
    applyGeomRotX(bar, Math.PI / 2);
    applyGeomRotY(bar, Math.PI);
    setupScene(bar);

    setupScene(faucet);

    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
    invalidate();
  }, [tray, bar, faucet, invalidate]);

  return (
    <group ref={groupRef}>
      {/* Receveur — setupScene centre et pose au sol (détaché parent pendant calcul). */}
      <primitive object={tray} />

      {/* Barre douchette — mur fond à local Z=+35 (world Z=670) */}
      <group position={[0, 0, TRAY_HALF - 6]}>
        <primitive object={bar} />
      </group>

      {/* Mitigeur thermostatique — mur fond, hauteur 90cm */}
      <group position={[0, 90, TRAY_HALF + 1]} rotation-x={-Math.PI / 2} rotation-y={Math.PI}>
        <primitive object={faucet} />
      </group>

      {/* Porte — centrée en X, 2cm devant la face sud du bac (local Z=−TRAY_HALF) */}
      <group position={[0, 0, -(TRAY_HALF + 2)]}>
        <ShowerDoor />
      </group>
    </group>
  );
}

useGLTF.preload(GLB_TRAY);
useGLTF.preload(GLB_BAR);
useGLTF.preload(GLB_FAUCET);
