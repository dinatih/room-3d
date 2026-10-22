import { useMemo } from 'react';
import * as THREE from 'three';
import { EXTERIOR_GROUND } from '../environmentData';
import { useTexture } from '@react-three/drei';
import type { GroundType } from '../sidepanel/types';
import { CategoryLayerGroup } from '../sceneLayer';
import { LAYER_GRASS } from '@config';
import { useSceneStore } from '../store/useSceneStore';

export interface GroundConfig {
  id: GroundType;
  label: string;
  diffuse: string;
  normal: string;
  roughness: string;
  tileSize: number;
}

export const GROUND_CONFIGS: Record<GroundType, GroundConfig> = {
  bermuda: {
    id: 'bermuda',
    label: 'Gazon Bermuda 🌱',
    diffuse: 'textures/grass_bermuda/diffuse.jpg',
    normal: 'textures/grass_bermuda/normal.jpg',
    roughness: 'textures/grass_bermuda/roughness.jpg',
    tileSize: 150,
  },
  medium_01: {
    id: 'medium_01',
    label: 'Gazon Moyen 1 🌿',
    diffuse: 'textures/grass_medium_01/diffuse.jpg',
    normal: 'textures/grass_medium_01/normal.jpg',
    roughness: 'textures/grass_medium_01/roughness.jpg',
    tileSize: 160,
  },
  medium_02: {
    id: 'medium_02',
    label: 'Gazon Moyen 2 🌾',
    diffuse: 'textures/grass_medium_02/diffuse.jpg',
    normal: 'textures/grass_medium_02/normal.jpg',
    roughness: 'textures/grass_medium_02/roughness.jpg',
    tileSize: 160,
  },
  celandine: {
    id: 'celandine',
    label: 'Prairie Fleurie (Chélidoine) 🌼',
    diffuse: 'textures/celandine_01/diffuse.jpg',
    normal: 'textures/celandine_01/normal.jpg',
    roughness: 'textures/celandine_01/roughness.jpg',
    tileSize: 140,
  },
};

interface BermudaGroundProps {
  active?: boolean;
  groundType?: GroundType;
  yPos?: number;
}

export function BermudaGround({ active, groundType = 'bermuda', yPos = -3.6 }: BermudaGroundProps) {
  const storeBermudaGrass = useSceneStore(state => state.layers.bermudaGrass ?? true);
  const isGrassActive = active ?? storeBermudaGrass;

  if (!isGrassActive) return null;

  const config = GROUND_CONFIGS[groundType] ?? GROUND_CONFIGS.bermuda;

  return (
    <CategoryLayerGroup layer={LAYER_GRASS}>
      <TexturedGroundMesh
        key={config.id}
        config={config}
        yPos={yPos}
      />
    </CategoryLayerGroup>
  );
}

function TexturedGroundMesh({ config, yPos }: { config: GroundConfig; yPos: number }) {
  const textures = useTexture({
    map: config.diffuse,
    normalMap: config.normal,
    roughnessMap: config.roughness,
  });

  const material = useMemo(() => {
    const repeatX = EXTERIOR_GROUND.width / config.tileSize;
    const repeatY = EXTERIOR_GROUND.depth / config.tileSize;

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
      transparent: true,
      opacity: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
  }, [textures, config.tileSize]);

  return (
    <mesh
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[EXTERIOR_GROUND.x, yPos, EXTERIOR_GROUND.z]}
      receiveShadow
      userData={{
        birdSupport: { id: 'garden-ground', kind: 'ground' },
              brickType: 'ground',
        itemName: `Terrain Extérieur (${config.label})`,
      }}
    >
      <planeGeometry args={[EXTERIOR_GROUND.width, EXTERIOR_GROUND.depth]} />
    </mesh>
  );
}

// Pré-chargement des 4 textures PBR
Object.values(GROUND_CONFIGS).forEach((c) => {
  useTexture.preload([c.diffuse, c.normal, c.roughness]);
});
