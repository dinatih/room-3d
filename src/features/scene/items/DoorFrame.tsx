import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const W = 83;  // Largeur passage libre (cm)
const H = 204; // Hauteur passage libre (cm)

export function DoorFrame({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    // Dimensions hors-tout pour l'inventaire :
    // Largeur = 83 + 2.5 * 2 = 88 cm
    // Hauteur = 204 + 1.0 (traverse haute) = 205 cm
    // Profondeur = 9.2 cm (total dormant)
    onSize(new THREE.Vector3(88, 205, 9.2));
  }, [onSize]);

  // Profil du dormant gauche d'après le schéma de conception
  const leftFrameShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Coordonnées de section en centimètres, centrées sur l'épaisseur du mur (Z)
    // u (X du profil) = épaisseur, v (Y du profil) = butée/feuillure
    shape.moveTo(-4.6, 3.0);  // Pointe recouvrement gauche (lip 3cm)
    shape.lineTo(-3.6, 3.0);  // Intérieur lip gauche (épaisseur lip 1cm)
    shape.lineTo(-3.6, 0);    // Assise mur (Z = -3.6)
    shape.lineTo(3.6, 0);     // Assise mur (Z = 3.6) (mur épaisseur = 7.2cm)
    shape.lineTo(3.6, 3.0);    // Intérieur lip droite (recouvrement 3cm)
    shape.lineTo(4.6, 3.0);    // Pointe recouvrement droite (épaisseur lip 1cm)
    shape.lineTo(4.6, -1.0);   // Face inférieure droite (dormant épaisseur 1cm)
    shape.lineTo(-0.2, -1.0);  // Début de la butée
    shape.lineTo(-0.2, -2.8);  // Fond de butée (profondeur 1.8cm, largeur 1.8cm)
    shape.lineTo(-2.0, -2.8);  // Fond de butée
    shape.lineTo(-2.0, -1.0);  // Début de la butée
    shape.lineTo(-4.6, -1.0);  // Face inférieure gauche
    shape.closePath();
    return shape;
  }, []);

  // Profil du dormant droit (miroité par rapport à l'axe Z)
  const rightFrameShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Coordonnées de section en centimètres, avec u (X) miroité (u -> -u)
    shape.moveTo(4.6, 3.0);    // Miroir de (-4.6, 3.0)
    shape.lineTo(4.6, -1.0);   // Miroir de (-4.6, -1.0)
    shape.lineTo(2.0, -1.0);   // Miroir de (-2.0, -1.0)
    shape.lineTo(2.0, -2.8);   // Miroir de (-2.0, -2.8)
    shape.lineTo(0.2, -2.8);   // Miroir de (-0.2, -2.8)
    shape.lineTo(0.2, -1.0);   // Miroir de (-0.2, -1.0)
    shape.lineTo(-4.6, -1.0);  // Miroir de (4.6, -1.0)
    shape.lineTo(-4.6, 3.0);   // Miroir de (4.6, 3.0)
    shape.lineTo(-3.6, 3.0);   // Miroir de (3.6, 3.0)
    shape.lineTo(-3.6, 0);     // Miroir de (3.6, 0)
    shape.lineTo(3.6, 0);      // Miroir de (-3.6, 0)
    shape.lineTo(3.6, 3.0);    // Miroir de (-3.6, 3.0)
    shape.closePath();
    return shape;
  }, []);

  const leftJambGeo = useMemo(() => {
    return new THREE.ExtrudeGeometry(leftFrameShape, {
      depth: H,
      bevelEnabled: false,
    });
  }, [leftFrameShape]);

  const rightJambGeo = useMemo(() => {
    return new THREE.ExtrudeGeometry(rightFrameShape, {
      depth: H,
      bevelEnabled: false,
    });
  }, [rightFrameShape]);

  const headerGeo = useMemo(() => {
    return new THREE.ExtrudeGeometry(leftFrameShape, {
      depth: W,
      bevelEnabled: false,
    });
  }, [leftFrameShape]);

  const material = <meshStandardMaterial color="#f5f4f0" roughness={0.4} envMapIntensity={0.5} />;

  return (
    <group position={[0, H / 2, 0]}>
      {/* Montant Gauche */}
      <mesh
        geometry={leftJambGeo}
        position={[-W / 2, -H / 2, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        {material}
      </mesh>

      {/* Montant Droit (Miroir propre par géométrie avec rotation 180° Y pour l'orientation de l'axe u) */}
      <group position={[W / 2, -H / 2, 0]} rotation={[0, Math.PI, 0]}>
        <mesh
          geometry={rightJambGeo}
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          {material}
        </mesh>
      </group>

      {/* Traverse Haute */}
      <mesh
        geometry={headerGeo}
        position={[-W / 2, H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        {material}
      </mesh>
    </group>
  );
}
