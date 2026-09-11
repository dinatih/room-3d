/**
 * TShirt.tsx — T-shirt basique procédural.
 * Matériau tissu coton mat avec col côtelé, ourlets et étiquette.
 * Conçu pour reposer naturellement sur un cintre Spruttig (ou en pièce autonome).
 *
 * Clin d'œil historique : au tout début du projet, les vêtements procéduraux
 * étaient modélisés en rouge (#cc2020) dans buildMackapar.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { GroupProps } from '@react-three/fiber';
import type { SceneItemProps } from '@shared/types';

export interface TShirtProps extends Partial<SceneItemProps>, GroupProps {
  color?: string | number;
}

export function TShirt({
  color = '#181818',
  onSize,
  ...props
}: TShirtProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [currentColor, setCurrentColor] = useState<string | number>(color);

  // Demi-épaisseur du T-shirt
  const HALF_D = 1.0;

  // Profil du contour extérieur du T-shirt (identique pour l'avant et l'arrière)
  const perimeter = useMemo(() => [
    new THREE.Vector2(5.5, 13.5),    // 0: Encolure droite
    new THREE.Vector2(19.5, 4.5),    // 1: Pointe épaule droite
    new THREE.Vector2(26.0, 0.0),    // 2: Haut manche droite
    new THREE.Vector2(22.5, -11.0),  // 3: Bas manche droite (ouverture)
    new THREE.Vector2(18.5, -8.0),   // 4: Aisselle droite
    new THREE.Vector2(18.5, -42.0),  // 5: Bas droit
    new THREE.Vector2(0.0, -42.6),   // 6: Centre bas
    new THREE.Vector2(-18.5, -42.0), // 7: Bas gauche
    new THREE.Vector2(-18.5, -8.0),  // 8: Aisselle gauche
    new THREE.Vector2(-22.5, -11.0), // 9: Bas manche gauche (ouverture)
    new THREE.Vector2(-26.0, 0.0),   // 10: Haut manche gauche
    new THREE.Vector2(-19.5, 4.5),   // 11: Pointe épaule gauche
    new THREE.Vector2(-5.5, 13.5),   // 12: Encolure gauche
  ], []);

  // Panneau avant : échancrure de col plongeante (ras-du-cou)
  const frontGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(perimeter[0].x, perimeter[0].y);
    for (let i = 1; i < perimeter.length; i++) {
      shape.lineTo(perimeter[i].x, perimeter[i].y);
    }
    // Courbe du col avant plongeant jusqu'à Y = 9.8
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = -5.5 + 11.0 * t;
      const y = 13.5 - 3.7 * (1 - (x / 5.5) * (x / 5.5));
      shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [perimeter]);

  // Panneau arrière : échancrure de col haute (Y = 12.8) pour éviter le trou traversant
  const backGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(perimeter[0].x, perimeter[0].y);
    for (let i = 1; i < perimeter.length; i++) {
      shape.lineTo(perimeter[i].x, perimeter[i].y);
    }
    // Courbe du col arrière plus haut
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = -5.5 + 11.0 * t;
      const y = 13.5 - 0.7 * (1 - (x / 5.5) * (x / 5.5));
      shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [perimeter]);

  // Épaisseur latérale continue (épaules, manches, côtés, bas) sans aucun trou ni pièce flottante
  const sideGeometry = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i < perimeter.length; i++) {
      const p = perimeter[i];
      positions.push(p.x, p.y, HALF_D);
      positions.push(p.x, p.y, -HALF_D);
      uvs.push(i / (perimeter.length - 1), 1);
      uvs.push(i / (perimeter.length - 1), 0);
    }

    for (let i = 0; i < perimeter.length - 1; i++) {
      const a = 2 * i;
      const b = 2 * i + 1;
      const c = 2 * (i + 1);
      const d = 2 * (i + 1) + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [perimeter, HALF_D]);

  // Bord-côte du col rond bordant naturellement l'ouverture
  const collarGeometry = useMemo(() => {
    const collarPoints = [
      new THREE.Vector3(-5.5, 13.5, 0.0),
      new THREE.Vector3(-3.2, 10.8, HALF_D * 0.95),
      new THREE.Vector3(0.0, 9.8, HALF_D * 1.02),
      new THREE.Vector3(3.2, 10.8, HALF_D * 0.95),
      new THREE.Vector3(5.5, 13.5, 0.0),
      new THREE.Vector3(3.2, 13.0, -HALF_D * 0.95),
      new THREE.Vector3(0.0, 12.8, -HALF_D * 1.02),
      new THREE.Vector3(-3.2, 13.0, -HALF_D * 0.95),
    ];
    const curve = new THREE.CatmullRomCurve3(collarPoints, true);
    return new THREE.TubeGeometry(curve, 36, 0.32, 8, true);
  }, [HALF_D]);

  // Matériaux du tissu
  const fabricMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: currentColor,
      roughness: 0.88,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
  }, [currentColor]);

  const collarMaterial = useMemo(() => {
    const base = new THREE.Color(currentColor);
    base.multiplyScalar(0.85);
    return new THREE.MeshStandardMaterial({
      color: base,
      roughness: 0.95,
      metalness: 0.02,
    });
  }, [currentColor]);

  const labelMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.6,
      metalness: 0.1,
    });
  }, []);

  useLayoutEffect(() => {
    if (groupRef.current && onSize) {
      groupRef.current.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(groupRef.current);
      onSize(box.getSize(new THREE.Vector3()));
    }
  }, [onSize, frontGeometry]);

  // Clic pour basculer entre noir moderne et rouge historique du projet
  const handleToggleColor = (e: any) => {
    e.stopPropagation();
    setCurrentColor((prev) => (prev === '#181818' ? '#cc2020' : '#181818'));
  };

  return (
    <group
      ref={groupRef}
      {...props}
      onClick={handleToggleColor}
      userData={{ animUnit: true, itemName: 'T-shirt basique' }}
    >
      {/* Panneau avant */}
      <mesh
        geometry={frontGeometry}
        material={fabricMaterial}
        position={[0, 0, HALF_D]}
        castShadow
        receiveShadow
      />

      {/* Panneau arrière (tourné vers l'arrière pour fermer le volume) */}
      <mesh
        geometry={backGeometry}
        material={fabricMaterial}
        position={[0, 0, -HALF_D]}
        rotation={[0, Math.PI, 0]}
        castShadow
        receiveShadow
      />

      {/* Flancs, épaules et manches continus */}
      <mesh
        geometry={sideGeometry}
        material={fabricMaterial}
        castShadow
        receiveShadow
      />

      {/* Bord-côte du col rond */}
      <mesh
        geometry={collarGeometry}
        material={collarMaterial}
        castShadow
        receiveShadow
      />

      {/* Étiquette d'entretien cousue à l'intérieur du dos */}
      <mesh
        position={[0, 11.4, -HALF_D + 0.08]}
        material={labelMaterial}
        castShadow
      >
        <boxGeometry args={[2.0, 2.2, 0.05]} />
      </mesh>
    </group>
  );
}
