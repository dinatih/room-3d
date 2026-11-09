import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from './store/useSceneStore';
import { daylight, simulatedHour } from './DayNight';

// Coordonnées réelles de la Seine sur le panorama équirectangulaire HDR de Paris
// az: azimut en degrés, el: élévation en degrés
const SEINE_WAYPOINTS = [
  { az: 145.0, el: -16.8 }, // En amont vers BNF / Bercy
  { az: 152.0, el: -16.5 }, // Pont de Bercy / Austerlitz
  { az: 158.0, el: -15.1 }, // Gare d'Austerlitz
  { az: 163.0, el: -14.8 }, // Île de la Cité / Pont de Sully
  { az: 168.0, el: -14.6 }, // Pont Alexandre III / Invalides
  { az: 173.5, el: -12.8 }, // Pont d'Iéna (au pied de la Tour Eiffel)
  { az: 178.0, el: -11.4 }, // Pont de Bir-Hakeim
  { az: 183.0, el: -13.8 }, // Île aux Cygnes (centre)
  { az: 188.0, el: -15.3 }, // Pont de Grenelle / Maison de la Radio
  { az: 194.0, el: -12.8 }, // Pont Mirabeau
  { az: 200.0, el: -12.5 }, // Pont du Garigliano
  { az: 207.0, el: -14.2 }, // Issy-les-Moulineaux
  { az: 214.0, el: -16.5 }, // Aval vers Boulogne
];

function toSpherical(azimuthDeg: number, elevDeg: number, radius: number): [number, number, number] {
  const phi = (azimuthDeg * Math.PI) / 180;
  const theta = ((90 - elevDeg) * Math.PI) / 180;
  return [
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

interface BoatLightDef {
  fwd: number;
  side: number;
  up: number;
  color: [number, number, number];
}

const BOAT_LIGHTS: BoatLightDef[] = [
  { fwd: 9.0,  side: 0.0,  up: 0.6, color: [1.0, 0.98, 0.88] },  // Feu de proue blanc chaud
  { fwd: 7.0,  side: -1.8, up: 0.6, color: [1.0, 0.15, 0.15] },  // Bâbord (rouge)
  { fwd: 7.0,  side:  1.8, up: 0.6, color: [0.15, 1.0, 0.35] },  // Tribord (vert)
  { fwd: 1.5,  side: 0.0,  up: 1.0, color: [1.0, 0.85, 0.45] },  // Cabine / guirlande dorée
  { fwd: -3.5, side: 0.0,  up: 1.0, color: [1.0, 0.78, 0.38] },  // Cabine / guirlande ambrée
  { fwd: -9.0, side: 0.0,  up: 0.6, color: [1.0, 0.92, 0.82] },  // Poupe blanc chaud
];

const BOATS = [
  { speed: 0.012, phase: 0.08, upstream: false, lane: -1.2 }, // Aval (droite de navigation)
  { speed: 0.009, phase: 0.58, upstream: false, lane: -1.0 }, // Aval
  { speed: 0.011, phase: 0.32, upstream: true,  lane:  1.2 }, // Amont (droite de navigation)
  { speed: 0.010, phase: 0.82, upstream: true,  lane:  1.0 }, // Amont
];

const TOTAL_POINTS = BOATS.length * BOAT_LIGHTS.length * 2; // Lumières + reflets sur l'eau

export function SeineRiverBoats({ skyRadius = 3600 }: { skyRadius?: number }) {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const enabled = useSceneStore(state => state.layers.seineBoats ?? true);

  const pointsRef = useRef<THREE.Points>(null);
  const posAttrRef = useRef<THREE.BufferAttribute>(null);
  const colAttrRef = useRef<THREE.BufferAttribute>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const riverRadius = skyRadius * 0.992;

  const curve = useMemo(() => {
    const pts = SEINE_WAYPOINTS.map(w => new THREE.Vector3(...toSpherical(w.az, w.el, riverRadius)));
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  }, [riverRadius]);

  const glowMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => () => { glowMap?.dispose(); }, [glowMap]);

  const [positions, colors] = useMemo(() => {
    return [
      new Float32Array(TOTAL_POINTS * 3),
      new Float32Array(TOTAL_POINTS * 3),
    ];
  }, []);

  useFrame(({ clock }) => {
    const light = daylight(simulatedHour());
    const nightFade = THREE.MathUtils.clamp((0.45 - light) / 0.45, 0, 1);

    if (nightFade <= 0.001 || !enabled || currentHdri !== 'default') {
      if (pointsRef.current) pointsRef.current.visible = false;
      return;
    }

    if (pointsRef.current) pointsRef.current.visible = true;
    if (matRef.current) matRef.current.opacity = nightFade;

    const posAttr = posAttrRef.current;
    const colAttr = colAttrRef.current;
    if (!posAttr || !colAttr) return;

    const t = clock.elapsedTime;
    let pIdx = 0;

    const pos = new THREE.Vector3();
    const fwd = new THREE.Vector3();
    const up = new THREE.Vector3();
    const side = new THREE.Vector3();
    const pt = new THREE.Vector3();

    for (let b = 0; b < BOATS.length; b++) {
      const boat = BOATS[b];
      const rawU = (t * boat.speed + boat.phase) % 1;
      const u = boat.upstream ? (1 - rawU) : rawU;

      const edgeFade = THREE.MathUtils.smoothstep(u, 0.02, 0.09) * (1 - THREE.MathUtils.smoothstep(u, 0.91, 0.98));
      const ptOnCurve = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u);

      pos.copy(ptOnCurve).normalize().multiplyScalar(riverRadius);
      up.copy(pos).normalize();

      if (boat.upstream) {
        fwd.copy(tangent).negate().normalize();
      } else {
        fwd.copy(tangent).normalize();
      }
      side.crossVectors(fwd, up).normalize();

      pos.addScaledVector(side, boat.lane * 2.2);

      for (let l = 0; l < BOAT_LIGHTS.length; l++) {
        const bl = BOAT_LIGHTS[l];
        const flicker = 0.93 + 0.07 * Math.sin(t * 7 + b * 4 + l * 2.5);
        const alpha = edgeFade * flicker;

        // 1. Feu de la péniche
        pt.copy(pos)
          .addScaledVector(fwd, bl.fwd)
          .addScaledVector(side, bl.side)
          .addScaledVector(up, bl.up);

        posAttr.setXYZ(pIdx, pt.x, pt.y, pt.z);
        colAttr.setXYZ(pIdx, bl.color[0] * alpha, bl.color[1] * alpha, bl.color[2] * alpha);
        pIdx++;

        // 2. Reflet doux sur l'eau de la Seine (sous la ligne de flottaison)
        pt.copy(pos)
          .addScaledVector(fwd, bl.fwd)
          .addScaledVector(side, bl.side)
          .addScaledVector(up, -2.4);

        const reflAlpha = alpha * 0.32;
        posAttr.setXYZ(pIdx, pt.x, pt.y, pt.z);
        colAttr.setXYZ(pIdx, bl.color[0] * reflAlpha, bl.color[1] * reflAlpha, bl.color[2] * reflAlpha);
        pIdx++;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (currentHdri !== 'default' || !enabled) return null;

  return (
    <points ref={pointsRef} renderOrder={-960}>
      <bufferGeometry>
        <bufferAttribute
          ref={posAttrRef}
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          ref={colAttrRef}
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={4.8}
        sizeAttenuation={false}
        map={glowMap ?? undefined}
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthTest
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </points>
  );
}
