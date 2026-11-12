import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, PointLight } from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { useLightAppearance } from '../../home-assistant/useLightAppearance';
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

function LightStrip({ name, segments, storeKey, rainbow = false }: { name: string; segments: Segment[]; storeKey: 'lampWindow' | 'lampGardenStrip'; rainbow?: boolean }) {
  const on = useSceneStore(state => storeKey === 'lampWindow'
    ? (state.furniture.lampWindow ?? state.furniture.lampGardenStrips)
    : ((state.furniture.socketGarden ?? true) && (state.furniture.lampGardenStrip ?? state.furniture.lampGardenStrips)));
  const lightsHD = useSceneStore(state => state.layers.lightsHD);
  const material = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), []);
  const lights = useRef<(PointLight | null)[]>([]);
  const { remote, color, brightness } = useLightAppearance(storeKey, storeKey === 'lampGardenStrip' ? 0xff0000 : 0xffffff);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock, invalidate }) => {
    if (on) {
      if (remote && color) material.color.copy(color);
      else if (rainbow) material.color.setHSL((clock.elapsedTime / RAINBOW_PERIOD_SECONDS) % 1, 1, 0.5);
      else material.color.set('#ff0000');
    } else material.color.set('#d0d0d0');
    for (const light of lights.current) light?.color.copy(material.color);
    if (on && rainbow && !remote) invalidate();
  });
  return <group name={name} userData={{ sceneItemRoot: true, itemName: `Bande lumineuse ${name}`, hoverAction: { label: name === 'Fenêtre' ? 'Lumière Fenêtre' : 'Strip Blanc Jardin', actions: [name === 'Fenêtre' ? 'lamp-window-toggle' : 'lamp-garden-toggle'] } }}>
    {segments.map(({ position, size }, index) => <group key={index} position={position}>
      <mesh material={material}><boxGeometry args={size} /></mesh>
      <pointLight ref={light => { lights.current[index] = light; }} position={[0, 0, rainbow ? 2 : -2]} color={material.color}
        intensity={on ? 120 * brightness : 0}
        distance={0} decay={1}
        castShadow={lightsHD} shadow-mapSize={[512, 512]} shadow-camera-near={1} />
    </group>)}
  </group>;
}

export function GardenLightStrips() {
  const centerX = (pEast('glass-west') + pWest('glass-east')) / 2;
  return <>
    <group position={[centerX, 0, ROOM_NORTH_WALL + 1.2 + STRIP_WIDTH / 2]}>
      <LightStrip name="Fenêtre" segments={windowSegments} storeKey="lampWindow" rainbow />
    </group>
    <group position={[centerX, STEP_HEIGHT - STRIP_WIDTH / 2, -30 - STRIP_WIDTH / 2]}>
      <LightStrip name="Jardin" segments={gardenSegments} storeKey="lampGardenStrip" />
    </group>
  </>;
}
