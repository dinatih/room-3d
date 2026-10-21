import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { acquireAnimationLibrary } from './animationLibrary';
import { resolveAnimationPath, resolveAnimationId, getAnimationDef } from '../animations/animationResolver';
import { animationSourcePlugin, extractAnimationSource, type AnimationSource } from './animationSource';

const silentManager = new THREE.LoadingManager();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const MAX_DYNAMIC_GLTF_CACHE = 8;
const globalGLTFCache = new Map<string, Promise<AnimationSource>>();
// Pending loads are shared independently of the completed-source LRU. Evicting
// an unfinished request would let another character decode the same file again.
const pendingGLTFLoads = new Map<string, Promise<AnimationSource>>();

export function cacheDynamicGLTF(path: string): Promise<AnimationSource> {
  const loading = pendingGLTFLoads.get(path);
  if (loading) return loading;
  const cached = globalGLTFCache.get(path);
  if (cached) {
    globalGLTFCache.delete(path);
    globalGLTFCache.set(path, cached);
    return cached;
  }
  const pending = new Promise<AnimationSource>((resolve, reject) => {
    const loader = new GLTFLoader(silentManager);
    loader.setDRACOLoader(dracoLoader);
    loader.register(animationSourcePlugin);
    loader.load(path, gltf => resolve(extractAnimationSource(gltf)), undefined, (err) => {
      const msg = `[GLB 404] Fichier introuvable : "${path}" — ${(err as any)?.message ?? err}`;
      console.error(msg);
      reject(new Error(msg));
    });
  });
  const shared = pending.then(source => {
    pendingGLTFLoads.delete(path);
    globalGLTFCache.set(path, shared);
    while (globalGLTFCache.size > MAX_DYNAMIC_GLTF_CACHE) {
      globalGLTFCache.delete(globalGLTFCache.keys().next().value!);
    }
    return source;
  }, error => {
    pendingGLTFLoads.delete(path);
    throw error;
  });
  pendingGLTFLoads.set(path, shared);
  return shared;
}

export interface UseCharacterAnimationsProps {
  id: string;
  scene: THREE.Group;
  animations?: THREE.AnimationClip[];
  sittingScene?: THREE.Group;
  invalidate: () => void;
  onRelease: (animationId: string) => void;
}

export function useCharacterAnimations({
  id,
  scene,
  invalidate, onRelease
}: UseCharacterAnimationsProps) {
  const libraryRef = useRef<ReturnType<typeof acquireAnimationLibrary> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const currentAnimClip = useRef<string | null>(null);
  const userAnimOverrideRef = useRef<boolean>(false);
  const pendingLoadsRef = useRef<Set<string>>(new Set());
  const failedLoadsRef = useRef<Set<string>>(new Set());
  const retired = useRef(new Map<THREE.AnimationAction, number>());
  const baseClips = useMemo(() => new Set(['idle', 'falling', 'falling-idle'].map(resolveAnimationId)), []);

  function retireAction(action: THREE.AnimationAction, duration: number) {
    retired.current.set(action, mixerRef.current!.time + duration);
  }
  function collectActions() {
    const mixer = mixerRef.current!;
    for (const [action, end] of retired.current) {
      if (actionsRef.current[activeActionName.current] === action) { retired.current.delete(action); continue; }
      if (mixer.time < end) continue;
      action.stop(); retired.current.delete(action);
      const id = action.getClip().name;
      if (baseClips.has(id)) continue;
      mixer.uncacheAction(action.getClip());
      if (actionsRef.current[id] && actionsRef.current[id] !== action) continue;
      for (const key in actionsRef.current) if (actionsRef.current[key] === action) delete actionsRef.current[key];
      onRelease(id);
      const def = getAnimationDef(id);
      libraryRef.current!.discard(def?.path ?? resolveAnimationPath(id), id, def?.rootMotionSpace);
    }
  }

  const loadAndPlayClip = useCallback((pathOrKey: string, loop = true, isUserOverride = false) => {
    if (!scene || !mixerRef.current) return;
    const def = getAnimationDef(pathOrKey);
    const animId = def ? def.id : pathOrKey;
    const path = def ? def.path : resolveAnimationPath(pathOrKey);

    if (!path || (!path.endsWith('.glb') && !path.endsWith('.gltf') && !path.includes('/'))) {
      console.warn(`[useCharacterAnimations] Animation introuvable pour la clé "${pathOrKey}". Chargement ignoré.`);
      return;
    }

    const isTPose = animId === 't-pose';
    if (isTPose) {
      currentAnimClip.current = 't-pose';
      if (isUserOverride) userAnimOverrideRef.current = true;
      invalidate();
      return;
    }

    // Si l'action existe déjà en mémoire, la réactiver immédiatement sans recharger le GLB
    const existingAction = actionsRef.current[animId] || actionsRef.current[path] || (pathOrKey ? actionsRef.current[pathOrKey] : undefined);
    if (existingAction) {
      if (!loop || def?.loop === 'once') {
        existingAction.setLoop(THREE.LoopOnce, 1);
        existingAction.clampWhenFinished = true;
      } else {
        existingAction.setLoop(THREE.LoopRepeat, Infinity);
        existingAction.clampWhenFinished = false;
      }

      if (isUserOverride) {
        currentAnimClip.current = animId;
        userAnimOverrideRef.current = true;
        // Si l'action était déjà en cours ou terminée, la relancer depuis le début
        existingAction.reset().play();
      }
      invalidate();
      return;
    }

    // Verrou anti-spam : évite de lancer des requêtes async simultanées pour le même clip
    const loadKey = `${id}_${animId}`;
    if (pendingLoadsRef.current.has(loadKey) || failedLoadsRef.current.has(loadKey)) {
      return;
    }
    pendingLoadsRef.current.add(loadKey);

    const requestedMixer = mixerRef.current;
    const library = libraryRef.current!;
    const handleClip = (finalClip: THREE.AnimationClip) => {
      if (mixerRef.current !== requestedMixer) return;
      pendingLoadsRef.current.delete(loadKey);
      const mixer = mixerRef.current;
      if (!mixer) return;

      // Déjà instancié entre temps
      let action = actionsRef.current[animId] || actionsRef.current[path];
      if (action) return;

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

    cacheDynamicGLTF(path)
      .then(source => {
        if (mixerRef.current !== requestedMixer) return;
        return library.prepare(path, animId, source, def?.rootMotionSpace);
      })
      .then(clip => { if (clip) handleClip(clip); })
      .catch((err) => {
        pendingLoadsRef.current.delete(loadKey);
        failedLoadsRef.current.add(loadKey);
        if (mixerRef.current === requestedMixer) { setError(err instanceof Error ? err : new Error(String(err))); invalidate(); }
      });
  }, [id, scene, invalidate]);

  // Initialisation du mixer et pré-chargement dynamique de l'idle
  useEffect(() => {
    if (!scene) return;
    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;
    const library = acquireAnimationLibrary(scene);
    libraryRef.current = library;

    mixer.addEventListener('finished', (e) => {
      const currentAction = currentAnimClip.current ? actionsRef.current[currentAnimClip.current] : null;
      if (currentAction === e.action && e.action.loop === THREE.LoopOnce) {
        currentAnimClip.current = null;
        userAnimOverrideRef.current = false;
      }
    });

    actionsRef.current = {};
    pendingLoadsRef.current.clear();
    failedLoadsRef.current.clear();

    // Pré-chargement automatique de la pose idle et des animations de chute
    loadAndPlayClip('idle');
    loadAndPlayClip('falling');
    loadAndPlayClip('falling-idle');

    return () => {
      library.release();
      libraryRef.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      mixerRef.current = null;
      actionsRef.current = {};
      retired.current.clear();
      pendingLoadsRef.current.clear();
      failedLoadsRef.current.clear();
    };
  }, [scene, loadAndPlayClip]);

  // Écouteur global pour character-anim-finished
  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    const onFinished = (e: any) => {
      document.dispatchEvent(new CustomEvent('character-anim-finished', { detail: { id, path: e.action.getClip().name } }));
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [id]);

  if (error) throw error;
  return {
    mixerRef,
    actionsRef,
    activeActionName,
    currentAnimClip,
    userAnimOverrideRef,
    loadAndPlayClip, retireAction, collectActions
  };
}
