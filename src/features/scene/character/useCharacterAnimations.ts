import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { retargetClip, _retargetCache } from '../retargeting';
import { duoSessionManager } from '../ai/duoSessionManager';
import { resolveAnimationPath } from '../animations/animationResolver';

const silentManager = new THREE.LoadingManager();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const MAX_DYNAMIC_GLTF_CACHE = 12;
const MAX_RETARGETED_CLIPS = 48;
const globalGLTFCache = new Map<string, Promise<any>>();

export function cacheDynamicGLTF(path: string): Promise<any> {
  const cached = globalGLTFCache.get(path);
  if (cached) {
    globalGLTFCache.delete(path);
    globalGLTFCache.set(path, cached);
    return cached;
  }
  const pending = new Promise((resolve, reject) => {
    const loader = new GLTFLoader(silentManager);
    loader.setDRACOLoader(dracoLoader);
    loader.load(path, resolve, undefined, (err) => {
      const msg = `[GLB 404] Fichier introuvable : "${path}" — ${(err as any)?.message ?? err}`;
      console.error(msg);
      reject(new Error(msg));
    });
  });
  globalGLTFCache.set(path, pending);
  while (globalGLTFCache.size > MAX_DYNAMIC_GLTF_CACHE) {
    globalGLTFCache.delete(globalGLTFCache.keys().next().value!);
  }
  return pending;
}

export function cacheRetargetedClip(key: string, clip: THREE.AnimationClip) {
  if (!_retargetCache[key] && Object.keys(_retargetCache).length >= MAX_RETARGETED_CLIPS) {
    delete _retargetCache[Object.keys(_retargetCache)[0]];
  }
  _retargetCache[key] = clip;
}

export interface UseCharacterAnimationsProps {
  id: string;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  sittingScene?: THREE.Group;
  invalidate: () => void;
}

export function useCharacterAnimations({
  id,
  scene,
  animations,
  sittingScene,
  invalidate
}: UseCharacterAnimationsProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const currentAnimClip = useRef<string | null>(null);
  const userAnimOverrideRef = useRef<boolean>(false);

  const loadAndPlayClip = useCallback((pathOrKey: string, loop = true, isUserOverride = false) => {

    if (!scene || !mixerRef.current) return;
    const path = resolveAnimationPath(pathOrKey);
    const isTPose = path === 'tpose' || path === 'animations/poses_idles/anim_t_pose.glb' || pathOrKey === 't_pose';
    if (isTPose) {
      currentAnimClip.current = 'tpose';
      if (isUserOverride) userAnimOverrideRef.current = true;
      invalidate();
      return;
    }


    if (path === 'idle') {
      currentAnimClip.current = null;
      userAnimOverrideRef.current = false;
      invalidate();
      return;
    }

    const handleClip = (clip: THREE.AnimationClip, sourceScene: THREE.Object3D | undefined) => {
      if (!clip) return;
      const mixer = mixerRef.current;
      if (!mixer) return;

      clip.name = path;
      const cacheKey = id + '_' + path;
      let finalClip = _retargetCache[cacheKey];
      if (!finalClip) {
        if (sourceScene) sourceScene.updateMatrixWorld(true);
        finalClip = retargetClip(clip, scene, sourceScene);
        cacheRetargetedClip(cacheKey, finalClip);
      }
      finalClip.name = path;

      let action = actionsRef.current[path];
      if (!action) {
        action = mixer.clipAction(finalClip);
        action.enabled = true;
        actionsRef.current[path] = action;
      }

      if (!loop) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
      }

      if (duoSessionManager.isPlaying()) {
        const currentAnimState = duoSessionManager.getCurrentAnimState();
        if (currentAnimState && (currentAnimState.clipA === path || currentAnimState.clipB === path)) {
          duoSessionManager.updateRealClipDuration(currentAnimState.def.id, finalClip.duration);
        }
      }

      document.dispatchEvent(new CustomEvent('walker-clip-loaded', {
        detail: { id, path, duration: finalClip.duration }
      }));

      currentAnimClip.current = path;
      if (isUserOverride) userAnimOverrideRef.current = true;
      invalidate();
    };

    const existingAnim = animations?.find(a => a.name === path);
    if (existingAnim) {
      handleClip(existingAnim, existingAnim.userData?.animScene as THREE.Object3D | undefined);
    } else {
      const loadCallback = (gltf: any) => {
        const sourceScene = gltf.scene;
        if (sourceScene) sourceScene.updateMatrixWorld(true);
        handleClip(gltf.animations[0], sourceScene);
      };

      cacheDynamicGLTF(path).then(loadCallback).catch(console.error);
    }
  }, [id, scene, animations, invalidate]);

  // Initialisation du mixer et pré-retargeting des animations de base
  useEffect(() => {
    if (!scene) return;
    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    mixer.addEventListener('finished', (e) => {
      if (currentAnimClip.current && actionsRef.current[currentAnimClip.current] === e.action) {
        currentAnimClip.current = null;
        userAnimOverrideRef.current = false;
      }
    });

    actionsRef.current = {};

    animations.forEach(clip => {
      const isExternal = clip.name.endsWith('.glb');
      const actualAnimScene = (clip as any).userData?.animScene || (isExternal ? sittingScene : undefined);
      const cacheKey = id + '_' + clip.name;
      let finalClip = _retargetCache[cacheKey];
      if (!finalClip) {
        finalClip = retargetClip(clip, scene, actualAnimScene);
        cacheRetargetedClip(cacheKey, finalClip);
      }

      const action = mixer.clipAction(finalClip);
      actionsRef.current[clip.name] = action;
      action.enabled = true;
      action.play();
      action.setEffectiveWeight(0);
    });

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [id, scene, animations, sittingScene]);

  // Écouteur global pour walker-anim-finished
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    const onFinished = (e: any) => {
      document.dispatchEvent(new CustomEvent('walker-anim-finished', { detail: { id, path: e.action.getClip().name } }));
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [id]);

  return {
    mixerRef,
    actionsRef,
    activeActionName,
    currentAnimClip,
    userAnimOverrideRef,
    loadAndPlayClip
  };
}
