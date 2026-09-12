import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { groundExteriorMat } from './buildingCommon';

interface BermudaGroundProps {
  active?: boolean;
}

export function BermudaGround({ active = true }: BermudaGroundProps) {
  if (!active) {
    return (
      <mesh
        material={groundExteriorMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[150, -10, 0]}
        receiveShadow
        userData={{
          brickType: 'ground',
          itemName: 'Terrain Extérieur',
          hoverAction: { label: 'Gazon Bermuda', actionId: 'bermuda-grass-toggle' },
        }}
      >
        <planeGeometry args={[1100, 2000]} />
      </mesh>
    );
  }

  return <BermudaGroundMesh />;
}

function BermudaGroundMesh() {
  const textures = useTexture({
    map: 'textures/grass_bermuda/diffuse.jpg',
    normalMap: 'textures/grass_bermuda/normal.jpg',
    roughnessMap: 'textures/grass_bermuda/roughness.jpg',
  });

  const material = useMemo(() => {
    // Échelle réelle : 1 tuile = 150x150 cm pour conserver les proportions sans étirement
    const tileSize = 150;
    const repeatX = 1100 / tileSize;
    const repeatY = 2000 / tileSize;

    [textures.map, textures.normalMap, textures.roughnessMap].forEach((tex) => {
      if (tex) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        tex.needsUpdate = true;
      }
    });

    if (textures.map) {
      textures.map.colorSpace = THREE.SRGBColorSpace;
    }

    return new THREE.MeshStandardMaterial({
      map: textures.map,
      normalMap: textures.normalMap,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughnessMap: textures.roughnessMap,
      roughness: 0.9,
      metalness: 0.02,
    });
  }, [textures]);

  return (
    <mesh
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[150, -10, 0]}
      receiveShadow
      userData={{
        brickType: 'ground',
        itemName: 'Terrain Extérieur (Gazon Bermuda)',
        hoverAction: { label: 'Gazon Bermuda', actionId: 'bermuda-grass-toggle' },
      }}
    >
      <planeGeometry args={[1100, 2000]} />
    </mesh>
  );
}

useTexture.preload([
  'textures/grass_bermuda/diffuse.jpg',
  'textures/grass_bermuda/normal.jpg',
  'textures/grass_bermuda/roughness.jpg',
]);
