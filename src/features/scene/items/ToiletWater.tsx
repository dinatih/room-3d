/**
 * ToiletWater.tsx — Eau et animation de chasse d'eau pour WC President.
 * Coordonnées locales Toilet : centré en X, Z = 8.5 cm, Y = 17.5 cm (repos).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  TOILET_FLUSH_DURATION,
  TOILET_WATER_REST_Y,
  TOILET_WATER_MIN_Y,
  TOILET_WATER_CENTER_X,
  TOILET_WATER_CENTER_Z,
  TOILET_WATER_RADIUS_X,
  TOILET_WATER_RADIUS_Z,
  TOILET_RIM_Y,
  TOILET_RIM_CENTER_Z,
  TOILET_RIM_RADIUS_X,
  TOILET_RIM_RADIUS_Z,
} from './toiletAnimation';

const N_RINGS = 16;
const N_SEGS = 32;
const STREAM_COUNT = 48;
const BUBBLE_COUNT = 36;

export interface ToiletWaterProps {
  isFlushingRef: React.MutableRefObject<boolean>;
  flushTimeRef: React.MutableRefObject<number>;
  invalidate: () => void;
}

export function ToiletWater({ isFlushingRef, flushTimeRef, invalidate }: ToiletWaterProps) {
  const waterGroupRef = useRef<THREE.Group>(null!);
  const waterMeshRef = useRef<THREE.Mesh>(null!);
  const streamsRef = useRef<THREE.LineSegments>(null!);
  const bubblesRef = useRef<THREE.Points>(null!);

  const swirlAngleRef = useRef(0);
  const timeRef = useRef(0);

  const {
    waterGeo,
    basePos,
    streamGeo,
    bubbleGeo,
    waterMaterial,
    streamMaterial,
    bubbleMaterial,
    bubbleSeeds,
  } = useMemo(() => {
    // 1. Géométrie de l'eau (anneau découpé en segments concentriques)
    const ring = new THREE.RingGeometry(0.001, 1, N_SEGS, N_RINGS);
    ring.rotateX(-Math.PI / 2);

    const posAttr = ring.attributes.position;
    const count = posAttr.count;
    const base = new Float32Array(count * 3);
    base.set(posAttr.array);

    for (let i = 0; i < count; i++) {
      posAttr.setX(i, base[i * 3] * TOILET_WATER_RADIUS_X);
      posAttr.setZ(i, base[i * 3 + 2] * TOILET_WATER_RADIUS_Z);
    }
    posAttr.needsUpdate = true;
    ring.computeVertexNormals();

    // 2. Traînées d'eau provenant du rebord
    const sGeo = new THREE.BufferGeometry();
    const sPositions = new Float32Array(STREAM_COUNT * 2 * 3);
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3));

    // 3. Bulles / écume du tourbillon
    const bGeo = new THREE.BufferGeometry();
    const bPositions = new Float32Array(BUBBLE_COUNT * 3);
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPositions, 3));

    const seeds: { angle: number; r: number; y: number }[] = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      seeds.push({
        angle: (i / BUBBLE_COUNT) * Math.PI * 2 + (i % 3) * 0.4,
        r: ((i % 6) + 1) / 6,
        y: ((i % 8) + 1) / 8,
      });
    }

    // 4. Matériaux
    const wMat = new THREE.MeshStandardMaterial({
      color: 0x2ba6e3,
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const sMat = new THREE.LineBasicMaterial({
      color: 0xa8e4ff,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const bMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    return {
      waterGeo: ring,
      basePos: base,
      streamGeo: sGeo,
      bubbleGeo: bGeo,
      waterMaterial: wMat,
      streamMaterial: sMat,
      bubbleMaterial: bMat,
      bubbleSeeds: seeds,
    };
  }, []);

  useEffect(() => () => {
    waterGeo.dispose();
    streamGeo.dispose();
    bubbleGeo.dispose();
    waterMaterial.dispose();
    streamMaterial.dispose();
    bubbleMaterial.dispose();
  }, [waterGeo, streamGeo, bubbleGeo, waterMaterial, streamMaterial, bubbleMaterial]);

  useFrame((_, delta) => {
    const isFlushing = isFlushingRef.current;
    let active = false;

    if (isFlushing) {
      flushTimeRef.current += delta;
      if (flushTimeRef.current >= TOILET_FLUSH_DURATION) {
        isFlushingRef.current = false;
        flushTimeRef.current = TOILET_FLUSH_DURATION;
      }
      active = true;
    }

    const t = flushTimeRef.current;
    const progress = THREE.MathUtils.clamp(t / TOILET_FLUSH_DURATION, 0, 1);
    timeRef.current += delta;
    const globalTime = timeRef.current;

    // Profils de chasse
    let swirlSpeed = 0;
    let drop = 0;
    let vortexFactor = 0;
    let rimIntensity = 0;

    if (isFlushing) {
      // 1. Rotation tourbillon
      if (progress < 0.22) {
        swirlSpeed = Math.pow(progress / 0.22, 1.5) * 14.0;
      } else if (progress < 0.65) {
        swirlSpeed = 14.0;
      } else {
        swirlSpeed = Math.pow(Math.max(0, 1.0 - (progress - 0.65) / 0.35), 2.0) * 14.0;
      }

      // 2. Vidange par siphon puis remplissage
      if (progress < 0.15) {
        drop = -0.25 * (progress / 0.15); // petite vague d'arrivée d'eau
      } else if (progress < 0.55) {
        drop = Math.pow((progress - 0.15) / 0.40, 2.0); // vidange siphon rapide
      } else if (progress < 0.65) {
        drop = 1.0; // niveau bas au fond
      } else {
        drop = Math.max(0, Math.pow(1.0 - (progress - 0.65) / 0.30, 0.8)); // retour de l'eau
      }

      // 3. Creusement en entonnoir
      if (progress < 0.25) {
        vortexFactor = Math.pow(progress / 0.25, 2.0);
      } else if (progress < 0.60) {
        vortexFactor = 1.0;
      } else {
        vortexFactor = Math.pow(Math.max(0, 1.0 - (progress - 0.60) / 0.40), 2.0);
      }

      // 4. Eau qui coule le long des parois
      if (progress < 0.15) {
        rimIntensity = progress / 0.15;
      } else if (progress < 0.65) {
        rimIntensity = 1.0;
      } else if (progress < 0.85) {
        rimIntensity = Math.max(0, 1.0 - (progress - 0.65) / 0.20);
      } else {
        rimIntensity = 0;
      }
    }

    // Mise à jour de la rotation et position du groupe d'eau
    swirlAngleRef.current += swirlSpeed * delta;
    const currentY = TOILET_WATER_REST_Y - drop * (TOILET_WATER_REST_Y - TOILET_WATER_MIN_Y);
    const currentScale = 1.0 - 0.22 * Math.max(0, drop);

    if (waterGroupRef.current) {
      waterGroupRef.current.position.set(TOILET_WATER_CENTER_X, currentY, TOILET_WATER_CENTER_Z);
      waterGroupRef.current.rotation.y = swirlAngleRef.current;
      waterGroupRef.current.scale.set(currentScale, 1.0, currentScale);
    }

    // Déformation 3D de la surface de l'eau (entonnoir vortex + vaguelettes)
    const posAttr = waterGeo.attributes.position;
    const count = posAttr.count;
    const vortexDepth = 4.5 * vortexFactor;
    const waveAmp = isFlushing ? 0.25 * vortexFactor : 0.06;

    for (let i = 0; i < count; i++) {
      const bx = basePos[i * 3];
      const bz = basePos[i * 3 + 2];
      const normR = Math.hypot(bx, bz);
      const funnel = -vortexDepth * Math.pow(Math.max(0, 1.0 - normR), 2.2);
      const ripple = waveAmp * Math.sin(globalTime * 8.0 - normR * 6.0);
      posAttr.setY(i, funnel + ripple);
    }
    posAttr.needsUpdate = true;
    waterGeo.computeVertexNormals();

    // Ruisseaux le long de la cuvette
    if (streamsRef.current) {
      if (rimIntensity > 0.02) {
        streamsRef.current.visible = true;
        streamMaterial.opacity = 0.65 * rimIntensity;
        const sPos = streamGeo.attributes.position;

        for (let k = 0; k < STREAM_COUNT; k++) {
          const baseAngle = (k / STREAM_COUNT) * Math.PI * 2;
          const offset = (k * 0.37) % 1.0;
          const streamProg = (offset + globalTime * 1.8) % 1.0;
          const headP = streamProg;
          const tailP = Math.max(0, streamProg - 0.14);

          const evalStreamPoint = (sp: number) => {
            const sy = TOILET_RIM_Y - sp * (TOILET_RIM_Y - currentY);
            const scz = TOILET_RIM_CENTER_Z - sp * (TOILET_RIM_CENTER_Z - TOILET_WATER_CENTER_Z);
            const srx = TOILET_RIM_RADIUS_X - sp * (TOILET_RIM_RADIUS_X - TOILET_WATER_RADIUS_X * currentScale);
            const srz = TOILET_RIM_RADIUS_Z - sp * (TOILET_RIM_RADIUS_Z - TOILET_WATER_RADIUS_Z * currentScale);
            const sAngle = baseAngle + sp * 1.8;
            return {
              x: srx * Math.cos(sAngle),
              y: sy,
              z: scz + srz * Math.sin(sAngle),
            };
          };

          const head = evalStreamPoint(headP);
          const tail = evalStreamPoint(tailP);

          sPos.setXYZ(k * 2, head.x, head.y, head.z);
          sPos.setXYZ(k * 2 + 1, tail.x, tail.y, tail.z);
        }
        sPos.needsUpdate = true;
      } else {
        streamsRef.current.visible = false;
      }
    }

    // Bulles et écume au cœur du siphon
    if (bubblesRef.current) {
      if (vortexFactor > 0.05) {
        bubblesRef.current.visible = true;
        bubbleMaterial.opacity = 0.85 * vortexFactor;
        const bPos = bubbleGeo.attributes.position;

        for (let b = 0; b < BUBBLE_COUNT; b++) {
          const seed = bubbleSeeds[b];
          const bAngle = seed.angle + globalTime * 18.0;
          const br = seed.r * 2.2 * vortexFactor;
          const by = currentY - (seed.y * 0.7 + 0.3) * vortexDepth * 0.8;
          const bx = br * Math.cos(bAngle);
          const bz = TOILET_WATER_CENTER_Z + br * 1.5 * Math.sin(bAngle);
          bPos.setXYZ(b, bx, by, bz);
        }
        bPos.needsUpdate = true;
      } else {
        bubblesRef.current.visible = false;
      }
    }

    if (active) invalidate();
  });

  return (
    <group name="toilet-water-system">
      {/* Surface d'eau au fond de la cuvette */}
      <group ref={waterGroupRef} position={[TOILET_WATER_CENTER_X, TOILET_WATER_REST_Y, TOILET_WATER_CENTER_Z]}>
        <mesh
          ref={waterMeshRef}
          geometry={waterGeo}
          material={waterMaterial}
          receiveShadow
          renderOrder={2}
        />
      </group>

      {/* Ruisseaux le long des parois */}
      <lineSegments
        ref={streamsRef}
        geometry={streamGeo}
        material={streamMaterial}
        visible={false}
        renderOrder={3}
      />

      {/* Bulles / écume au cœur du tourbillon */}
      <points
        ref={bubblesRef}
        geometry={bubbleGeo}
        material={bubbleMaterial}
        visible={false}
        renderOrder={4}
      />
    </group>
  );
}
