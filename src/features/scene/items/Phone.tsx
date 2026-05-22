/**
 * Phone.tsx — Xiaomi 17 Pro Max (media/free_xiaomi_17_pro_max.glb).
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_D = 16.2; // longueur du téléphone (cm)

const redPhoneMat = new THREE.MeshStandardMaterial({ color: 0xcc1500, roughness: 0.3, metalness: 0.15 });

export function Phone({ onSize }: SceneItemProps) {
  const { scene: gltfScene } = useGLTF('media/free_xiaomi_17_pro_max.glb');
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    // Peindre uniquement la coque (matériau 'Main', couleur verte d'origine)
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if ((mat as THREE.Material)?.name === 'Main') mesh.material = redPhoneMat;
    });
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, 0, 0);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    // Si debout (Y long), coucher à plat d'abord
    if (raw.y >= raw.x && raw.y >= raw.z) {
      scene.rotation.set(-Math.PI / 2, 0, 0);
    }
    // Scale sur la dimension la plus longue = TARGET_D
    const longest = Math.max(raw.x, raw.y, raw.z);
    scene.scale.setScalar(TARGET_D / longest);
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
    <group userData={{ hoverAction: { label: 'Xiaomi 17 Pro Max' } }}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('media/free_xiaomi_17_pro_max.glb');
