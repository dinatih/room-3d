import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from './store/useSceneStore';
import { daylight, simulatedHour } from './astronomy';

// Structure visible relevée dans le HDR 7978 × 3989, sans remplir les arches.
const STRUCTURE = [
  [[3847, 1974], [3847, 2006]],
  [[3839, 2008], [3847, 2005], [3855, 2009], [3853, 2018], [3841, 2018], [3839, 2008]],
  [[3841, 2018], [3841, 2050], [3838, 2090], [3833, 2130], [3827, 2161]],
  [[3853, 2018], [3855, 2050], [3858, 2090], [3863, 2130], [3870, 2161]],
  [[3842, 2024], [3856, 2055], [3838, 2090], [3862, 2125], [3828, 2160]],
  [[3853, 2024], [3840, 2055], [3858, 2090], [3834, 2125], [3869, 2160]],
  [[3825, 2162], [3870, 2165], [3868, 2171], [3826, 2169], [3825, 2162]],
  [[3826, 2171], [3804, 2211], [3774, 2255]],
  [[3837, 2171], [3820, 2214], [3790, 2255]],
  [[3842, 2170], [3836, 2220], [3837, 2273]],
  [[3852, 2170], [3853, 2220], [3852, 2273]],
  [[3858, 2170], [3870, 2212], [3897, 2261]],
  [[3868, 2170], [3885, 2210], [3912, 2263]],
  [[3804, 2211], [3838, 2220], [3894, 2214], [3885, 2210]],
  [[3804, 2216], [3838, 2225], [3894, 2219]],
  [[3778, 2254], [3794, 2237], [3809, 2233], [3825, 2242], [3839, 2267]],
  [[3852, 2268], [3863, 2242], [3880, 2235], [3895, 2243], [3909, 2262]],
] as const;

function panoramaPoint(x: number, y: number, radius: number) {
  const az = x / 7978 * Math.PI * 2, el = (0.5 - y / 3989) * Math.PI;
  return new THREE.Vector3(-radius * Math.cos(az) * Math.cos(el), radius * Math.sin(el), radius * Math.sin(az) * Math.cos(el));
}

export function EiffelTowerLights({ skyRadius = 3600 }: { skyRadius?: number }) {
  const active = useSceneStore(state => state.currentHdri === 'default' && state.layers.eiffelSparkle);
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Group>(null);
  const eastWallLightRef = useRef<THREE.PointLight>(null);
  const radius = skyRadius * 0.992;
  const summit = useMemo(() => panoramaPoint(3847, 2008, radius), [radius]);
  const [structure, lighting, beam, beamMaterial] = useMemo(() => {
    const positions: number[] = [];
    for (const path of STRUCTURE) for (let i = 1; i < path.length; i++) {
      const [x, y] = path[i - 1], [endX, endY] = path[i];
      // Deux pixels du HDR 8k entre les points gardent la structure fine.
      const steps = Math.ceil(Math.hypot(endX - x, endY - y) / 2);
      for (let step = 0; step < steps; step++) positions.push(...panoramaPoint(x + (endX - x) * step / steps, y + (endY - y) * step / steps, radius).toArray());
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // L'angle d'or répartit les phases sans tirage aléatoire au remontage.
    geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(Array.from({ length: positions.length / 3 }, (_, i) => i * Math.PI * (3 - Math.sqrt(5))), 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        attribute float aPhase;
        varying float vFlash;
        void main() {
          vFlash = pow(max(0.0, sin(uTime * (0.9 + 0.5 * sin(aPhase)) + aPhase)), 48.0);
          gl_PointSize = 2.2 + 2.8 * vFlash;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uOpacity;
        varying float vFlash;
        void main() {
          float halo = max(0.0, 1.0 - length(gl_PointCoord - 0.5) * 2.0);
          vec3 color = mix(vec3(1.0, 0.72, 0.36), vec3(1.0), vFlash);
          gl_FragColor = vec4(color, uOpacity * halo * (0.72 + 0.28 * vFlash));
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    const vertices: number[] = [], coordinates: number[] = [];
    const length = 3900, halfWidth = 14, tilt = THREE.MathUtils.degToRad(2.2);
    for (const direction of [-1, 1]) {
      const x = direction * length * Math.cos(tilt), y = length * Math.sin(tilt);
      vertices.push(0, 0, 0, x, y, -halfWidth, x, y, halfWidth,
        0, 0, 0, x - direction * halfWidth * Math.sin(tilt), y + halfWidth * Math.cos(tilt), 0,
        x + direction * halfWidth * Math.sin(tilt), y - halfWidth * Math.cos(tilt), 0);
      coordinates.push(0, 0, -1, 1, 1, 1, 0, 0, -1, 1, 1, 1);
    }
    const beamGeometry = new THREE.BufferGeometry();
    beamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    beamGeometry.setAttribute('aBeam', new THREE.Float32BufferAttribute(coordinates, 2));
    const beamShader = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: `
        attribute vec2 aBeam;
        varying vec2 vBeam;
        void main() { vBeam = aBeam; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uOpacity;
        varying vec2 vBeam;
        void main() {
          float fade = pow(1.0 - abs(vBeam.x), 2.0) * pow(1.0 - vBeam.y, 2.0);
          gl_FragColor = vec4(0.72, 0.83, 1.0, uOpacity * fade);
        }`,
      side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    return [geometry, material, beamGeometry, beamShader];
  }, [radius]);
  useEffect(() => () => { structure.dispose(); lighting.dispose(); beam.dispose(); beamMaterial.dispose(); }, [structure, lighting, beam, beamMaterial]);

  useFrame(({ clock }) => {
    const fade = active ? THREE.MathUtils.clamp((0.45 - daylight(simulatedHour())) / 0.45, 0, 1) : 0;
    if (groupRef.current) groupRef.current.visible = fade > 0;
    lighting.uniforms.uTime.value = clock.elapsedTime;
    lighting.uniforms.uOpacity.value = fade;
    beamMaterial.uniforms.uOpacity.value = fade * 0.12;
    const angle = clock.elapsedTime * Math.PI * 2 / 60;
    if (beaconRef.current) beaconRef.current.rotation.y = angle;
    if (eastWallLightRef.current) eastWallLightRef.current.intensity = Math.pow(Math.abs(Math.cos(angle + 3.028)), 40) * 8 * fade;
  });

  return (
    <>
      <pointLight ref={eastWallLightRef} position={[320, 160, 50]} distance={900} decay={1.2} color="#eaf3ff" intensity={0} />
      <group ref={groupRef} name="EiffelTowerLights" visible={false}>
        <points geometry={structure} material={lighting} renderOrder={-960} />
        <group position={summit}>
          <group ref={beaconRef}><mesh geometry={beam} material={beamMaterial} renderOrder={-950} /></group>
        </group>
      </group>
    </>
  );
}
