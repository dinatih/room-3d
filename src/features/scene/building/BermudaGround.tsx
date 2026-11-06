import { useFrame } from '@react-three/fiber';
import { weatherSurface } from '../weatherSurface';
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
  const textures = useTexture({
    map: config.diffuse,
    normalMap: config.normal,
    roughnessMap: config.roughness,
  });

  const surfaceUniforms = useMemo(() => ({ gardenSnow: { value: 0 }, gardenWater: { value: 0 } }), []);
  useFrame(() => {
    surfaceUniforms.gardenSnow.value = weatherSurface.snow;
    surfaceUniforms.gardenWater.value = weatherSurface.water;
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

    const ground = new THREE.MeshStandardMaterial({
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
    ground.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, surfaceUniforms);
      shader.vertexShader = 'varying vec2 gardenPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n gardenPosition = position.xy;');
      shader.fragmentShader = `
        varying vec2 gardenPosition; uniform float gardenSnow; uniform float gardenWater;
        float gardenHash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float gardenNoise(vec2 p) {
          vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(gardenHash(i),gardenHash(i+vec2(1,0)),f.x),mix(gardenHash(i+vec2(0,1)),gardenHash(i+vec2(1,1)),f.x),f.y);
        }
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float terrain = gardenNoise(gardenPosition / 100.0) * 0.7 + gardenNoise(gardenPosition / 35.0) * 0.3;
        float snowCover = smoothstep(terrain - 0.08, terrain + 0.08, gardenSnow) * smoothstep(0.0, 0.08, gardenSnow);
        float puddle = (1.0 - smoothstep(gardenWater * 0.65 - 0.06, gardenWater * 0.65 + 0.06, terrain)) * (1.0-snowCover) * smoothstep(0.0, 0.08, gardenWater);
        diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - gardenWater * 0.35), vec3(0.12,0.17,0.2), puddle * 0.7);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88,0.93,1.0), snowCover);
        diffuseColor.a = mix(diffuseColor.a, 1.0, max(snowCover, puddle));
      `).replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.08, puddle);
        roughnessFactor = mix(roughnessFactor, 0.95, snowCover);
      `).replace('#include <normal_fragment_maps>', `
        #include <normal_fragment_maps>
        normal = normalize(mix(normal, nonPerturbedNormal, max(snowCover, puddle)));
      `);
    };
    return ground;
  }, [textures, config.tileSize, surfaceUniforms]);

  return (
    <mesh
      material={material}
      // Le sol doit précéder les surfaces transparentes verticales, quelle que soit la distance à son centre.
      renderOrder={-1}
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
