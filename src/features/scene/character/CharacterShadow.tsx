import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _v = new THREE.Vector3();

export function CharacterShadow({ hipsBone, visible = true }: { hipsBone?: THREE.Bone | null; visible?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uOpacity: { value: 0.4 } }), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !visible) return;
    if (hipsBone && mesh.parent) {
      hipsBone.getWorldPosition(_v);
      mesh.parent.worldToLocal(_v);
      mesh.position.set(_v.x, 0.03, _v.z);
      const height = Math.max(0, _v.y - 90);
      const factor = Math.max(0, 1 - height / 150);
      mesh.scale.setScalar(1 + (1 - factor) * 0.4);
      uniforms.uOpacity.value = 0.4 * factor;
    }
  });

  return (
    <mesh ref={meshRef} visible={visible} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <planeGeometry args={[55, 65]} />
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
