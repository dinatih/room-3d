/**
 * BuildingPipes.tsx — Tuyaux techniques communs de l'immeuble :
 * 1. Tuyau d'aération / ventilation commun aux étages au-dessus :
 *    - Démarre au sol de l'étage supérieur (Y = 270 cm)
 *    - Descend dans la gaine jusqu'à 20 cm sous le plafond (Y = 230 cm)
 *    - Côté SDB : s'arrête au nu du mur SDB-Nord avec grille à ras
 *    - Côté Cuisine : sortie Nord avec grille VMC, sortie Sud reliée à la gaine flexible de la hotte
 * 2. Gaine flexible d'évacuation de la hotte aspirante :
 *    - Part du coude direction Sud de l'aération cuisine
 *    - Longe le mur Cuisine-Sud en descendant le long du mur
 *    - Coude à 90° le long du dessus de la hotte
 *    - Coude à 90° vers le bas pour se connecter au trou supérieur de la hotte UTDRAG
 * 3. Tube vertical d'évacuation des eaux usées :
 *    - Colonne de chute continue (Y = 270 cm à Y = 0 cm)
 *    - Évacuation WC peinte en BLANC dans la partie visible SDB (longeant le mur SDB-Nord)
 *    - Traversée du mur SDB-Nord à 90° vers la gaine et jonction sur la colonne générale
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
const FLEX_RADIUS = 3.8; // Ø7.6 cm (conduit flexible hotte alu compact)

// Repères de parois en coordonnées locales (groupe parent à [14, 0, 440])
const SDB_WALL_Z = BATH_NORTH_WALL - 440; // ≈ 23.6 cm (mur SDB-Nord)
const KITCHEN_WALL_X = KITCHEN_WEST_WALL - 14; // ≈ 19.6 cm (mur Cuisine-Ouest)
const KITCHEN_EXIT_X = KITCHEN_WALL_X + 5.5; // ≈ 25.1 cm (ressort juste de la cloison)
const KITCHEN_DOUBLE_OUTLET_LEN = 9.0; // demi-longueur des sorties perpendiculaires

// Repères de la hotte aspirante UTDRAG en coordonnées locales
// Centre exact du trou d'évacuation mesuré sur la géométrie 3D Utdrag : X = 87.5, Z = 2.17, Y = 170.7
const HOOD_X = 87.5;
const HOOD_COLLAR_Z = 2.17; // centre exact du trou de la buse de hotte
const HOOD_COLLAR_Y = 170.7;
const FLEX_WALL_Z = 21.0; // collé contre le mur Sud (Z = 25 - rayon 3.8 - 0.2), dégagement total > 4.5 cm derrière les Drona (Z = 12.5)

// Position de l'évacuation WC en coordonnées locales
// Toilette monde : X = 50 -> local X = 36
const WC_X = 36;
const WC_AXIS_Y = 18.0; // axe standard évacuation cuvette NF
const WC_WALL_RUN_Z = SDB_WALL_Z + DRAIN_RADIUS + 0.4; // axe du tuyau longeant le mur dans la SDB (≈ 29.5 cm)
const WC_ELBOW_Y = 17.3; // hauteur au coude 90°
const WC_JUNCTION_Y = 16.5; // raccordement sur la colonne générale

export function BuildingPipes({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    const size = new THREE.Vector3(
      Math.max(HOOD_X, WC_X) + DRAIN_RADIUS,
      Y_FLOOR_ABOVE,
      WC_WALL_RUN_Z + DRAIN_RADIUS - (DRAIN_OFFSET_Z - DRAIN_RADIUS)
    );
    onSize(size);
  }, [onSize]);

  // Matériaux PBR réutilisables
  const { ventMat, ventGrilleMat, drainMat, drainWhiteMat, flexMat, clampMat, clampWhiteMat, gasketMat } = useMemo(() => {
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
      // Peinture blanche sanitaire pour la partie visible du tuyau WC dans la SDB
      drainWhiteMat: new THREE.MeshStandardMaterial({
        color: 0xfafbfc,
        roughness: 0.35,
        metalness: 0.05,
      }),
      // Aluminium strié pour la gaine flexible de hotte
      flexMat: new THREE.MeshStandardMaterial({
        color: 0xd8dde3,
        roughness: 0.28,
        metalness: 0.85,
      }),
      clampMat: new THREE.MeshStandardMaterial({
        color: 0x2b2e33,
        roughness: 0.3,
        metalness: 0.8,
      }),
      clampWhiteMat: new THREE.MeshStandardMaterial({
        color: 0xededed,
        roughness: 0.4,
        metalness: 0.1,
      }),
      gasketMat: new THREE.MeshStandardMaterial({
        color: 0x1f2124,
        roughness: 0.8,
        metalness: 0.0,
      }),
    };
  }, []);

  const ventTrunkHeight = Y_FLOOR_ABOVE - Y_VENT_SPLIT; // 40 cm
  const ventTrunkCenterY = Y_VENT_SPLIT + ventTrunkHeight / 2; // 250 cm

  const drainHeight = Y_FLOOR_ABOVE - Y_FLOOR + 10; // 280 cm
  const drainCenterY = (Y_FLOOR_ABOVE + Y_FLOOR - 10) / 2; // 130 cm

  // Longueurs des tronçons de la ligne d'évacuation WC
  const wcRunAlongWallLen = WC_X; // longe le mur de X = 36 à X = 0
  const wcThroughWallLenSDB = WC_WALL_RUN_Z - SDB_WALL_Z; // partie visible entre axe tuyau et mur SDB
  const wcThroughWallLenGaine = SDB_WALL_Z - DRAIN_OFFSET_Z; // partie cachée dans la gaine jusqu'à la colonne

  // Trajectoire 3D de la gaine flexible de hotte aspirante
  const flexTubeGeo = useMemo(() => {
    // 1. Part du coude direction Sud (KITCHEN_EXIT_X, Y_VENT_SPLIT, +KITCHEN_DOUBLE_OUTLET_LEN)
    // 2. Longe le mur Cuisine-Sud à Z = FLEX_WALL_Z (reculé contre le placo)
    // 3. Descend le long du mur jusqu'au-dessus de la hotte
    // 4. Coude à 90° vers le Nord (-Z) vers le centre de la buse (Z = HOOD_COLLAR_Z)
    // 5. Coude à 90° vers le bas (-Y) entrant directement dans le trou de la hotte
    const points = [
      new THREE.Vector3(KITCHEN_EXIT_X, Y_VENT_SPLIT, KITCHEN_DOUBLE_OUTLET_LEN),
      new THREE.Vector3(KITCHEN_EXIT_X + 2.0, Y_VENT_SPLIT, FLEX_WALL_Z),
      new THREE.Vector3(45.0, 222, FLEX_WALL_Z),
      new THREE.Vector3(70.0, 205, FLEX_WALL_Z),
      new THREE.Vector3(HOOD_X, 186, FLEX_WALL_Z),
      new THREE.Vector3(HOOD_X, 176, HOOD_COLLAR_Z + 5.0),
      new THREE.Vector3(HOOD_X, HOOD_COLLAR_Y + 2.5, HOOD_COLLAR_Z),
      new THREE.Vector3(HOOD_X, HOOD_COLLAR_Y, HOOD_COLLAR_Z),
      new THREE.Vector3(HOOD_X, HOOD_COLLAR_Y - 2.0, HOOD_COLLAR_Z),
    ];
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.2);
    return new THREE.TubeGeometry(curve, 80, FLEX_RADIUS, 18, false);
  }, []);

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
        <mesh position={[0, 0.2, 0]} material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS + 1.2, VENT_BRANCH_RADIUS + 1.2, 0.4, 32]} />
        </mesh>
        <mesh position={[0, 0.4, 0]} material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS - 0.4, VENT_BRANCH_RADIUS - 0.4, 0.3, 32]} />
        </mesh>
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

      {/* Té double perpendiculaire à la sortie de la cloison cuisine (parallèle au mur cuisine-ouest) */}
      <group position={[KITCHEN_EXIT_X, Y_VENT_SPLIT, 0]}>
        <mesh material={ventMat}>
          <sphereGeometry args={[VENT_BRANCH_RADIUS * 1.06, 20, 20]} />
        </mesh>

        {/* Conduit transversal (axe Z, parallèle au mur cuisine-ouest) */}
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

        {/* Sortie Sud (Z = +KITCHEN_DOUBLE_OUTLET_LEN) avec collerette de raccordement flexible */}
        <group position={[0, 0, KITCHEN_DOUBLE_OUTLET_LEN]} rotation-x={Math.PI / 2} userData={{ itemName: 'Raccord flexible aération Sud' }}>
          <mesh material={ventMat}>
            <cylinderGeometry args={[VENT_BRANCH_RADIUS + 0.3, VENT_BRANCH_RADIUS + 0.3, 2.0, 24]} />
          </mesh>
          {/* Collier serflex inox de serrage du flexible */}
          <mesh position={[0, 0.8, 0]} material={clampMat}>
            <cylinderGeometry args={[VENT_BRANCH_RADIUS + 0.5, VENT_BRANCH_RADIUS + 0.5, 0.8, 24]} />
          </mesh>
        </group>
      </group>

      {/* =================================================================== */}
      {/* 2. GAINE FLEXIBLE DE HOTTE ASPIRANTE                                */}
      {/* =================================================================== */}
      <mesh
        geometry={flexTubeGeo}
        material={flexMat}
        castShadow
        receiveShadow
        userData={{ itemName: 'Gaine flexible hotte aspirante' }}
      />

      {/* Collerette et collier de serrage sur la buse supérieure de la hotte */}
      <group position={[HOOD_X, HOOD_COLLAR_Y + 1.0, HOOD_COLLAR_Z]} userData={{ itemName: 'Raccord hotte UTDRAG' }}>
        <mesh material={ventMat}>
          <cylinderGeometry args={[FLEX_RADIUS + 0.4, FLEX_RADIUS + 0.4, 2.5, 24]} />
        </mesh>
        {/* Collier serflex inox */}
        <mesh position={[0, 0.5, 0]} material={clampMat}>
          <cylinderGeometry args={[FLEX_RADIUS + 0.6, FLEX_RADIUS + 0.6, 0.8, 24]} />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* 3. TUBE D'ÉVACUATION DES EAUX USÉES (COLONNE DE CHUTE)              */}
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

      {/* Manchons d'emboîtement le long de la colonne */}
      {[Y_FLOOR + 28, 135, Y_CEILING - 10, Y_FLOOR_ABOVE - 3].map((y) => (
        <mesh key={`sleeve-${y}`} position={[0, y, DRAIN_OFFSET_Z]} material={drainMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.7, DRAIN_RADIUS + 0.4, 7, 32]} />
        </mesh>
      ))}

      {/* Colliers métalliques de fixation murale de la colonne */}
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

      {/* ── Évacuation WC peinte en BLANC dans la partie visible SDB ─────────── */}
      {/* 1. Manchette d'évacuation étanche peinte en blanc à l'arrière de la cuvette avec joint noir vertical */}
      <group position={[WC_X, WC_AXIS_Y, WC_WALL_RUN_Z + 2.4]} rotation-x={Math.PI / 2} userData={{ itemName: 'Manchette évacuation WC' }}>
        <mesh material={drainWhiteMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.4, DRAIN_RADIUS + 0.4, 4.8, 24]} />
        </mesh>
        {/* Joint noir vertical enserrant la manchette horizontale */}
        <mesh position={[0, 1.0, 0]} material={gasketMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.7, DRAIN_RADIUS + 0.7, 0.9, 24]} />
        </mesh>
      </group>

      {/* 2. Coude de sortie de cuvette à 90° en blanc (le long du mur SDB-Nord) */}
      <mesh position={[WC_X, WC_AXIS_Y, WC_WALL_RUN_Z]} material={drainWhiteMat}>
        <sphereGeometry args={[DRAIN_RADIUS * 1.06, 20, 20]} />
      </mesh>

      {/* 3. Tronçon visible peint en BLANC longeant le mur SDB-Nord (de X = 36 vers X = 0) */}
      <mesh
        position={[wcRunAlongWallLen / 2, (WC_AXIS_Y + WC_ELBOW_Y) / 2, WC_WALL_RUN_Z]}
        rotation-z={Math.PI / 2}
        material={drainWhiteMat}
        castShadow
        receiveShadow
        userData={{ itemName: 'Tuyau évacuation WC blanc longeant mur SDB-Nord' }}
      >
        <cylinderGeometry args={[DRAIN_RADIUS, DRAIN_RADIUS, wcRunAlongWallLen, 24]} />
      </mesh>

      {/* Colliers de fixation muraux peints en blanc le long du mur SDB-Nord */}
      {[10, 26].map((x) => (
        <group key={`wc-wall-clamp-${x}`} position={[x, (WC_AXIS_Y + WC_ELBOW_Y) / 2, WC_WALL_RUN_Z]}>
          <mesh material={clampWhiteMat}>
            <cylinderGeometry args={[DRAIN_RADIUS + 0.4, DRAIN_RADIUS + 0.4, 2.0, 24]} />
          </mesh>
          <mesh position={[0, 0, -DRAIN_RADIUS - 0.5]} material={clampWhiteMat}>
            <boxGeometry args={[2.0, 2.0, 1.2]} />
          </mesh>
        </group>
      ))}

      {/* 4. Coude à 90° à X = 0 en blanc tournant vers le Nord */}
      <mesh position={[0, WC_ELBOW_Y, WC_WALL_RUN_Z]} material={drainWhiteMat}>
        <sphereGeometry args={[DRAIN_RADIUS * 1.08, 20, 20]} />
      </mesh>

      {/* 5. Partie visible en blanc entre le coude et le mur SDB-Nord (Z = SDB_WALL_Z) */}
      <mesh
        position={[0, WC_ELBOW_Y, (WC_WALL_RUN_Z + SDB_WALL_Z) / 2]}
        rotation-x={Math.PI / 2}
        material={drainWhiteMat}
        castShadow
        receiveShadow
        userData={{ itemName: 'Raccord évacuation WC blanc traversée mur' }}
      >
        <cylinderGeometry args={[DRAIN_RADIUS, DRAIN_RADIUS, wcThroughWallLenSDB, 24]} />
      </mesh>

      {/* 6. Partie dans la gaine technique (en PVC gris standard) traversant vers la colonne */}
      <mesh
        position={[0, (WC_ELBOW_Y + WC_JUNCTION_Y) / 2, (SDB_WALL_Z + DRAIN_OFFSET_Z) / 2]}
        rotation-x={Math.PI / 2}
        material={drainMat}
        castShadow
        receiveShadow
        userData={{ itemName: 'Tuyau évacuation dans gaine vers colonne générale' }}
      >
        <cylinderGeometry args={[DRAIN_RADIUS, DRAIN_RADIUS, wcThroughWallLenGaine, 24]} />
      </mesh>

      {/* 7. Culotte de raccordement sur la colonne de chute générale dans la gaine */}
      <group position={[0, WC_JUNCTION_Y, DRAIN_OFFSET_Z]} userData={{ itemName: 'Culotte de raccordement colonne générale' }}>
        <mesh material={drainMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.8, DRAIN_RADIUS + 0.8, 12, 32]} />
        </mesh>
        <mesh position={[0, 0, DRAIN_RADIUS * 0.7]} material={drainMat}>
          <sphereGeometry args={[DRAIN_RADIUS * 1.05, 20, 20]} />
        </mesh>
      </group>
    </group>
  );
}
