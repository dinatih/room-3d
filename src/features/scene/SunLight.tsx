import { simulatedHour, solarElevation } from './DayNight';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight, Mesh, MeshBasicMaterial, Color, MathUtils } from 'three';

const LAT    = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');

const AZ_DEG = parseFloat(import.meta.env.VITE_STUDIO_AZ  ?? '90');

// ── Calcul de la position solaire ─────────────────────────────────────────────

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
    const hour = simulatedHour();
    const elevation = solarElevation(hour);
    const direction = sunDir(hour);
    lightRef.current.position.set(direction.x, direction.y, direction.z);
    const { color, intensity } = sunParams(elevation);
    lightRef.current.color.copy(color);
    lightRef.current.intensity = intensity;
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={0}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-near={1}
      shadow-camera-far={3000}
      shadow-camera-left={-1200}
      shadow-camera-right={1200}
      shadow-camera-top={1200}
      shadow-camera-bottom={-1200}
      shadow-bias={-0.0002}
      shadow-normalBias={0.04}
    />
  );
}

// ── Disque solaire visible ────────────────────────────────────────────────────

const SPHERE_D = SKY_RADIUS * 0.8;
const SPHERE_R = 65;

function sunDir(hour: number) {
  const angle = (hour - 12) * Math.PI / 12;
  const latitude = LAT * Math.PI / 180;
  const east = -Math.sin(angle);
  const north = -Math.sin(latitude) * Math.cos(angle);
  const up = Math.cos(latitude) * Math.cos(angle);
  const orientation = AZ_DEG * Math.PI / 180;
  return {
    x: SKY_CENTER[0] + (Math.sin(orientation) * east + Math.cos(orientation) * north) * SPHERE_D,
    y: SKY_CENTER[1] + up * SPHERE_D,
    z: SKY_CENTER[2] + (Math.cos(orientation) * east - Math.sin(orientation) * north) * SPHERE_D,
  };
}

export function SunSphere() {
  const meshRef = useRef<Mesh>(null!);
  const matRef  = useRef<MeshBasicMaterial>(null!);
  useFrame(() => {
    const hour = simulatedHour();
    const elevation = solarElevation(hour);
    meshRef.current.visible = elevation > 0;
    const { x, y, z } = sunDir(hour);
    meshRef.current.position.set(x, y, z);
    matRef.current.color.copy(sunParams(elevation).color);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[SPHERE_R, 16, 8]} />
      <meshBasicMaterial ref={matRef} toneMapped={false} fog={false} />
    </mesh>
  );
}
