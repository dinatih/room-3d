import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { WALL_H, DiagWall } from '../wallData';

const GLB = '/environment/before_i_die__wall_scan_in_seoul_korea.glb';

export function GardenFrontWallScan() {
  const { scene } = useGLTF(GLB);

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && !(mesh.material as any).transparent) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = new THREE.MeshStandardMaterial({
        map: (mesh.material as any).map,
        roughness: 0.85,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
    }
  });

  return (
    <primitive
      object={scene}
      position={[150, 0, -786.33]}
      rotation-y={DiagWall.rotY + Math.PI / 2}
      scale={WALL_H / 2}
    />
  );
}

useGLTF.preload(GLB);
