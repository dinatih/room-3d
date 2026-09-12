import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import type { GroundType } from '../sidepanel/types';
import { groundExteriorMat } from './buildingCommon';

export interface GroundConfig {
  id: GroundType;
  label: string;
  diffuse: string;
  normal: string;
  roughness: string;
  tileSize: number;
}

export const GROUND_CONFIGS: Record<Exclude<GroundType, 'none'>, GroundConfig> = {
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
  mud_leaves: {
    id: 'mud_leaves',
    label: 'Terre & Feuilles 🍂',
    diffuse: 'textures/brown_mud_leaves_01/diffuse.jpg',
    normal: 'textures/brown_mud_leaves_01/normal.jpg',
    roughness: 'textures/brown_mud_leaves_01/roughness.jpg',
    tileSize: 200,
  },
};

interface BermudaGroundProps {
  active?: boolean;
  groundType?: GroundType;
  yPos?: number;
}

export function BermudaGround({ active = true, groundType = 'bermuda', yPos = -4.5 }: BermudaGroundProps) {
  const effectiveType = active ? groundType : 'none';

  if (effectiveType === 'none' || !(effectiveType in GROUND_CONFIGS)) {
    return (
      <mesh
        material={groundExteriorMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[150, yPos, 0]}
        receiveShadow
        userData={{
          brickType: 'ground',
          itemName: 'Terrain Extérieur',
          hoverAction: { label: 'Sol : Vert uni', actionId: 'ground-type-cycle' },
        }}
      >
        <planeGeometry args={[1100, 2000]} />
      </mesh>
    );
  }

  const config = GROUND_CONFIGS[effectiveType as Exclude<GroundType, 'none'>];
  return <TexturedGroundMesh key={config.id} config={config} yPos={yPos} />;
}

function TexturedGroundMesh({ config, yPos }: { config: GroundConfig; yPos: number }) {
  const textures = useTexture({
    map: config.diffuse,
    normalMap: config.normal,
    roughnessMap: config.roughness,
  });

  const material = useMemo(() => {
    const repeatX = 1100 / config.tileSize;
    const repeatY = 2000 / config.tileSize;

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
  }, [textures, config.tileSize]);

  return (
    <mesh
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[150, yPos, 0]}
      receiveShadow
      userData={{
        brickType: 'ground',
        itemName: `Terrain Extérieur (${config.label})`,
        hoverAction: { label: `Sol : ${config.label}`, actionId: 'ground-type-cycle' },
      }}
    >
      <planeGeometry args={[1100, 2000]} />
    </mesh>
  );
}

// Pré-chargement des 5 textures PBR
Object.values(GROUND_CONFIGS).forEach((c) => {
  useTexture.preload([c.diffuse, c.normal, c.roughness]);
});
