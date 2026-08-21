/**
 * JblCharge3.tsx — Enceinte JBL Charge 3 (items/jbl-charge3/jbl-charge3.glb).
 * Ø 8.7 cm × 17.5 cm. Orientée à la verticale par défaut.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 17.5; // hauteur debout (cm)

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc1500, roughness: 0.35, metalness: 0.1 });

export function JblCharge3({ onSize }: SceneItemProps) {
  const { scene: gltfScene } = useGLTF('items/jbl-charge3/jbl-charge3.glb');
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    // Peindre tout en rouge
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) mesh.material = redMat;
    });
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    // Le GLB est probablement couché (axe long = X ou Z) : on scale sur l'axe long
    const longestRaw = Math.max(raw.x, raw.y, raw.z);
    scene.scale.setScalar(TARGET_H / longestRaw);
    // Rotation pour mettre debout : si l'axe long est X, on tourne -90° sur Z
    if (raw.x >= raw.y && raw.x >= raw.z) {
      scene.rotation.set(0, 0, -Math.PI / 2);
    } else if (raw.z >= raw.x && raw.z >= raw.y) {
      scene.rotation.set(Math.PI / 2, 0, 0);
    }
    // si déjà vertical (raw.y le plus grand) : pas de rotation
    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(size);
  }, [scene]);

  return (
    <group userData={{ hoverAction: { label: 'Enceinte JBL Charge 3' } }}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('items/jbl-charge3/jbl-charge3.glb');
