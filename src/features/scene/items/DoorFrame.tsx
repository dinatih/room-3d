import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { SceneItemProps } from '@shared/types';

const H = 204; // Hauteur passage libre (cm)

export function DoorFrame({ onSize, width: W = 83, wallThickness = 7.2, twoTone = false }: SceneItemProps & { width?: number; wallThickness?: number; twoTone?: boolean }) {
  const innerDepth = wallThickness / 2;
  const outerDepth = innerDepth + 1;
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W + 5, H + 1, wallThickness + 2));
  }, [onSize, W, wallThickness]);

  // Profil du dormant gauche d'après le schéma de conception
  const leftFrameShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Coordonnées de section en centimètres, centrées sur l'épaisseur du mur (Z)
    // u (X du profil) = épaisseur, v (Y du profil) = butée/feuillure
    shape.moveTo(-outerDepth, 3.0);  // Pointe recouvrement gauche (lip 3cm)
    shape.lineTo(-innerDepth, 3.0);  // Intérieur lip gauche (épaisseur lip 1cm)
    shape.lineTo(-innerDepth, 0);    // Assise mur, face arrière
    shape.lineTo(innerDepth, 0);     // Assise mur, face avant
    shape.lineTo(innerDepth, 3.0);    // Intérieur lip droite (recouvrement 3cm)
    shape.lineTo(outerDepth, 3.0);    // Pointe recouvrement droite (épaisseur lip 1cm)
    shape.lineTo(outerDepth, -1.0);   // Face inférieure droite (dormant épaisseur 1cm)
    shape.lineTo(-0.2, -1.0);  // Début de la butée
    shape.lineTo(-0.2, -2.8);  // Fond de butée (profondeur 1.8cm, largeur 1.8cm)
    shape.lineTo(-2.0, -2.8);  // Fond de butée
    shape.lineTo(-2.0, -1.0);  // Début de la butée
    shape.lineTo(-outerDepth, -1.0);  // Face inférieure gauche
    shape.closePath();
    return shape;
  }, [innerDepth, outerDepth]);

  // Profil du dormant droit (miroité par rapport à l'axe Z)
  const rightFrameShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Coordonnées de section en centimètres, avec u (X) miroité (u -> -u)
    shape.moveTo(outerDepth, 3.0);    // Miroir de (-outerDepth, 3.0)
    shape.lineTo(outerDepth, -1.0);   // Miroir de (-outerDepth, -1.0)
    shape.lineTo(2.0, -1.0);   // Miroir de (-2.0, -1.0)
    shape.lineTo(2.0, -2.8);   // Miroir de (-2.0, -2.8)
    shape.lineTo(0.2, -2.8);   // Miroir de (-0.2, -2.8)
    shape.lineTo(0.2, -1.0);   // Miroir de (-0.2, -1.0)
    shape.lineTo(-outerDepth, -1.0);  // Miroir de (outerDepth, -1.0)
    shape.lineTo(-outerDepth, 3.0);   // Miroir de (outerDepth, 3.0)
    shape.lineTo(-innerDepth, 3.0);   // Miroir de (innerDepth, 3.0)
    shape.lineTo(-innerDepth, 0);     // Miroir de (innerDepth, 0)
    shape.lineTo(innerDepth, 0);      // Miroir de (-innerDepth, 0)
    shape.lineTo(innerDepth, 3.0);    // Miroir de (-innerDepth, 3.0)
    shape.closePath();
    return shape;
  }, [innerDepth, outerDepth]);

  const [leftJambGeo, rightJambGeo, headerGeo] = useMemo(() => {
    const extrude = (shape: THREE.Shape, depth: number, side: number) => {
      if (!twoTone) return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      // Coupe réelle du profil à mi-épaisseur pour une séparation nette des peintures.
      const points = shape.getPoints();
      const halves = [side, -side].map(sign => {
        const clipped: THREE.Vector2[] = [];
        points.forEach((point, index) => {
          const next = points[(index + 1) % points.length];
          if (point.x * sign >= 0) clipped.push(point);
          if (point.x * next.x < 0) clipped.push(new THREE.Vector2(0,
            point.y + (next.y - point.y) * -point.x / (next.x - point.x)));
        });
        return new THREE.ExtrudeGeometry(new THREE.Shape(clipped), { depth, bevelEnabled: false });
      });
      const geometry = mergeGeometries(halves, true)!;
      halves.forEach(half => half.dispose());
      return geometry;
    };
    return [extrude(leftFrameShape, H, 1), extrude(rightFrameShape, H, -1), extrude(leftFrameShape, W, 1)];
  }, [leftFrameShape, rightFrameShape, W, twoTone]);

  const material = twoTone ? <>
    <meshStandardMaterial attach="material-0" color="#cc0000" roughness={0.4} envMapIntensity={0.5} />
    <meshStandardMaterial attach="material-1" color="#f5f4f0" roughness={0.4} envMapIntensity={0.5} />
  </> : <meshStandardMaterial color="#f5f4f0" roughness={0.4} envMapIntensity={0.5} />;

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

export function DoorEntryFrame(props: SceneItemProps) {
  return <DoorFrame {...props} width={90} wallThickness={10} twoTone />;
}
