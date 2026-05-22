/**
 * VacuumCleaner.tsx — Rowenta X-Force Flex RH2079WO (112×24.8×23.4 cm).
 * GLB toon style, rouge. Coordonnées locales : X/Z centrés, Y=0 = sol.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 112;

const redOpaqueMat = new THREE.MeshStandardMaterial({ color: 0xcc1500, roughness: 0.35, metalness: 0.1 });

export function VacuumCleaner({ onSize }: SceneItemProps) {
  const { scene: gltfScene } = useGLTF('media/toon_-_vacuum_cleaner.glb');
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    // Peindre tout en rouge — parties transparentes gardent leur opacité
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material)
        ? (mesh.material as THREE.Material[])
        : [mesh.material as THREE.Material];
      const newMats = mats.map(m => {
        const mat = m as THREE.MeshStandardMaterial;
        if (mat.transparent && mat.opacity < 1) {
          return new THREE.MeshStandardMaterial({
            color: 0xcc1500, transparent: true, opacity: mat.opacity,
            roughness: 0.1, metalness: 0.1,
          });
        }
        return redOpaqueMat;
      });
      mesh.material = Array.isArray(mesh.material) ? newMats : newMats[0];
    });
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    // Orient vertical: if Y not the longest axis, rotate accordingly
    const longestAxis = raw.x >= raw.y && raw.x >= raw.z ? 'x'
                      : raw.z >= raw.y && raw.z >= raw.x ? 'z'
                      : 'y';
    if (longestAxis === 'x') scene.rotation.set(0, 0, -Math.PI / 2);
    else if (longestAxis === 'z') scene.rotation.set(-Math.PI / 2, 0, 0);

    const longest = Math.max(raw.x, raw.y, raw.z);
    scene.scale.setScalar(TARGET_H / longest);

    const box  = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(size);
  }, [scene]);

  return (
    <group userData={{ hoverAction: { label: 'Aspirateur Rowenta RH2079WO' } }}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('media/toon_-_vacuum_cleaner.glb');
