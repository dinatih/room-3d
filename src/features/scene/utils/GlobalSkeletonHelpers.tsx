import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function GlobalSkeletonHelpers({ show }: { show: boolean }) {
  const { scene } = useThree();
  const helpersRef = useRef<Map<THREE.Bone, THREE.SkeletonHelper>>(new Map());

  // Use a slow interval to detect new SkinnedMeshes instead of doing it every frame
  useEffect(() => {
    if (!show) {
      // Cleanup all helpers
      helpersRef.current.forEach((helper) => {
        helper.removeFromParent();
        helper.dispose();
      });
      helpersRef.current.clear();
      return;
    }

    const interval = setInterval(() => {
      const currentTopBones = new Set<THREE.Bone>();
      
      scene.traverse((child) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          const skinnedMesh = child as THREE.SkinnedMesh;
          // Ignorer les SkinnedMeshes masqués (ex: cheveux natifs quand une perruque est portée)
          let isVis = skinnedMesh.visible;
          let p: THREE.Object3D | null = skinnedMesh.parent;
          while (p && isVis) {
            if (!p.visible) isVis = false;
            p = p.parent;
          }
          if (!isVis) return;

          if (skinnedMesh.skeleton && skinnedMesh.skeleton.bones.length > 0) {
            let topBone = skinnedMesh.skeleton.bones[0];
            while (topBone.parent && (topBone.parent as THREE.Bone).isBone) {
              topBone = topBone.parent as THREE.Bone;
            }
            currentTopBones.add(topBone);
          }
        }
      });

      // Add helpers for new skeletons
      currentTopBones.forEach(topBone => {
        if (!helpersRef.current.has(topBone)) {
          const helper = new THREE.SkeletonHelper(topBone);
          const mat = helper.material as THREE.LineBasicMaterial;
          mat.color.set(0x00ffff);
          mat.depthTest = false;
          helper.renderOrder = 99999;
          helper.raycast = () => {};
          helper.traverse(c => { c.raycast = () => {}; });
          
          scene.add(helper);
          helpersRef.current.set(topBone, helper);
        }
      });

      // Remove helpers for skeletons that no longer exist
      helpersRef.current.forEach((helper, topBone) => {
        if (!currentTopBones.has(topBone) || !topBone.parent) {
          helper.removeFromParent();
          helper.dispose();
          helpersRef.current.delete(topBone);
        }
      });
    }, 1000); // Check every second

    return () => {
      clearInterval(interval);
      helpersRef.current.forEach((helper) => {
        helper.removeFromParent();
        helper.dispose();
      });
      helpersRef.current.clear();
    };
  }, [show, scene]);

  return null;
}
