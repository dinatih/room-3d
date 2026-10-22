import trajectories from '../animations/dronaCarryMotion.json';
import type { DronaCarryAnimation } from '../animations/dronaCarryManifest';

export interface DronaPose {
  position: [number, number, number];
  quaternion: [number, number, number, number];
}
export type DronaMotion = { action: string } & (
  { animation: DronaCarryAnimation } |
  { from: number; to: number; range: [number, number] }
);

/** Cell-local pose sampled from the same baked clock as the character. */
export function sampleDronaMotion(motion: DronaMotion, progress: number): number | DronaPose {
  if ('animation' in motion) {
    const positions = trajectories[motion.animation].positions;
    const frame = Math.max(0, Math.min(1, progress)) * (positions.length - 1);
    const index = Math.floor(frame), next = Math.min(index + 1, positions.length - 1);
    return {
      position: positions[index].map((value, axis) => value + (positions[next][axis] - value) * (frame - index)) as DronaPose['position'],
      quaternion: [0, 0, 0, 1],
    };
  }
  const fraction = Math.max(0, Math.min(1, (progress - motion.range[0]) / (motion.range[1] - motion.range[0])));
  return motion.from + (motion.to - motion.from) * fraction;
}

/** Absent during manual use; each action owns its own prop playback. */
export const dronaPlayback = new Map<string, number | DronaPose>();
