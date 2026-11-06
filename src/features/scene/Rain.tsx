import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, BufferAttribute, LineBasicMaterial, LineSegments, Points, Raycaster, Vector3 } from 'three';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { useWeather } from './Weather';

const COUNT = 4000;
const HEIGHT = 1800;
const SPEED = 900; // cm/s, terminal speed of large raindrops

export function Rain({ snow = false }: { snow?: boolean }) {
  const lines = useRef<LineSegments | Points>(null!);
  const radius = snow ? HEIGHT / 2 : SKY_RADIUS;
  const drops = useMemo(() => Float32Array.from({ length: COUNT * 3 }, (_, i) => i % 3 === 1 ? Math.random() * HEIGHT : (Math.random() - 0.5) * radius * 2), [radius]);
  const vertices = useMemo(() => new Float32Array(COUNT * (snow ? 3 : 6)), [snow]);
  const ray = useMemo(() => new Raycaster(new Vector3(), new Vector3(0, -1, 0)), []);
  ray.layers.enableAll();
  const roofBounds = useMemo(() => new Box3(), []);
  useFrame(({ scene, camera }, delta) => {
    const { rain: rainfall, snow: snowfall, windSpeed, windDirection } = useWeather.getState();
    const rain = snow ? snowfall : rainfall;
    const speed = snow ? 100 : SPEED; // cm/s: slow flakes versus raindrops
    lines.current.visible = rain > 0;
    if (!rain) return;
    const roof = scene.getObjectByName('ceiling-group');
    if (roof) roofBounds.setFromObject(roof);
    const underRoof = (x: number, z: number) => !!roof && x >= roofBounds.min.x && x <= roofBounds.max.x && z >= roofBounds.min.z && z <= roofBounds.max.z;
    const angle = windDirection * Math.PI / 180;
    const dx = Math.cos(angle) * windSpeed * 100, dz = Math.sin(angle) * windSpeed * 100;
    const centerX = snow ? camera.position.x - SKY_CENTER[0] : 0;
    const centerZ = snow ? camera.position.z - SKY_CENTER[2] : 0;
    for (let i = 0; i < Math.floor(COUNT * rain); i++) {
      const k = i * 3, v = i * 6;
      drops[k] = ((drops[k] - centerX + dx * delta + radius) % (radius * 2) + radius * 2) % (radius * 2) - radius + centerX;
      drops[k + 2] = ((drops[k + 2] - centerZ + dz * delta + radius) % (radius * 2) + radius * 2) % (radius * 2) - radius + centerZ;
      drops[k + 1] = ((drops[k + 1] - speed * delta) % HEIGHT + HEIGHT) % HEIGHT;
      const x = drops[k] + SKY_CENTER[0], z = drops[k + 2] + SKY_CENTER[2], y = drops[k + 1];
      ray.ray.origin.set(x, HEIGHT, z);
      const hit = underRoof(x, z) ? ray.intersectObject(roof!, true)[0] : undefined;
      const floor = hit?.point.y ?? 0;
      if (snow) vertices.set([x, y < floor ? -HEIGHT : y, z], k);
      else vertices.set([x, Math.max(floor, y), z, x, Math.max(floor, y + SPEED * 0.025), z], v);
    }
    (lines.current.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    lines.current.geometry.setDrawRange(0, Math.floor(COUNT * rain) * (snow ? 1 : 2));
    (lines.current.material as LineBasicMaterial).opacity = 0.5;
  });
  if (snow) return <points ref={lines as React.RefObject<Points>} frustumCulled={false}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]} /></bufferGeometry>
    <pointsMaterial color="white" size={3} sizeAttenuation={false} transparent depthWrite={false} onBeforeCompile={shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_particle_fragment>', '#include <map_particle_fragment>\n diffuseColor.a *= 1.0 - smoothstep(0.3, 0.5, length(gl_PointCoord - vec2(0.5)));');
    }} />
  </points>;
  return <lineSegments ref={lines as React.RefObject<LineSegments>} frustumCulled={false}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]} /></bufferGeometry>
    <lineBasicMaterial color="#bed5ed" transparent depthWrite={false} />
  </lineSegments>;
}
