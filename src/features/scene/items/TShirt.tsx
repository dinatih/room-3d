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
import { createShirtGeometry, SHIRT_HALF_DEPTH as HALF_D } from './shirtGeometry';
import { glbLocalBBox } from '../glbUtils';
import type { ThreeElements } from '@react-three/fiber';
import type { SceneItemProps } from '@shared/types';

export type TShirtProps = Partial<SceneItemProps> & ThreeElements['group'] & {
  color?: string | number;
}

export function TShirt({
  color = '#181818',
  onSize,
  ...props
}: TShirtProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [currentColor, setCurrentColor] = useState<string | number>(color);

  const { frontGeometry, backGeometry, sideGeometry, collarGeometry } = useMemo(() => createShirtGeometry(.32), []);

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
    onSize?.(glbLocalBBox(groupRef.current).getSize(new THREE.Vector3()));
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
      userData={{ sceneItemRoot: true, itemName: 'T-shirt basique' }}
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
