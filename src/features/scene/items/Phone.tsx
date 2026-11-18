/**
 * Phone.tsx — Xiaomi 17 Pro Max (items/xiaomi-phone/xiaomi-phone.glb).
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneModelProps } from '@shared/types';
import { useSceneGlass } from '../utils/useSceneGlass';

const TARGET_D = 16.2; // longueur du téléphone (cm)

const redPhoneMat = new THREE.MeshStandardMaterial({ color: 0xcc1500, roughness: 0.3, metalness: 0.15 });
// Fond d'écran : l'affiche recadrée « cover » sur l'écran (rapport ≈ 0,457) ; l'écran émet sa propre lumière.
const SCREEN_ASPECT = 221.16 / 484.41;
const WALLPAPER_ASPECT = 1493 / 2000;
const glassMat    = new THREE.MeshPhysicalMaterial({ 
  color: 0x111111, transparent: true, opacity: 0.4, 
  roughness: 0.05, metalness: 0.1, transmission: 0.5 
});

export function Phone({ onSize }: SceneModelProps) {
  const { scene: gltfScene } = useGLTF('items/xiaomi-phone/xiaomi-phone.glb');
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);
  const wallpaper = useTexture('media/photos/hug-life-vi.jpg', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(SCREEN_ASPECT / WALLPAPER_ASPECT, 1);
    texture.offset.set((1 - texture.repeat.x) / 2, 0);
  });
  const displayMat = useMemo(() => new THREE.MeshBasicMaterial({ map: wallpaper, toneMapped: false }), [wallpaper]);

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
        if (m.name === 'Display') {
          // Le plan d'écran du GLB n'a pas d'UV : projection planaire sur sa boîte englobante.
          const geometry = mesh.geometry;
          if (!geometry.attributes.uv) {
            geometry.computeBoundingBox();
            const { min, max } = geometry.boundingBox!;
            const position = geometry.attributes.position;
            const uv = new Float32Array(position.count * 2);
            for (let i = 0; i < position.count; i++) {
              uv[i * 2] = (position.getX(i) - min.x) / (max.x - min.x);
              uv[i * 2 + 1] = (position.getY(i) - min.y) / (max.y - min.y);
            }
            geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
          }
          return displayMat;
        }
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
    onSize?.(size);
  }, [scene, displayMat]);

  useSceneGlass(scene);

  return (
    <group userData={{ hoverAction: { label: 'Xiaomi 17 Pro Max' } }}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('items/xiaomi-phone/xiaomi-phone.glb');
