import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { isAppIdle } from '../idleState';
import { FADE_SECONDS, FISH_SPEED, fishHabitat, pickFishTarget, shortestFishTurn, type FishMode } from './goldfishBehavior';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import jikinModel from './goldfishModel.json';
import tosakinModel from './tosakinModel.json';

const MODELS = { jikin: jikinModel, tosakin: tosakinModel };

export function Goldfish({ species = 'jikin', isPreview = false, previewAnim = 'idle', onSize }: {
  species?: keyof typeof MODELS;
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}) {
  const model = MODELS[species];
  const { scene, animations } = useGLTFClone(`/characters/${species}-goldfish/${species}-goldfish.glb`);
  const body = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const clips = useMemo(() => {
    if (animations.length !== 1) throw new Error('Goldfish: expected the original combined animation');
    return Object.fromEntries(Object.entries(model.frames).map(([name, [start, end]]) => {
      // Blender exported original frame numbers as timestamps, including frame 2 offset.
      const clip = THREE.AnimationUtils.subclip(animations[0], name, start, end + 1, 24);
      if (clip.tracks.length === 0) throw new Error(`Goldfish: empty animation ${name}`);
      return [name, clip];
    })) as Record<FishMode, THREE.AnimationClip>;
  }, [animations, model]);
  const current = useRef<THREE.AnimationAction | null>(null);
  const life = useRef({
    mode: 'idle' as FishMode, timer: 0, target: new THREE.Vector3(),
    arrival: 'idle' as 'idle' | 'eat', startYaw: 0, turn: 0, elapsed: 0,
  });
  const direction = useMemo(() => new THREE.Vector3(), []);
  const habitat = fishHabitat(model.radius);

  function play(mode: FishMode) {
    const next = mixer.clipAction(clips[mode]);
    next.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    if (current.current && current.current !== next) {
      current.current.fadeOut(FADE_SECONDS);
      next.fadeIn(FADE_SECONDS);
    }
    current.current = next;
    life.current.mode = mode;
  }

  useLayoutEffect(() => {
    scene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const ai = life.current;
    ai.timer = clips.idle.duration * 2;
    body.current!.rotation.set(0, 0, 0);
    body.current!.position.set(0, isPreview ? 0 : (habitat.bottom + habitat.top) / 2, isPreview ? 0 : (species === 'jikin' ? -20 : 20));
    const mode = isPreview ? previewAnim : 'idle';
    if (!(mode in clips)) throw new Error(`Goldfish: unknown animation ${mode}`);
    play(mode as FishMode);
    mixer.update(0);
    if (isPreview) {
      body.current!.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(body.current!, true);
      body.current!.position.y -= box.min.y;
      onSize?.(box.getSize(new THREE.Vector3()));
      useAnimPreviewStore.getState().setClipInfo(`${species} ${mode}`, clips[mode as FishMode].duration, false, 24);
    }
    invalidate();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      current.current = null;
    };
  }, [scene, clips, mixer, invalidate, isPreview, previewAnim, onSize, species]);

  useFrame((_, delta) => {
    if (isAppIdle() || !body.current) return;
    if (isPreview) {
      const store = useAnimPreviewStore.getState();
      const time = store.tick(delta);
      const action = current.current!;
      // Keep the end pose available when scrubbing to the final frame.
      action.setLoop(THREE.LoopOnce, 0);
      action.clampWhenFinished = true;
      action.paused = false;
      mixer.setTime(time);
      invalidate();
      return;
    }
    const fish = body.current;
    const ai = life.current;
    if (ai.mode === 'idle' || ai.mode === 'eat') {
      ai.timer -= delta;
      if (ai.timer <= 0) {
        ai.arrival = Math.random() < 0.25 ? 'eat' : 'idle';
        const target = pickFishTarget(model.radius, ai.arrival === 'eat' ? 'eat' : 'swim');
        ai.target.set(target.x, target.y, target.z);
        direction.copy(ai.target).sub(fish.position);
        ai.startYaw = fish.rotation.y;
        ai.turn = shortestFishTurn(ai.startYaw, Math.atan2(direction.x, direction.z));
        ai.elapsed = 0;
        play(ai.turn > 0 ? 'turn-left' : 'turn-right');
      }
    } else if (ai.mode === 'turn-left' || ai.mode === 'turn-right') {
      ai.elapsed += delta;
      const progress = Math.min(ai.elapsed / clips[ai.mode].duration, 1);
      fish.rotation.y = ai.startYaw + ai.turn * progress;
      if (progress === 1) play('swim');
    } else {
      direction.copy(ai.target).sub(fish.position);
      const distance = direction.length();
      if (distance <= FISH_SPEED * delta) {
        fish.position.copy(ai.target);
        fish.rotation.x = 0;
        play(ai.arrival);
        ai.timer = clips[ai.arrival].duration * (1 + Math.floor(Math.random() * 3));
      } else {
        direction.divideScalar(distance);
        fish.position.addScaledVector(direction, FISH_SPEED * delta);
        fish.rotation.y = Math.atan2(direction.x, direction.z);
        fish.rotation.x = -Math.asin(direction.y);
      }
    }
    mixer.update(delta);
    invalidate();
  });

  return (
    <group ref={body} rotation-order="YXZ">
      <group scale={model.scale}>
        <group position={[-model.center[0], -model.center[1], -model.center[2]]}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}
