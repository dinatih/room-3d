import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from './store/useSceneStore';
import { daylight, simulatedHour } from './DayNight';

const AZ_CENTER = 174.31;
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
  const lanternMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const strobeMatRef = useRef<THREE.ShaderMaterial>(null);
  const eastWallLightRef = useRef<THREE.PointLight>(null);

  const r = skyRadius * 0.988;

  // 1. Silhouette dorée (corps supérieur + piliers évasés et arche)
  const glowGeo = useMemo(() => {
    const upperLevels = [
      { elev: -3.69, hw: 0.42 },
      { elev: 0.70, hw: 0.25 },
      { elev: 7.03, hw: 0.10 },
      { elev: 9.49, hw: 0.02 },
    ];
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i < upperLevels.length; i++) {
      const { elev, hw } = upperLevels[i];
      pos.push(...toSpherical(AZ_CENTER - hw, elev, r * 0.999));
      pos.push(...toSpherical(AZ_CENTER + hw, elev, r * 0.999));
      if (i < upperLevels.length - 1) {
        const v = i * 2;
        idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
      }
    }
    // Pilier gauche (-9.14 à -3.69)
    const baseOffset = pos.length / 3;
    pos.push(
      ...toSpherical(AZ_CENTER - 0.75, -9.14, r * 0.999),
      ...toSpherical(AZ_CENTER - 0.38, -9.14, r * 0.999),
      ...toSpherical(AZ_CENTER - 0.42, -3.69, r * 0.999),
      ...toSpherical(AZ_CENTER - 0.12, -3.69, r * 0.999)
    );
    idx.push(baseOffset, baseOffset + 1, baseOffset + 2, baseOffset + 1, baseOffset + 3, baseOffset + 2);
    // Pilier droit (-9.14 à -3.69)
    const rOffset = pos.length / 3;
    pos.push(
      ...toSpherical(AZ_CENTER + 0.38, -9.14, r * 0.999),
      ...toSpherical(AZ_CENTER + 0.75, -9.14, r * 0.999),
      ...toSpherical(AZ_CENTER + 0.12, -3.69, r * 0.999),
      ...toSpherical(AZ_CENTER + 0.42, -3.69, r * 0.999)
    );
    idx.push(rOffset, rOffset + 1, rOffset + 2, rOffset + 1, rOffset + 3, rOffset + 2);
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
      let az: number;
      if (elev < -3.69) {
        const sign = Math.random() > 0.5 ? 1 : -1;
        const normBase = (elev - (-9.14)) / (-3.69 - (-9.14));
        const pillarMid = 0.56 - normBase * 0.29;
        az = AZ_CENTER + sign * (pillarMid + (Math.random() - 0.5) * 0.22);
      } else {
        const hw = (1 - t) * 0.45;
        az = AZ_CENTER + (Math.random() - 0.5) * 2 * hw;
      }
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

  // 3. Phare rotatif au sommet (axe vertical monde, inclinaison ascendante vers le ciel)
  const summitPos = useMemo(() => new THREE.Vector3(...toSpherical(AZ_CENTER, 9.49, r)), [r]);

  const beaconGeo = useMemo(() => {
    const len = 1500;
    const tipR = 38;
    const tilt = 7.5 * (Math.PI / 180); // +7.5° d'élévation ascendante vers le ciel
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const verts: number[] = [];
    const colors: number[] = [];

    const addBeam = (dirX: number) => {
      const ex = dirX * len * cosT;
      const ey = len * sinT;
      const nx = -sinT * dirX * tipR;
      const ny = cosT * tipR;
      // Plan 1 (horizontal en Z)
      verts.push(0, 0, 0, ex, ey, -tipR, ex, ey, tipR);
      // Plan 2 (perpendiculaire à l'axe du faisceau)
      verts.push(0, 0, 0, ex + nx, ey + ny, 0, ex - nx, ey - ny, 0);
      // Dégradé : blanc bleuté au sommet -> atténuation vers l'obscurité
      const cApex = [0.95, 0.98, 1.0];
      const cTip = [0.02, 0.05, 0.10];
      for (let i = 0; i < 2; i++) colors.push(...cApex, ...cTip, ...cTip);
    };

    addBeam(1);
    addBeam(-1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
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
    if (beaconMatRef.current) beaconMatRef.current.opacity = 0.22 * nightFade;
    if (lanternMatRef.current) lanternMatRef.current.opacity = 0.9 * nightFade;
    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 0.35;
      // Balayage lumineux sur le mur Est : pic quand l'un des deux faisceaux traverse l'azimut de l'appartement
      const sweep = Math.pow(Math.abs(Math.cos(beaconRef.current.rotation.y - (-3.052))), 48.0);
      if (eastWallLightRef.current) {
        eastWallLightRef.current.intensity = sweep * 1.8 * nightFade;
      }
    }
  });

  if (currentHdri !== 'default' || !enabled) return null;

  return (
    <group ref={groupRef} name="EiffelTowerLights">
      {/* Balayage lumineux du phare sur le mur Est de l'appartement */}
      <pointLight
        ref={eastWallLightRef}
        position={[240, 140, 50]}
        distance={380}
        decay={1.6}
        color="#dce9ff"
        intensity={0}
      />

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

      {/* Phare rotatif au sommet (rotation horizontale, incliné vers le ciel) */}
      <group position={summitPos}>
        {/* Ampoule éclatante de la lanterne */}
        <mesh renderOrder={-945}>
          <sphereGeometry args={[10, 16, 12]} />
          <meshBasicMaterial
            ref={lanternMatRef}
            color="#ffffff"
            transparent
            opacity={0}
            depthTest
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* Faisceaux volumétriques rotatifs */}
        <group ref={beaconRef}>
          <mesh geometry={beaconGeo} renderOrder={-950}>
            <meshBasicMaterial
              ref={beaconMatRef}
              vertexColors
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
