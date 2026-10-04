import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import type { GroundType } from '../sidepanel/types';
import { groundExteriorMat } from './buildingCommon';
import { CategoryLayerGroup } from '../sceneLayer';
import { LAYER_GRASS, LAYER_FLOOR_COVERINGS } from '@config';
import { useSceneStore } from '../store/useSceneStore';

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

export function BermudaGround({ active, groundType = 'bermuda', yPos = -3.4 }: BermudaGroundProps) {
  const storeBermudaGrass = useSceneStore(state => state.layers.bermudaGrass ?? true);
  const isGrassActive = active ?? storeBermudaGrass;
  const showTexturedGrass = isGrassActive && groundType !== 'none' && (groundType in GROUND_CONFIGS);

  return (
    <>
      {/* Rectangle vert uni : terrain extérieur de secours quand l'herbe PBR est désactivée ou en mode 'none' */}
      {!showTexturedGrass && (
        <CategoryLayerGroup layer={LAYER_FLOOR_COVERINGS}>
          <mesh
            material={groundExteriorMat}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[150, yPos, 0]}
            receiveShadow
            userData={{
              brickType: 'ground',
              itemName: 'Terrain Extérieur',
            }}
          >
            <planeGeometry args={[1100, 2000]} />
          </mesh>
        </CategoryLayerGroup>
      )}

      {/* Herbe texturée PBR : rattachée au calque Herbe (LAYER_GRASS) */}
      {showTexturedGrass && (
        <CategoryLayerGroup layer={LAYER_GRASS}>
          <TexturedGroundMesh
            key={GROUND_CONFIGS[groundType as Exclude<GroundType, 'none'>].id}
            config={GROUND_CONFIGS[groundType as Exclude<GroundType, 'none'>]}
            yPos={yPos}
          />
        </CategoryLayerGroup>
      )}
    </>
  );
}

function TexturedGroundMesh({ config, yPos }: { config: GroundConfig; yPos: number }) {
  const textures = useTexture({
    map: config.diffuse,
    normalMap: config.normal,
    roughnessMap: config.roughness,
  });

  const material = useMemo(() => {
    const planeW = 1100;
    const planeH = 2000;
    const repeatX = planeW / config.tileSize;
    const repeatY = planeH / config.tileSize;

    // Alignement parfait des tuiles sur l'origine du monde (X=0, Z=0)
    const minWorldX = 150 - planeW / 2; // -400
    const minWorldZ = 0 - planeH / 2;   // -1000
    let offsetX = (minWorldX / config.tileSize) % 1;
    let offsetY = (minWorldZ / config.tileSize) % 1;
    if (offsetX < 0) offsetX += 1;
    if (offsetY < 0) offsetY += 1;

    [textures.map, textures.normalMap, textures.roughnessMap].forEach((tex) => {
      if (tex) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
        tex.offset.set(offsetX, offsetY);
        tex.anisotropy = 8;
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
      roughness: 0.85,
      metalness: 0.02,
      // Opaque : empêche la dalle béton ou le fond en dessous de transparaître par transparence
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
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
