/**
 * Phone.tsx — Xiaomi 17 Pro Max (items/xiaomi-phone/model.glb).
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_D = 16.2; // longueur du téléphone (cm)

const redPhoneMat = new THREE.MeshStandardMaterial({ color: 0xcc1500, roughness: 0.3, metalness: 0.15 });
const displayMat  = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.2, metalness: 0.4 });
const glassMat    = new THREE.MeshPhysicalMaterial({ 
  color: 0x111111, transparent: true, opacity: 0.4, 
  roughness: 0.05, metalness: 0.1, transmission: 0.5 
});

export function Phone({ onSize }: SceneItemProps) {
  const { scene: gltfScene } = useGLTF('items/xiaomi-phone/model.glb');
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    // Overrides matériaux pour éviter l'écran blanc
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      
      const newMaterials = materials.map(mat => {
        const m = mat as THREE.Material;
        if (m.name === 'Main')    return redPhoneMat;
        if (m.name === 'Display') return displayMat;
        if (m.name === 'glass')   return glassMat;
        return m;
      });
      
      mesh.material = Array.isArray(mesh.material) ? newMaterials : newMaterials[0];
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

useGLTF.preload('items/xiaomi-phone/model.glb');
