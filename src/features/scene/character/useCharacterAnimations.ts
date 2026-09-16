import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { retargetClip, _retargetCache } from '../retargeting/index';
import { resolveAnimationPath, getAnimationDef } from '../animations/animationResolver';

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

export function clearRetargetCache() {
  for (const key of Object.keys(_retargetCache)) {
    delete _retargetCache[key];
  }
}

export interface UseCharacterAnimationsProps {
  id: string;
  scene: THREE.Group;
  animations?: THREE.AnimationClip[];
  sittingScene?: THREE.Group;
  invalidate: () => void;
}

export function useCharacterAnimations({
  id,
  scene,
  invalidate
}: UseCharacterAnimationsProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const currentAnimClip = useRef<string | null>(null);
  const userAnimOverrideRef = useRef<boolean>(false);

  const loadAndPlayClip = useCallback((pathOrKey: string, loop = true, isUserOverride = false) => {
    if (!scene || !mixerRef.current) return;
    const def = getAnimationDef(pathOrKey);
    const animId = def ? def.id : pathOrKey;
    const path = def ? def.path : resolveAnimationPath(pathOrKey);

    const isTPose = animId === 'tpose' || animId === 't_pose' || animId === 'anim_t_pose' || path === 'tpose' || path === 'animations/poses_idles/anim_t_pose.glb' || pathOrKey === 't_pose' || pathOrKey === 'tpose';
    if (isTPose) {
      currentAnimClip.current = 't_pose';
      if (isUserOverride) userAnimOverrideRef.current = true;
      invalidate();
      return;
    }

    const handleClip = (clip: THREE.AnimationClip, sourceScene: THREE.Object3D | undefined) => {
      if (!clip) return;
      const mixer = mixerRef.current;
      if (!mixer) return;

      clip.name = animId;
      const cacheKey = id + '_' + animId;
      let finalClip = _retargetCache[cacheKey];
      if (!finalClip) {
        if (sourceScene) sourceScene.updateMatrixWorld(true);
        finalClip = retargetClip(clip, scene, sourceScene);
        cacheRetargetedClip(cacheKey, finalClip);
      }
      finalClip.name = animId;

      let action = actionsRef.current[animId] || actionsRef.current[path];
      if (!action) {
        action = mixer.clipAction(finalClip);
        action.enabled = true;
        // Indexer sous l'ID canonique
        actionsRef.current[animId] = action;
        // Indexer sous la clé/alias demandé
        if (pathOrKey && pathOrKey !== animId) {
          actionsRef.current[pathOrKey] = action;
        }
        // Indexer sous le chemin GLB
        if (path && path !== animId) {
          actionsRef.current[path] = action;
        }
        // Indexer sous tous les alias connus de la définition
        if (def?.aliases) {
          for (const alias of def.aliases) {
            actionsRef.current[alias] = action;
          }
        }
      }

      if (!loop) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
      }

      if (isUserOverride) {
        currentAnimClip.current = animId;
        userAnimOverrideRef.current = true;
      }
      invalidate();
    };

    const loadCallback = (gltf: any) => {
      const sourceScene = gltf.scene;
      if (sourceScene) sourceScene.updateMatrixWorld(true);
      handleClip(gltf.animations[0], sourceScene);
    };

    cacheDynamicGLTF(path).then(loadCallback).catch(console.error);
  }, [id, scene, invalidate]);

  // Initialisation du mixer et pré-chargement dynamique de l'idle
  useEffect(() => {
    if (!scene) return;
    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    mixer.addEventListener('finished', (e) => {
      const currentAction = currentAnimClip.current ? actionsRef.current[currentAnimClip.current] : null;
      if (currentAction === e.action && e.action.loop === THREE.LoopOnce) {
        currentAnimClip.current = null;
        userAnimOverrideRef.current = false;
      }
    });

    actionsRef.current = {};

    // Pré-chargement automatique de la pose idle par défaut
    loadAndPlayClip('idle');

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [scene, loadAndPlayClip]);

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
