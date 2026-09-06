/**
 * AirPerformer.tsx — Philips Air Performer AMF870/15 3D procedural simulation.
 * Exact replication of philips_air_performer (2) best.html design.
 * Scale: 1 unit = 1 cm. Total height: 106.4 cm. Base stand diameter: 32.5 cm.
 * Integrates interactive events, particle systems, dynamic LED screen canvas texture,
 * and synthesized fan hum audio matching the standalone test bench.
 */
import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { useFrame, useThree } from '@react-three/fiber';
import type { SceneItemProps } from '@shared/types';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  type: 'clean' | 'dirty';
  color: THREE.Color;
}

// ---------------------------------------------------------------------
// Dimensions (cm) — Philips Air Performer AMF870 proportions
// ---------------------------------------------------------------------
const H_TOTAL = 106.4;
const BASE_R = 32.5 / 2; // 16.25
const BASE_H = 2;

const neckR = 13; // rayon du cylindre principal (diamètre 26cm)
const bevelPad = 0.85; // extension du bevel du cadre extérieur
const outerW = 24.3; // largeur de la pilule
const bodyDepth = 12.5; // épaisseur avant-arrière
const outerH = 60; // hauteur de la pilule (boucle)
const neckHeight = 45; // hauteur du cylindre principal
const loopBottomY = H_TOTAL - outerH; // 46.4

const midMargin = 1.3; // fin liseré sombre en bordure externe
const midW = outerW - 2 * midMargin;
const midH = outerH - 2 * midMargin;

const topRim = 1.8; // largeur du bandeau argenté en haut
const sideBottomRim = 5; // bandeau argenté (bas)
const innerW = midW - 2 * 1.0;
const innerTop = midH / 2 - topRim;
const innerBottom = -midH / 2 + sideBottomRim;
const innerH = innerTop - innerBottom;
const innerCenterY = (innerTop + innerBottom) / 2;

const pillCenterY = loopBottomY + outerH / 2;
const holeBottomY = pillCenterY + innerBottom;
const shoulderTopRX = outerW / 2 + bevelPad;
const shoulderTopRZ = bodyDepth / 2 + 0.5;

// ---------------------------------------------------------------------
// Helper: build a "pill" (stadium) outline on a Shape or Path
// ---------------------------------------------------------------------
function pillOutline<T extends THREE.Shape | THREE.Path>(target: T, w: number, h: number, offsetX: number, offsetY: number): T {
  const r = Math.min(w, h) / 2;
  const x = offsetX - w / 2, y = offsetY - h / 2;
  target.moveTo(x, y + r);
  target.lineTo(x, y + h - r);
  target.absarc(x + r, y + h - r, r, Math.PI, Math.PI / 2, true);
  target.lineTo(x + w - r, y + h);
  target.absarc(x + w - r, y + h - r, r, Math.PI / 2, 0, true);
  target.lineTo(x + w, y + r);
  target.absarc(x + w - r, y + r, r, 0, -Math.PI / 2, true);
  target.lineTo(x + r, y);
  target.absarc(x + r, y + r, r, -Math.PI / 2, -Math.PI, true);
  return target;
}

function extrudeRing(outerW: number, outerH: number, innerW: number, innerH: number, innerOffsetY: number, depth: number, bevelT: number, bevelS: number) {
  const shape = pillOutline(new THREE.Shape(), outerW, outerH, 0, 0);
  const hole = pillOutline(new THREE.Path(), innerW, innerH, 0, innerOffsetY);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevelT,
    bevelSize: bevelS,
    bevelSegments: 2,
    curveSegments: 16,
    steps: 1
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function buildShoulder(bottomR: number, topRX: number, topRZ: number, yBottom: number, yTop: number, radialSeg: number, heightSeg: number) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let i = 0; i <= heightSeg; i++) {
    const t = i / heightSeg;
    const te = t * t * (3 - 2 * t); // easing doux
    const y = THREE.MathUtils.lerp(yBottom, yTop, t);
    const rx = THREE.MathUtils.lerp(bottomR, topRX, te);
    const rz = THREE.MathUtils.lerp(bottomR, topRZ, te);
    for (let j = 0; j <= radialSeg; j++) {
      const a = (j / radialSeg) * Math.PI * 2;
      positions.push(Math.sin(a) * rx, y, Math.cos(a) * rz);
      uvs.push(j / radialSeg, t);
    }
  }
  for (let i = 0; i < heightSeg; i++) {
    for (let j = 0; j < radialSeg; j++) {
      const a = i * (radialSeg + 1) + j;
      const b = a + radialSeg + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function AirPerformer({ onSize }: SceneItemProps) {
  const { invalidate } = useThree();

  // ── States & Refs for configuration ────────────────────────────────────────
  const [power, setPower] = useState(false);
  const [mode, setMode] = useState<'auto' | 'cool' | 'heat' | 'sleep'>('auto');
  const [speed, setSpeed] = useState(5);
  const [targetTemp] = useState(25);
  const [pm25State, setPm25State] = useState(8);

  const pm25Ref = useRef(8);
  const timeSinceLastAqiUpdate = useRef(0);
  const timeSinceStateSync = useRef(0);
  const timeSinceScreenUpdate = useRef(0);
  const lastScreenDrawnState = useRef<{ power: boolean; mode: string; speed: number; pm25: number } | null>(null);

  // Sync state values to refs for safe closure-free use inside useFrame
  const powerRef = useRef(false);
  const modeRef = useRef<'auto' | 'cool' | 'heat' | 'sleep'>('auto');
  const speedRef = useRef(5);

  useEffect(() => { powerRef.current = power; }, [power]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Bounding box registration
  useLayoutEffect(() => {
    // Base width 32.5cm, height 106.4cm, depth 32.5cm
    onSize(new THREE.Vector3(32.5, 106.4, 32.5));
  }, [onSize]);

  // ── Event Listener for HoverMenu actions ───────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key === 'airPerformerPower') {
        setPower(p => !p);
        invalidate();
      } else if (key === 'airPerformerMode') {
        setMode(m => {
          if (m === 'auto') return 'cool';
          if (m === 'cool') return 'heat';
          if (m === 'heat') return 'sleep';
          return 'auto';
        });
        invalidate();
      } else if (key === 'airPerformerSpeed') {
        setSpeed(s => {
          if (s === 3) return 6;
          if (s === 6) return 10;
          return 3;
        });
        invalidate();
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate]);

  // ── Web Audio Synthesizer ──────────────────────────────────────────────────
  const audioRef = useRef<{
    audioCtx: AudioContext | null;
    noiseSource: AudioBufferSourceNode | null;
    lowpassFilter: BiquadFilterNode | null;
    soundGain: GainNode | null;
  }>({ audioCtx: null, noiseSource: null, lowpassFilter: null, soundGain: null });

  const initAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 250;
      filter.Q.value = 1.0;

      const gain = ctx.createGain();
      gain.gain.value = 0.0;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();

      audioRef.current = {
        audioCtx: ctx,
        noiseSource: source,
        lowpassFilter: filter,
        soundGain: gain
      };
    } catch (e) {
      console.warn('Web Audio init failed or blocked:', e);
    }
  };

  const updateAudioVolume = () => {
    const { audioCtx, soundGain, lowpassFilter } = audioRef.current;
    if (!audioCtx || !soundGain || !lowpassFilter) return;

    if (power) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      let targetVolume = 0.01;
      let targetFreq = 160;

      if (mode === 'sleep') {
        targetVolume = 0.003;
        targetFreq = 130;
      } else {
        targetVolume = 0.005 + (speed / 10) * 0.035;
        targetFreq = 150 + (speed / 10) * 150;
      }

      soundGain.gain.setTargetAtTime(targetVolume, audioCtx.currentTime, 0.2);
      lowpassFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.2);
    } else {
      soundGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
    }
  };

  useEffect(() => {
    if (power && !audioRef.current.audioCtx) {
      initAudio();
    }
    updateAudioVolume();
  }, [power, mode, speed]);

  useEffect(() => {
    return () => {
      const { audioCtx, noiseSource } = audioRef.current;
      if (noiseSource) {
        try { noiseSource.stop(); } catch {}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch {}
      }
    };
  }, []);

  // ── Dynamic LED screen canvas texture ──────────────────────────────────────
  const screenCanvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    return canvas;
  }, []);

  const screenCtx = useMemo(() => screenCanvas.getContext('2d')!, [screenCanvas]);
  const screenTexture = useMemo(() => new THREE.CanvasTexture(screenCanvas), [screenCanvas]);

  const updateScreenTexture = (time: number) => {
    const ctx = screenCtx;
    if (!ctx) return;

    ctx.fillStyle = '#07080b';
    ctx.fillRect(0, 0, 256, 256);

    let ringColor = '#0055ff'; // good (blue)
    const currentPm25 = pm25Ref.current;
    if (currentPm25 > 12 && currentPm25 <= 35) ringColor = '#60a5fa'; // fair
    if (currentPm25 > 35 && currentPm25 <= 55) ringColor = '#c084fc'; // poor
    if (currentPm25 > 55) ringColor = '#ef4444'; // very poor

    let glowOffset = 0;
    if (power) {
      glowOffset = Math.sin(time * 4) * 1.5;
    }

    // Outer background ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 114, 0, Math.PI * 2);
    ctx.stroke();

    // Active color status ring
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 8 + glowOffset;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 128, 114, -Math.PI / 2, Math.PI * 2 - Math.PI / 2);
    ctx.stroke();

    if (power) {
      // PM2.5 value digits
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const pmText = String(Math.round(currentPm25)).padStart(3, '0');
      ctx.fillText(pmText, 128, 105);

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 13px sans-serif';
      ctx.fillText('PM2.5', 128, 148);

      // Separator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 168);
      ctx.lineTo(216, 168);
      ctx.stroke();

      // Mode text
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 20px sans-serif';
      let subText = 'Auto';
      if (mode === 'cool') subText = `VENTIL • ${speed}`;
      if (mode === 'heat') subText = `🔥 ${targetTemp}°C`;
      if (mode === 'sleep') subText = '💤 SOMMEIL';
      ctx.fillText(subText, 128, 198);

      // Status
      ctx.font = '500 12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      let filterStatus = 'FILTRE : OK';
      if (currentPm25 > 100) filterStatus = 'FILTRE : ACTIF';
      ctx.fillText(filterStatus, 128, 55);

      // Wi-Fi dot
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(128, 32, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Device is OFF - red standby dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(128, 128, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(128, 128, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    screenTexture.needsUpdate = true;
  };

  // ── Particle System ────────────────────────────────────────────────────────
  const maxParticles = 250;
  const positions = useMemo(() => new Float32Array(maxParticles * 3), []);
  const colors = useMemo(() => new Float32Array(maxParticles * 3), []);

  const particleData = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    for (let i = 0; i < maxParticles; i++) {
      list.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: 0,
        type: 'clean',
        color: new THREE.Color()
      });
    }
    return list;
  }, []);

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const emitCleanParticle = () => {
    const p = particleData.find(pt => !pt.active);
    if (!p) return;

    p.active = true;
    p.type = 'clean';
    p.life = 0;
    p.maxLife = 0.8 + Math.random() * 0.6;

    let lx = 0, ly = 0, lz = 0.2;
    const selection = Math.random();
    const straightHalf = innerH / 2 - innerW / 2;
    const yTop = innerCenterY + straightHalf;
    const yBot = innerCenterY - straightHalf;

    if (selection < 0.45) {
      lx = -innerW / 2;
      ly = pillCenterY + THREE.MathUtils.lerp(yBot, yTop, Math.random());
    } else if (selection < 0.9) {
      lx = innerW / 2;
      ly = pillCenterY + THREE.MathUtils.lerp(yBot, yTop, Math.random());
    } else {
      const angle = Math.random() * Math.PI;
      lx = Math.cos(angle) * (innerW / 2);
      ly = pillCenterY + yTop + Math.sin(angle) * (innerW / 2);
    }

    const currentSpeed = speedRef.current;
    const speedFactor = 15 + currentSpeed * 10;
    const lvx = (Math.random() - 0.5) * 5;
    const lvy = (Math.random() - 0.5) * 5;
    const lvz = speedFactor;

    const rotY = oscillatingGroupRef.current?.rotation.y || 0;
    const cos = Math.cos(rotY);
    const sin = Math.sin(rotY);

    p.x = lx * cos + lz * sin;
    p.y = ly;
    p.z = -lx * sin + lz * cos;

    p.vx = lvx * cos + lvz * sin;
    p.vy = lvy;
    p.vz = -lvx * sin + lvz * cos;

    const currentMode = modeRef.current;
    if (currentMode === 'heat') {
      const rVal = Math.random();
      if (rVal < 0.5) p.color.setHex(0xff3300);
      else if (rVal < 0.85) p.color.setHex(0xff7700);
      else p.color.setHex(0xffdd22);
    } else {
      const rVal = Math.random();
      if (rVal < 0.5) p.color.setHex(0xaae8ff);
      else if (rVal < 0.85) p.color.setHex(0x5599ff);
      else p.color.setHex(0xffffff);

      if (currentMode === 'sleep') {
        p.color.multiplyScalar(0.4);
      }
    }
  };

  const emitDirtyParticle = () => {
    const p = particleData.find(pt => !pt.active);
    if (!p) return;

    p.active = true;
    p.type = 'dirty';
    p.life = 0;
    p.maxLife = 2.5 + Math.random() * 1.5;

    const R = 60 + Math.random() * 30;
    const angle = Math.random() * Math.PI * 2;
    p.x = Math.cos(angle) * R;
    p.z = Math.sin(angle) * R;
    p.y = 5 + Math.random() * 95;

    p.vx = -Math.cos(angle) * 8 + (Math.random() - 0.5) * 4;
    p.vy = (Math.random() - 0.5) * 4;
    p.vz = -Math.sin(angle) * 8 + (Math.random() - 0.5) * 4;

    p.color.setRGB(0.55 + Math.random() * 0.1, 0.48 + Math.random() * 0.1, 0.42);
  };

  const updateParticles = (dt: number) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colAttr = pointsRef.current.geometry.attributes.color;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    for (let i = 0; i < maxParticles; i++) {
      const p = particleData[i];
      if (!p.active) {
        posArr[i * 3] = 0;
        posArr[i * 3 + 1] = -9999;
        posArr[i * 3 + 2] = 0;
        continue;
      }

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      if (p.type === 'clean') {
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vz *= 0.97;
        p.vy += (Math.random() - 0.5) * 3 * dt;
        p.vx += (Math.random() - 0.5) * 3 * dt;

        const alpha = 1.0 - p.life / p.maxLife;
        colArr[i * 3] = p.color.r * alpha;
        colArr[i * 3 + 1] = p.color.g * alpha;
        colArr[i * 3 + 2] = p.color.b * alpha;
      } else {
        // Pulled inwards to cylinder neck (center Y = 24.5)
        const dx = 0 - p.x;
        const dy = (BASE_H + neckHeight / 2) - p.y;
        const dz = 0 - p.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < neckR + 0.5) {
          p.active = false;
          continue;
        }

        const force = 1200 / (dist * dist + 50);
        p.vx += (dx / dist) * force * dt * 50;
        p.vy += (dy / dist) * force * dt * 50;
        p.vz += (dz / dist) * force * dt * 50;

        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vz *= 0.99;

        const lifeAlpha = 1.0 - p.life / p.maxLife;
        const filterDistanceAlpha = Math.min((dist - neckR) / 25, 1.0);
        const finalAlpha = lifeAlpha * filterDistanceAlpha;

        colArr[i * 3] = p.color.r * finalAlpha;
        colArr[i * 3 + 1] = p.color.g * finalAlpha;
        colArr[i * 3 + 2] = p.color.b * finalAlpha;
      }

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  };

  // ── References ─────────────────────────────────────────────────────────────
  const oscillatingGroupRef = useRef<THREE.Group>(null!);
  const heaterLightRef = useRef<THREE.PointLight>(null!);
  const screenGlowLightRef = useRef<THREE.PointLight>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const oscillationTimeRef = useRef(0);

  // ── Materials (Matching philips_air_performer (2) best.html) ────────────────
  const darkBody = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x33383e,
    roughness: 0.55,
    metalness: 0.18,
    side: THREE.DoubleSide
  }), []);

  const silverRim = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xd7dadd,
    roughness: 0.35,
    metalness: 0.35,
    side: THREE.DoubleSide
  }), []);

  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x2c3136,
    roughness: 0.5,
    metalness: 0.2
  }), []);

  const slatMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x14171a,
    roughness: 0.6,
    metalness: 0.1
  }), []);

  const matGlossyBlack = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x090a0c,
    roughness: 0.12,
    metalness: 0.8,
  }), []);

  const matHeater = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xff3300,
    emissiveIntensity: 0.0,
    transparent: true,
    opacity: 0.9,
  }), []);

  const matScreen = useMemo(() => new THREE.MeshBasicMaterial({
    map: screenTexture,
  }), [screenTexture]);

  // ── Procedural Geometries ──────────────────────────────────────────────────
  const outerRingGeo = useMemo(() =>
    extrudeRing(outerW, outerH, midW, midH, 0, bodyDepth, 1.05, bevelPad),
  []);

  const silverGeo = useMemo(() =>
    extrudeRing(midW, midH, innerW, innerH, innerCenterY, bodyDepth * 0.92, 0.7, 0.55),
  []);

  const shoulderGeo = useMemo(() =>
    buildShoulder(
      neckR, shoulderTopRX, shoulderTopRZ,
      BASE_H + neckHeight, holeBottomY,
      32, 8
    ),
  []);

  const baseGeo = useMemo(() =>
    new THREE.CylinderGeometry(BASE_R, BASE_R, BASE_H, 36),
  []);

  const rimGeo = useMemo(() =>
    new THREE.TorusGeometry(BASE_R - 0.4, 0.35, 6, 36),
  []);

  const neckGeo = useMemo(() =>
    new THREE.CylinderGeometry(neckR, neckR, neckHeight, 36, 1, false),
  []);

  // ── Inner loop slats merged geometry ───────────────────────────────────────
  const innerSlatsGeo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const half = innerW / 2 + 0.35;
    const straightHalf = innerH / 2 - innerW / 2;
    const yTop = innerCenterY + straightHalf - 2;
    const yBot = innerCenterY - straightHalf + 2;
    const count = 12;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const y = THREE.MathUtils.lerp(yBot, yTop, t);
        const g = new THREE.BoxGeometry(2.1, 0.5, 0.5);
        g.translate(side * half, y, bodyDepth * 0.46 - 0.4);
        geos.push(g);
      }
    }
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    return merged;
  }, []);

  // ── Curved slats on cylinder neck merged geometry ──────────────────────────
  const cylinderSlatsGeo = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const arcSlats = 16;
    const arcSpan = Math.PI * 0.92;
    const bandY = BASE_H + neckHeight * 0.52;
    const bandH = neckHeight * 0.42;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const y = bandY - bandH / 2 + (r + 0.5) * (bandH / rows);
      for (let i = 0; i < arcSlats; i++) {
        const t = i / (arcSlats - 1);
        const theta = Math.PI + (-arcSpan / 2 + t * arcSpan);
        const x = neckR * Math.sin(theta);
        const z = neckR * Math.cos(theta);
        const g = new THREE.BoxGeometry(0.55, (neckHeight * 0.42 / 3) * 0.55, 0.5);
        g.rotateY(theta);
        g.translate(x, y, z + 0.18 * Math.cos(theta));
        geos.push(g);
      }
    }
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    return merged;
  }, []);

  // ── R3F frame update loop ──────────────────────────────────────────────────
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Device Oscillation Logic
    if (power) {
      oscillationTimeRef.current += delta * 0.25;
      const maxAngleRad = (90 * Math.PI) / 180;
      if (oscillatingGroupRef.current) {
        oscillatingGroupRef.current.rotation.y =
          Math.sin(oscillationTimeRef.current * Math.PI) * (maxAngleRad / 2);
      }
    } else {
      if (oscillatingGroupRef.current) {
        oscillatingGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          oscillatingGroupRef.current.rotation.y,
          0,
          delta * 2.0
        );
      }
    }

    // 2. Heater Glow Pulses
    if (power && mode === 'heat') {
      const pulse = 0.6 + Math.sin(time * 3) * 0.25;
      matHeater.emissiveIntensity = pulse;
      if (heaterLightRef.current) {
        heaterLightRef.current.intensity = pulse * 12.0;
      }
    } else {
      matHeater.emissiveIntensity = THREE.MathUtils.lerp(
        matHeater.emissiveIntensity,
        0,
        delta * 3.0
      );
      if (heaterLightRef.current) {
        heaterLightRef.current.intensity = THREE.MathUtils.lerp(
          heaterLightRef.current.intensity,
          0,
          delta * 3.0
        );
      }
    }

    // 3. Screen status ring glow and pulse
    if (power) {
      const pulse = Math.sin(time * 4) * 1.5;
      if (screenGlowLightRef.current) {
        let glowColor = 0x0055ff;
        if (pm25Ref.current > 12 && pm25Ref.current <= 35) glowColor = 0x60a5fa;
        if (pm25Ref.current > 35 && pm25Ref.current <= 55) glowColor = 0xc084fc;
        if (pm25Ref.current > 55) glowColor = 0xef4444;

        screenGlowLightRef.current.color.setHex(glowColor);
        screenGlowLightRef.current.intensity = 4.0 + pulse * 0.8;
      }
    } else {
      if (screenGlowLightRef.current) {
        screenGlowLightRef.current.intensity = THREE.MathUtils.lerp(
          screenGlowLightRef.current.intensity,
          0,
          delta * 3.0
        );
      }
    }

    // 4. Update PM2.5 levels
    if (power) {
      if (pm25Ref.current > 8) {
        pm25Ref.current = Math.max(8, pm25Ref.current - delta * (speed / 3));
      }

      // Spawn clean particles
      const emissionRate = mode === 'sleep' ? 0.08 : (speed / 10) * 0.5;
      if (Math.random() < emissionRate) {
        emitCleanParticle();
      }
    } else {
      // Dust accumulation over time when OFF
      timeSinceLastAqiUpdate.current += delta;
      if (timeSinceLastAqiUpdate.current > 8.0) {
        timeSinceLastAqiUpdate.current = 0;
        if (pm25Ref.current < 45) {
          pm25Ref.current += 1;
        }
      }
    }

    // Spawn dirty particles if PM2.5 is high
    if (Math.random() < (pm25Ref.current / 300) * 0.15) {
      emitDirtyParticle();
    }

    // 5. Update particles
    updateParticles(delta);

    // 6. Draw dynamic screen texture (optimized: only redraw on state change or at 10Hz when ON)
    timeSinceScreenUpdate.current += delta;
    const roundedPm25 = Math.round(pm25Ref.current);
    const lastState = lastScreenDrawnState.current;
    const stateChanged =
      !lastState ||
      lastState.power !== power ||
      lastState.mode !== mode ||
      lastState.speed !== speed ||
      lastState.pm25 !== roundedPm25;

    if (!power) {
      if (stateChanged) {
        updateScreenTexture(time);
        lastScreenDrawnState.current = { power, mode, speed, pm25: roundedPm25 };
      }
    } else {
      // When ON, update on state change or throttle pulse animation to ~10 Hz (every 100ms)
      if (stateChanged || timeSinceScreenUpdate.current >= 0.1) {
        timeSinceScreenUpdate.current = 0;
        updateScreenTexture(time);
        lastScreenDrawnState.current = { power, mode, speed, pm25: roundedPm25 };
      }
    }

    // 7. Sync PM2.5 state occasionally to update hover label text
    timeSinceStateSync.current += delta;
    if (timeSinceStateSync.current > 1.0) {
      timeSinceStateSync.current = 0;
      const rounded = Math.round(pm25Ref.current);
      if (rounded !== pm25State) {
        setPm25State(rounded);
      }
    }
  });

  return (
    <group
      userData={{
        hoverAction: {
          label: power
            ? `Air Performer (ON - Mode ${mode.toUpperCase()} - PM2.5: ${pm25State} µg/m³)`
            : 'Air Performer (Éteint)',
          actions: ['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed', 'airperformer-position']
        }
      }}
    >
      {/* ── 1. BASE STAND (FIXED) ── */}
      <mesh position={[0, BASE_H / 2, 0]} material={baseMat} geometry={baseGeo} castShadow receiveShadow />
      <mesh position={[0, BASE_H + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={silverRim} geometry={rimGeo} />

      {/* ── 2. OSCILLATING CONTAINER (ROTATING GROUP) ── */}
      <group ref={oscillatingGroupRef} position={[0, 0, 0]}>
        {/* A. Neck Cylinder */}
        <mesh
          position={[0, BASE_H + neckHeight / 2, 0]}
          geometry={neckGeo}
          material={darkBody}
          castShadow
          receiveShadow
        />

        {/* B. Arc Slats on cylinder neck (Merged geometry) */}
        <mesh geometry={cylinderSlatsGeo} material={slatMat} castShadow />

        {/* C. Shoulder Transition Geometry */}
        <mesh
          geometry={shoulderGeo}
          material={darkBody}
          castShadow
          receiveShadow
        />

        {/* D. Outer Dark Pill Loop */}
        <mesh
          position={[0, loopBottomY + outerH / 2, 0]}
          geometry={outerRingGeo}
          material={darkBody}
          castShadow
          receiveShadow
        />

        {/* E. Silver Inner Rim */}
        <mesh
          position={[0, loopBottomY + outerH / 2, -0.5]}
          geometry={silverGeo}
          material={silverRim}
          castShadow
          receiveShadow
        />

        {/* F. Inner Loop Vertical Slats (Merged geometry) */}
        <mesh
          position={[0, loopBottomY + outerH / 2, 0]}
          geometry={innerSlatsGeo}
          material={slatMat}
          castShadow
        />

        {/* G. Front Circular LED Screen */}
        <mesh position={[0, BASE_H + neckHeight * 0.68, neckR - 0.05]} rotation={[0, 0, 0]} material={matGlossyBlack}>
          <cylinderGeometry args={[2.9, 2.9, 0.3, 32]} />
        </mesh>
        <mesh position={[0, BASE_H + neckHeight * 0.68, neckR + 0.12]} rotation={[Math.PI / 2, 0, 0]} material={matScreen}>
          <cylinderGeometry args={[2.7, 2.7, 0.05, 32]} />
        </mesh>

        {/* ── Auxiliary Lights ── */}
        {/* Screen ambient status ring glow */}
        <pointLight
          ref={screenGlowLightRef}
          color={0x0055ff}
          intensity={0}
          distance={30}
          decay={2.0}
          position={[0, BASE_H + neckHeight * 0.68, neckR + 2.0]}
        />
        {/* Heater warm pointlight */}
        <pointLight
          ref={heaterLightRef}
          color={0xff3300}
          intensity={0}
          distance={50}
          decay={1.5}
          position={[0, loopBottomY + outerH / 2, 8.0]}
        />
      </group>

      {/* ── 3. PARTICLE SYSTEMS (LOCAL SIMULATION) ── */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={2.2}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          map={particleTexture}
        />
      </points>
    </group>
  );
}

