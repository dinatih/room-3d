import { useMemo } from 'react';
import * as THREE from 'three';
import { EXTERIOR_GROUND, EXTERIOR_CORRIDOR, NEIGHBOR_OFFSETS, SLAB_OUTLINE } from '../environmentData';
import polygonClipping, { type Polygon } from 'polygon-clipping';
import { DiagWall } from '../wallData';
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

export function BermudaGround({ active, groundType = 'bermuda', yPos = 0 }: BermudaGroundProps) {
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
  const geometry = useMemo(() => {
    const { x, z, width, depth } = EXTERIOR_GROUND;
    const ground: Polygon = [[
      [x - width / 2, z - depth / 2], [x + width / 2, z - depth / 2],
      [x + width / 2, z + depth / 2], [x - width / 2, z + depth / 2],
    ]];
    const slabs: Polygon[] = [{ x: 0, z: 0 }, ...NEIGHBOR_OFFSETS].map(offset => [
      SLAB_OUTLINE.map(([sx, sz]) => [sx + offset.x, sz + offset.z]),
    ]);
    const center = DiagWall.p(DiagWall.len / 2, DiagWall.depth / 2 + EXTERIOR_CORRIDOR.width / 2);
    const corridor: Polygon = [[
      [-1, -1], [1, -1], [1, 1], [-1, 1],
    ].map(([u, v]) => {
      const point = new THREE.Vector2(u * EXTERIOR_CORRIDOR.length / 2, v * EXTERIOR_CORRIDOR.width / 2)
        .rotateAround(new THREE.Vector2(), -DiagWall.rotY - Math.PI / 2);
      return [center.x + point.x, center.z + point.y];
    })];
    const shapes = polygonClipping.difference(ground, ...slabs, corridor).map(rings => {
      const [outline, ...holes] = rings.map(ring => ring.map(([px, pz]) => new THREE.Vector2(px - x, z - pz)));
      const shape = new THREE.Shape(outline);
      shape.holes = holes.map(hole => new THREE.Path(hole));
      return shape;
    });
    const geo = new THREE.ShapeGeometry(shapes);
    const positions = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < positions.count; i++) {
      uv.setXY(i, positions.getX(i) / width + 0.5, positions.getY(i) / depth + 0.5);
    }
    return geo;
  }, []);
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
    });
  }, [textures, config.tileSize]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[EXTERIOR_GROUND.x, yPos, EXTERIOR_GROUND.z]}
      receiveShadow
      userData={{
        birdSupport: { id: 'garden-ground', kind: 'ground' },
              brickType: 'ground',
        itemName: `Terrain Extérieur (${config.label})`,
      }}
    />
  );
}

// Pré-chargement des 4 textures PBR
Object.values(GROUND_CONFIGS).forEach((c) => {
  useTexture.preload([c.diffuse, c.normal, c.roughness]);
});
