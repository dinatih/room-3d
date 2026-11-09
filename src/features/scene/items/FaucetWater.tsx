import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OccupancyManager } from '../ai/occupancyManager';
import { SMART_OBJECTS } from '../ai/smartObjectRegistry';
import { cameraState } from '../cameraState';
import { resolveAnimationId } from '../animations/animationResolver';

/** Jet en centimètres, de la sortie du mitigeur au fond de la cuve. */
export function FaucetWater({ objectId, slotIds, position, basinY, isPreview = false }: {
  objectId: string;
  slotIds: string[];
  position: [number, number, number];
  basinY: number;
  isPreview?: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const material = useRef<THREE.ShaderMaterial>(null!);
  const ripple = useRef<THREE.Mesh>(null!);
  const height = position[1] - basinY;
  useFrame(({ clock, invalidate }) => {
    const running = !isPreview && slotIds.some(slotId => {
      const occupant = OccupancyManager.getOccupant(objectId, slotId);
      const animation = occupant && cameraState.positions[occupant]?.anim;
      const slot = SMART_OBJECTS[objectId].slots.find(slot => slot.slotId === slotId)!;
      return !!animation && !!slot.animation && resolveAnimationId(animation) === resolveAnimationId(slot.animation);
    });
    group.current.visible = running;
    if (running) {
      const time = clock.elapsedTime;
      material.current.uniforms.time.value = time;
      ripple.current.scale.setScalar(1 + (time * 2 % 1) * 4);
      (ripple.current.material as THREE.MeshBasicMaterial).opacity = (1 - time * 2 % 1) * 0.4;
      invalidate();
    }
  });
  return <group ref={group} name={`${objectId}-faucet-water`} visible={false} userData={{ skipMerge: true }}>
    <mesh position={[position[0], position[1] - height / 2, position[2]]} raycast={() => {}}>
      <cylinderGeometry args={[0.45, 0.65, height, 12, 1, true]} />
      <shaderMaterial ref={material} transparent depthWrite={false} side={THREE.DoubleSide}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`uniform float time; varying vec2 vUv;
          void main() {
            float flow = 0.5 + 0.5 * sin(vUv.y * 85.0 + time * 28.0 + sin(vUv.x * 18.0));
            gl_FragColor = vec4(0.65, 0.88, 1.0, 0.25 + flow * 0.35);
          }`} />
    </mesh>
    <mesh ref={ripple} position={[position[0], basinY + 0.15, position[2]]} rotation-x={-Math.PI / 2} raycast={() => {}}>
      <ringGeometry args={[0.7, 0.85, 32]} />
      <meshBasicMaterial color="#bceaff" transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  </group>;
}
