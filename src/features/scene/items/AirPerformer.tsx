/**
 * AirPerformer.tsx — Philips Air Performer AMF870/15 3D procedural simulation.
 * Scale: 1 unit = 1 cm. Total height: 106.4 cm. Base stand diameter: 32.5 cm.
 * Integrates interactive events, particle systems, dynamic LED screen canvas texture,
 * and synthesized fan hum audio matching the standalone test bench.
 */
import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
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

  // ── Procedural Canvas Textures ─────────────────────────────────────────────
  // 1. Filter grid mesh canvas texture
  const filterTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#222328';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#0a0a0c';
    const dotRadius = 1.0;
    const spacingX = 6;
    const spacingY = 6;
    for (let y = 0; y < 256; y += spacingY) {
      for (let x = 0; x < 512; x += spacingX) {
        const offsetX = (y / spacingY) % 2 === 0 ? 0 : spacingX / 2;
        ctx.beginPath();
        ctx.arc(x + offsetX, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }, []);

  // 2. Dynamic LED screen canvas texture
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
    if (selection < 0.45) {
      lx = -8.4;
      ly = 44 + Math.random() * 50.9;
    } else if (selection < 0.9) {
      lx = 8.4;
      ly = 44 + Math.random() * 50.9;
    } else {
      const angle = Math.random() * Math.PI;
      lx = Math.cos(angle) * 8.35;
      ly = 94.9 + Math.sin(angle) * 8.35;
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
        // Pulled inwards to bottom filter cylinder (center Y = 15)
        const dx = 0 - p.x;
        const dy = 15.0 - p.y;
        const dz = 0 - p.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 16.5) {
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
        const filterDistanceAlpha = Math.min((dist - 16) / 25, 1.0);
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

  // ── Materials ──────────────────────────────────────────────────────────────
  const matStand = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x16171b,
    roughness: 0.6,
    metalness: 0.1,
  }), []);

  const matAnthracite = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x2b2c31,
    roughness: 0.45,
    metalness: 0.3,
  }), []);

  const matGlossyBlack = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x090a0c,
    roughness: 0.12,
    metalness: 0.8,
  }), []);

  const matFilter = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3d3f47,
    map: filterTexture,
    bumpMap: filterTexture,
    bumpScale: -0.04,
    roughness: 0.5,
    metalness: 0.7,
  }), [filterTexture]);

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

    // 6. Draw dynamic screen texture
    updateScreenTexture(time);

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
          actions: ['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed']
        }
      }}
    >
      {/* ── 1. BASE STAND (FIXED) ── */}
      <mesh position={[0, 1, 0]} material={matStand} castShadow receiveShadow>
        <cylinderGeometry args={[16.25, 16.25, 2, 64]} />
      </mesh>

      {/* ── 2. OSCILLATING CONTAINER (ROTATING GROUP) ── */}
      <group ref={oscillatingGroupRef} position={[0, 0, 0]}>
        {/* Bottom spacer ring */}
        <mesh position={[0, 2.2, 0]} material={matGlossyBlack}>
          <cylinderGeometry args={[16.1, 16.1, 0.4, 64]} />
        </mesh>

        {/* A. Filter cover tower (height 25, starts at 2.4) */}
        <mesh position={[0, 14.9, 0]} material={matFilter} castShadow receiveShadow>
          <cylinderGeometry args={[16.0, 16.0, 25.0, 64]} />
        </mesh>

        {/* B. Upper body tower (height 14.8, starts at 27.4) */}
        <mesh position={[0, 34.8, 0]} material={matAnthracite} castShadow receiveShadow>
          <cylinderGeometry args={[16.0, 16.0, 14.8, 64]} />
        </mesh>

        {/* C. Circular screen display */}
        {/* Screen bezel */}
        <mesh position={[0, 34.8, 15.95]} rotation={[Math.PI / 2, 0, 0]} material={matGlossyBlack}>
          <cylinderGeometry args={[3.0, 3.0, 0.3, 32]} />
        </mesh>
        {/* Screen canvas */}
        <mesh position={[0, 34.8, 16.12]} rotation={[Math.PI / 2, 0, 0]} material={matScreen}>
          <cylinderGeometry args={[2.8, 2.8, 0.1, 32]} />
        </mesh>

        {/* D. Tapered neck transition (height 1.8, starts at 42.2) */}
        <mesh position={[0, 43.1, 0]} material={matAnthracite} castShadow>
          <cylinderGeometry args={[13.0, 15.8, 1.8, 64]} />
        </mesh>

        {/* E. Bladeless loop columns (height 50.9, starts at 44.0) */}
        {/* Left column */}
        <mesh position={[-9.0, 69.45, 0]} material={matAnthracite} castShadow receiveShadow>
          <cylinderGeometry args={[2.5, 2.5, 50.9, 32]} />
        </mesh>
        {/* Right column */}
        <mesh position={[9.0, 69.45, 0]} material={matAnthracite} castShadow receiveShadow>
          <cylinderGeometry args={[2.5, 2.5, 50.9, 32]} />
        </mesh>

        {/* F. Bladeless top arch (Torus center Y = 94.9) */}
        <mesh position={[0, 94.9, 0]} material={matAnthracite} castShadow receiveShadow>
          <torusGeometry args={[9.0, 2.5, 32, 64, Math.PI]} />
        </mesh>

        {/* G. Inner air channel (Glossy black inside loop) */}
        {/* Left inner column */}
        <mesh position={[-8.4, 69.45, 0]} material={matGlossyBlack}>
          <cylinderGeometry args={[2.2, 2.2, 50.9, 32]} />
        </mesh>
        {/* Right inner column */}
        <mesh position={[8.4, 69.45, 0]} material={matGlossyBlack}>
          <cylinderGeometry args={[2.2, 2.2, 50.9, 32]} />
        </mesh>
        {/* Top inner arch */}
        <mesh position={[0, 94.9, 0]} material={matGlossyBlack}>
          <torusGeometry args={[8.4, 2.2, 32, 64, Math.PI]} />
        </mesh>

        {/* H. Heater glow slits */}
        {/* Left glow slit */}
        <mesh position={[-8.35, 69.45, 0.05]} material={matHeater}>
          <cylinderGeometry args={[2.25, 2.25, 50.9, 16]} />
        </mesh>
        {/* Right glow slit */}
        <mesh position={[8.35, 69.45, 0.05]} material={matHeater}>
          <cylinderGeometry args={[2.25, 2.25, 50.9, 16]} />
        </mesh>
        {/* Top glow arch */}
        <mesh position={[0, 94.9, 0.05]} material={matHeater}>
          <torusGeometry args={[8.35, 2.25, 16, 32, Math.PI]} />
        </mesh>

        {/* ── Auxiliary Lights ── */}
        {/* Screen ambient status ring glow */}
        <pointLight
          ref={screenGlowLightRef}
          color={0x0055ff}
          intensity={0}
          distance={30}
          decay={2.0}
          position={[0, 34.8, 18.0]}
        />
        {/* Heater warm pointlight */}
        <pointLight
          ref={heaterLightRef}
          color={0xff3300}
          intensity={0}
          distance={50}
          decay={1.5}
          position={[0, 69.45, 12.0]}
        />
      </group>

      {/* ── 3. PARTICLE SYSTEMS (ADDED IN PARENT GROUP AS SELF-CONTAINED LOCAL SIMULATION) ── */}
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
