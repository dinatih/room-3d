import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useLayoutEffect } from 'react';

export function SkySphere() {
  const { scene } = useGLTF('/media/sky_sphere.glb');

  useLayoutEffect(() => {
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        // Make sure it doesn't cast shadows
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (mesh.material) {
           (mesh.material as THREE.MeshStandardMaterial).side = THREE.BackSide;
           (mesh.material as THREE.MeshStandardMaterial).depthWrite = false;
           // If it's too dark or bright, maybe use MeshBasicMaterial
           const basicMat = new THREE.MeshBasicMaterial({
               map: (mesh.material as THREE.MeshStandardMaterial).map,
               side: THREE.BackSide,
               depthWrite: false,
               fog: false
           });
           mesh.material = basicMat;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={[500, 500, 500]} position={[0, -100, 0]} />;
}

useGLTF.preload('/media/sky_sphere.glb');
