/**
 * XRayLayer.tsx — rend les murs de la structure semi-transparents.
 * Actif quand layers.xray=true dans Studio.tsx.
 * Port du comportement x-ray de js/ui/events.js.
 */
import { useEffect } from 'react';
import { useThree }  from '@react-three/fiber';
import * as THREE    from 'three';

// @ts-ignore
import { LAYER_STRUCTURE } from '@config';

const xrayMat = new THREE.MeshPhysicalMaterial({
  color: 0x88aacc,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const savedMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

export function XRayLayer() {
  const { scene } = useThree();

  useEffect(() => {
    // Apply x-ray material to structure meshes
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Only structure layer (layer 0), skip if not tagged or already replaced
      const onLayer0 = (mesh.layers.mask & 1) !== 0;
      if (!onLayer0) return;
      if (savedMaterials.has(mesh)) return;
      savedMaterials.set(mesh, mesh.material);
      mesh.material = xrayMat;
    });

    return () => {
      // Restore original materials
      savedMaterials.forEach((mat, mesh) => { mesh.material = mat; });
      savedMaterials.clear();
    };
  }, [scene]);

  return null;
}
