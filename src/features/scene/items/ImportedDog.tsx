import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AnimationMixer, Group, LoopOnce, Vector3, type AnimationAction } from 'three';
import { enableAnimatedFrustumCulling } from '../utils/animatedFrustumCulling';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import { cameraState } from '../cameraState';
import { glbLocalBBox } from '../glbUtils';
import { useGLTFClone } from '../useGLTFClone';
import { createDogBehavior, resumeDogBehavior, updateDogBehavior, releaseDogRoute, transitionDogAction, type DogContext } from './dogBehavior';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';
import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import type { SceneModelProps } from '@shared/types';

/** Original skeleton and clips; one animation at a time, independent per dog. */
export function ImportedDog({ path, height, clip, onSize, agentId, walkClip, runClip, heading = 0, isPreview = false, previewAnim }: SceneModelProps & { path: string; height: number; clip: string; agentId?: string; walkClip?: string; runClip?: string; heading?: number; isPreview?: boolean; previewAnim?: string }) {
  const { invalidate } = useThree();
  const { scene, animations } = useGLTFClone(path);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const root = useRef<Group>(null);
  const life = useMemo(createDogBehavior, []);
  const active = useRef<AnimationAction | null>(null);
  const navigationEnabled = useNavigationEnabled();
  const autonomous = !!agentId && !!runClip && navigationEnabled;
  const context = (): DogContext => ({ id: agentId!, root: root.current!, walkSpeed: 50, canWalk: !!walkClip, pauses: ['idle'], play(action) {
    const name = action === 'walk' ? walkClip : action === 'run' ? runClip : clip;
    const animation = animations.find(candidate => candidate.name === name);
    if (!animation) throw new Error(`Missing animation ${name}: ${path}`);
    active.current = transitionDogAction(mixer, animation, active.current);
    return animation.duration;
  }});
  useLayoutEffect(() => {
    const animation = animations.find(animation => animation.name === clip);
    if (!animation) throw new Error(`Missing dog animation ${clip}: ${path}`);
    mixer.stopAllAction();
    mixer.clipAction(animation).reset().play();
    mixer.update(0);
    scene.scale.setScalar(1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, heading, 0);
    scene.traverse(node => { if ((node as import('three').Mesh).isMesh) enableAnimatedFrustumCulling(node as import('three').Mesh); });
    scene.updateMatrixWorld(true);
    const bounds = glbLocalBBox(scene, true);
    const size = bounds.getSize(new Vector3());
    if (size.y <= 0) throw new Error(`Invalid dog bounds: ${path}`);
    const scale = height / size.y;
    scene.scale.setScalar(scale);
    scene.position.set(-(bounds.min.x + bounds.max.x) / 2 * scale, -bounds.min.y * scale, -(bounds.min.z + bounds.max.z) / 2 * scale);
    onSize?.(size.multiplyScalar(scale));
    if (autonomous) {
      setAgentProfile(agentId!, { radius: Math.min(size.x, size.z) / 2, height });
      root.current!.updateWorldMatrix(true, false);
      root.current!.getWorldPosition(life.position);
      resumeDogBehavior(life, context());
    }
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(scene); if (autonomous) { removeAgentProfile(agentId!); releaseDogRoute(life, agentId!); delete cameraState.positions[agentId!]; } };
  }, [scene, height, path, onSize, animations, clip, mixer, autonomous, agentId, walkClip, runClip, life, heading]);
  useEffect(() => {
    if (!isPreview) return;
    const name = previewAnim ?? clip;
    const animation = animations.find(candidate => candidate.name === name);
    if (!animation) throw new Error(`Missing dog preview animation ${name}: ${path}`);
    mixer.stopAllAction();
    active.current = mixer.clipAction(animation).reset().setLoop(LoopOnce, 1).play();
    active.current.clampWhenFinished = true;
    useAnimPreviewStore.getState().setClipInfo(animation.name, animation.duration, false, 30);
    invalidate();
  }, [isPreview, previewAnim, clip, animations, mixer, path, invalidate]);
  useFrame((_, delta) => {
    if (isPreview) { mixer.setTime(useAnimPreviewStore.getState().tick(delta)); invalidate(); return; }
    if (autonomous) {
    updateDogBehavior(life, context(), delta);
    root.current!.getWorldQuaternion(life.rotation);
    cameraState.positions[agentId!] = { x: life.position.x, y: life.position.y, z: life.position.z, yaw: life.euler.setFromQuaternion(life.rotation).y };
  } mixer.update(delta); });
  return <group ref={root}><primitive object={scene} /></group>;
}
