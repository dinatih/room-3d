import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { WALL_H } from '@config';

interface GardenFrontWallScanProps {
  position?: [number, number, number];
  rotationY?: number;
  userData?: Record<string, any>;
}

export function GardenFrontWallScan({
  position = [150, 0, -786.33],
  rotationY = 0,
  userData,
}: GardenFrontWallScanProps) {
  const { scene } = useGLTF('/environment/before_i_die__wall_scan_in_seoul_korea.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.position.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.rotation.set(0, 0, 0);
    clone.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Échelle pour atteindre WALL_H (250 cm)
    // Le scan fait ~2.0 m de haut -> scale ~125
    const scaleFactor = WALL_H / (size.y || 2.0);

    // Ajustement de centrage en X et Z, base à Y = 0
    clone.position.set(-center.x * scaleFactor, -box.min.y * scaleFactor, -center.z * scaleFactor);
    clone.scale.set(scaleFactor, scaleFactor, scaleFactor);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Conversion en MeshStandardMaterial pour réagir à l'éclairage et aux ombres
        if (mesh.material) {
          const originalMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const map = (originalMat as any).map;
          if (map) {
            map.colorSpace = THREE.SRGBColorSpace;
            mesh.material = new THREE.MeshStandardMaterial({
              map,
              roughness: 0.85,
              metalness: 0.05,
              side: THREE.DoubleSide,
            });
          }
        }
      }
    });

    return clone;
  }, [scene]);

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
