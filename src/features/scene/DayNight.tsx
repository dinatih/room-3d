import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, MathUtils, Mesh, MeshBasicMaterial } from 'three';
import { Stars } from '@react-three/drei';
import { useLaraLifeStore } from './ai/laraLifeStore';

/** The household sky follows Lara, independently of the selected character. */
export function simulatedHour() {
  return (8 + useLaraLifeStore.getState().characters.native.elapsedSeconds / 60) % 24;
}

export function daylight(hour: number) {
  if (!Number.isFinite(hour)) throw new Error('Invalid environment hour');
  return MathUtils.smoothstep(hour, 6, 8) * (1 - MathUtils.smoothstep(hour, 18, 22));
}

const nightColor = new Color('#17243e');
const dayColor = new Color('white');

export function DayNight() {
  const moon = useRef<Mesh>(null!);
  const moonMaterial = useRef<MeshBasicMaterial>(null!);
  useFrame(({ scene }) => {
    const hour = simulatedHour();
    const light = daylight(hour);
    scene.traverse(object => {
      if (object.name === 'SkySphere') object.traverse(child => {
        const material = (child as Mesh).material;
        if (material instanceof MeshBasicMaterial && material.map) material.color.copy(nightColor).lerp(dayColor, light);
      });
      if (object.type === 'AmbientLight' || object.type === 'DirectionalLight') {
        const source = object as import('three').Light;
        if (source.userData.lastNightIntensity !== source.intensity) source.userData.dayIntensity = source.intensity;
        source.intensity = source.userData.dayIntensity * (0.12 + 0.88 * light);
        source.userData.lastNightIntensity = source.intensity;
      }
    });
    if (scene.userData.lastNightEnvironment !== scene.environmentIntensity) scene.userData.dayEnvironmentIntensity = scene.environmentIntensity;
    scene.environmentIntensity = scene.userData.dayEnvironmentIntensity * (0.12 + 0.88 * light);
    scene.userData.lastNightEnvironment = scene.environmentIntensity;
    const angle = ((hour + 6) % 24) / 24 * Math.PI * 2;
    moon.current.position.set(Math.cos(angle) * 3500, Math.sin(angle) * 3500, -2000);
    moon.current.visible = light < 1 && moon.current.position.y > 0;
    moonMaterial.current.opacity = 1 - light;
  });
  const light = useLaraLifeStore(state => daylight((8 + state.characters.native.elapsedSeconds / 60) % 24));
  return <>
    <mesh ref={moon}>
      <sphereGeometry args={[65, 24, 16]} />
      <meshBasicMaterial ref={moonMaterial} color="#dee7ff" transparent toneMapped={false} />
    </mesh>
    <group visible={light < 0.5}><Stars radius={4500} depth={500} count={1500} factor={2} fade speed={0} /></group>
  </>;
}
