import { celestialState } from './astronomy';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight, Mesh, MeshBasicMaterial, Color, MathUtils, Vector3 } from 'three';

const center = new Vector3(...SKY_CENTER);

// ── Couleur et intensité selon l'élévation ────────────────────────────────────

function sunParams(el: number): { color: Color; intensity: number } {
  if (el <= 0)  return { color: new Color(0x001020), intensity: 0 };
  if (el < 5)   return { color: new Color(0xff5500), intensity: 0.3 + (el / 5) * 0.5 };
  if (el < 15)  return { color: new Color(0xff9940), intensity: 0.8 + ((el - 5)  / 10) * 0.4 };
  if (el < 30)  return { color: new Color(0xffc070), intensity: 1.1 + ((el - 15) / 15) * 0.4 };
  return { color: new Color(0xfff5e0), intensity: 1.4 + Math.sin(MathUtils.degToRad(el)) * 0.4 };
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function SunLight() {
  const lightRef = useRef<DirectionalLight>(null!);
  useFrame(() => {
    lightRef.current.target.position.set(...SKY_CENTER);
    lightRef.current.target.updateMatrixWorld();
    const { sun } = celestialState();
    const elevation = sun.elevation;
    // Le volume d’ombres couvre la sphère du monde, dans toutes les directions.
    // La lumière reste en amont de ce volume, indépendamment du disque visible.
    lightRef.current.position.copy(sun.direction).multiplyScalar(2 * SKY_RADIUS).add(center);
    const { color, intensity } = sunParams(elevation);
    lightRef.current.color.copy(color);
    lightRef.current.intensity = intensity;
  });

  return (
    <directionalLight
      name="SunLight"
      ref={lightRef}
      intensity={0}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-near={1}
      shadow-camera-far={3 * SKY_RADIUS}
      shadow-camera-left={-SKY_RADIUS}
      shadow-camera-right={SKY_RADIUS}
      shadow-camera-top={SKY_RADIUS}
      shadow-camera-bottom={-SKY_RADIUS}
      shadow-bias={-0.0002}
      shadow-normalBias={0.04}
    />
  );
}

// ── Disque solaire visible ────────────────────────────────────────────────────

const SPHERE_D = SKY_RADIUS * 0.8;
const SPHERE_R = 65;

export function SunSphere() {
  const meshRef = useRef<Mesh>(null!);
  const matRef  = useRef<MeshBasicMaterial>(null!);
  useFrame(() => {
    const { sun } = celestialState();
    const elevation = sun.elevation;
    meshRef.current.visible = elevation > 0;
    meshRef.current.position.copy(sun.direction).multiplyScalar(SPHERE_D).add(center);
    matRef.current.color.copy(sunParams(elevation).color);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[SPHERE_R, 16, 8]} />
      <meshBasicMaterial ref={matRef} toneMapped={false} fog={false} />
    </mesh>
  );
}
