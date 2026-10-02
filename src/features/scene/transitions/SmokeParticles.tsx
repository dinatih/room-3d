/**
 * SmokeParticles.tsx — Système de particules Cartoon "Poof!" pour Three.js / R3F.
 *
 * Génère des bouffées de fumée cartoon stylisées (style anime / Zelda) composées
 * de boules de fumée denses et douces qui jaillissent, tourbillonnent et s'évaporent.
 *
 * Utilise un InstancedMesh préalloué (600 particules max) avec un ShaderMaterial léger
 * pour garantir 60 FPS constants et 0 allocation mémoire par frame.
 */
import { useRef, useMemo, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface SmokeBurstOptions {
  radius?: number;       // Rayon de l'objet en cm (défaut ~25cm)
  count?: number;        // Nombre de boules de fumée par bouffée (défaut ~16)
  speedFactor?: number;  // Facteur de vitesse de dispersion
}

export interface SmokeParticlesRef {
  triggerBurst: (center: THREE.Vector3, options?: SmokeBurstOptions) => void;
  triggerMultiBurst: (centers: { pos: THREE.Vector3; radius?: number }[]) => void;
  hasActiveParticles: () => boolean;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rot: number;
  vRot: number;
  life: number;
  maxLife: number;
  baseSize: number;
  currentSize: number;
  alpha: number;
}

const MAX_PARTICLES = 700;

/**
 * Génère dynamiquement une texture de bulle de fumée cartoon nette et douce.
 */
function createCartoonSmokeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);

  const cx = 64;
  const cy = 64;
  const r = 50;

  // Dégradé radial pour une boule de fumée cartoon bien dense au centre
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.70, 'rgba(248, 250, 255, 0.98)');
  grad.addColorStop(0.88, 'rgba(230, 238, 250, 0.85)');
  grad.addColorStop(0.96, 'rgba(215, 225, 242, 0.35)');
  grad.addColorStop(1.0, 'rgba(210, 220, 240, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Reflet supérieur doux pour donner du relief à la bulle
  const highlightGrad = ctx.createRadialGradient(cx - 14, cy - 14, 0, cx - 14, cy - 14, 22);
  highlightGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.55)');
  highlightGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = highlightGrad;
  ctx.beginPath();
  ctx.arc(cx - 14, cy - 14, 22, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

export const SmokeParticles = forwardRef<SmokeParticlesRef>((_props, ref) => {
  const { camera, invalidate } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempRot = useMemo(() => new THREE.Quaternion(), []);

  // Pool de particules
  const particles = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      list.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        rot: 0, vRot: 0,
        life: 0, maxLife: 0.5,
        baseSize: 30, currentSize: 0,
        alpha: 0,
      });
    }
    return list;
  }, []);

  const smokeTexture = useMemo(() => createCartoonSmokeTexture(), []);

  const alphaArray = useMemo(() => new Float32Array(MAX_PARTICLES), []);
  const alphaAttribute = useMemo(() => new THREE.InstancedBufferAttribute(alphaArray, 1), [alphaArray]);

  const smokeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: smokeTexture },
      },
      vertexShader: `
        attribute float aAlpha;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          vUv = uv;
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          vec4 texColor = texture2D(map, vUv);
          gl_FragColor = vec4(texColor.rgb, texColor.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
  }, [smokeTexture]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.geometry.setAttribute('aAlpha', alphaAttribute);

    // Initialiser toutes les matrices à scale 0
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      meshRef.current.setMatrixAt(i, dummy.matrix);
      alphaArray[i] = 0;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    alphaAttribute.needsUpdate = true;
  }, [alphaAttribute, dummy, alphaArray]);

  const triggerBurst = (center: THREE.Vector3, options?: SmokeBurstOptions) => {
    const radius = Math.max(15, options?.radius ?? 30);
    const count = Math.min(24, Math.max(10, options?.count ?? Math.round(12 + radius * 0.25)));
    const speedFactor = options?.speedFactor ?? 1.0;

    let spawned = 0;
    for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
      const p = particles[i];
      if (p.active) continue;

      p.active = true;
      p.life = 0;
      p.maxLife = 0.45 + Math.random() * 0.22; // 450ms à 670ms

      const angle = Math.random() * Math.PI * 2;
      const dist = (0.15 + Math.random() * 0.4) * radius;
      p.x = center.x + Math.cos(angle) * dist;
      p.y = center.y + (Math.random() - 0.4) * (radius * 0.5);
      p.z = center.z + Math.sin(angle) * dist;

      // Vitesse radiale + légère impulsion ascendante
      const speed = (radius * (1.8 + Math.random() * 1.4) + 20) * speedFactor;
      p.vx = Math.cos(angle) * speed;
      p.vz = Math.sin(angle) * speed;
      p.vy = (20 + Math.random() * 35) * speedFactor;

      p.rot = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 6; // Tournoiement cartoon

      p.baseSize = Math.max(22, radius * (0.85 + Math.random() * 0.6));
      p.currentSize = p.baseSize * 0.2;
      p.alpha = 0.95;

      spawned++;
    }

    invalidate();
  };

  const triggerMultiBurst = (centers: { pos: THREE.Vector3; radius?: number }[]) => {
    centers.forEach(c => triggerBurst(c.pos, { radius: c.radius }));
  };

  useImperativeHandle(ref, () => ({
    triggerBurst,
    triggerMultiBurst,
    hasActiveParticles: () => particles.some(p => p.active),
  }));

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    let hasActive = false;
    const camQuat = camera.quaternion;
    const clampedDelta = Math.min(delta, 0.1);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (!p.active) continue;

      hasActive = true;
      p.life += clampedDelta;

      if (p.life >= p.maxLife) {
        p.active = false;
        dummy.position.set(0, -9999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        alphaArray[i] = 0;
        continue;
      }

      const t = p.life / p.maxLife; // 0.0 -> 1.0

      // Mouvement physique avec friction de l'air
      p.x += p.vx * clampedDelta;
      p.y += p.vy * clampedDelta;
      p.z += p.vz * clampedDelta;

      const decay = Math.exp(-3.5 * clampedDelta);
      p.vx *= decay;
      p.vz *= decay;
      p.vy = p.vy * decay + 12.0 * clampedDelta; // Légère flottabilité ascendante

      p.rot += p.vRot * clampedDelta;

      // Évolution cartoon de la taille :
      // Rapide gonflement dans le premier quart (0 -> 0.25), puis lente expansion (0.25 -> 1.0)
      if (t < 0.22) {
        const growthT = t / 0.22;
        p.currentSize = THREE.MathUtils.lerp(p.baseSize * 0.25, p.baseSize, Math.sin(growthT * Math.PI * 0.5));
      } else {
        const expandT = (t - 0.22) / 0.78;
        p.currentSize = THREE.MathUtils.lerp(p.baseSize, p.baseSize * 1.35, expandT);
      }

      // Évolution de l'opacité (Alpha) :
      // Opaque au début pour masquer l'objet, puis dissipation progressive
      if (t < 0.28) {
        p.alpha = 0.96;
      } else {
        const fadeT = (t - 0.28) / 0.72;
        p.alpha = 0.96 * Math.pow(1 - fadeT, 1.8);
      }

      // Billboarding avec rotation propre de la bulle
      tempRot.setFromAxisAngle(new THREE.Vector3(0, 0, 1), p.rot);
      dummy.position.set(p.x, p.y, p.z);
      dummy.quaternion.copy(camQuat).multiply(tempRot);
      dummy.scale.set(p.currentSize, p.currentSize, 1);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
      alphaArray[i] = p.alpha;
    }

    if (hasActive) {
      mesh.instanceMatrix.needsUpdate = true;
      alphaAttribute.needsUpdate = true;
      invalidate();
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_PARTICLES]}
      frustumCulled={false}
      renderOrder={9999}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={smokeMaterial} attach="material" />
    </instancedMesh>
  );
});

SmokeParticles.displayName = 'SmokeParticles';
