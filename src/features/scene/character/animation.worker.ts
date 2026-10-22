import { fitDronaCarry } from '../animations/fitDronaCarry';
import { retargetClip } from '../retargeting/retargetClip';
import { captureAnimationClip, restoreAnimationClip, restoreAnimationRig, type ClipData, type RigNode } from './animationSerialization';

export interface AnimationRequest {
  id: number; target: RigNode; source: RigNode; clip: ClipData;
  rootMotionSpace?: 'world-meters' | 'rest-meters';
}
export type AnimationResponse = { id: number; milliseconds: number } & ({ ok: true; clip: ClipData } | { ok: false; error: string });

self.onmessage = ({ data }: MessageEvent<AnimationRequest>) => {
  const start = performance.now();
  let response: AnimationResponse;
  try {
    const target = restoreAnimationRig(data.target);
    const retargeted = retargetClip(restoreAnimationClip(data.clip), target, restoreAnimationRig(data.source), data.rootMotionSpace);
    retargeted.name = data.clip.name;
    const clip = fitDronaCarry(retargeted, target);
    response = { id: data.id, ok: true, clip: captureAnimationClip(clip), milliseconds: performance.now() - start };
  } catch (error) {
    response = { id: data.id, ok: false, error: error instanceof Error ? error.stack ?? error.message : String(error), milliseconds: performance.now() - start };
  }
  const buffers = response.ok ? response.clip.tracks.flatMap(track => [track.times.buffer, ...(track.values instanceof Float32Array ? [track.values.buffer] : [])]) : [];
  self.postMessage(response, { transfer: [...new Set(buffers)] });
};
