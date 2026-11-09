import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { daylight, simulatedHour } from './astronomy';
import { useSceneStore } from './store/useSceneStore';

// Rectangles relevés dans le HDR : x, y, largeur, hauteur, colonnes, rangées.
const LANDMARKS = [
  { name: 'Montparnasse', layer: 'montparnasseLights', resolution: [2048, 1024], facades: [[841, 522, 3, 11, 3, 12]], beacon: [843, 519.5] },
  { name: 'Bnf', layer: 'bnfLights', resolution: [7978, 3989], facades: [
    [3442, 2035, 4, 8, 2, 5], [3455, 2036, 4, 8, 2, 5],
    [3464, 2035, 4, 8, 2, 5], [3476, 2036, 4, 8, 2, 5],
  ] },
  // Corniche et deux piédroits ; l'ouverture centrale reste sombre.
  { name: 'ArcDeTriomphe', layer: 'arcLights', resolution: [7978, 3989], facades: [
    [4964, 2033, 16, 2, 10, 2], [4964, 2035, 4, 11, 3, 7], [4976, 2035, 4, 11, 3, 7],
  ] },
] as const;

function panoramaPoint(x: number, y: number, width: number, height: number, radius: number) {
  const az = x / width * Math.PI * 2;
  const el = (0.5 - y / height) * Math.PI;
  return [-radius * Math.cos(az) * Math.cos(el), radius * Math.sin(el), radius * Math.sin(az) * Math.cos(el)];
}

export function ParisLandmarkLights({ skyRadius = 3600 }: { skyRadius?: number }) {
  return LANDMARKS.map(landmark => <LandmarkLights key={landmark.name} landmark={landmark} radius={skyRadius * 0.992} />);
}

function LandmarkLights({ landmark, radius }: { landmark: typeof LANDMARKS[number]; radius: number }) {
  const active = useSceneStore(state => state.currentHdri === 'default' && state.layers[landmark.layer]);
  const group = useRef<THREE.Group>(null);
  const windows = useRef<THREE.PointsMaterial>(null);
  const beacon = useRef<THREE.PointsMaterial>(null);
  const [facade, summit] = useMemo(() => {
    const positions: number[] = [];
    for (const [x, y, width, height, columns, rows] of landmark.facades) {
      for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        positions.push(...panoramaPoint(x + column * width / (columns - 1), y + row * height / (rows - 1), landmark.resolution[0], landmark.resolution[1], radius));
      }
    }
    return [new Float32Array(positions), 'beacon' in landmark ? new Float32Array(panoramaPoint(landmark.beacon[0], landmark.beacon[1], landmark.resolution[0], landmark.resolution[1], radius)) : null];
  }, [landmark, radius]);

  useFrame(({ clock }) => {
    const fade = THREE.MathUtils.clamp((0.45 - daylight(simulatedHour())) / 0.45, 0, 1);
    if (group.current) group.current.visible = Boolean(active) && fade > 0;
    if (windows.current) windows.current.opacity = fade * 0.55;
    if (beacon.current) beacon.current.opacity = fade * (0.2 + 0.8 * Math.pow((1 + Math.sin(clock.elapsedTime * Math.PI)) / 2, 4));
  });

  return (
    <group ref={group} name={`${landmark.name}Lights`} visible={false}>
      <points renderOrder={-960}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[facade, 3]} /></bufferGeometry>
        <pointsMaterial ref={windows} color="#ffe0ac" size={1.4} sizeAttenuation={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </points>
      {summit && <points renderOrder={-959}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[summit, 3]} /></bufferGeometry>
        <pointsMaterial ref={beacon} color="#ff3020" size={3} sizeAttenuation={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </points>}
    </group>
  );
}
