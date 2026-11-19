import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';
import { WALL_H, DiagWall } from '../wallData';

const GLB = '/environment/before_i_die__wall_scan_in_seoul_korea.glb';

export function GardenFrontWallScan() {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    const created: THREE.Material[] = [];
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && !(mesh.material as THREE.Material).transparent) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        originals.set(mesh, mesh.material);
        const ghost = new THREE.MeshStandardMaterial({
          map: (mesh.material as THREE.MeshStandardMaterial).map,
          roughness: 0.85,
          side: THREE.FrontSide,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
        });
        created.push(ghost);
        mesh.material = ghost;
      }
    });
    return () => {
      originals.forEach((mat, mesh) => { mesh.material = mat; });
      created.forEach(mat => mat.dispose());
    };
  }, [scene]);

  return (
    <group userData={{ skipMerge: true, isGardenFrontWallScan: true }}>
      <primitive
        object={scene}
        position={[150, 0, -786.33]}
        rotation-y={DiagWall.rotY + Math.PI / 2}
        scale={WALL_H / 2}
      />
    </group>
  );
}

preloadSceneGLTF(GLB);
