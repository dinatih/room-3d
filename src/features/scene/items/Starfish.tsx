import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { isAppIdle } from '../idleState';
import { advanceStarfish, STARFISH_STARTS } from './starfishBehavior';
import model from './starfishModel.json';

function Starfish({ index }: { index: number }) {
  const { scene, animations } = useGLTFClone('/characters/star-fish/star-fish.glb');
  const body = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const state = useMemo(() => {
    const start = STARFISH_STARTS[index];
    return { ...start, position: { ...start.position }, target: { ...start.target } };
  }, [index]);

  useLayoutEffect(() => {
    if (animations.length !== 1) throw new Error('Starfish: expected the original arm animation');
    scene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const action = mixer.clipAction(animations[0]);
    action.setLoop(THREE.LoopRepeat, Infinity).play();
    mixer.timeScale = 0.5;
    mixer.setTime(state.phase / (2 * Math.PI) * animations[0].duration);
    invalidate();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [scene, animations, mixer, invalidate, state]);

  useFrame((_, delta) => {
    if (isAppIdle()) return;
    advanceStarfish(state, delta);
    body.current!.position.set(state.position.x, state.position.y, state.position.z);
    body.current!.rotation.y = state.yaw;
    mixer.update(delta);
    invalidate();
  });

  return (
    <group ref={body} position={[state.position.x, state.position.y, state.position.z]} rotation={[0, state.yaw, 0]}
           userData={{ itemName: `Étoile de mer ${index + 1}`, animUnit: true, noAnim: true, skipMerge: true }}>
      <group scale={model.scale}>
        <group position={[-model.center[0], -model.center[1], -model.center[2]]}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

export function BathtubStarfish() {
  return <>{STARFISH_STARTS.map((_, index) => <Starfish key={index} index={index} />)}</>;
}
