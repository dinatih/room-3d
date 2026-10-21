import type * as THREE from 'three';
import { captureAnimationClip, captureAnimationRig, restoreAnimationClip, type RigNode } from './animationSerialization';
import type { AnimationSource } from './animationSource';
import type { AnimationRequest, AnimationResponse } from './animation.worker';
import { characterRuntimeStats } from './characterRuntime';

interface RigLibrary { target: RigNode; users: number; clips: Map<string, { promise: Promise<THREE.AnimationClip>; users: number }> }
const libraries = new Map<string, RigLibrary>();
const jobs = new Map<number, { resolve: (clip: THREE.AnimationClip) => void; reject: (error: Error) => void }>();
let worker: Worker | undefined, nextId = 0;
let failure: Error | undefined;
export function animationLibraryStats() {
  return { rigs: libraries.size, users: [...libraries.values()].reduce((n, rig) => n + rig.users, 0), clips: [...libraries.values()].reduce((n, rig) => n + rig.clips.size, 0), pending: jobs.size };
}
function fail(error: Error): void {
  failure = error;
  for (const job of jobs.values()) job.reject(error);
  jobs.clear();
}

export function acquireAnimationLibrary(scene: THREE.Object3D) {
  const target = captureAnimationRig(scene);
  const key = JSON.stringify(target);
  let library = libraries.get(key);
  if (!library) { library = { target, users: 0, clips: new Map() }; libraries.set(key, library); }
  library.users++;
  const current = library;
  const retained = new Set<string>();
  const discard = (clipKey: string) => {
    if (!retained.delete(clipKey)) return;
    const entry = current.clips.get(clipKey)!;
    if (--entry.users === 0) current.clips.delete(clipKey);
  };
  return {
    release() {
      for (const clipKey of retained) discard(clipKey);
      if (--current.users === 0) libraries.delete(key);
    },
    discard(path: string, animationId: string, rootMotionSpace?: AnimationRequest['rootMotionSpace']) { discard(`${path}:${animationId}:${rootMotionSpace ?? ''}`); },
    prepare(path: string, animationId: string, source: AnimationSource, rootMotionSpace?: AnimationRequest['rootMotionSpace']): Promise<THREE.AnimationClip> {
      if (failure) return Promise.reject(failure);
      const clipKey = `${path}:${animationId}:${rootMotionSpace ?? ''}`;
      const cached = current.clips.get(clipKey);
      if (cached) {
        if (!retained.has(clipKey)) { retained.add(clipKey); cached.users++; }
        return cached.promise;
      }
      if (!worker) {
        worker = new Worker(new URL('./animation.worker.ts', import.meta.url), { type: 'module', name: 'room-animation' });
        worker.onerror = event => fail(new Error(`Animation worker: ${event.message}`));
        worker.onmessageerror = () => fail(new Error('Animation worker response could not be decoded'));
        worker.onmessage = ({ data }: MessageEvent<AnimationResponse>) => {
          const job = jobs.get(data.id);
          if (!job) { fail(new Error('Unknown animation worker response')); return; }
          jobs.delete(data.id);
          const metric = characterRuntimeStats.preparation;
          metric.calls++; metric.totalMs += data.milliseconds; metric.maxMs = Math.max(metric.maxMs, data.milliseconds);
          if (data.ok) job.resolve(restoreAnimationClip(data.clip));
          else job.reject(new Error(data.error));
        };
      }
      const clip = source.animations[0];
      if (!clip) return Promise.reject(new Error(`Animation source has no clip: ${path}`));
      const prepared = new Promise<THREE.AnimationClip>((resolve, reject) => {
        const id = ++nextId;
        jobs.set(id, { resolve: clip => { clip.name = animationId; resolve(clip); }, reject });
        const clipData = captureAnimationClip(clip);
        clipData.name = animationId;
        const request: AnimationRequest = { id, target: current.target, source: captureAnimationRig(source.scene), clip: clipData, rootMotionSpace };
        try { worker!.postMessage(request); }
        catch (error) { jobs.delete(id); reject(error instanceof Error ? error : new Error(String(error))); }
      });
      retained.add(clipKey);
      current.clips.set(clipKey, { promise: prepared, users: 1 });
      return prepared;
    },
  };
}

if (import.meta.hot) import.meta.hot.dispose(() => { worker?.terminate(); fail(new Error('Animation worker replaced during hot reload')); });
