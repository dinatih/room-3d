import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, ShaderMaterial, Vector2 } from 'three';
import { create } from 'zustand';
import { CategoryLayerGroup } from './sceneLayer';
import { LAYER_ENVIRONMENT } from '@config';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { daylight, simulatedHour } from './DayNight';

export const useWeather = create(() => ({ coverage: 0.35, windSpeed: 3, windDirection: 90 }));
const settings = [
  { key: 'coverage', label: 'Couverture nuageuse', max: 1, step: 0.01, unit: '' },
  { key: 'windSpeed', label: 'Vent', max: 20, step: 0.5, unit: ' m/s' },
  { key: 'windDirection', label: 'Direction du vent', max: 360, step: 1, unit: '°' },
] as const;

export function WeatherControls() {
  const weather = useWeather();
  return <fieldset className="p-2 border-bottom" onKeyDown={event => event.stopPropagation()}>
    <legend className="small fw-semibold mb-1">Nuages et vent</legend>
    {settings.map(({ key, label, max, step, unit }) => <div key={key}>
      <label className="small form-label mb-0" htmlFor={`weather-${key}`}>{label} : {key === 'coverage' ? `${Math.round(weather[key] * 100)} %` : `${weather[key]}${unit}`}</label>
      <input id={`weather-${key}`} className="form-range" type="range" min={0} max={max} step={step} value={weather[key]} onChange={event => useWeather.setState({ [key]: Number(event.target.value) })} />
    </div>)}
  </fieldset>;
}

export function Weather() {
  const material = useRef<ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({ offset: { value: new Vector2() }, coverage: { value: 0 }, tint: { value: new Color() } }), []);
  useFrame((_, delta) => {
    const { coverage, windSpeed, windDirection } = useWeather.getState();
    const direction = windDirection * Math.PI / 180;
    // m/s to scene centimetres; drift stays continuous when wind settings change.
    uniforms.offset.value.x += Math.cos(direction) * windSpeed * 100 * delta;
    uniforms.offset.value.y += Math.sin(direction) * windSpeed * 100 * delta;
    uniforms.coverage.value = coverage;
    uniforms.tint.value.set('#182338').lerp(new Color('#edf1f5'), daylight(simulatedHour()));
  });
  return <CategoryLayerGroup layer={LAYER_ENVIRONMENT} register={false}>
    <mesh position={SKY_CENTER} renderOrder={-800} userData={{ isSky: true }}>
      <sphereGeometry args={[SKY_RADIUS * 0.75, 48, 32]} />
      <shaderMaterial ref={material} uniforms={uniforms} side={BackSide} transparent depthWrite={false}
        vertexShader={`varying vec3 direction; void main() { direction = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec3 direction; uniform vec2 offset; uniform float coverage; uniform vec3 tint;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
          }
          void main() {
            vec3 ray = normalize(direction);
            if (ray.y <= 0.0) discard;
            vec2 p = ray.xz / max(ray.y, 0.05) * 3.0 + offset / 3000.0;
            float density = noise(p)*0.57 + noise(p*2.0)*0.28 + noise(p*4.0)*0.15;
            float alpha = smoothstep(1.0-coverage, 1.15-coverage, density) * smoothstep(0.0, 0.2, ray.y) * coverage;
            gl_FragColor = vec4(tint, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`} />
    </mesh>
  </CategoryLayerGroup>;
}
