import { getObjectActionIds } from '../objectActions';
/**
 * Vihals.tsx — VIHALS chaise pliante, rouge (705.927.44).
 * Modèle articulé réaliste :
 * - Cadre arrière / dossier principal (tubes + arc supérieur + dossier à fentes)
 * - Cadre avant pivotant autour du point de charnière sous l'assise
 * - Assise pivotante articulée entre le cadre arrière et le cadre avant
 * - Traverse / barreaux de renfort inférieurs
 * - Animation fluide de pliage / dépliage cinématique via useFrame (MathUtils.damp)
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { SceneItemProps, SceneModelProps } from '@shared/types';

const GLB = 'items/vihals70592744/Vihals70592744.glb';

// Dimensions réelles IKEA VIHALS (cm) : 43 L × 47 P × 80 H (pliée : 43 L × 9 P × 88 H)
const W = 43;
const TUBE_R = 0.95;
const LEG_X = W / 2 - 1.8; // demi-largeur d'écartement des montants (~19.7 cm)
const MAT_RED = 0xbf2a22;

interface VihalsAnimatedProps extends SceneModelProps {
  folded: boolean;
}

function VihalsModel({ folded, onSize }: VihalsAnimatedProps) {
  // Matériaux réalistes
  const matFrame = useMemo(() => new THREE.MeshStandardMaterial({
    color: MAT_RED, roughness: 0.42, metalness: 0.35,
  }), []);
  const matPlate = useMemo(() => new THREE.MeshStandardMaterial({
    color: MAT_RED, roughness: 0.55, metalness: 0.08, side: THREE.DoubleSide,
  }), []);
  const matCaps = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.7, metalness: 0.1,
  }), []);
  const matRivets = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x555555, roughness: 0.3, metalness: 0.8,
  }), []);

  // Progression d'animation (0 = dépliée, 1 = pliée)
  const animT = useRef(folded ? 1 : 0);
  const frontLegsRef = useRef<THREE.Group>(null);
  const seatRef = useRef<THREE.Group>(null);
  const mainGroupRef = useRef<THREE.Group>(null);

  // Géométries communes
  const rearLegGeo = useMemo(() => new THREE.CylinderGeometry(TUBE_R, TUBE_R, 79, 14), []);
  const frontLegGeo = useMemo(() => new THREE.CylinderGeometry(TUBE_R, TUBE_R, 64, 14), []);
  const rungGeo = useMemo(() => new THREE.CylinderGeometry(TUBE_R * 0.85, TUBE_R * 0.85, LEG_X * 2, 12), []);
  const capGeo = useMemo(() => new THREE.CylinderGeometry(TUBE_R * 1.15, TUBE_R * 1.15, 2.2, 14), []);
  const rivetGeo = useMemo(() => new THREE.CylinderGeometry(TUBE_R * 0.6, TUBE_R * 0.6, LEG_X * 2 + 3, 10), []);

  useLayoutEffect(() => {
    onSize?.(new THREE.Vector3(W, folded ? 88 : 80, folded ? 9 : 47));
  }, [folded, onSize]);

  useFrame((_, delta) => {
    const target = folded ? 1 : 0;
    if (Math.abs(animT.current - target) > 0.0005) {
      animT.current = THREE.MathUtils.damp(animT.current, target, 9, delta);
    } else {
      animT.current = target;
    }

    const t = animT.current;

    // Cinématique réaliste du pliage VIHALS :
    // - Déplié : cadre arrière incliné de ~9° vers l'arrière, pieds avant inclinés vers l'avant de ~24°
    // - Plié : cadre arrière redressé verticalement (0°), pieds avant rabattus parallèlement contre le cadre arrière
    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(-0.16, 0, t);
      mainGroupRef.current.position.z = THREE.MathUtils.lerp(1.5, 0, t);
    }

    // Le cadre des pieds avant pivote sur l'axe de charnière (Y ~ 42 cm)
    // En position ouverte : angle relatif d'environ +0.65 rad (~37°)
    // En position fermée : angle relatif proche de 0 (parallèle)
    if (frontLegsRef.current) {
      frontLegsRef.current.rotation.x = THREE.MathUtils.lerp(0.68, 0.04, t);
    }

    // L'assise pivote autour de son axe arrière (Y ~ 44 cm)
    // En position ouverte : quasi horizontale (angle ~ -1.45 rad / ~83° par rapport au montant)
    // En position fermée : rabattue verticalement le long du cadre arrière (angle ~ 0 rad)
    if (seatRef.current) {
      seatRef.current.rotation.x = THREE.MathUtils.lerp(-1.42, 0.02, t);
    }
  });

  return (
    <group ref={mainGroupRef}>
      {/* ── 1. CADRE ARRIÈRE ET DOSSIER (Structure mère) ── */}
      <group position={[0, 0, 0]}>
        {/* Montants verticaux arrière gauche et droit */}
        {[-1, 1].map((s) => (
          <group key={`rear-leg-${s}`} position={[s * LEG_X, 39.5, 0]}>
            <mesh material={matFrame} geometry={rearLegGeo} castShadow receiveShadow />
            {/* Pied / patin bas */}
            <mesh position={[0, -38.5, 0]} material={matCaps}>
              <primitive object={capGeo} />
            </mesh>
          </group>
        ))}

        {/* Cintre supérieur du dossier (arcade tubulaire) */}
        <mesh position={[0, 79, 0]} material={matFrame} castShadow>
          <torusGeometry args={[LEG_X, TUBE_R, 10, 32, Math.PI]} />
        </mesh>

        {/* Traverse arrière basse de renfort */}
        <mesh position={[0, 9, 0]} rotation={[0, 0, Math.PI / 2]} material={matFrame} castShadow>
          <primitive object={rungGeo} />
        </mesh>

        {/* Dossier ergonomique incurvé avec fente poignée intégrée */}
        <group position={[0, 62, 0.2]}>
          <mesh material={matPlate} castShadow receiveShadow>
            <boxGeometry args={[W - 5, 23, 1.2]} />
          </mesh>
          {/* Fente de préhension centrale du dossier VIHALS */}
          <mesh position={[0, 5.5, 0]} rotation={[0, 0, Math.PI / 2]} material={matFrame}>
            <cylinderGeometry args={[1.5, 1.5, 12, 14]} />
          </mesh>
        </group>

        {/* Axe / rivet de liaison de l'assise */}
        <mesh position={[0, 44, 0]} rotation={[0, 0, Math.PI / 2]} material={matRivets}>
          <primitive object={rivetGeo} />
        </mesh>

        {/* ── 2. CADRE AVANT PIVOTANT (Pieds avant en cintre inversé) ── */}
        {/* Charnière située sur les montants arrière à Y = 42 cm */}
        <group ref={frontLegsRef} position={[0, 42, 0]}>
          {[-1, 1].map((s) => (
            <group key={`front-leg-${s}`} position={[s * (LEG_X - 1.8), -18, 0]}>
              <mesh material={matFrame} geometry={frontLegGeo} castShadow receiveShadow />
              {/* Patin bas avant */}
              <mesh position={[0, -31, 0]} material={matCaps}>
                <primitive object={capGeo} />
              </mesh>
            </group>
          ))}

          {/* Traverse basse cadre avant */}
          <mesh position={[0, -32, 0]} rotation={[0, 0, Math.PI / 2]} material={matFrame} castShadow>
            <cylinderGeometry args={[TUBE_R * 0.85, TUBE_R * 0.85, (LEG_X - 1.8) * 2, 12]} />
          </mesh>

          {/* Traverse haute d'appui sous assise */}
          <mesh position={[0, -4, 0]} rotation={[0, 0, Math.PI / 2]} material={matFrame} castShadow>
            <cylinderGeometry args={[TUBE_R * 0.85, TUBE_R * 0.85, (LEG_X - 1.8) * 2, 12]} />
          </mesh>
        </group>

        {/* ── 3. ASSISE PIVOTANTE ── */}
        {/* Charnière assise à Y = 44 cm */}
        <group ref={seatRef} position={[0, 44, 1.2]}>
          {/* Plateau d'assise thermoformé rouge */}
          <mesh position={[0, -18, 0.4]} material={matPlate} castShadow receiveShadow>
            <boxGeometry args={[W - 4.5, 36, 1.3]} />
          </mesh>
          {/* Bords et renfort sous l'assise */}
          {[-1, 1].map((s) => (
            <mesh key={`seat-rib-${s}`} position={[s * (LEG_X - 2.5), -18, -0.6]} material={matPlate}>
              <boxGeometry args={[1, 35, 1.2]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export function Vihals({ onSize, actionState = {}, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const sceneState = useFurnitureToggles(['vihals-toggle']);
  const folded = Boolean((isPreview ? actionState : sceneState)['vihals-toggle']);

  return (
    <group userData={{
      hoverAction: {
        label: folded ? 'VIHALS (Pliée)' : 'VIHALS (Dépliée)',
        actions: getObjectActionIds('vihals-chair'),
      },
    }}>
      <VihalsModel folded={folded} onSize={onSize} />
    </group>
  );
}

useGLTF.preload(GLB);
