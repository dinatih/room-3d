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
    <group position={SKY_CENTER} name="SkySphere" userData={{ isSky: true }}>
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
    </>
  );
}

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
