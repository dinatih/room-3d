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
    [5003, 2131, 14, 5, 9, 3], [5003, 2136, 4, 13, 3, 8], [5012, 2136, 5, 13, 3, 8],
  ] },
  { name: 'SeineBridges', layer: 'bridgeLights', resolution: [7978, 3989], paths: [
    [[2300, 2380], [2430, 2320]], // Grenelle
    [[2610, 2460], [2670, 2410], [2720, 2380], [2760, 2366]], // Rouelle
    [[3310, 2345], [3505, 2420]], // Bir-Hakeim
    [[3950, 2285], [4100, 2317]], // Iéna
    [[4225, 2225], [4285, 2230]], // Debilly
    [[4215, 2182], [4275, 2188]], // Alma
    [[4165, 2140], [4202, 2145]], // Invalides
    [[4145, 2130], [4185, 2133]], // Alexandre III
  ] },
  { name: 'SeineBanks', layer: 'bankLights', resolution: [7978, 3989], spacing: 18, paths: [
    [[2300, 2347], [2450, 2364], [2650, 2380], [2850, 2380], [3100, 2370], [3280, 2353], [3350, 2340]],
    [[3500, 2344], [3700, 2336], [3880, 2300], [4000, 2265], [4140, 2220], [4200, 2180], [4180, 2150], [4140, 2120]],
    [[2300, 2400], [2500, 2440], [2750, 2450], [3000, 2455], [3270, 2430], [3500, 2400], [3700, 2375], [3900, 2335], [4100, 2300], [4290, 2235], [4300, 2190], [4220, 2140]],
  ] },
  { name: 'ChampDeMars', layer: 'champDeMarsLights', resolution: [7978, 3989], paths: [
    [[3490, 2182], [3587, 2210], [3675, 2233], [3760, 2250], [3800, 2257]],
    [[3515, 2168], [3590, 2181], [3685, 2202], [3773, 2217], [3840, 2232]],
    [[3490, 2182], [3515, 2168]], [[3800, 2257], [3840, 2232]],
  ] },
  { name: 'ParisAvenues', layer: 'avenueLights', resolution: [7978, 3989], paths: [
    // Axes bordant le Champ-de-Mars.
    [[3450, 2165], [3550, 2200], [3650, 2240], [3770, 2285]],
    [[3520, 2148], [3630, 2170], [3750, 2200], [3880, 2240]],
  ] },
  { name: 'BoisDeBoulogne', layer: 'boisLights', resolution: [7978, 3989], spacing: 24, paths: [
    // Lisières visibles : quatre fois moins de points que les avenues, sans traverser la couture du HDR.
    [[5750, 2160], [6200, 2140], [6800, 2122], [7400, 2115], [7978, 2120]],
    [[0, 2120], [300, 2130], [600, 2155], [850, 2187], [760, 2220], [650, 2250], [500, 2290], [350, 2330], [200, 2365], [0, 2400]],
    [[7978, 2400], [7700, 2420], [7400, 2390], [7130, 2370], [6980, 2440], [6700, 2380], [6400, 2310], [6120, 2260], [5900, 2220], [5750, 2160]],
  ] },
] as const;

// Un point tous les six pixels du HDR 8k donne des lampadaires distincts à l'échelle du panorama.
const STREET_LAMP_SPACING_PX = 6;

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
    const addPoint = (x: number, y: number) => positions.push(...panoramaPoint(x, y, landmark.resolution[0], landmark.resolution[1], radius));
    if ('facades' in landmark) for (const [x, y, width, height, columns, rows] of landmark.facades) {
      for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        addPoint(x + column * width / (columns - 1), y + row * height / (rows - 1));
      }
    }
    if ('paths' in landmark) for (const path of landmark.paths) {
      for (let i = 1; i < path.length; i++) {
        const [x, y] = path[i - 1], [endX, endY] = path[i];
        const steps = Math.ceil(Math.hypot(endX - x, endY - y) / ('spacing' in landmark ? landmark.spacing : STREET_LAMP_SPACING_PX));
        for (let step = 0; step < steps; step++) addPoint(x + (endX - x) * step / steps, y + (endY - y) * step / steps);
      }
      const last = path[path.length - 1];
      addPoint(last[0], last[1]);
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
