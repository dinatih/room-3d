import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * METOD Élément mural, blanc, 40x37x100 cm
 * Price: 30 €
 * URL: https://www.ikea.com/fr/fr/p/metod-rangement-mural-blanc-50205532/
 */
export function Metod50205532({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/metod50205532/Metod50205532.glb');
  const shelfRef = useRef<THREE.Mesh>(null!);
  const dividerRef = useRef<THREE.Mesh>(null!);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.set(-Math.PI / 2, 0, 0); // Z-up GLB → debout
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    const height = box.max.y - box.min.y;
    const halfW = (box.max.x - box.min.x) / 2;
    const shelfY = height - 40;
    // Étagère à 40 cm du haut du meuble (épaisseur 1.8 cm)
    if (shelfRef.current) {
      shelfRef.current.position.set(0, shelfY, 0.5);
    }
    // Plaque / montant vertical à 11 cm du bord droit (X négatif face au meuble), du bas jusqu'à l'étagère
    if (dividerRef.current) {
      const bottomY = 1.8;
      const topY = shelfY - 0.9;
      const divHeight = topY - bottomY;
      dividerRef.current.position.set(-(halfW - 11), bottomY + divHeight / 2, 0.5);
    }
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <group {...props}>
      <primitive object={scene} />
      {/* Étagère procédurale à 40 cm du haut */}
      <mesh ref={shelfRef} position={[0, 60, 0.5]}>
        <boxGeometry args={[36.4, 1.8, 35]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Plaque / montant vertical à 11 cm du bord droit du meuble, du bas jusqu'à l'étagère */}
      <mesh ref={dividerRef} position={[-9, 30.45, 0.5]}>
        <boxGeometry args={[1.8, 57.3, 35]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.35} metalness={0.05} />
      </mesh>
    </group>
  );
}

useGLTF.preload('/items/metod50205532/Metod50205532.glb');
