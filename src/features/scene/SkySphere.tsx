import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { useSceneStore } from './store/useSceneStore';
import { getHdriById } from './hdriConfig';

const SKY_CENTER: [number, number, number] = [150, 0, 150];
const SKY_RADIUS = 3600;
const SKY_FADE_START = SKY_RADIUS * 0.82;
const SKY_FADE_END = SKY_RADIUS * 1.04;
const WIREFRAME_FADE_START = SKY_RADIUS * 0.72;
const WIREFRAME_FADE_END = SKY_RADIUS * 0.98;
const EXTERIOR_FADE_START = SKY_RADIUS * 0.98;
const EXTERIOR_FADE_END = SKY_RADIUS * 1.22;
const RAINBOW_COLORS = ['#ff3055', '#ff8a00', '#ffe94d', '#35ff6f', '#28d7ff', '#5177ff', '#c45cff'];

const textureCache = new Map<string, THREE.Texture>();
const rgbeLoader = new RGBELoader();
const textureLoader = new THREE.TextureLoader();

export function SkySphere() {
  const currentHdri = useSceneStore(state => state.currentHdri);
  const [texture, setTexture] = useState<THREE.Texture | null>(() => {
    const initialHdri = getHdriById(currentHdri);
    return textureCache.get(initialHdri.id) ?? null;
  });
  const { scene, invalidate } = useThree();

  useEffect(() => {
    const hdri = getHdriById(currentHdri);
    const cached = textureCache.get(hdri.id);
    if (cached) {
      setTexture(cached);
      scene.environment = cached;
      invalidate();
      return;
    }

    let isMounted = true;
    const onLoad = (loadedTexture: THREE.Texture) => {
      loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
      if (hdri.type === 'jpg') {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
      }
      textureCache.set(hdri.id, loadedTexture);
      if (isMounted) {
        setTexture(loadedTexture);
        scene.environment = loadedTexture;
        invalidate();
      }
    };

    if (hdri.type === 'hdr') {
      rgbeLoader.load(hdri.url, onLoad);
    } else {
      textureLoader.load(hdri.url, onLoad);
    }

    return () => {
      isMounted = false;
    };
  }, [currentHdri, scene, invalidate]);

  return (
    <group position={SKY_CENTER}>
      <SpaceBackdrop />
      {texture && <FadingSkyDome texture={texture} />}
      {texture && <ExteriorSkyShell texture={texture} />}
    </group>
  );
}

function FadingSkyDome({ texture }: { texture: THREE.Texture }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const skyCenter = useMemo(() => new THREE.Vector3(...SKY_CENTER), []);

  useFrame(({ camera }) => {
    const material = materialRef.current;
    if (!material) return;

    const dist = camera.position.distanceTo(skyCenter);
    const fadeOut = THREE.MathUtils.smoothstep(dist, SKY_FADE_START, SKY_FADE_END);
    material.opacity = 1 - fadeOut;
    material.visible = material.opacity > 0.01;
  });

  return (
    <mesh renderOrder={-1000}>
      <sphereGeometry args={[SKY_RADIUS, 96, 96]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        side={THREE.BackSide}
        depthTest
        depthWrite={false}
        fog={false}
        transparent
      />
    </mesh>
  );
}

function ExteriorSkyShell({ texture }: { texture: THREE.Texture }) {
  const shellRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const shellMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
    fog: false,
    transparent: true,
    opacity: 0,
  }), [texture]);
  const wireMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xff233d,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
    fog: false,
    transparent: true,
    opacity: 0,
    wireframe: true,
  }), []);
  const skyCenter = useMemo(() => new THREE.Vector3(...SKY_CENTER), []);

  useFrame(({ camera }) => {
    const shell = shellRef.current;
    const wire = wireRef.current;
    if (!shell || !wire) return;

    const dist = camera.position.distanceTo(skyCenter);
    const shellFade = THREE.MathUtils.smoothstep(dist, EXTERIOR_FADE_START, EXTERIOR_FADE_END);
    const wireFade = THREE.MathUtils.smoothstep(dist, WIREFRAME_FADE_START, WIREFRAME_FADE_END);
    const visible = shellFade > 0.01 || wireFade > 0.01;

    shell.visible = visible;
    wire.visible = visible;
    shellMaterial.opacity = shellFade * 0.3;
    wireMaterial.opacity = wireFade * 0.62;
  });

  return (
    <>
      <mesh ref={shellRef} material={shellMaterial} renderOrder={-900} visible={false}>
        <sphereGeometry args={[SKY_RADIUS, 96, 96]} />
      </mesh>
      <mesh ref={wireRef} material={wireMaterial} renderOrder={-880} visible={false}>
        <sphereGeometry args={[SKY_RADIUS * 1.002, 32, 24]} />
      </mesh>
    </>
  );
}

function SpaceBackdrop() {
  const starsGeometry = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = seededUnit(i * 3 + 1);
      const v = seededUnit(i * 3 + 2);
      const radius = SKY_RADIUS * (1.35 + seededUnit(i * 3 + 3) * 2.2);
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const sinPhi = Math.sin(phi);

      positions[i * 3] = Math.cos(theta) * sinPhi * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius;
      positions[i * 3 + 2] = Math.sin(theta) * sinPhi * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const distantStarsGeometry = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = seededUnit(i * 5 + 11);
      const v = seededUnit(i * 5 + 12);
      const radius = SKY_RADIUS * (3.4 + seededUnit(i * 5 + 13) * 2.7);
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const sinPhi = Math.sin(phi);

      positions[i * 3] = Math.cos(theta) * sinPhi * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius;
      positions[i * 3 + 2] = Math.sin(theta) * sinPhi * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  return (
    <>
      <points geometry={distantStarsGeometry} renderOrder={-1200}>
        <pointsMaterial
          color={0x7f9fff}
          size={14}
          sizeAttenuation
          depthTest
          depthWrite={false}
          fog={false}
        />
      </points>
      <points geometry={starsGeometry} renderOrder={-1190}>
        <pointsMaterial
          color={0xffffff}
          size={8}
          sizeAttenuation
          depthTest
          depthWrite={false}
          fog={false}
        />
      </points>
      <ShootingLetterStars />
    </>
  );
}

function ShootingLetterStars() {
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const textureCache = useMemo(() => new Map<string, THREE.CanvasTexture>(), []);
  const trailSegments = 13;
  const comets = useMemo(() => {
    return Array.from({ length: 6 }, (_, cometIndex) => {
      const start = randomSpaceVector(300 + cometIndex * 17, SKY_RADIUS * (1.52 + seededUnit(200 + cometIndex) * 0.6));
      const targetBias = randomSpaceVector(500 + cometIndex * 19, SKY_RADIUS * 0.35);
      const tangentSeed = new THREE.Vector3(
        seededUnit(610 + cometIndex) - 0.5,
        seededUnit(620 + cometIndex) - 0.5,
        seededUnit(630 + cometIndex) - 0.5,
      ).normalize();
      const radial = start.clone().normalize();
      const tangent = new THREE.Vector3().crossVectors(radial, tangentSeed).normalize();
      if (tangent.lengthSq() < 0.01) tangent.set(0, 1, 0).cross(radial).normalize();

      const direction = tangent
        .multiplyScalar(SKY_RADIUS * (0.18 + seededUnit(610 + cometIndex) * 0.06))
        .add(targetBias.clone().multiplyScalar(0.15));

      return {
        position: start.clone(),
        velocity: direction,
        trail: Array.from({ length: trailSegments }, () => start.clone()),
        wobbleSeed: seededUnit(830 + cometIndex) * Math.PI * 2,
        gravityStrength: SKY_RADIUS * (0.002 + seededUnit(720 + cometIndex) * 0.0012),
        gravityRadius: SKY_RADIUS * (1.18 + seededUnit(940 + cometIndex) * 0.35),
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    comets.forEach((comet, cometIndex) => {
      const toCenter = new THREE.Vector3().subVectors(new THREE.Vector3(...SKY_CENTER), comet.position);
      const distance = toCenter.length();
      const influence = THREE.MathUtils.smoothstep(distance, comet.gravityRadius, SKY_RADIUS * 0.72);
      if (distance > 0.0001 && influence > 0) {
        toCenter.normalize();
        const accel = comet.gravityStrength * influence / Math.max(distance * distance * 0.000001, 1);
        comet.velocity.addScaledVector(toCenter, accel);
      }

      const swirlAxis = new THREE.Vector3(0, 1, 0);
      const swirl = new THREE.Vector3().crossVectors(swirlAxis, toCenter).normalize();
      if (swirl.lengthSq() > 0.01) {
        comet.velocity.addScaledVector(swirl, Math.sin(time * 0.55 + comet.wobbleSeed) * SKY_RADIUS * 0.00002 * influence);
      }

      comet.velocity.multiplyScalar(0.998);
      comet.position.addScaledVector(comet.velocity, 0.016);

      comet.trail.unshift(comet.position.clone());
      comet.trail.length = trailSegments;

      for (let segment = 0; segment < trailSegments; segment++) {
        const sprite = spritesRef.current[cometIndex * trailSegments + segment];
        if (!sprite) continue;

        const trailT = segment / (trailSegments - 1);
        sprite.position.copy(comet.trail[segment]);
        sprite.position.addScaledVector(new THREE.Vector3(
          Math.sin(time * 1.9 + segment * 0.4 + cometIndex),
          Math.cos(time * 1.2 + segment * 0.35),
          Math.sin(time * 1.5 + segment * 0.5 - cometIndex),
        ).normalize(), SKY_RADIUS * 0.004 * (1 - trailT));

        const scale = THREE.MathUtils.lerp(100, 26, trailT);
        sprite.scale.set(scale, scale, 1);

        const material = sprite.material as THREE.SpriteMaterial;
        material.opacity = THREE.MathUtils.lerp(0.98, 0.05, trailT);
      }
    });
  });

  return (
    <group renderOrder={-1180}>
      {comets.map((_, cometIndex) => (
        Array.from({ length: trailSegments }, (_, segment) => {
          const letter = String.fromCharCode(65 + ((cometIndex * 5 + segment) % 26));
          const color = RAINBOW_COLORS[(cometIndex + segment) % RAINBOW_COLORS.length];
          const texture = getLetterTexture(textureCache, letter, color);

          return (
            <sprite
              key={`${cometIndex}-${segment}`}
              ref={(sprite) => {
                if (sprite) spritesRef.current[cometIndex * trailSegments + segment] = sprite;
              }}
              renderOrder={-1180}
            >
              <spriteMaterial
                map={texture}
                color={0xffffff}
                depthTest
                depthWrite={false}
                fog={false}
                transparent
                opacity={0}
              />
            </sprite>
          );
        })
      ))}
    </group>
  );
}

function getLetterTexture(cache: Map<string, THREE.CanvasTexture>, letter: string, color: string) {
  const key = `${letter}-${color}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.font = '900 82px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(letter, 64, 65);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeText(letter, 64, 65);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

function randomSpaceVector(seed: number, radius: number) {
  const u = seededUnit(seed + 1);
  const v = seededUnit(seed + 2);
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    Math.cos(theta) * sinPhi * radius,
    Math.cos(phi) * radius,
    Math.sin(theta) * sinPhi * radius,
  );
}

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
