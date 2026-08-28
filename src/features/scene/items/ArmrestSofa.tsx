/**
 * ArmrestSofa.tsx — Tectake Sintra Garden Sofa and Sun Lounger.
 * Procedural implementation with high fidelity.
 * Center seat: width=115, depth=61, height=41 cm.
 * Foldable armrests: length=34.25, depth=61, thickness=6 cm.
 * Seat height with cushion: 48 cm. Total height: 89 cm.
 * Independent left/right folding animations (75 to 0 degrees).
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { SceneItemProps } from '@shared/types';

// ── Texture Generators ───────────────────────────────────────────────────────

function createRattanTextures() {
  const size = 256;
  const cols = 16;
  const step = size / cols; // 16px
  const pad = 1.5;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const colorCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  // Dark charcoal base
  colorCtx.fillStyle = '#2c2e30';
  colorCtx.fillRect(0, 0, size, size);

  bumpCtx.fillStyle = '#000000';
  bumpCtx.fillRect(0, 0, size, size);

  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * step;
      const y = r * step;

      if ((r + c) % 2 === 0) {
        // Horizontal rattan strap
        const colorGrad = colorCtx.createLinearGradient(x, y + pad, x, y + step - pad);
        colorGrad.addColorStop(0, '#1c1d1e');
        colorGrad.addColorStop(0.3, '#525558');
        colorGrad.addColorStop(0.5, '#6a6d70');
        colorGrad.addColorStop(0.7, '#525558');
        colorGrad.addColorStop(1, '#1c1d1e');

        colorCtx.fillStyle = colorGrad;
        colorCtx.fillRect(x + pad, y + pad, step - 2 * pad, step - 2 * pad);

        // Highlight stroke
        colorCtx.strokeStyle = '#121314';
        colorCtx.lineWidth = 1;
        colorCtx.strokeRect(x + pad, y + pad, step - 2 * pad, step - 2 * pad);

        // Bump height profile
        const bumpGrad = bumpCtx.createLinearGradient(x, y + pad, x, y + step - pad);
        bumpGrad.addColorStop(0, '#000000');
        bumpGrad.addColorStop(0.5, '#ffffff');
        bumpGrad.addColorStop(1, '#000000');
        bumpCtx.fillStyle = bumpGrad;
        bumpCtx.fillRect(x + pad, y + pad, step - 2 * pad, step - 2 * pad);
      } else {
        // Vertical rattan strap
        const colorGrad = colorCtx.createLinearGradient(x + pad, y, x + step - pad, y);
        colorGrad.addColorStop(0, '#161718');
        colorGrad.addColorStop(0.3, '#484b4d');
        colorGrad.addColorStop(0.5, '#5d6063');
        colorGrad.addColorStop(0.7, '#484b4d');
        colorGrad.addColorStop(1, '#161718');

        colorCtx.fillStyle = colorGrad;
        colorCtx.fillRect(x + pad, y + pad, step - 2 * pad, step - 2 * pad);

        // Highlight stroke
        colorCtx.strokeStyle = '#121314';
        colorCtx.lineWidth = 1;
        colorCtx.strokeRect(x + pad, y + pad, step - 2 * pad, step - 2 * pad);

        // Bump height profile
        const bumpGrad = bumpCtx.createLinearGradient(x + pad, y, x + step - pad, y);
        bumpGrad.addColorStop(0, '#000000');
        bumpGrad.addColorStop(0.5, '#ffffff');
        bumpGrad.addColorStop(1, '#000000');
        bumpCtx.fillStyle = bumpGrad;
        bumpCtx.fillRect(x + pad, y + pad, step - 2 * pad, step - 2 * pad);
      }
    }
  }

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.wrapS = THREE.RepeatWrapping;
  colorTex.wrapT = THREE.RepeatWrapping;
  colorTex.repeat.set(6, 3);

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(6, 3);

  return { colorTex, bumpTex };
}

function createFabricTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Anthracite/Dark Gray base
  ctx.fillStyle = '#3a3c3e';
  ctx.fillRect(0, 0, size, size);

  // Micro-weave grid pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < size; i += 2) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let i = 1; i < size; i += 2) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

// ── ArmrestSofa Component ─────────────────────────────────────────────────────

export function ArmrestSofa({ actionState, onSize }: SceneItemProps) {
  const { invalidate } = useThree();

  const leftGroupRef = useRef<THREE.Group>(null);
  const rightGroupRef = useRef<THREE.Group>(null);

  // Check if armrests are flat (toggled ON in actionState)
  const leftFlat = !!(actionState && actionState['sofa-arm-left']);
  const rightFlat = !!(actionState && actionState['sofa-arm-right']);

  // Angle state refs (in radians)
  // Visual Left (+Z = 57.5): Upright angle is -1.309 rad, Flat is 0
  // Visual Right (-Z = -57.5): Upright angle is 1.309 rad, Flat is 0
  const leftAngleRef = useRef(leftFlat ? 0 : -1.309);
  const rightAngleRef = useRef(rightFlat ? 0 : 1.309);

  // Set sizing bounding box once
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(61, 89, 157));
  }, [onSize]);

  // Procedural textures and materials
  const { colorTex, bumpTex, fabricTex } = useMemo(() => {
    const rattan = createRattanTextures();
    const fabric = createFabricTexture();
    return {
      colorTex: rattan.colorTex,
      bumpTex: rattan.bumpTex,
      fabricTex: fabric,
    };
  }, []);

  const rattanMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: colorTex,
    bumpMap: bumpTex,
    bumpScale: 0.05,
    roughness: 0.85,
    metalness: 0.05,
  }), [colorTex, bumpTex]);

  const fabricMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: fabricTex,
    roughness: 0.9,
    metalness: 0.02,
  }), [fabricTex]);

  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1d1d1d,
    roughness: 0.5,
    metalness: 0.7,
  }), []);

  const feetMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0f0f0f,
    roughness: 0.9,
  }), []);

  // Geometries
  const seatFrameRimGeo = useMemo(() => new RoundedBoxGeometry(61, 8, 115, 3, 1), []);
  const centerCushionGeo = useMemo(() => new RoundedBoxGeometry(56, 7, 115, 4, 1.5), []);
  const backrestFrameGeo = useMemo(() => new RoundedBoxGeometry(4, 48, 115, 3, 1), []);

  const armFrameGeo = useMemo(() => new RoundedBoxGeometry(61, 6, 34.25, 3, 1), []);
  const armCushionGeo = useMemo(() => new RoundedBoxGeometry(56, 7, 34.25, 4, 1.5), []);

  const pillowGeo = useMemo(() => new RoundedBoxGeometry(14, 47, 53, 4, 2.5), []);

  // Frame details
  const supportBeamGeo = useMemo(() => new THREE.BoxGeometry(2, 2, 110), []);
  const legGeo = useMemo(() => new THREE.BoxGeometry(3, 33, 3), []);
  const footGeo = useMemo(() => new THREE.CylinderGeometry(2, 2, 1, 16), []);

  // Animation logic in render loop
  useFrame((_, delta) => {
    const targetLeft = leftFlat ? 0 : -1.309;
    const targetRight = rightFlat ? 0 : 1.309;

    let changed = false;

    // Smoothly interpolate left armrest angle (+Z)
    const diffLeft = targetLeft - leftAngleRef.current;
    if (Math.abs(diffLeft) > 0.002) {
      leftAngleRef.current += diffLeft * Math.min(delta * 7, 1);
      changed = true;
    } else {
      leftAngleRef.current = targetLeft;
    }

    // Smoothly interpolate right armrest angle (-Z)
    const diffRight = targetRight - rightAngleRef.current;
    if (Math.abs(diffRight) > 0.002) {
      rightAngleRef.current += diffRight * Math.min(delta * 7, 1);
      changed = true;
    } else {
      rightAngleRef.current = targetRight;
    }

    if (leftGroupRef.current) {
      leftGroupRef.current.rotation.x = leftAngleRef.current;
    }
    if (rightGroupRef.current) {
      rightGroupRef.current.rotation.x = rightAngleRef.current;
    }

    if (changed) {
      invalidate();
    }
  });

  return (
    <group>
      {/* ── 1. BASE FRAME & LEGS ────────────────────────────────────────────── */}
      {/* Rattan Seat Rim */}
      <mesh geometry={seatFrameRimGeo} material={rattanMat} position={[0, 37, 0]} castShadow receiveShadow />

      {/* Under-seat Metal Support Beams */}
      <mesh geometry={supportBeamGeo} material={metalMat} position={[-20, 32, 0]} castShadow />
      <mesh geometry={supportBeamGeo} material={metalMat} position={[20, 32, 0]} castShadow />

      {/* Straight Vertical Legs */}
      {/* Left Side (Z = -50) */}
      <mesh geometry={legGeo} material={metalMat} position={[24, 16.5, -50]} castShadow />
      <mesh geometry={legGeo} material={metalMat} position={[-24, 16.5, -50]} castShadow />
      <mesh geometry={footGeo} material={feetMat} position={[24, 0.5, -50]} />
      <mesh geometry={footGeo} material={feetMat} position={[-24, 0.5, -50]} />

      {/* Right Side (Z = 50) */}
      <mesh geometry={legGeo} material={metalMat} position={[24, 16.5, 50]} castShadow />
      <mesh geometry={legGeo} material={metalMat} position={[-24, 16.5, 50]} castShadow />
      <mesh geometry={footGeo} material={feetMat} position={[24, 0.5, 50]} />
      <mesh geometry={footGeo} material={feetMat} position={[-24, 0.5, 50]} />


      {/* ── 2. STATIC SEAT & BACKREST CUSHIONS ──────────────────────────────── */}
      {/* Center Seat Cushion */}
      <mesh geometry={centerCushionGeo} material={fabricMat} position={[0, 44.5, 0]} castShadow receiveShadow />

      {/* Tilted Rattan Backrest Panel (Pivot at top back of seat rim) */}
      <group position={[-30.5, 41, 0]} rotation={[0, 0, 0.14]}>
        <mesh geometry={backrestFrameGeo} material={rattanMat} position={[-2, 24, 0]} castShadow receiveShadow />
        
        {/* Cushions lean back with the backrest */}
        <mesh geometry={pillowGeo} material={fabricMat} position={[9, 24, -27]} rotation={[0, 0, -0.05]} castShadow />
        <mesh geometry={pillowGeo} material={fabricMat} position={[9, 24, 27]} rotation={[0, 0, -0.05]} castShadow />
      </group>


      {/* ── 3. ANIMATED LEFT ARMREST (Visual Left in room = +Z 57.5) ────────────── */}
      {/* Pivot at Z = 57.5, Y = 41. Local armrest extends into +Z */}
      <group ref={leftGroupRef} position={[0, 41, 57.5]} userData={{ hoverAction: { label: 'Accoudoir Gauche', actionId: 'sofa-arm-left' } }}>
        {/* Rattan Armrest Frame */}
        <mesh geometry={armFrameGeo} material={rattanMat} position={[0, -3, 17.125]} castShadow receiveShadow />
        {/* Left Cushion Section */}
        <mesh geometry={armCushionGeo} material={fabricMat} position={[0, 3.5, 17.125]} castShadow receiveShadow />
      </group>


      {/* ── 4. ANIMATED RIGHT ARMREST (Visual Right in room = -Z -57.5) ──────────── */}
      {/* Pivot at Z = -57.5, Y = 41. Local armrest extends into -Z */}
      <group ref={rightGroupRef} position={[0, 41, -57.5]} userData={{ hoverAction: { label: 'Accoudoir Droit', actionId: 'sofa-arm-right' } }}>
        {/* Rattan Armrest Frame */}
        <mesh geometry={armFrameGeo} material={rattanMat} position={[0, -3, -17.125]} castShadow receiveShadow />
        {/* Right Cushion Section */}
        <mesh geometry={armCushionGeo} material={fabricMat} position={[0, 3.5, -17.125]} castShadow receiveShadow />
      </group>
    </group>
  );
}
