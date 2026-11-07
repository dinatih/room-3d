import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, PointLight } from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { pEast, pWest, ROOM_NORTH_WALL } from '../wallData';

// Dimensions du dormant, du coffrage et de la marche de GlassDoor (en cm).
const WINDOW_WIDTH = 170;
const WINDOW_TOP = 224;
const STEP_WIDTH = 165;
const STEP_HEIGHT = 25;
const STRIP_WIDTH = 1;
const RAINBOW_PERIOD_SECONDS = 60;
type Segment = { position: [number, number, number]; size: [number, number, number] };
const windowSegments: Segment[] = [
  { position: [0, WINDOW_TOP, 0], size: [WINDOW_WIDTH, STRIP_WIDTH, STRIP_WIDTH] },
  {
    position: [-WINDOW_WIDTH / 2, WINDOW_TOP / 2, 0],
    size: [STRIP_WIDTH, WINDOW_TOP, STRIP_WIDTH],
  },
];
const gardenSegments: Segment[] = [
  { position: [0, 0, 0], size: [STEP_WIDTH, STRIP_WIDTH, STRIP_WIDTH] },
];

function LightStrip({ name, segments, rainbow = false }: { name: string; segments: Segment[]; rainbow?: boolean }) {
  const on = useSceneStore(state => !!state.furniture.lampGardenStrips);
  const lightsHD = useSceneStore(state => state.layers.lightsHD);
  const fullLight = useSceneStore(state => state.nightLighting || state.layers.lightsHD);
  const material = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), []);
  const lights = useRef<(PointLight | null)[]>([]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock, invalidate }) => {
    if (on && rainbow) material.color.setHSL((clock.elapsedTime / RAINBOW_PERIOD_SECONDS) % 1, 1, 0.5);
    else material.color.set(on ? '#ff0000' : '#d0d0d0');
    for (const light of lights.current) light?.color.copy(material.color);
    if (on && rainbow) invalidate();
  });
  return <group name={name} userData={{ sceneItemRoot: true, itemName: `Bande lumineuse ${name}` }}>
    {segments.map(({ position, size }, index) => <group key={index} position={position}>
      <mesh material={material}><boxGeometry args={size} /></mesh>
      <pointLight ref={light => { lights.current[index] = light; }} position={[0, 0, rainbow ? 2 : -2]} color={material.color}
        intensity={on ? (fullLight ? 120 : 2.5) : 0}
        distance={fullLight ? 0 : 250} decay={fullLight ? 1 : 2}
        castShadow={lightsHD} shadow-mapSize={[512, 512]} shadow-camera-near={1} />
    </group>)}
  </group>;
}

export function GardenLightStrips() {
  const centerX = (pEast('glass-west') + pWest('glass-east')) / 2;
  return <>
    <group position={[centerX, 0, ROOM_NORTH_WALL + 1.2 + STRIP_WIDTH / 2]}>
      <LightStrip name="Fenêtre" segments={windowSegments} rainbow />
    </group>
    <group position={[centerX, STEP_HEIGHT - STRIP_WIDTH / 2, -30 - STRIP_WIDTH / 2]}>
      <LightStrip name="Jardin" segments={gardenSegments} />
    </group>
  </>;
}
