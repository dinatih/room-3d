import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _v = new THREE.Vector3();

export interface BlobShadowProps {
  size?: [number, number];
  opacity?: number;
  y?: number;
  trackBone?: THREE.Bone | THREE.Object3D | null;
  groundY?: boolean;
  visible?: boolean;
}

export function BlobShadow({
  size = [55, 65],
  opacity = 0.4,
  y = 0.03,
  trackBone,
  groundY = false,
  visible = true,
}: BlobShadowProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uOpacity: { value: opacity } }), [opacity]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !visible) return;

    if (trackBone && mesh.parent) {
      trackBone.getWorldPosition(_v);
      mesh.parent.worldToLocal(_v);
      mesh.position.set(_v.x, y, _v.z);
      const height = Math.max(0, _v.y - 90);
      const factor = Math.max(0, 1 - height / 150);
      mesh.scale.setScalar(1 + (1 - factor) * 0.4);
      uniforms.uOpacity.value = opacity * factor;
    } else if (groundY && mesh.parent) {
      mesh.parent.getWorldPosition(_v);
      const altitude = Math.max(0, _v.y);
      mesh.position.y = -altitude + y;
      const factor = Math.max(0, 1 - altitude / 300);
      mesh.scale.setScalar(1 + (1 - factor) * 0.8);
      uniforms.uOpacity.value = opacity * factor;
    }
  });

  return (
    <mesh
      ref={meshRef}
      name="blob-shadow"
      userData={{ isBlobShadow: true }}
      visible={visible}
      renderOrder={2}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
    >
      <planeGeometry args={size} />
      <shaderMaterial
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
        uniforms={uniforms}
        vertexShader="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        fragmentShader="varying vec2 vUv; uniform float uOpacity; void main() { float d = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(1.0, 0.0, d) * uOpacity); }"
      />
    </mesh>
  );
}
