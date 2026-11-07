import { useSceneStore } from './store/useSceneStore';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, MathUtils, Mesh, MeshBasicMaterial } from 'three';
import { Points, PointsMaterial } from 'three';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { simulationClock } from './ai/laraLifeStore';

/** The sky follows the shared world clock. */
export function simulatedHour() {
  return (8 + simulationClock.minutes / 60) % 24;
}

export function daylight(hour: number) {
  if (!Number.isFinite(hour)) throw new Error('Invalid environment hour');
  return MathUtils.smoothstep(hour, 6, 8) * (1 - MathUtils.smoothstep(hour, 18, 22));
}

const nightColor = new Color('#17243e');
const dayColor = new Color('white');

export function DayNight() {
  const scene = useThree(state => state.scene);
  useLayoutEffect(() => () => {
    scene.getObjectByName('SkySphere')?.traverse(child => {
      const material = (child as Mesh).material;
      if (material instanceof MeshBasicMaterial && material.map) material.color.copy(dayColor);
    });
    for (const object of scene.children) {
      const source = object as import('three').Light;
      if (source.userData.dayIntensity !== undefined) {
        source.intensity = source.userData.dayIntensity;
        delete source.userData.dayIntensity;
        delete source.userData.lastNightIntensity;
      }
    }
    if (scene.userData.dayEnvironmentIntensity !== undefined) scene.environmentIntensity = scene.userData.dayEnvironmentIntensity;
    delete scene.userData.dayEnvironmentIntensity;
    delete scene.userData.lastNightEnvironment;
  }, [scene]);
  const previousNight = useRef<boolean | null>(null);
  const moon = useRef<Mesh>(null!);
  const moonMaterial = useRef<MeshBasicMaterial>(null!);
  const stars = useRef<Points>(null!);
  const positions = useMemo(() => {
    const count = 750;
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const y = (i + 0.5) / count;
      const angle = i * Math.PI * (3 - Math.sqrt(5));
      const radius = SKY_RADIUS * 0.9;
      points.set([Math.cos(angle) * Math.sqrt(1 - y * y) * radius, y * radius, Math.sin(angle) * Math.sqrt(1 - y * y) * radius], i * 3);
    }
    return points;
  }, []);
  useFrame(({ scene }) => {
    const hour = simulatedHour();
    const light = daylight(hour);
    const night = hour < 6 || hour >= 18;
    if (previousNight.current !== night) {
      previousNight.current = night;
      const store = useSceneStore.getState();
      store.triggerAction('lamp-toggle', night);
    }
    scene.getObjectByName('SkySphere')?.traverse(child => {
      const material = (child as Mesh).material;
      if (material instanceof MeshBasicMaterial && material.map) material.color.copy(nightColor).lerp(dayColor, light);
    });
    for (const object of scene.children) {
      if (object.type === 'AmbientLight' || object.type === 'DirectionalLight') {
        const source = object as import('three').Light;
        if (source.userData.lastNightIntensity !== source.intensity) source.userData.dayIntensity = source.intensity;
        source.intensity = source.userData.dayIntensity * (0.12 + 0.88 * light);
        source.userData.lastNightIntensity = source.intensity;
      }
    }
    if (scene.userData.lastNightEnvironment !== scene.environmentIntensity) scene.userData.dayEnvironmentIntensity = scene.environmentIntensity;
    scene.environmentIntensity = scene.userData.dayEnvironmentIntensity * (0.12 + 0.88 * light);
    scene.userData.lastNightEnvironment = scene.environmentIntensity;
    const angle = ((hour + 6) % 24) / 24 * Math.PI * 2;
    moon.current.position.set(Math.cos(angle) * SKY_RADIUS * 0.8, Math.sin(angle) * SKY_RADIUS * 0.8, 0);
    moon.current.visible = light < 1 && moon.current.position.y > 0;
    moonMaterial.current.opacity = 1 - light;
    (stars.current.material as PointsMaterial).opacity = 1 - light;
  });
  return <group position={SKY_CENTER}>
    <mesh ref={moon}>
      <sphereGeometry args={[65, 24, 16]} />
      <meshBasicMaterial ref={moonMaterial} color="#dee7ff" transparent toneMapped={false} />
    </mesh>
    <points ref={stars}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="white" size={2} sizeAttenuation={false} transparent depthWrite={false} toneMapped={false} />
    </points>
  </group>;
}
