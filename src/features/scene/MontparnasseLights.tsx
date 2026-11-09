import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { daylight, simulatedHour } from './astronomy';
import { useSceneStore } from './store/useSceneStore';

// Mesure du HDR 2k : silhouette x=840..846, y=520..535 (origine en haut).
function panoramaPoint(x: number, y: number, radius: number) {
  const az = x / 2048 * Math.PI * 2;
  const el = (0.5 - y / 1024) * Math.PI;
  return [-radius * Math.cos(az) * Math.cos(el), radius * Math.sin(el), radius * Math.sin(az) * Math.cos(el)];
}

export function MontparnasseLights({ skyRadius = 3600 }: { skyRadius?: number }) {
  const active = useSceneStore(state => state.currentHdri === 'default' && state.layers.montparnasseLights);
  const group = useRef<THREE.Group>(null);
  const windows = useRef<THREE.PointsMaterial>(null);
  const beacon = useRef<THREE.PointsMaterial>(null);
  const [facade, summit] = useMemo(() => {
    const positions: number[] = [];
    for (let row = 0; row < 12; row++) {
      for (let column = 0; column < 3; column++) {
        positions.push(...panoramaPoint(841 + column * 1.5, 522 + row, skyRadius * 0.992));
      }
    }
    return [new Float32Array(positions), new Float32Array(panoramaPoint(843, 519.5, skyRadius * 0.992))];
  }, [skyRadius]);

  useFrame(({ clock }) => {
    const fade = THREE.MathUtils.clamp((0.45 - daylight(simulatedHour())) / 0.45, 0, 1);
    if (group.current) group.current.visible = Boolean(active) && fade > 0;
    if (windows.current) windows.current.opacity = fade * 0.55;
    if (beacon.current) beacon.current.opacity = fade * (0.2 + 0.8 * Math.pow((1 + Math.sin(clock.elapsedTime * Math.PI)) / 2, 4));
  });

  return (
    <group ref={group} name="MontparnasseLights" visible={false}>
      <points renderOrder={-960}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[facade, 3]} /></bufferGeometry>
        <pointsMaterial ref={windows} color="#ffe0ac" size={1.4} sizeAttenuation={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </points>
      <points renderOrder={-959}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[summit, 3]} /></bufferGeometry>
        <pointsMaterial ref={beacon} color="#ff3020" size={3} sizeAttenuation={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </points>
    </group>
  );
}
