import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function SkySphere() {
  const texture = useTexture('/media/HDR_029_Sky_Cloudy_Bg.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;
  // If the texture is mapped equirectangularly, mapping should be set.
  // We can just apply it to a sphere with BackSide.

  return (
    <mesh position={[150, 0, 150]} scale={[2000, 2000, 2000]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.BackSide} 
        depthWrite={false} 
        fog={false} 
      />
    </mesh>
  );
}

useTexture.preload('/media/HDR_029_Sky_Cloudy_Bg.jpg');
