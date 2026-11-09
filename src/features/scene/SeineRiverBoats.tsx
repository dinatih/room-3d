import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from './store/useSceneStore';
import { daylight, simulatedHour } from './DayNight';

// Centre du chenal relevé sur le HDR équirectangulaire 2048 × 1024.
// La boucle aval revient vers des azimuts décroissants : ce n'est pas une sinusoïde.
const SEINE_WAYPOINTS = [
  [650, 618], [700, 620], [750, 619], [800, 617], [850, 615],
  [900, 611], [950, 606], [987, 600], // Au pied de la Tour Eiffel
  [1020, 593], [1050, 585], [1075, 576], [1090, 568],
  [1095, 560], [1087, 553], [1074, 547], [1066, 544],
].map(([x, y]) => ({ az: x / 2048 * 360, el: 90 - y / 1024 * 180 }));

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
  { fwd: 9.0,  side: 0.0,  up: 0.6, color: [1.0, 0.98, 0.88] },  // Proue blanc chaud
  { fwd: 7.0,  side: -1.8, up: 0.6, color: [1.0, 0.15, 0.15] },  // Bâbord (rouge)
  { fwd: 7.0,  side:  1.8, up: 0.6, color: [0.15, 1.0, 0.35] },  // Tribord (vert)
  { fwd: 1.5,  side: 0.0,  up: 1.0, color: [1.0, 0.85, 0.45] },  // Guirlande dorée
  { fwd: -3.5, side: 0.0,  up: 1.0, color: [1.0, 0.78, 0.38] },  // Guirlande ambrée
  { fwd: -9.0, side: 0.0,  up: 0.6, color: [1.0, 0.92, 0.82] },  // Poupe blanc chaud
];

const BOATS = [
  { speed: 0.010, phase: 0.08, upstream: false, lane: -1.0 }, // Aval
  { speed: 0.008, phase: 0.58, upstream: false, lane: -0.8 }, // Aval
  { speed: 0.009, phase: 0.32, upstream: true,  lane:  1.0 }, // Amont
  { speed: 0.007, phase: 0.82, upstream: true,  lane:  0.8 }, // Amont
];

const TOTAL_POINTS = BOATS.length * BOAT_LIGHTS.length * 2;

export function SeineRiverBoats({ skyRadius = 3600 }: { skyRadius?: number }) {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const enabled = useSceneStore(state => state.layers.seineBoats ?? true);
  const showDebug = useSceneStore(state => state.layers.seineDebugPath);

  const pointsRef = useRef<THREE.Points>(null);
  const posAttrRef = useRef<THREE.BufferAttribute>(null);
  const colAttrRef = useRef<THREE.BufferAttribute>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const riverRadius = skyRadius * 0.992;

  const curve = useMemo(() => {
    const pts = SEINE_WAYPOINTS.map(w => new THREE.Vector3(...toSpherical(w.az, w.el, riverRadius)));
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  }, [riverRadius]);

  // Tracé et contours du fleuve (ruban de surface, berges gauche/droite et waypoints)
  const debugGeometries = useMemo(() => {
    const SAMPLES = 90;
    const HALF_WIDTH = 10;
    const ribbonPos: number[] = [];
    const ribbonIdx: number[] = [];
    const bankL: number[] = [];
    const bankR: number[] = [];
    const center: number[] = [];

    const up = new THREE.Vector3();
    const fwd = new THREE.Vector3();
    const side = new THREE.Vector3();
    const pL = new THREE.Vector3();
    const pR = new THREE.Vector3();

    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES;
      const pt = curve.getPointAt(u).normalize().multiplyScalar(riverRadius);
      const tan = curve.getTangentAt(u).normalize();
      up.copy(pt).normalize();
      fwd.copy(tan);
      side.crossVectors(fwd, up).normalize();

      pL.copy(pt).addScaledVector(side, HALF_WIDTH).normalize().multiplyScalar(riverRadius);
      pR.copy(pt).addScaledVector(side, -HALF_WIDTH).normalize().multiplyScalar(riverRadius);

      ribbonPos.push(pL.x, pL.y, pL.z, pR.x, pR.y, pR.z);
      bankL.push(pL.x, pL.y, pL.z);
      bankR.push(pR.x, pR.y, pR.z);
      center.push(pt.x, pt.y, pt.z);

      if (i < SAMPLES) {
        const base = i * 2;
        ribbonIdx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }

    const lineIdx: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      lineIdx.push(i, i + 1);
    }

    const ribbonGeo = new THREE.BufferGeometry();
    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribbonPos, 3));
    ribbonGeo.setIndex(ribbonIdx);

    const bankLGeo = new THREE.BufferGeometry();
    bankLGeo.setAttribute('position', new THREE.Float32BufferAttribute(bankL, 3));
    bankLGeo.setIndex(lineIdx);

    const bankRGeo = new THREE.BufferGeometry();
    bankRGeo.setAttribute('position', new THREE.Float32BufferAttribute(bankR, 3));
    bankRGeo.setIndex(lineIdx);

    const centerGeo = new THREE.BufferGeometry();
    centerGeo.setAttribute('position', new THREE.Float32BufferAttribute(center, 3));
    centerGeo.setIndex(lineIdx);

    const wpPos: number[] = [];
    for (const w of SEINE_WAYPOINTS) {
      wpPos.push(...toSpherical(w.az, w.el, riverRadius));
    }
    const wpGeo = new THREE.BufferGeometry();
    wpGeo.setAttribute('position', new THREE.Float32BufferAttribute(wpPos, 3));

    return { ribbonGeo, bankLGeo, bankRGeo, centerGeo, wpGeo };
  }, [curve, riverRadius]);

  useEffect(() => () => {
    debugGeometries.ribbonGeo.dispose();
    debugGeometries.bankLGeo.dispose();
    debugGeometries.bankRGeo.dispose();
    debugGeometries.centerGeo.dispose();
    debugGeometries.wpGeo.dispose();
  }, [debugGeometries]);

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
    if (currentHdri !== 'default') return;

    const light = daylight(simulatedHour());
    const nightFade = THREE.MathUtils.clamp((0.45 - light) / 0.45, 0, 1);

    if (!enabled || nightFade <= 0.001) {
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

  if (currentHdri !== 'default') return null;

  return (
    <>
      {/* Visualisation du tracé et des berges de la Seine */}
      {showDebug && (
        <group name="SeineDebugTrace">
          <mesh geometry={debugGeometries.ribbonGeo} renderOrder={-955}>
            <meshBasicMaterial
              color="#00e5ff"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              depthTest
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <lineSegments geometry={debugGeometries.bankLGeo} renderOrder={-954}>
            <lineBasicMaterial color="#00ffcc" depthTest depthWrite={false} toneMapped={false} />
          </lineSegments>
          <lineSegments geometry={debugGeometries.bankRGeo} renderOrder={-954}>
            <lineBasicMaterial color="#00ffcc" depthTest depthWrite={false} toneMapped={false} />
          </lineSegments>
          <lineSegments geometry={debugGeometries.centerGeo} renderOrder={-953}>
            <lineBasicMaterial color="#ffee00" depthTest depthWrite={false} toneMapped={false} />
          </lineSegments>
          <points geometry={debugGeometries.wpGeo} renderOrder={-952}>
            <pointsMaterial
              size={9}
              sizeAttenuation={false}
              color="#ff3366"
              depthTest
              depthWrite={false}
              toneMapped={false}
            />
          </points>
        </group>
      )}

      {/* Péniches lumineuses */}
      {enabled && (
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
      )}
    </>
  );
}
