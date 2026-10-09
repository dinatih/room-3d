import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OccupancyManager } from '../ai/occupancyManager';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';
import { cameraState } from '../cameraState';
import { resolveAnimationId } from '../animations/animationResolver';

const STEAM_DELAY = 10;
const STEAM_CHANCE = 0.5;
const DROPS_PER_SECOND = 180;
const GRAVITY = 981; // cm/s²
const INITIAL_SPEED = 120; // cm/s
const STEAM_PUFFS = 24;

export interface ShowerHumidity {
  amount: number;
}

/** Matériau propre à chaque cabine, aussi partagé par ses deux vitres. */
export function createCondensationMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { amount: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float amount; varying vec2 vUv;
      void main() {
        float cloud = 0.65 + 0.18 * sin(vUv.x * 19.0 + sin(vUv.y * 13.0))
                           + 0.12 * sin(vUv.y * 31.0 + sin(vUv.x * 23.0));
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(0.0, 0.12, 1.0-vUv.x)
                   * smoothstep(0.0, 0.1, vUv.y) * smoothstep(0.0, 0.1, 1.0-vUv.y);
        float runs = pow(0.5 + 0.5 * sin(vUv.x * 260.0 + sin(vUv.y * 5.0)), 18.0);
        gl_FragColor = vec4(0.91, 0.96, 0.98, amount * edge * (cloud * 0.65 + runs * 0.12));
      }`,
  });
}

export function ShowerEffects({ origin, humidity, condensation, isPreview }: {
  origin: THREE.Vector3;
  humidity: ShowerHumidity;
  condensation: THREE.ShaderMaterial;
  isPreview: boolean;
}) {
  const { invalidate } = useThree();
  const waterRef = useRef<THREE.LineSegments>(null!);
  const steamRef = useRef<THREE.Points>(null!);
  const session = useRef({ elapsed: 0, running: false, steam: false, decided: false, time: 0 });
  const { waterGeometry, waterMaterial, steamGeometry, steamMaterial } = useMemo(() => {
    // Une population couvrant le temps de chute depuis la douchette jusqu'au bac.
    const flightTime = (Math.sqrt(INITIAL_SPEED ** 2 + 2 * GRAVITY * 220) - INITIAL_SPEED) / GRAVITY;
    const count = Math.ceil(DROPS_PER_SECOND * flightTime);
    const waterGeometry = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 6);
    const tips = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const seed = [Math.random(), Math.random(), Math.random()];
      seeds.set(seed, i * 6);
      seeds.set(seed, i * 6 + 3);
      tips[i * 2 + 1] = 1;
    }
    waterGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    waterGeometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 3));
    waterGeometry.setAttribute('tip', new THREE.BufferAttribute(tips, 1));
    const waterMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { time: { value: 0 }, origin: { value: origin }, flight: { value: flightTime } },
      vertexShader: `attribute vec3 seed; attribute float tip;
        uniform float time; uniform float flight; uniform vec3 origin; varying float alpha;
        void main() {
          float t = fract(time / flight + seed.x) * flight;
          float angle = seed.y * 6.283185;
          float r = sqrt(seed.z) * 4.5;
          vec3 p = origin + vec3(cos(angle)*r, 0.0, sin(angle)*r);
          p += vec3(cos(angle)*t*16.0, -120.0*t-490.5*t*t, -t*45.0+sin(angle)*t*12.0);
          p.y -= tip * (1.0 + t * 5.0);
          alpha = smoothstep(15.0, 22.0, p.y) * (0.35 + seed.z * 0.4);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `varying float alpha; void main() { gl_FragColor = vec4(0.66, 0.86, 1.0, alpha); }`,
    });
    const steamGeometry = new THREE.BufferGeometry();
    const steamSeeds = new Float32Array(STEAM_PUFFS * 3);
    for (let i = 0; i < steamSeeds.length; i++) steamSeeds[i] = Math.random();
    steamGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STEAM_PUFFS * 3), 3));
    steamGeometry.setAttribute('seed', new THREE.BufferAttribute(steamSeeds, 3));
    const steamMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { time: { value: 0 }, amount: { value: 0 }, height: { value: 0 } },
      vertexShader: `attribute vec3 seed; uniform float time; uniform float height; varying float fade;
        void main() {
          float age = fract(time / 7.0 + seed.x);
          vec3 p = vec3((seed.y-0.5)*48.0 + sin(age*6.0+seed.z*6.0)*6.0,
                        40.0 + age*160.0, (seed.z-0.5)*45.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (18.0+age*22.0) * height * projectionMatrix[1][1] / (2.0*-mv.z);
          fade = sin(age*3.141593);
        }`,
      fragmentShader: `uniform float amount; varying float fade;
        void main() {
          float r = length(gl_PointCoord-0.5)*2.0;
          float opacity = (1.0-smoothstep(0.0, 1.0, r)) * fade * amount * 0.16;
          gl_FragColor = vec4(0.95, 0.98, 1.0, opacity);
        }`,
    });
    return { waterGeometry, waterMaterial, steamGeometry, steamMaterial };
  }, [origin]);

  useEffect(() => () => {
    waterGeometry.dispose(); waterMaterial.dispose();
    steamGeometry.dispose(); steamMaterial.dispose();
  }, [waterGeometry, waterMaterial, steamGeometry, steamMaterial]);

  useFrame((state, delta) => {
    const running = !isPreview && SMART_OBJECTS.shower.slots.some(slot => {
      const occupant = OccupancyManager.getOccupant('shower', slot.slotId);
      // La réservation commence pendant la marche ; l'eau attend l'animation de douche.
      return occupant && cameraState.positions[occupant]?.anim === resolveAnimationId(slot.animation!);
    });
    const s = session.current;
    if (running !== s.running) {
      s.elapsed = 0;
      s.steam = false;
      s.decided = false;
      s.running = running;
    }
    s.time += delta;
    if (running) {
      s.elapsed += delta;
      if (s.elapsed >= STEAM_DELAY && !s.decided) {
        s.decided = true;
        s.steam = Math.random() < STEAM_CHANCE;
      }
    }
    const target = running && s.steam ? 1 : 0;
    humidity.amount = THREE.MathUtils.damp(humidity.amount, target, target ? 0.35 : 0.25, delta);
    if (target === 0 && humidity.amount < 0.001) humidity.amount = 0;
    waterRef.current.visible = running;
    steamRef.current.visible = humidity.amount > 0;
    waterMaterial.uniforms.time.value = s.time;
    steamMaterial.uniforms.time.value = s.time;
    steamMaterial.uniforms.amount.value = humidity.amount;
    steamMaterial.uniforms.height.value = state.size.height * state.gl.getPixelRatio();
    condensation.uniforms.amount.value = humidity.amount;
    if (running || humidity.amount > 0) invalidate();
  });

  return <group userData={{ skipMerge: true }}>
    <lineSegments name="shower-water" ref={waterRef} visible={false} geometry={waterGeometry} material={waterMaterial} frustumCulled={false} raycast={() => {}} />
    <points name="shower-steam" ref={steamRef} visible={false} geometry={steamGeometry} material={steamMaterial} frustumCulled={false} raycast={() => {}} />
  </group>;
}
