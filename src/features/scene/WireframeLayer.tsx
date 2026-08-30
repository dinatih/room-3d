/**
 * WireframeLayer.tsx — active le mode wireframe filaire sur tous les matériaux
 * de la scène tout en conservant leurs couleurs, textures et teintes d'origine.
 */
import { useEffect } from 'react';
import { useThree }  from '@react-three/fiber';
import * as THREE    from 'three';

export function WireframeLayer() {
  const { scene, invalidate } = useThree();

  useEffect(() => {
    const alteredMaterials = new Set<THREE.Material>();

    scene.traverse(obj => {
      // Ignorer la SkySphere et les objets célestes
      let curr: THREE.Object3D | null = obj;
      while (curr) {
        if (curr.name === 'SkySphere' || curr.name === 'skysphere' || curr.userData?.isSky) return;
        curr = curr.parent;
      }

      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(mat => {
        if ('wireframe' in mat) {
          (mat as any).wireframe = true;
          mat.needsUpdate = true;
          alteredMaterials.add(mat);
        }
      });
    });

    invalidate();

    return () => {
      alteredMaterials.forEach(mat => {
        if ('wireframe' in mat) {
          (mat as any).wireframe = false;
          mat.needsUpdate = true;
        }
      });
      invalidate();
    };
  }, [scene, invalidate]);

  return null;
}
