import { useSceneStore } from './store/useSceneStore';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, MathUtils, Mesh, MeshBasicMaterial, DirectionalLight } from 'three';
import { Points, ShaderMaterial } from 'three';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { simulationClock } from './ai/laraLifeStore';

/** The sky follows the shared world clock. */
export function simulatedHour() {
  return (8 + simulationClock.minutes / 60) % 24;
}

export function solarElevation(hour: number) {
  const latitude = Number(import.meta.env.VITE_STUDIO_LAT ?? 48.828) * Math.PI / 180;
  return Math.asin(Math.cos(latitude) * Math.cos((hour - 12) * Math.PI / 12)) * 180 / Math.PI;
}

export function daylight(hour: number) {
  if (!Number.isFinite(hour)) throw new Error('Invalid environment hour');
  return MathUtils.smoothstep(solarElevation(hour), -6, 0);
}

const nightColor = new Color('#17243e');
const dayColor = new Color('white');

// Même luminosité que le ciel, échantillonnée à chaque minute du curseur.
export const dayTimeTrack = `linear-gradient(to right, ${Array.from({ length: 24 * 60 + 1 }, (_, minute) => {
  const color = new Color('#234b80').lerp(new Color('#f4d78b'), daylight(minute / 60));
  return `#${color.getHexString()} ${minute / (24 * 60) * 100}%`;
}).join(', ')})`;


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
  const moonLight = useRef<DirectionalLight>(null!);
  const starField = useMemo(() => {
    const count = 750;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    // Tirages stables : pas de spirale régulière ni de changement au remontage.
    const random = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let i = 0; i < count; i++) {
      const y = random(i * 5 + 1);
      const angle = random(i * 5 + 2) * Math.PI * 2;
      const radius = SKY_RADIUS * 0.9;
      positions.set([Math.cos(angle) * Math.sqrt(1 - y * y) * radius, y * radius, Math.sin(angle) * Math.sqrt(1 - y * y) * radius], i * 3);
      const brightness = 0.2 + 0.8 * random(i * 5 + 3) ** 2;
      const warmth = random(i * 5 + 4);
      colors.set([brightness * (0.75 + 0.25 * warmth), brightness * 0.85, brightness * (1 - 0.25 * warmth)], i * 3);
      sizes[i] = 1 + 2 * random(i * 5 + 5) ** 3;
    }
    return { positions, colors, sizes, uniforms: { opacity: { value: 0 } } };
  }, []);
  useFrame(({ scene }) => {
    const hour = simulatedHour();
    const light = daylight(hour);
    const night = solarElevation(hour) < 0;
    if (previousNight.current !== night) {
      previousNight.current = night;
      const store = useSceneStore.getState();
      useSceneStore.setState({ nightLighting: night });
      store.triggerAction('lamp-toggle', night);
    }
    scene.getObjectByName('SkySphere')?.traverse(child => {
      const material = (child as Mesh).material;
      if (material instanceof MeshBasicMaterial && material.map) material.color.copy(nightColor).lerp(dayColor, light);
    });
    for (const object of scene.children) {
      if (object.type === 'AmbientLight') {
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
    // Clair de lune doux : même direction que le disque, sans lumière sous l’horizon.
    moonLight.current.position.copy(moon.current.position).multiplyScalar(2 / 0.8);
    moonLight.current.target.position.set(...SKY_CENTER);
    moonLight.current.target.updateMatrixWorld();
    moonLight.current.intensity = 0.2 * (1 - light) * Math.max(0, Math.sin(angle));
    (stars.current.material as ShaderMaterial).uniforms.opacity.value = 1 - light;
  });
  return <group position={SKY_CENTER}>
    <directionalLight name="MoonLight" ref={moonLight} color="#b9ceff" intensity={0} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-near={1} shadow-camera-far={3 * SKY_RADIUS}
      shadow-camera-left={-SKY_RADIUS} shadow-camera-right={SKY_RADIUS}
      shadow-camera-top={SKY_RADIUS} shadow-camera-bottom={-SKY_RADIUS}
      shadow-bias={-0.0002} shadow-normalBias={0.04} />
    <mesh ref={moon}>
      <sphereGeometry args={[65, 24, 16]} />
      <meshBasicMaterial ref={moonMaterial} color="#dee7ff" transparent toneMapped={false} />
    </mesh>
    <points ref={stars}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[starField.positions, 3]} />
        <bufferAttribute attach="attributes-starColor" args={[starField.colors, 3]} />
        <bufferAttribute attach="attributes-starSize" args={[starField.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial uniforms={starField.uniforms} transparent depthWrite={false} toneMapped={false}
        vertexShader={`
          attribute vec3 starColor;
          attribute float starSize;
          varying vec3 tint;
          void main() {
            tint = starColor;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = starSize;
          }
        `}
        fragmentShader={`
          uniform float opacity;
          varying vec3 tint;
          void main() {
            float radius = length(gl_PointCoord - 0.5);
            gl_FragColor = vec4(tint, opacity * (1.0 - smoothstep(0.15, 0.5, radius)));
            #include <colorspace_fragment>
          }
        `} />
    </points>
  </group>;
}
