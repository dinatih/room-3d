import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function GlobalSkeletonHelpers({ show }: { show: boolean }) {
  const { scene } = useThree();
  const helpersRef = useRef<Map<THREE.SkinnedMesh, THREE.SkeletonHelper>>(new Map());

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
      const currentMeshes = new Set<THREE.SkinnedMesh>();
      
      scene.traverse((child) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          const skinnedMesh = child as THREE.SkinnedMesh;
          currentMeshes.add(skinnedMesh);
        }
      });

      // Add helpers for new meshes
      currentMeshes.forEach(mesh => {
        if (!helpersRef.current.has(mesh)) {
          // Find a suitable parent to attach the helper to.
          // SkeletonHelper draws vertices in world space of the bones, relative to the helper's world space.
          // In Three.js, adding it to the scene works well because it overrides updateMatrixWorld to copy the root's matrixWorld.
          const helper = new THREE.SkeletonHelper(mesh);
          // R3F scene is the root.
          scene.add(helper);
          helpersRef.current.set(mesh, helper);
        }
      });

      // Remove helpers for meshes that no longer exist
      helpersRef.current.forEach((helper, mesh) => {
        if (!currentMeshes.has(mesh) || !mesh.parent) {
          helper.removeFromParent();
          helper.dispose();
          helpersRef.current.delete(mesh);
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
