/**
 * Shower.tsx — Receveur de douche + équipements VALLAMOSSE IKEA.
 *
 * Ensemble 71×71 cm centré en X/Z dans son repère local :
 * - Bac : shower.glb mis à l'échelle (71×71 cm), centré et posé au sol
 * - Robinetterie VALLAMOSSE : mitigeur thermostatique + barre réglable chromés
 * - Porte procédurale : verre + cadre aluminium + poignée avec pivot d'ouverture
 */
import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';


const GLB_TRAY   = 'items/shower/shower.glb';
const GLB_BAR    = 'items/vallamosse barre avec douchette haut réglable chromé/VALLAMOSSE Barre avec douchette haut réglable chromé.glb';
const GLB_FAUCET = 'items/vallamosse mitigeur thermostatique pour douche chromé 150 mm/VALLAMOSSE Mitigeur thermostatique pour douche chromé 150 mm.glb';

// Dimensions de l'ensemble de douche
export const SHOWER_W = 71;
export const SHOWER_D = 71;
export const SHOWER_H = 200;

// Bac GLB recentré (script Python) : bbox ±0.34m → scale normalisé à 71×71cm centré à l'origine.
const TRAY_CM   = SHOWER_W;
const TRAY_HALF = SHOWER_D / 2;  // 35.5

// Porte procédurale : paroi fixe 20 cm à l'Ouest + battant pivotant de 51 cm
const FIXED_W = 20;               // Largeur paroi fixe côté Ouest (cm)
const DOOR_W  = SHOWER_W - FIXED_W; // Largeur battant mobile (51 cm)
const DOOR_H  = SHOWER_H;          // Hauteur cm
const DOOR_T  = 0.8;               // Épaisseur vitre cm
const FRAME   = 2.0;               // Section profil aluminium cm

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
  mergeGlbByMaterial(scene);
  const box = glbLocalBBox(scene);
  scene.position.set(
    -(box.min.x + box.max.x) / 2,
    -box.min.y,
    -(box.min.z + box.max.z) / 2,
  );
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
  depthWrite: false,
});
const frameMat = new THREE.MeshStandardMaterial({
  color: 0xd8d8d8,
  metalness: 0.85,
  roughness: 0.15,
});

/** Porte de douche procédurale : paroi fixe 20 cm + battant 51 cm avec pivot d'ouverture. */
function ShowerDoor({ isOpen }: { isOpen: boolean }) {
  const hf = FRAME / 2;
  const pivotRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  const isOpenRef = useRef(isOpen);
  useLayoutEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useFrame((_, delta) => {
    if (!pivotRef.current) return;
    // Rotation cible : ouverture vers l'extérieur de la douche (angle positif vers la SDB)
    const targetAngle = isOpenRef.current ? Math.PI * 0.47 : 0;
    const current = pivotRef.current.rotation.y;
    if (current === targetAngle) return;
    if (Math.abs(targetAngle - current) < 0.001) {
      pivotRef.current.rotation.y = targetAngle;
      invalidate();
      return;
    }
    pivotRef.current.rotation.y = THREE.MathUtils.damp(
      current,
      targetAngle,
      8,
      delta
    );
    invalidate();
  });

  // Repère local centré en X dans [−SHOWER_W/2, +SHOWER_W/2] :
  // Mur Ouest à x = −SHOWER_W/2 (−35.5)
  // Paroi fixe de 20 cm couvrant [−35.5, −15.5]
  const westX = -SHOWER_W / 2;
  const fixedCenterX = westX + FIXED_W / 2;
  // Pivot placé à 20 cm du mur Ouest, soit local x = −15.5
  const pivotX = westX + FIXED_W;
  const hw = DOOR_W / 2; // Demi-largeur du battant (25.5)

  return (
    <group>
      {/* 1. Paroi fixe de 20 cm côté Ouest */}
      <mesh material={glassMat} position={[fixedCenterX, DOOR_H / 2, 0]} castShadow>
        <boxGeometry args={[FIXED_W - FRAME * 2, DOOR_H - FRAME * 2, DOOR_T]} />
      </mesh>
      {/* Profil bas fixe */}
      <mesh material={frameMat} position={[fixedCenterX, hf, 0]} castShadow receiveShadow>
        <boxGeometry args={[FIXED_W, FRAME, FRAME]} />
      </mesh>
      {/* Profil haut fixe */}
      <mesh material={frameMat} position={[fixedCenterX, DOOR_H - hf, 0]} castShadow>
        <boxGeometry args={[FIXED_W, FRAME, FRAME]} />
      </mesh>
      {/* Profil montant gauche (contre mur Ouest) */}
      <mesh material={frameMat} position={[westX + hf, DOOR_H / 2, 0]} castShadow>
        <boxGeometry args={[FRAME, DOOR_H, FRAME]} />
      </mesh>
      {/* Profil montant droit (jonction fixe / pivot) */}
      <mesh material={frameMat} position={[pivotX - hf, DOOR_H / 2, 0]} castShadow>
        <boxGeometry args={[FRAME, DOOR_H, FRAME]} />
      </mesh>

      {/* 2. Battant mobile (51 cm) articulé sur le pivot à 20 cm du mur Ouest */}
      <group position={[pivotX, 0, 0]}>
        <group ref={pivotRef}>
          {/* Décalage de +hw pour que le battant s'étende du pivot vers l'Est */}
          <group position={[hw, 0, 0]}>
            {/* Vitre mobile */}
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
            {/* Profil gauche (charnière) */}
            <mesh material={frameMat} position={[-hw + hf, DOOR_H / 2, 0]} castShadow>
              <boxGeometry args={[FRAME, DOOR_H, FRAME]} />
            </mesh>
            {/* Profil droit (côté fermeture Est) */}
            <mesh material={frameMat} position={[hw - hf, DOOR_H / 2, 0]} castShadow>
              <boxGeometry args={[FRAME, DOOR_H, FRAME]} />
            </mesh>

            {/* Poignée — barre verticale côté droit, face extérieure */}
            <mesh material={frameMat} position={[hw - FRAME - 3, DOOR_H / 2, DOOR_T + 1.5]} castShadow>
              <boxGeometry args={[1.5, 22, 1.5]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export function Shower({ actionState, onSize }: SceneItemProps) {
  const { scene: tray   } = useGLTFClone(GLB_TRAY);
  const { scene: bar    } = useGLTFClone(GLB_BAR);
  const { scene: faucet } = useGLTFClone(GLB_FAUCET);
  const groupRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  const isDoorOpen = Boolean(actionState?.['shower-door-toggle'] ?? actionState?.['showerDoor']);

  useLayoutEffect(() => {
    setupScene(tray, 100 * (TRAY_CM / 68));

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
    <group ref={groupRef} userData={{ hoverAction: { label: 'Cabine de Douche', actions: ['showerDoor', ...SMART_OBJECTS.shower.slots.map(slot => `smart-object:::shower:::${slot.slotId}`)] } }}>
      {/* Receveur — setupScene centre et pose au sol (détaché parent pendant calcul). */}
      <primitive object={tray} />

      {/* Barre douchette — platines murales au ras du mur Sud */}
      <group position={[0, 0, TRAY_HALF - 8.6]}>
        <primitive object={bar} />
      </group>

      {/* Mitigeur thermostatique — rosaces coniques au ras du mur Sud */}
      <group position={[0, 90, TRAY_HALF]} rotation-x={-Math.PI / 2} rotation-y={Math.PI}>
        <primitive object={faucet} />
      </group>

      {/* Porte — centrée en X, au niveau du nez nord du bac (local Z=−TRAY_HALF) */}
      <group position={[0, 20, -TRAY_HALF]}>
        <ShowerDoor isOpen={isDoorOpen} />
      </group>
    </group>
  );
}


useGLTF.preload(GLB_TRAY);
useGLTF.preload(GLB_BAR);
useGLTF.preload(GLB_FAUCET);
