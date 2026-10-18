/**
 * BuildingPipes.tsx — Tuyaux techniques communs de l'immeuble :
 * 1. Tuyau d'aération / ventilation commun aux étages au-dessus :
 *    - Démarre au sol de l'étage supérieur (Y = 270 cm)
 *    - Descend dans la gaine jusqu'à 20 cm sous le plafond (Y = 230 cm)
 *    - Séparation à Y = 230 cm :
 *      * Côté SDB : s'arrête exactement au nu du mur SDB-Nord, grille extra-plate posée à ras du mur
 *      * Côté Cuisine : ressort juste de la cloison Ouest pour offrir 2 sorties perpendiculaires (parallèles au mur cuisine-ouest)
 * 2. Tube vertical d'évacuation des eaux usées :
 *    - Colonne de chute continue du sol supérieur (Y = 270 cm) au sol (Y = 0 cm)
 *    - Raccordement réglementaire du WC au ras du sol (Y ≈ 17-18 cm)
 *    - Même diamètre que la colonne générale (Ø110 mm) avec coude, pente gravitaire et culotte de branchement
 *
 * Coordonnées locales :
 *   Base au sol (Y = 0), centré en X/Z sur l'axe du tuyau d'aération.
 *   Position monde du groupe parent : [14, 0, 440].
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { WALL_H, BATH_NORTH_WALL, KITCHEN_WEST_WALL } from '../wallData';

// Constantes de hauteur (cm)
const CEIL_THICK = 20; // épaisseur dalle plafond
const Y_FLOOR_ABOVE = WALL_H + CEIL_THICK; // 270 cm — niveau sol de l'étage au-dessus
const Y_CEILING = WALL_H; // 250 cm — sous-face du plafond
const Y_VENT_SPLIT = WALL_H - 20; // 230 cm — séparation à 20 cm sous le plafond
const Y_FLOOR = 0; // sol appartement

// Diamètres et rayons (cm)
const VENT_RADIUS = 6.0; // Ø12 cm — colonne aération VMC collective
const VENT_BRANCH_RADIUS = 5.0; // Ø10 cm — piquages vers pièces
const DRAIN_RADIUS = 5.5; // Ø11 cm — colonne de chute eaux usées standard NF
const DRAIN_OFFSET_Z = -22; // décalage du tube d'eaux usées à côté de l'aération

// Repères de parois en coordonnées locales (groupe parent à [14, 0, 440])
const SDB_WALL_Z = BATH_NORTH_WALL - 440; // ≈ 23.6 cm (mur SDB-Nord)
const KITCHEN_WALL_X = KITCHEN_WEST_WALL - 14; // ≈ 19.6 cm (mur Cuisine-Ouest)
const KITCHEN_EXIT_X = KITCHEN_WALL_X + 5.5; // ≈ 25.1 cm (ressort juste de la cloison)
const KITCHEN_DOUBLE_OUTLET_LEN = 9.0; // demi-longueur des sorties perpendiculaires (parallèles au mur)

// Position de la pipe d'évacuation WC en coordonnées locales
// Toilette monde : X = 50, Z_dos = 465.1 -> local X = 36, local Z = 25.1
const WC_X = 36;
const WC_BACK_Z = 25.1;
const WC_AXIS_Y = 18.0; // axe standard évacuation cuvette NF
const WC_JUNCTION_Y = 16.5; // raccordement sur la colonne générale

export function BuildingPipes({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    const size = new THREE.Vector3(
      Math.max(KITCHEN_EXIT_X, WC_X) + DRAIN_RADIUS,
      Y_FLOOR_ABOVE,
      SDB_WALL_Z - (DRAIN_OFFSET_Z - DRAIN_RADIUS)
    );
    onSize(size);
  }, [onSize]);

  // Matériaux PBR réutilisables
  const { ventMat, ventGrilleMat, drainMat, clampMat, gasketMat } = useMemo(() => {
    return {
      ventMat: new THREE.MeshStandardMaterial({
        color: 0xb5bec8,
        roughness: 0.35,
        metalness: 0.65,
      }),
      ventGrilleMat: new THREE.MeshStandardMaterial({
        color: 0xf5f6f7,
        roughness: 0.4,
        metalness: 0.05,
      }),
      drainMat: new THREE.MeshStandardMaterial({
        color: 0x50565e,
        roughness: 0.45,
        metalness: 0.15,
      }),
      clampMat: new THREE.MeshStandardMaterial({
        color: 0x2b2e33,
        roughness: 0.3,
        metalness: 0.8,
      }),
      gasketMat: new THREE.MeshStandardMaterial({
        color: 0x1f2124,
        roughness: 0.8,
        metalness: 0.0,
      }),
    };
  }, []);

  // Calcul géométrique du tronçon incliné à 45° reliant le coude WC à la colonne générale
  const wcPipeGeom = useMemo(() => {
    const pA = new THREE.Vector3(WC_X, WC_AXIS_Y - 0.5, 12);
    const pB = new THREE.Vector3(0, WC_JUNCTION_Y, DRAIN_OFFSET_Z);
    const v = new THREE.Vector3().subVectors(pB, pA);
    const len = v.length();
    const center = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      v.clone().normalize()
    );
    return { center, quat, len };
  }, []);

  const ventTrunkHeight = Y_FLOOR_ABOVE - Y_VENT_SPLIT; // 40 cm
  const ventTrunkCenterY = Y_VENT_SPLIT + ventTrunkHeight / 2; // 250 cm

  const drainHeight = Y_FLOOR_ABOVE - Y_FLOOR + 10; // 280 cm
  const drainCenterY = (Y_FLOOR_ABOVE + Y_FLOOR - 10) / 2; // 130 cm

  return (
    <group userData={{ itemName: 'Colonnes techniques (Aération & Évacuation)' }}>
      {/* =================================================================== */}
      {/* 1. TUYAU D'AÉRATION / VENTILATION COLLECTIVE                        */}
      {/* =================================================================== */}
      {/* Tronc vertical descendant depuis le sol de l'étage supérieur (270) jusqu'à 20cm sous le plafond (230) */}
      <mesh
        position={[0, ventTrunkCenterY, 0]}
        material={ventMat}
        castShadow
        receiveShadow
        userData={{ itemName: "Colonne d'aération collective" }}
      >
        <cylinderGeometry args={[VENT_RADIUS, VENT_RADIUS, ventTrunkHeight, 32]} />
      </mesh>

      {/* Collerette au passage de dalle supérieure (Y = 270) */}
      <mesh position={[0, Y_FLOOR_ABOVE - 2, 0]} material={clampMat}>
        <cylinderGeometry args={[VENT_RADIUS + 0.8, VENT_RADIUS + 0.8, 4, 32]} />
      </mesh>

      {/* Raccord de dérivation en T à Y = 230 */}
      <mesh position={[0, Y_VENT_SPLIT, 0]} material={ventMat}>
        <sphereGeometry args={[VENT_RADIUS * 1.05, 24, 24]} />
      </mesh>

      {/* ── Branche SDB : s'arrête exactement au nu du mur SDB-Nord ─────────── */}
      <group position={[0, Y_VENT_SPLIT, SDB_WALL_Z / 2]}>
        <mesh rotation-x={Math.PI / 2} material={ventMat} castShadow receiveShadow>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS, VENT_BRANCH_RADIUS, SDB_WALL_Z, 24]} />
        </mesh>
      </group>

      {/* Grille VMC SDB extra-plate posée à ras du mur SDB-Nord (Z = SDB_WALL_Z) */}
      <group position={[0, Y_VENT_SPLIT, SDB_WALL_Z]} rotation-x={Math.PI / 2} userData={{ itemName: 'Grille aération SDB' }}>
        {/* Cadre bague extra-plat affleurant le mur */}
        <mesh position={[0, 0.2, 0]} material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS + 1.2, VENT_BRANCH_RADIUS + 1.2, 0.4, 32]} />
        </mesh>
        {/* Disque obturateur réglable blanc au nu du mur */}
        <mesh position={[0, 0.4, 0]} material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS - 0.4, VENT_BRANCH_RADIUS - 0.4, 0.3, 32]} />
        </mesh>
        {/* Fente circulaire d'extraction d'air */}
        <mesh position={[0, 0.25, 0]} material={gasketMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS - 0.2, VENT_BRANCH_RADIUS - 0.2, 0.35, 32]} />
        </mesh>
      </group>

      {/* ── Branche Cuisine : traverse la cloison et offre 2 sorties perpendiculaires ── */}
      {/* Piquage horizontal traversant la cloison vers la cuisine */}
      <group position={[KITCHEN_EXIT_X / 2, Y_VENT_SPLIT, 0]}>
        <mesh rotation-z={Math.PI / 2} material={ventMat} castShadow receiveShadow>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS, VENT_BRANCH_RADIUS, KITCHEN_EXIT_X, 24]} />
        </mesh>
      </group>

      {/* Té double perpendiculaire juste à la sortie de la cloison cuisine (parallèle au mur cuisine-ouest) */}
      <group position={[KITCHEN_EXIT_X, Y_VENT_SPLIT, 0]}>
        {/* Jonction centrale */}
        <mesh material={ventMat}>
          <sphereGeometry args={[VENT_BRANCH_RADIUS * 1.06, 20, 20]} />
        </mesh>

        {/* Conduit transversal perpendiculaire (axe Z, parallèle au mur cuisine-ouest) */}
        <mesh rotation-x={Math.PI / 2} material={ventMat} castShadow receiveShadow>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS, VENT_BRANCH_RADIUS, KITCHEN_DOUBLE_OUTLET_LEN * 2, 24]} />
        </mesh>

        {/* Sortie Nord (Z = -KITCHEN_DOUBLE_OUTLET_LEN) avec grille */}
        <group position={[0, 0, -KITCHEN_DOUBLE_OUTLET_LEN]} rotation-x={-Math.PI / 2} userData={{ itemName: 'Sortie aération cuisine Nord' }}>
          <mesh material={ventGrilleMat}>
            <cylinderGeometry args={[VENT_BRANCH_RADIUS + 0.8, VENT_BRANCH_RADIUS + 0.8, 1.2, 24]} />
          </mesh>
          <mesh position={[0, 0.7, 0]} material={ventGrilleMat}>
            <cylinderGeometry args={[VENT_BRANCH_RADIUS - 0.5, VENT_BRANCH_RADIUS - 0.5, 0.5, 24]} />
          </mesh>
        </group>

        {/* Sortie Sud (Z = +KITCHEN_DOUBLE_OUTLET_LEN) avec grille */}
        <group position={[0, 0, KITCHEN_DOUBLE_OUTLET_LEN]} rotation-x={Math.PI / 2} userData={{ itemName: 'Sortie aération cuisine Sud' }}>
          <mesh material={ventGrilleMat}>
            <cylinderGeometry args={[VENT_BRANCH_RADIUS + 0.8, VENT_BRANCH_RADIUS + 0.8, 1.2, 24]} />
          </mesh>
          <mesh position={[0, 0.7, 0]} material={ventGrilleMat}>
            <cylinderGeometry args={[VENT_BRANCH_RADIUS - 0.5, VENT_BRANCH_RADIUS - 0.5, 0.5, 24]} />
          </mesh>
        </group>
      </group>

      {/* =================================================================== */}
      {/* 2. TUBE D'ÉVACUATION DES EAUX USÉES (COLONNE DE CHUTE)              */}
      {/* =================================================================== */}
      {/* Colonne verticale continue du sol supérieur (270) au sol (0 / -10) */}
      <mesh
        position={[0, drainCenterY, DRAIN_OFFSET_Z]}
        material={drainMat}
        castShadow
        receiveShadow
        userData={{ itemName: "Colonne de chute eaux usées" }}
      >
        <cylinderGeometry args={[DRAIN_RADIUS, DRAIN_RADIUS, drainHeight, 32]} />
      </mesh>

      {/* Manchons d'emboîtement à lèvres le long de la colonne */}
      {[Y_FLOOR + 28, 135, Y_CEILING - 10, Y_FLOOR_ABOVE - 3].map((y) => (
        <mesh key={`sleeve-${y}`} position={[0, y, DRAIN_OFFSET_Z]} material={drainMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.7, DRAIN_RADIUS + 0.4, 7, 32]} />
        </mesh>
      ))}

      {/* Colliers métalliques de fixation murale */}
      {[45, 120, 205].map((y) => (
        <group key={`clamp-${y}`} position={[0, y, DRAIN_OFFSET_Z]}>
          <mesh material={clampMat}>
            <cylinderGeometry args={[DRAIN_RADIUS + 0.6, DRAIN_RADIUS + 0.6, 2.5, 24]} />
          </mesh>
          <mesh position={[-DRAIN_RADIUS - 3.5, 0, 0]} material={clampMat}>
            <boxGeometry args={[7, 2, 2.5]} />
          </mesh>
        </group>
      ))}

      {/* ── Raccordement réglementaire du WC au ras du sol (même diamètre Ø110) ── */}
      {/* Manchette d'évacuation étanche à joint à lèvres à l'arrière du WC */}
      <group position={[WC_X, WC_AXIS_Y, WC_BACK_Z]} rotation-x={Math.PI / 2} userData={{ itemName: 'Manchette évacuation WC' }}>
        <mesh material={clampMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.8, DRAIN_RADIUS + 0.8, 3.0, 24]} />
        </mesh>
        <mesh position={[0, 1.6, 0]} material={gasketMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.5, DRAIN_RADIUS + 0.5, 0.8, 24]} />
        </mesh>
      </group>

      {/* Tronçon droit traversant le mur SDB-Nord du dos du WC (Z = 25.1) vers l'intérieur de la gaine (Z = 12) */}
      <mesh
        position={[WC_X, (WC_AXIS_Y + WC_AXIS_Y - 0.5) / 2, (WC_BACK_Z + 12) / 2]}
        rotation-x={Math.PI / 2}
        material={drainMat}
        castShadow
        receiveShadow
        userData={{ itemName: 'Pipe évacuation WC' }}
      >
        <cylinderGeometry args={[DRAIN_RADIUS, DRAIN_RADIUS, WC_BACK_Z - 12, 24]} />
      </mesh>

      {/* Coude sanitaire 45° dans la gaine au changement d'angle vers la colonne */}
      <mesh position={[WC_X, WC_AXIS_Y - 0.5, 12]} material={drainMat}>
        <sphereGeometry args={[DRAIN_RADIUS * 1.08, 20, 20]} />
      </mesh>

      {/* Tronçon oblique à 45° avec pente gravitaire vers la colonne générale */}
      <mesh
        position={wcPipeGeom.center}
        quaternion={wcPipeGeom.quat}
        material={drainMat}
        castShadow
        receiveShadow
        userData={{ itemName: 'Tuyau évacuation WC Ø110' }}
      >
        <cylinderGeometry args={[DRAIN_RADIUS, DRAIN_RADIUS, wcPipeGeom.len, 24]} />
      </mesh>

      {/* Culotte de branchement à 45° sur la colonne de chute générale (Y = WC_JUNCTION_Y) */}
      <group position={[0, WC_JUNCTION_Y, DRAIN_OFFSET_Z]} userData={{ itemName: 'Culotte de branchement WC' }}>
        <mesh material={drainMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.8, DRAIN_RADIUS + 0.8, 12, 32]} />
        </mesh>
        {/* Renflement du piquage à 45° */}
        <mesh position={[DRAIN_RADIUS * 0.7, 0, DRAIN_RADIUS * 0.7]} material={drainMat}>
          <sphereGeometry args={[DRAIN_RADIUS * 1.05, 20, 20]} />
        </mesh>
      </group>

      {/* Collier de maintien au sol de la pipe WC */}
      <group position={[WC_X, (WC_AXIS_Y - 0.5) / 2, 12]}>
        <mesh material={clampMat}>
          <boxGeometry args={[2.5, WC_AXIS_Y - 0.5, 2.5]} />
        </mesh>
      </group>
    </group>
  );
}
