/**
 * BuildingPipes.tsx — Tuyaux techniques communs de l'immeuble :
 * 1. Tuyau d'aération / ventilation commun aux étages au-dessus :
 *    - Démarre au sol de l'étage supérieur (Y = 270 cm)
 *    - Descend dans la gaine jusqu'à 20 cm sous le plafond (Y = 230 cm)
 *    - Se sépare en 2 branches à Y = 230 cm : une vers la SDB (+Z), une vers la cuisine (+X)
 * 2. Tube vertical d'évacuation des eaux usées :
 *    - Situé à côté du tube d'aération dans la gaine
 *    - Colonne de chute continue du sol supérieur (Y = 270 cm) jusqu'au sol (Y = 0 cm)
 *    - Équipé de manchons, colliers de fixation et tampon de visite
 *
 * Coordonnées locales :
 *   Base au sol (Y = 0), centré en X/Z sur l'axe du tuyau d'aération.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { WALL_H } from '../wallData';

// Constantes de hauteur (cm)
const CEIL_THICK = 20; // épaisseur dalle plafond
const Y_FLOOR_ABOVE = WALL_H + CEIL_THICK; // 270 cm — niveau sol de l'étage au-dessus
const Y_CEILING = WALL_H; // 250 cm — sous-face du plafond
const Y_VENT_SPLIT = WALL_H - 20; // 230 cm — séparation à 20 cm sous le plafond
const Y_FLOOR = 0; // sol appartement

// Diamètres et rayons (cm)
const VENT_RADIUS = 6.0; // Ø12 cm — colonne aération VMC collective
const VENT_BRANCH_RADIUS = 5.0; // Ø10 cm — piquages vers pièces
const DRAIN_RADIUS = 5.5; // Ø11 cm — colonne de chute eaux usées standard
const DRAIN_OFFSET_Z = -22; // décalage du tube d'eaux usées à côté de l'aération

// Longueurs des branches horizontales depuis l'axe vertical (cm)
const SDB_BRANCH_LEN = 45; // vers la SDB (+Z)
const KITCHEN_BRANCH_LEN = 45; // vers la cuisine (+X)

export function BuildingPipes({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    // Encombrement approximatif : X=[-VENT_RADIUS, KITCHEN_BRANCH_LEN], Y=[0, Y_FLOOR_ABOVE], Z=[DRAIN_OFFSET_Z - DRAIN_RADIUS, SDB_BRANCH_LEN]
    const size = new THREE.Vector3(
      KITCHEN_BRANCH_LEN + VENT_RADIUS,
      Y_FLOOR_ABOVE,
      SDB_BRANCH_LEN - (DRAIN_OFFSET_Z - DRAIN_RADIUS)
    );
    onSize(size);
  }, [onSize]);

  // Matériaux PBR réutilisables
  const { ventMat, ventGrilleMat, drainMat, clampMat } = useMemo(() => {
    return {
      ventMat: new THREE.MeshStandardMaterial({
        color: 0xb5bec8,
        roughness: 0.35,
        metalness: 0.65,
      }),
      ventGrilleMat: new THREE.MeshStandardMaterial({
        color: 0xefefef,
        roughness: 0.5,
        metalness: 0.1,
      }),
      drainMat: new THREE.MeshStandardMaterial({
        color: 0x525861,
        roughness: 0.45,
        metalness: 0.15,
      }),
      clampMat: new THREE.MeshStandardMaterial({
        color: 0x2b2e33,
        roughness: 0.3,
        metalness: 0.8,
      }),
    };
  }, []);

  const ventTrunkHeight = Y_FLOOR_ABOVE - Y_VENT_SPLIT; // 40 cm
  const ventTrunkCenterY = Y_VENT_SPLIT + ventTrunkHeight / 2; // 250 cm

  const drainHeight = Y_FLOOR_ABOVE - Y_FLOOR + 10; // 280 cm (déborde un peu sous le sol)
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

      {/* Collerette / bague d'étanchéité au passage de dalle supérieure (Y = 270) */}
      <mesh position={[0, Y_FLOOR_ABOVE - 2, 0]} material={clampMat}>
        <cylinderGeometry args={[VENT_RADIUS + 0.8, VENT_RADIUS + 0.8, 4, 32]} />
      </mesh>

      {/* Raccord de dérivation / culotte à Y = 230 */}
      <mesh position={[0, Y_VENT_SPLIT, 0]} material={ventMat}>
        <sphereGeometry args={[VENT_RADIUS * 1.08, 24, 24]} />
      </mesh>

      {/* Branche Aération -> Salle de Bain (orientée le long de +Z) */}
      <group position={[0, Y_VENT_SPLIT, SDB_BRANCH_LEN / 2]}>
        <mesh rotation-x={Math.PI / 2} material={ventMat} castShadow receiveShadow>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS, VENT_BRANCH_RADIUS, SDB_BRANCH_LEN, 24]} />
        </mesh>
      </group>

      {/* Bouche d'extraction VMC / grille SDB (au bout de la branche SDB à Z = SDB_BRANCH_LEN) */}
      <group position={[0, Y_VENT_SPLIT, SDB_BRANCH_LEN]} rotation-x={Math.PI / 2}>
        {/* Collerette blanche */}
        <mesh material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS + 1.2, VENT_BRANCH_RADIUS + 1.2, 1.5, 24]} />
        </mesh>
        {/* Disque central obturateur réglable VMC */}
        <mesh position={[0, 1.2, 0]} material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS - 0.5, VENT_BRANCH_RADIUS - 0.5, 0.8, 24]} />
        </mesh>
      </group>

      {/* Branche Aération -> Cuisine (orientée le long de +X) */}
      <group position={[KITCHEN_BRANCH_LEN / 2, Y_VENT_SPLIT, 0]}>
        <mesh rotation-z={Math.PI / 2} material={ventMat} castShadow receiveShadow>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS, VENT_BRANCH_RADIUS, KITCHEN_BRANCH_LEN, 24]} />
        </mesh>
      </group>

      {/* Bouche d'extraction VMC / grille Cuisine (au bout de la branche Cuisine à X = KITCHEN_BRANCH_LEN) */}
      <group position={[KITCHEN_BRANCH_LEN, Y_VENT_SPLIT, 0]} rotation-z={-Math.PI / 2}>
        {/* Collerette blanche */}
        <mesh material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS + 1.2, VENT_BRANCH_RADIUS + 1.2, 1.5, 24]} />
        </mesh>
        {/* Disque central obturateur réglable VMC */}
        <mesh position={[0, 1.2, 0]} material={ventGrilleMat}>
          <cylinderGeometry args={[VENT_BRANCH_RADIUS - 0.5, VENT_BRANCH_RADIUS - 0.5, 0.8, 24]} />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* 2. TUBE D'ÉVACUATION DES EAUX USÉES (COLONNE DE CHUTE)              */}
      {/* =================================================================== */}
      {/* Colonne verticale continue de Y = 270 jusqu'à Y = -10 (à côté de l'aération) */}
      <mesh
        position={[0, drainCenterY, DRAIN_OFFSET_Z]}
        material={drainMat}
        castShadow
        receiveShadow
        userData={{ itemName: "Colonne de chute eaux usées" }}
      >
        <cylinderGeometry args={[DRAIN_RADIUS, DRAIN_RADIUS, drainHeight, 32]} />
      </mesh>

      {/* Manchons d'emboîtement à lèvres (socket joints) */}
      {[Y_FLOOR + 25, 135, Y_CEILING - 10, Y_FLOOR_ABOVE - 3].map((y) => (
        <mesh key={`sleeve-${y}`} position={[0, y, DRAIN_OFFSET_Z]} material={drainMat}>
          <cylinderGeometry args={[DRAIN_RADIUS + 0.7, DRAIN_RADIUS + 0.4, 7, 32]} />
        </mesh>
      ))}

      {/* Colliers métalliques de serrage mural avec platine de fixation */}
      {[45, 120, 205].map((y) => (
        <group key={`clamp-${y}`} position={[0, y, DRAIN_OFFSET_Z]}>
          {/* Anneau de serrage */}
          <mesh material={clampMat}>
            <cylinderGeometry args={[DRAIN_RADIUS + 0.6, DRAIN_RADIUS + 0.6, 2.5, 24]} />
          </mesh>
          {/* Patte de fixation murale vers le mur Ouest (-X) */}
          <mesh position={[-DRAIN_RADIUS - 3.5, 0, 0]} material={clampMat}>
            <boxGeometry args={[7, 2, 2.5]} />
          </mesh>
        </group>
      ))}

      {/* Tampon de visite à vis étanche pour tringlage / curage (à Y = 60 cm) */}
      <group position={[0, 60, DRAIN_OFFSET_Z]}>
        {/* Embranchement court à 45° vers +Z */}
        <mesh position={[0, 0, DRAIN_RADIUS + 2.5]} rotation-x={Math.PI / 4} material={drainMat}>
          <cylinderGeometry args={[3.5, 3.5, 5, 20]} />
        </mesh>
        {/* Bouchon à vis avec prise carrée */}
        <mesh position={[0, 1.8, DRAIN_RADIUS + 4.3]} rotation-x={Math.PI / 4} material={clampMat}>
          <cylinderGeometry args={[4.0, 4.0, 1.5, 20]} />
        </mesh>
      </group>
    </group>
  );
}
