import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, LineSegments, Points, ShaderMaterial, Vector2, Vector4 } from 'three';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { CEILING_CANOPY, CEILING_Y, SLAB_FOOTPRINT } from './building/roofData';
import { useWeather } from './Weather';

const COUNT = 4000;
const HEIGHT = 1800;

export function Rain({ snow = false }: { snow?: boolean }) {
  const particles = useRef<LineSegments | Points>(null!);
  const material = useRef<ShaderMaterial>(null!);
  const radius = snow ? HEIGHT / 2 : SKY_RADIUS;
  const speed = snow ? 100 : 900; // terminal speed in cm/s
  const data = useMemo(() => {
    const positions = new Float32Array(COUNT * (snow ? 3 : 6));
    const ends = new Float32Array(COUNT * (snow ? 1 : 2));
    for (let i = 0; i < COUNT; i++) {
      const seed = [(Math.random() - 0.5) * radius * 2, Math.random() * HEIGHT, (Math.random() - 0.5) * radius * 2];
      positions.set(seed, i * (snow ? 3 : 6));
      if (!snow) { positions.set(seed, i * 6 + 3); ends[i * 2 + 1] = 1; }
    }
    return { positions, ends };
  }, [snow, radius]);
  const uniforms = useMemo(() => ({
    fall: { value: 0 }, drift: { value: new Vector2() }, center: { value: new Vector2() }, pointSize: { value: 3 },
    color: { value: new Color(snow ? 'white' : '#bed5ed') },
    roof: { value: SLAB_FOOTPRINT.map(([x, z]) => new Vector2(x, z)) },
    canopy: { value: new Vector4(CEILING_CANOPY.x, CEILING_CANOPY.z, CEILING_CANOPY.width / 2, CEILING_CANOPY.depth / 2) },
  }), [snow]);
  useFrame(({ camera, gl }, delta) => {
    const weather = useWeather.getState();
    const amount = snow ? weather.snow : weather.rain;
    particles.current.visible = amount > 0;
    if (!amount) return;
    const active = material.current.uniforms;
    active.fall.value = (active.fall.value + speed * delta) % HEIGHT;
    const angle = weather.windDirection * Math.PI / 180;
    active.drift.value.x = (active.drift.value.x + Math.cos(angle) * weather.windSpeed * 100 * delta) % (radius * 2);
    active.drift.value.y = (active.drift.value.y + Math.sin(angle) * weather.windSpeed * 100 * delta) % (radius * 2);
    active.center.value.set(snow ? camera.position.x : SKY_CENTER[0], snow ? camera.position.z : SKY_CENTER[2]);
    active.pointSize.value = 3 * gl.getPixelRatio();
    particles.current.geometry.setDrawRange(0, Math.floor(COUNT * amount) * (snow ? 1 : 2));
  });
  const geometry = <bufferGeometry>
    <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
    <bufferAttribute attach="attributes-endpoint" args={[data.ends, 1]} />
  </bufferGeometry>;
  const shader = <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false}
    vertexShader={`
      uniform float fall, pointSize; uniform vec2 drift, center; uniform vec2 roof[${SLAB_FOOTPRINT.length}]; uniform vec4 canopy;
      attribute float endpoint; varying float exposed;
      void main() {
        vec2 xz = mod(position.xz + drift - center + ${radius.toFixed(1)}, ${(radius * 2).toFixed(1)}) - ${radius.toFixed(1)} + center;
        bool inside = false;
        for (int i = 0, j = ${SLAB_FOOTPRINT.length - 1}; i < ${SLAB_FOOTPRINT.length}; j = i++) {
          vec2 a = roof[i], b = roof[j];
          if ((a.y > xz.y) != (b.y > xz.y) && xz.x < (b.x-a.x)*(xz.y-a.y)/(b.y-a.y)+a.x) inside = !inside;
        }
        float floorY = inside ? ${CEILING_Y.toFixed(1)} : 0.0;
        if (all(lessThanEqual(abs(xz - canopy.xy), canopy.zw))) floorY = ${(CEILING_Y + CEILING_CANOPY.height).toFixed(1)};
        float y = mod(position.y - fall, ${HEIGHT.toFixed(1)});
        exposed = step(floorY, y);
        y = max(floorY, y + endpoint * ${(speed * 0.025).toFixed(1)});
        gl_Position = projectionMatrix * modelViewMatrix * vec4(xz.x, y, xz.y, 1.0);
        gl_PointSize = pointSize;
      }`}
    fragmentShader={`
      uniform vec3 color; varying float exposed;
      void main() {
        if (exposed < 0.5) discard;
        float alpha = 0.5;
        ${snow ? 'alpha *= 1.0 - smoothstep(0.3, 0.5, length(gl_PointCoord - vec2(0.5)));' : ''}
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`} />;
  return snow
    ? <points ref={particles as React.RefObject<Points>} frustumCulled={false}>{geometry}{shader}</points>
    : <lineSegments ref={particles as React.RefObject<LineSegments>} frustumCulled={false}>{geometry}{shader}</lineSegments>;
}
