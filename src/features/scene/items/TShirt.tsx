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

  // Géométrie principale du T-shirt (corps, épaules et manches courtes)
  const bodyGeometry = useMemo(() => {
    const shape = new THREE.Shape();

    // Encolure droite
    shape.moveTo(5.5, 13.5);

    // Épaule droite (pente suivant le profil du cintre Spruttig)
    shape.lineTo(19.0, 4.5);

    // Haut de la manche droite
    shape.lineTo(25.5, -1.0);

    // Ourlet de la manche droite
    shape.lineTo(22.0, -7.5);

    // Aisselle droite
    shape.lineTo(18.5, -5.5);

    // Côté droit du buste
    shape.lineTo(18.5, -42.0);

    // Ourlet bas avec léger arrondi naturel
    shape.quadraticCurveTo(0, -42.8, -18.5, -42.0);

    // Côté gauche du buste
    shape.lineTo(-18.5, -5.5);

    // Aisselle gauche et ourlet manche gauche
    shape.lineTo(-22.0, -7.5);

    // Haut de la manche gauche
    shape.lineTo(-25.5, -1.0);

    // Épaule gauche
    shape.lineTo(-19.0, 4.5);
    shape.lineTo(-5.5, 13.5);

    // Échancrure du col ras-du-cou laissant passer le crochet du cintre
    shape.quadraticCurveTo(0, 9.5, 5.5, 13.5);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 2.0,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.35,
      bevelThickness: 0.35,
    });
    // Centrer en Z
    geom.translate(0, 0, -1.0);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Géométrie du col côtelé arrondi (ribbed crewneck)
  const collarGeometry = useMemo(() => {
    const collarPoints = [
      new THREE.Vector3(-5.5, 13.5, 0),
      new THREE.Vector3(-3.0, 10.5, 0.35),
      new THREE.Vector3(0, 9.5, 0.45),
      new THREE.Vector3(3.0, 10.5, 0.35),
      new THREE.Vector3(5.5, 13.5, 0),
      new THREE.Vector3(3.0, 13.5, -0.35),
      new THREE.Vector3(0, 13.2, -0.45),
      new THREE.Vector3(-3.0, 13.5, -0.35),
    ];
    const curve = new THREE.CatmullRomCurve3(collarPoints, true);
    return new THREE.TubeGeometry(curve, 32, 0.38, 8, true);
  }, []);

  // Matériaux du tissu
  const fabricMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: currentColor,
      roughness: 0.88,
      metalness: 0.04,
    });
  }, [currentColor]);

  const collarMaterial = useMemo(() => {
    const base = new THREE.Color(currentColor);
    // Légèrement plus sombre pour l'effet de bord-côte
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
  }, [onSize, bodyGeometry]);

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
      {/* Corps principal extrudé avec biseaux */}
      <mesh
        geometry={bodyGeometry}
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

      {/* Ourlet du bas */}
      <mesh
        position={[0, -41.2, 0]}
        material={collarMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[37.2, 1.6, 2.78]} />
      </mesh>

      {/* Ourlet manche droite */}
      <mesh
        position={[23.6, -4.5, 0]}
        rotation={[0, 0, -1.0]}
        material={collarMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.5, 7.5, 2.78]} />
      </mesh>

      {/* Ourlet manche gauche */}
      <mesh
        position={[-23.6, -4.5, 0]}
        rotation={[0, 0, 1.0]}
        material={collarMaterial}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.5, 7.5, 2.78]} />
      </mesh>

      {/* Étiquette d'entretien intérieure au col */}
      <mesh
        position={[0, 12.6, -1.05]}
        material={labelMaterial}
        castShadow
      >
        <boxGeometry args={[2.0, 2.2, 0.05]} />
      </mesh>
    </group>
  );
}
