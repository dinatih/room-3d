import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from './store/useSceneStore';
import { daylight, simulatedHour } from './DayNight';

const AZ_CENTER = 173.14;
const STROBE_COUNT = 140;

function toSpherical(azimuthDeg: number, elevDeg: number, radius: number): [number, number, number] {
  const phi = (azimuthDeg * Math.PI) / 180;
  const theta = ((90 - elevDeg) * Math.PI) / 180;
  return [
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

export function EiffelTowerLights({ skyRadius = 3600 }: { skyRadius?: number }) {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const enabled = useSceneStore(state => state.layers.eiffelSparkle ?? true);

  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Group>(null);
  const beaconMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const strobeMatRef = useRef<THREE.ShaderMaterial>(null);

  const r = skyRadius * 0.988;

  // 1. Silhouette dorée (armature de la tour)
  const glowGeo = useMemo(() => {
    const levels = [
      { elev: -9.14, hw: 0.55 },
      { elev: -3.69, hw: 0.36 },
      { elev: 0.70, hw: 0.22 },
      { elev: 7.03, hw: 0.08 },
      { elev: 9.49, hw: 0.02 },
    ];
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i < levels.length; i++) {
      const { elev, hw } = levels[i];
      pos.push(...toSpherical(AZ_CENTER - hw, elev, r * 0.999));
      pos.push(...toSpherical(AZ_CENTER + hw, elev, r * 0.999));
      if (i < levels.length - 1) {
        const v = i * 2;
        idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    return geo;
  }, [r]);

  // 2. Particules de scintillement (flashs xénon ultra-rapides)
  const strobeGeo = useMemo(() => {
    const pos = new Float32Array(STROBE_COUNT * 3);
    const phases = new Float32Array(STROBE_COUNT);
    const speeds = new Float32Array(STROBE_COUNT);
    for (let i = 0; i < STROBE_COUNT; i++) {
      const t = Math.pow(Math.random(), 0.82);
      const elev = -9.14 + t * (9.49 - (-9.14));
      const hw = (1 - t) * 0.52;
      const az = AZ_CENTER + (Math.random() - 0.5) * 2 * hw;
      const [x, y, z] = toSpherical(az, elev, r);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 12.0 + Math.random() * 16.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    return geo;
  }, [r]);

  // Shader de scintillement optimisé
  const strobeMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      attribute float aPhase;
      attribute float aSpeed;
      varying float vFlash;
      void main() {
        float strobe = pow(max(0.0, sin(uTime * aSpeed + aPhase)), 22.0);
        vFlash = strobe;
        gl_PointSize = 3.2 + 5.0 * strobe;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vFlash;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if (length(coord) > 0.5) discard;
        float falloff = 1.0 - length(coord) * 2.0;
        vec3 col = mix(vec3(1.0, 0.88, 0.5), vec3(1.0, 1.0, 1.0), vFlash);
        gl_FragColor = vec4(col, uOpacity * falloff * (0.35 + 0.65 * vFlash));
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), []);

  // 3. Phare rotatif au sommet
  const summitPos = useMemo(() => new THREE.Vector3(...toSpherical(AZ_CENTER, 9.49, r)), [r]);
  const summitRot = useMemo(() => {
    const up = summitPos.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
  }, [summitPos]);

  const beaconGeo = useMemo(() => {
    const len = 1800;
    const hw = 50;
    const verts = new Float32Array([
      0, 0, 0,  len, 20, hw,  len, 20, -hw,
      0, 0, 0, -len, 20, -hw, -len, 20, hw,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    return geo;
  }, []);

  useFrame(({ clock }, delta) => {
    const light = daylight(simulatedHour());
    const nightFade = THREE.MathUtils.clamp((0.45 - light) / 0.45, 0, 1);

    if (groupRef.current) groupRef.current.visible = nightFade > 0.001;
    if (nightFade <= 0.001) return;

    if (strobeMatRef.current) {
      strobeMatRef.current.uniforms.uTime.value = clock.elapsedTime;
      strobeMatRef.current.uniforms.uOpacity.value = nightFade;
    }
    if (glowMatRef.current) glowMatRef.current.opacity = 0.32 * nightFade;
    if (beaconMatRef.current) beaconMatRef.current.opacity = 0.18 * nightFade;
    if (beaconRef.current) beaconRef.current.rotation.y += delta * 0.4;
  });

  if (currentHdri !== 'default' || !enabled) return null;

  return (
    <group ref={groupRef} name="EiffelTowerLights">
      {/* Illumination dorée de base */}
      <mesh geometry={glowGeo} renderOrder={-970}>
        <meshBasicMaterial
          ref={glowMatRef}
          color="#ffaa33"
          side={THREE.DoubleSide}
          transparent
          opacity={0}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Flashs scintillants (strobe) */}
      <points
        geometry={strobeGeo}
        material={strobeMaterial}
        ref={(el) => { if (el) (strobeMatRef as React.MutableRefObject<THREE.ShaderMaterial>).current = el.material as THREE.ShaderMaterial; }}
        renderOrder={-960}
      />

      {/* Phare rotatif au sommet */}
      <group position={summitPos} quaternion={summitRot}>
        <group ref={beaconRef}>
          <mesh geometry={beaconGeo} renderOrder={-950}>
            <meshBasicMaterial
              ref={beaconMatRef}
              color="#eaf3ff"
              side={THREE.DoubleSide}
              transparent
              opacity={0}
              depthTest
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
