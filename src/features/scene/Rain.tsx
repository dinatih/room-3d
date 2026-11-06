import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box3, BufferAttribute, LineBasicMaterial, LineSegments, Raycaster, Vector3 } from 'three';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';
import { useWeather } from './Weather';

const COUNT = 4000;
const HEIGHT = 1800;
const SPEED = 900; // cm/s, terminal speed of large raindrops

export function Rain() {
  const lines = useRef<LineSegments>(null!);
  const drops = useMemo(() => Float32Array.from({ length: COUNT * 3 }, (_, i) => i % 3 === 1 ? Math.random() * HEIGHT : (Math.random() - 0.5) * SKY_RADIUS * 2), []);
  const vertices = useMemo(() => new Float32Array(COUNT * 6), []);
  const ray = useMemo(() => new Raycaster(new Vector3(), new Vector3(0, -1, 0)), []);
  const roofBounds = useMemo(() => new Box3(), []);
  const audio = useRef<{ context: AudioContext; gain: GainNode; source: AudioBufferSourceNode } | null>(null);
  useEffect(() => {
    const start = () => {
      if (!audio.current && useWeather.getState().rainVolume > 0) {
        const context = new AudioContext();
        const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource();
        source.buffer = buffer; source.loop = true;
        const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1800;
        const gain = context.createGain(); gain.gain.value = 0;
        source.connect(filter).connect(gain).connect(context.destination); source.start();
        audio.current = { context, gain, source };
      }
      if (audio.current) void audio.current.context.resume().catch(console.error);
    };
    document.addEventListener('pointerup', start);
    document.addEventListener('keyup', start);
    return () => {
      document.removeEventListener('pointerup', start); document.removeEventListener('keyup', start);
      if (audio.current) { audio.current.source.stop(); void audio.current.context.close(); audio.current = null; }
    };
  }, []);
  useFrame(({ scene, camera }, delta) => {
    const { rain, rainVolume, windSpeed, windDirection } = useWeather.getState();
    lines.current.visible = rain > 0;
    const roof = scene.getObjectByName('ceiling-group');
    if (roof) roofBounds.setFromObject(roof);
    const underRoof = (x: number, z: number) => !!roof && x >= roofBounds.min.x && x <= roofBounds.max.x && z >= roofBounds.min.z && z <= roofBounds.max.z;
    ray.ray.origin.set(camera.position.x, HEIGHT, camera.position.z);
    const indoors = underRoof(camera.position.x, camera.position.z) && ray.intersectObject(roof!, true).some(hit => camera.position.y < hit.point.y);
    if (audio.current) audio.current.gain.gain.setTargetAtTime(document.hidden ? 0 : rain * rainVolume * (indoors ? 0.08 : 0.3), audio.current.context.currentTime, 0.25);
    if (!rain) return;
    const angle = windDirection * Math.PI / 180;
    const dx = Math.cos(angle) * windSpeed * 100, dz = Math.sin(angle) * windSpeed * 100;
    for (let i = 0; i < Math.floor(COUNT * rain); i++) {
      const k = i * 3, v = i * 6;
      drops[k] = ((drops[k] + dx * delta + SKY_RADIUS) % (SKY_RADIUS * 2) + SKY_RADIUS * 2) % (SKY_RADIUS * 2) - SKY_RADIUS;
      drops[k + 2] = ((drops[k + 2] + dz * delta + SKY_RADIUS) % (SKY_RADIUS * 2) + SKY_RADIUS * 2) % (SKY_RADIUS * 2) - SKY_RADIUS;
      drops[k + 1] = ((drops[k + 1] - SPEED * delta) % HEIGHT + HEIGHT) % HEIGHT;
      const x = drops[k] + SKY_CENTER[0], z = drops[k + 2] + SKY_CENTER[2], y = drops[k + 1];
      ray.ray.origin.set(x, HEIGHT, z);
      const hit = underRoof(x, z) ? ray.intersectObject(roof!, true)[0] : undefined;
      const floor = hit?.point.y ?? 0;
      vertices.set([x, Math.max(floor, y), z, x, Math.max(floor, y + SPEED * 0.025), z], v);
    }
    (lines.current.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    lines.current.geometry.setDrawRange(0, Math.floor(COUNT * rain) * 2);
    (lines.current.material as LineBasicMaterial).opacity = 0.5;
  });
  return <lineSegments ref={lines} frustumCulled={false}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]} /></bufferGeometry>
    <lineBasicMaterial color="#bed5ed" transparent depthWrite={false} />
  </lineSegments>;
}
