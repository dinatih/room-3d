/**
 * Porte-fenêtre double battant PVC blanc — 160×210cm total (seuil 20cm).
 * V1 : Battant gauche fixe, battant droit ouvrant.
 * V2 : Deux battants ouvrants individuels, logique de dépendance physique,
 *      coffrage de volet roulant (H=22, P=15), et tablier de lames de volet roulant animées.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W_TOTAL   = 160;   // largeur totale
const PANEL_W   = W_TOTAL / 2;  // 80cm par battant en V1
const SILL_H    = 20;    // seuil maçonné (V1)
const GLASS_H   = 190;   // hauteur vitrage
const GLASS_TOP = SILL_H + GLASS_H;  // 210
const FRAME_D_V1 = 5;     // profondeur cadre V1
const WW  = 10;   // épaisseur du cadre (profondeur Z)

// V2 Constants (Ajustées d'après les cotes réelles)
const FRAME = 5; // largeur des profilés du dormant fixe (5 cm)
const FRAME_D_V2 = 6; // profondeur cadre V2
const BOX_H = 22; // hauteur du coffrage
const BOX_D = 15; // profondeur du coffrage
const BOX_W = 170; // largeur du coffrage (170cm avec lattes)

// V1 Panel
function DoorPanelV1({ cx, baseY }: { cx: number; baseY: number }) {
  const pvc   = <meshStandardMaterial color="#f0f0f0" roughness={0.3} />;
  const glass = (
    <meshPhysicalMaterial
      color="#88ccff" transparent opacity={0.25}
      roughness={0.05} metalness={0.1}
      side={THREE.DoubleSide}
    />
  );
  const frameW = 8;
  const PANE_H = GLASS_H - frameW * 2;
  const PANE_W = PANEL_W - frameW * 2;
  return (
    <>
      <mesh position={[cx, baseY + GLASS_H - frameW / 2, 0]}>
        <boxGeometry args={[PANEL_W, frameW, FRAME_D_V1]} />{pvc}
      </mesh>
      <mesh position={[cx, baseY + frameW / 2, 0]}>
        <boxGeometry args={[PANEL_W, frameW, FRAME_D_V1]} />{pvc}
      </mesh>
      <mesh position={[cx - PANEL_W / 2 + frameW / 2, baseY + frameW + PANE_H / 2, 0]}>
        <boxGeometry args={[frameW, PANE_H, FRAME_D_V1]} />{pvc}
      </mesh>
      <mesh position={[cx + PANEL_W / 2 - frameW / 2, baseY + frameW + PANE_H / 2, 0]}>
        <boxGeometry args={[frameW, PANE_H, FRAME_D_V1]} />{pvc}
      </mesh>
      <mesh position={[cx, baseY + frameW + PANE_H / 2, 0]}>
        <planeGeometry args={[PANE_W, PANE_H]} />{glass}
      </mesh>
    </>
  );
}

// V2 Panel (procedural, detailed)
function DoorPanelV2({ width, height, baseY, pvcColor = "#ffffff", glassColor = "#b2e0ff" }: {
  width: number;
  height: number;
  baseY: number;
  pvcColor?: string;
  glassColor?: string;
}) {
  const pvc = <meshStandardMaterial color={pvcColor} roughness={0.15} metalness={0.05} />;
  const glass = (
    <meshPhysicalMaterial
      color={glassColor} transparent opacity={0.15}
      roughness={0.01} metalness={0.1}
      transmission={0.9} thickness={1.2}
      side={THREE.DoubleSide}
    />
  );
  
  const frameW = 8; // largeur profilés battant (8 cm)
  const frameD = 5.5; // épaisseur profilés battant
  
  const gw = width - frameW * 2;
  const gh = height - frameW * 2;
  
  return (
    <group position={[0, baseY + height / 2, 0]}>
      {/* Cadre du battant */}
      <mesh position={[0, height / 2 - frameW / 2, 0]}>
        <boxGeometry args={[width, frameW, frameD]} />{pvc}
      </mesh>
      <mesh position={[0, -height / 2 + frameW / 2, 0]}>
        <boxGeometry args={[width, frameW, frameD]} />{pvc}
      </mesh>
      <mesh position={[-width / 2 + frameW / 2, 0, 0]}>
        <boxGeometry args={[frameW, height - frameW * 2, frameD]} />{pvc}
      </mesh>
      <mesh position={[width / 2 - frameW / 2, 0, 0]}>
        <boxGeometry args={[frameW, height - frameW * 2, frameD]} />{pvc}
      </mesh>
      {/* Vitrage double épaisseur */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[gw, gh, 0.8]} />{glass}
      </mesh>
    </group>
  );
}

export function GlassDoor({ actionState, onSize }: SceneItemProps) {
  const isV2 = actionState['glass-door-v2'] ?? true;
  const { invalidate } = useThree();

  // Refs pour les groupes d'animation
  const doorRefV1 = useRef<THREE.Group>(null!);
  const rightDoorRef = useRef<THREE.Group>(null);
  const leftDoorRef = useRef<THREE.Group>(null);
  const handleRef = useRef<THREE.Group>(null);
  const shutterRef = useRef<THREE.Group>(null);

  // Valeurs d'animation persistantes
  const rightRotRef = useRef(0);
  const leftRotRef = useRef(0);
  const shutterPercentRef = useRef(0);

  // Synchronisation des états réactifs dans une ref locale pour la boucle useFrame
  const stateRef = useRef({
    isOpenRight: false,
    isOpenLeft: false,
    targetShutter: 0,
  });

  stateRef.current.isOpenRight = !!actionState['east-glass-door-toggle'];
  stateRef.current.isOpenLeft = !!actionState['glass-door-v2-left-open'];
  stateRef.current.targetShutter = actionState['glass-door-v2-shutter-pos'] ?? 0;

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W_TOTAL, GLASS_TOP, WW));
  }, [onSize]);

  // Boucle d'animation R3F haute performance
  useFrame(() => {
    if (!isV2) {
      // Animation V1
      const target = stateRef.current.isOpenRight ? Math.PI / 2 : 0;
      if (doorRefV1.current) {
        const delta = target - doorRefV1.current.rotation.y;
        if (Math.abs(delta) > 0.001) {
          doorRefV1.current.rotation.y += delta * 0.12;
          invalidate();
        } else {
          doorRefV1.current.rotation.y = target;
        }
      }
      return;
    }

    // Animation V2
    const s = stateRef.current;
    let moved = false;

    // 1. Cible du battant gauche (dépendance : ne s'ouvre que si le droit est déjà ouvert d'au moins 15° / 0.25 rad)
    const actualLeftOpen = s.isOpenRight && s.isOpenLeft;
    const isRightOpenEnough = rightRotRef.current > 0.25;
    const leftTarget = (actualLeftOpen && isRightOpenEnough) ? -Math.PI / 2 : 0;

    // 2. Cible du battant droit (dépendance : reste ouvert tant que le gauche n'est pas refermé)
    const isLeftOpen = Math.abs(leftRotRef.current) > 0.05;
    const rightTarget = s.isOpenRight ? Math.PI / 2 : (isLeftOpen ? Math.PI / 2 : 0);

    // Transition battant gauche
    const dLeft = leftTarget - leftRotRef.current;
    if (Math.abs(dLeft) > 0.001) {
      leftRotRef.current += dLeft * 0.12;
      moved = true;
    } else {
      leftRotRef.current = leftTarget;
    }

    // Transition battant droit
    const dRight = rightTarget - rightRotRef.current;
    if (Math.abs(dRight) > 0.001) {
      rightRotRef.current += dRight * 0.12;
      moved = true;
    } else {
      rightRotRef.current = rightTarget;
    }

    // Application des rotations
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = rightRotRef.current;
    }
    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = leftRotRef.current;
    }

    // 3. Animation de la poignée lors du déverrouillage initial (rot Z de 0° à 35° et retour)
    if (handleRef.current) {
      const maxTilt = 35 * (Math.PI / 180);
      let handleTilt = 0;
      // La poignée s'abaisse dans la zone d'angle initial (0 à 0.3 rad) du battant droit
      if (rightRotRef.current > 0 && rightRotRef.current < 0.3) {
        handleTilt = -Math.sin((rightRotRef.current / 0.3) * Math.PI) * maxTilt;
      }
      handleRef.current.rotation.z = handleTilt;
    }

    // 4. Animation du volet roulant
    const dShutter = s.targetShutter - shutterPercentRef.current;
    if (Math.abs(dShutter) > 0.1) {
      shutterPercentRef.current += dShutter * 0.08;
      moved = true;
    } else {
      shutterPercentRef.current = s.targetShutter;
    }

    // Masquage dynamique des lames du volet
    if (shutterRef.current) {
      const currentHeight = (200 * shutterPercentRef.current) / 100;
      const children = shutterRef.current.children;
      const visibleCount = Math.ceil(currentHeight / 4);
      for (let i = 0; i < children.length; i++) {
        children[i].visible = i < visibleCount;
      }
    }

    if (moved) {
      invalidate();
    }
  });

  // Matériaux partagés
  const pvcMat = <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.05} />;
  const metalMat = <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />;
  const darkMetalMat = <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />;

  // Dimensions intérieures d'ouverture V2
  const W_INNER = W_TOTAL - FRAME * 2; // 150 cm
  const PANEL_W_V2 = W_INNER / 2;     // 75 cm

  // Rendu de la version 1 (Simplifiée)
  if (!isV2) {
    const handleMatV1 = <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />;
    const HANDLE_LX = -PANEL_W + 8 + 4;
    return (
      <group position={[0, -GLASS_TOP / 2, 0]}>
        {/* Battant gauche — fixe */}
        <DoorPanelV1 cx={-W_TOTAL / 4} baseY={SILL_H} />

        {/* Battant droit — ouvrant, pivot charnière droite */}
        <group ref={doorRefV1} position={[W_TOTAL / 2, 0, 0]}>
          <DoorPanelV1 cx={-PANEL_W / 2} baseY={SILL_H} />
          {/* Poignée */}
          <mesh position={[HANDLE_LX, SILL_H + GLASS_H * 0.5, FRAME_D_V1 / 2 + 0.5]}>
            <boxGeometry args={[3, 20, 1]} />{handleMatV1}
          </mesh>
          <mesh position={[HANDLE_LX - 1, SILL_H + GLASS_H * 0.5, FRAME_D_V1 / 2 + 4]}>
            <boxGeometry args={[1.5, 1.5, 8]} />{handleMatV1}
          </mesh>
        </group>
      </group>
    );
  }

  // Lames de volet (50 lames de H=4cm, Z=-4cm pour couvrir Y=25 à Y=225)
  const slats = [];
  for (let i = 0; i < 50; i++) {
    slats.push(
      <mesh key={i} position={[0, 25 + 200 - i * 4 - 2, -4]}>
        <boxGeometry args={[W_INNER + 2, 3.8, 1.2]} />
        <meshStandardMaterial color="#dcdcdc" roughness={0.4} metalness={0.1} />
      </mesh>
    );
  }

  // Rendu de la version 2 (Détaillée procédurale)
  return (
    <group position={[0, -GLASS_TOP / 2, 0]}>
      {/* ── CADRE DORMANT FIXE (Y=25 à Y=225, mitered 5cm) ── */}
      {/* Montant gauche */}
      <mesh position={[-W_TOTAL / 2 + FRAME / 2, 25 + 200 / 2, 0]}>
        <boxGeometry args={[FRAME, 200, FRAME_D_V2]} />{pvcMat}
      </mesh>
      {/* Montant droit */}
      <mesh position={[W_TOTAL / 2 - FRAME / 2, 25 + 200 / 2, 0]}>
        <boxGeometry args={[FRAME, 200, FRAME_D_V2]} />{pvcMat}
      </mesh>
      {/* Traverse haute (s'emboîte entre les montants) */}
      <mesh position={[0, 225 - FRAME / 2, 0]}>
        <boxGeometry args={[W_INNER, FRAME, FRAME_D_V2]} />{pvcMat}
      </mesh>
      {/* Traverse basse (s'emboîte entre les montants) */}
      <mesh position={[0, 25 + FRAME / 2, 0]}>
        <boxGeometry args={[W_INNER, FRAME, FRAME_D_V2]} />{pvcMat}
      </mesh>

      {/* ── BATTANT GAUCHE (Pivot charnière gauche X=-75) ── */}
      <group ref={leftDoorRef} position={[-W_INNER / 2, 0, 0]}>
        <group position={[PANEL_W_V2 / 2, 0, 0]}>
          <DoorPanelV2 width={PANEL_W_V2} height={190} baseY={30} />
        </group>
        
        {/* Profilé de recouvrement central (battement) monté sur la tranche du battant gauche */}
        <mesh position={[PANEL_W_V2 + 0.5, 30 + 190 / 2, 0.5]}>
          <boxGeometry args={[2.5, 190, FRAME_D_V2 + 0.4]} />{pvcMat}
        </mesh>

        {/* Charnières gauche */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 60, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.7, 0.7, 3, 8]} />{metalMat}
          </mesh>
          <mesh position={[0, 125, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.7, 0.7, 3, 8]} />{metalMat}
          </mesh>
          <mesh position={[0, 190, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.7, 0.7, 3, 8]} />{metalMat}
          </mesh>
        </group>
      </group>

      {/* ── BATTANT DROIT (Pivot charnière droite X=75) ── */}
      <group ref={rightDoorRef} position={[W_INNER / 2, 0, 0]}>
        <group position={[-PANEL_W_V2 / 2, 0, 0]}>
          <DoorPanelV2 width={PANEL_W_V2} height={190} baseY={30} />
        </group>

        {/* Charnières droite */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 60, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.7, 0.7, 3, 8]} />{metalMat}
          </mesh>
          <mesh position={[0, 125, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.7, 0.7, 3, 8]} />{metalMat}
          </mesh>
          <mesh position={[0, 190, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.7, 0.7, 3, 8]} />{metalMat}
          </mesh>
        </group>

        {/* Poignée béquille animée sur le battant droit (côté intérieur, Z > 0) */}
        {/* Position local X relative au pivot : -PANEL_W_V2 + 6 = -69 */}
        <group position={[-PANEL_W_V2 + 6, 125, FRAME_D_V2 / 2 + 0.1]}>
          {/* Platine de poignée (Rosette) */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[2.5, 4.5, 0.2]} />{metalMat}
          </mesh>
          {/* Axe rotatif horizontal */}
          <mesh position={[0, 0, 0.4]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.4, 0.4, 0.6, 8]} />{metalMat}
          </mesh>
          {/* Levier de poignée pivotant */}
          <group ref={handleRef} position={[0, 0, 0.7]}>
            {/* Le bras s'étend horizontalement vers la droite (+X) */}
            <mesh position={[4.5, 0, 0.1]}>
              <boxGeometry args={[9, 0.9, 0.5]} />{metalMat}
            </mesh>
          </group>
        </group>
      </group>

      {/* ── COULISSES LATÉRALES DE VOLET ROULANT ── */}
      {/* Glissières le long des montants extérieurs (Z = -4) jusqu'au bas du coffrage (Y = 225) */}
      <mesh position={[-W_INNER / 2 - 0.5, 25 + 200 / 2, -4]}>
        <boxGeometry args={[1.5, 200, 1.5]} />{darkMetalMat}
      </mesh>
      <mesh position={[W_INNER / 2 + 0.5, 25 + 200 / 2, -4]}>
        <boxGeometry args={[1.5, 200, 1.5]} />{darkMetalMat}
      </mesh>

      {/* ── TABLIER DE LAMES DU VOLET ROULANT ── */}
      <group ref={shutterRef}>
        {slats}
      </group>

      {/* ── COFFRAGE SUPÉRIEUR DU VOLET (H=22, P=15) ── */}
      {/* Placé de Y=225 à Y=247, soit exactement 3 cm sous le plafond à Y=250 */}
      <group position={[0, 225 + BOX_H / 2, BOX_D / 2]}>
        {/* Corps principal du coffrage */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[BOX_W, BOX_H, BOX_D]} />
          <meshStandardMaterial color="#f7f7f7" roughness={0.4} metalness={0.0} />
        </mesh>
        {/* Baguette décorative / Jointure de la trappe de visite */}
        <mesh position={[0, -BOX_H / 2 + 0.5, BOX_D / 2 + 0.05]}>
          <boxGeometry args={[BOX_W - 2, 0.2, 0.1]} />
          <meshStandardMaterial color="#dddddd" roughness={0.3} />
        </mesh>
      </group>

      {/* ── LATTES DE FINITION / CHAMBRANLES (5cm de large, épaisseur 1.2cm, calées sur la face intérieure Z=0) ── */}
      {/* Latte gauche */}
      <mesh position={[-W_TOTAL / 2 - 2.5, 25 + 200 / 2, 0.6]}>
        <boxGeometry args={[5, 200, 1.2]} />{pvcMat}
      </mesh>
      {/* Latte droite */}
      <mesh position={[W_TOTAL / 2 + 2.5, 25 + 200 / 2, 0.6]}>
        <boxGeometry args={[5, 200, 1.2]} />{pvcMat}
      </mesh>
      {/* Latte haute */}
      <mesh position={[0, 225 + 2, 0.6]}>
        <boxGeometry args={[W_TOTAL + 10, 4, 1.2]} />{pvcMat}
      </mesh>
      {/* Latte basse (pour fermer le tour symétrique de 5cm) */}
      <mesh position={[0, 25 - 2.5, 0.6]}>
        <boxGeometry args={[W_TOTAL + 10, 5, 1.2]} />{pvcMat}
      </mesh>
    </group>
  );
}
