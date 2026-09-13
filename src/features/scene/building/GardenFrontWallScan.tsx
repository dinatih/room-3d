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

        // Suppression de la face arrière (-Z) pour voir à travers depuis l'extérieur,
        // à l'identique du mur procédural (northMats).
        if (mesh.geometry) {
          const geo = mesh.geometry.clone();
          const norm = geo.attributes.normal;
          if (geo.index && norm) {
            const idx = geo.index;
            const newIndices: number[] = [];
            for (let i = 0; i < idx.count; i += 3) {
              const i0 = idx.getX(i);
              const i1 = idx.getX(i + 1);
              const i2 = idx.getX(i + 2);
              const n0 = new THREE.Vector3(
                norm.getX(i0),
                norm.getY(i0),
                norm.getZ(i0)
              ).transformDirection(child.matrixWorld);

              // Les triangles dont la normale pointe vers -Z (face arrière) sont ignorés
              if (n0.z >= -0.5) {
                newIndices.push(i0, i1, i2);
              }
            }
            geo.setIndex(newIndices);
          }
          mesh.geometry = geo;
        }

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
              side: THREE.FrontSide,
            });
          } else if ('side' in (originalMat as any)) {
            (originalMat as any).side = THREE.FrontSide;
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
