import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { WALL_H } from '../wallData';

interface GardenFrontWallScanProps {
  position?: [number, number, number];
  rotationY?: number;
  opacity?: number;
  userData?: Record<string, any>;
}

export function GardenFrontWallScan({
  position = [150, 0, -786.33],
  rotationY = 0,
  opacity = 0.5,
  userData,
}: GardenFrontWallScanProps) {
  const { scene } = useGLTF('/environment/before_i_die__wall_scan_in_seoul_korea.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scaleFactor = WALL_H / (size.y || 2.0);

    clone.position.set(-center.x * scaleFactor, -box.min.y * scaleFactor, -center.z * scaleFactor);
    clone.scale.setScalar(scaleFactor);

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const map = (mesh.material as any).map;
        if (map) map.colorSpace = THREE.SRGBColorSpace;

        mesh.material = new THREE.MeshStandardMaterial({
          map,
          roughness: 0.85,
          metalness: 0.05,
          side: THREE.FrontSide,
          transparent: true,
          opacity,
          depthWrite: false,
        });
      }
    });

    return clone;
  }, [scene, opacity]);

  return (
    <group
      position={position}
      rotation-y={rotationY}
      userData={{ skipMerge: true, animUnit: true, brickType: 'wall', side: 'gardenFront', ...userData }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/environment/before_i_die__wall_scan_in_seoul_korea.glb');
