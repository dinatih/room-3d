import { create } from 'zustand';

export interface AnimPreviewState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  speed: number;
  isLooping: boolean;
  isScrubbing: boolean;
  clipName: string;
  isTPose: boolean;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setLooping: (loop: boolean) => void;
  setScrubbing: (scrubbing: boolean) => void;
  setCurrentTime: (time: number) => void;
  seekToTime: (time: number) => void;
  seekToFrame: (frame: number) => void;
  stepFrame: (deltaFrames: number) => void;
  setClipInfo: (name: string, duration: number, isTPose?: boolean, fps?: number) => void;
  tick: (deltaSeconds: number) => number;
  reset: () => void;
}

export const useAnimPreviewStore = create<AnimPreviewState>((set, get) => ({
  isPlaying: true,
  currentTime: 0,
  duration: 0,
  fps: 30,
  speed: 1,
  isLooping: true,
  isScrubbing: false,
  clipName: 'Idle',
  isTPose: false,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

  setSpeed: (speed: number) => set({ speed }),
  setLooping: (isLooping: boolean) => set({ isLooping }),
  setScrubbing: (isScrubbing: boolean) => set({ isScrubbing }),

  setCurrentTime: (time: number) => {
    const { isScrubbing } = get();
    if (isScrubbing) return;
    set({ currentTime: time });
  },

  seekToTime: (time: number) => {
    const { duration } = get();
    const clamped = duration > 0 ? Math.max(0, Math.min(duration, time)) : Math.max(0, time);
    set({ currentTime: clamped });
  },

  seekToFrame: (frame: number) => {
    const { duration, fps } = get();
    if (duration <= 0) return;
    const totalFrames = Math.max(1, Math.round(duration * fps));
    const clampedFrame = Math.max(0, Math.min(totalFrames, frame));
    set({ currentTime: clampedFrame / fps });
  },

  stepFrame: (deltaFrames: number) => {
    const { currentTime, duration, fps, isLooping } = get();
    if (duration <= 0) return;
    const totalFrames = Math.max(1, Math.round(duration * fps));
    const currentFrame = Math.round(currentTime * fps);
    let nextFrame = currentFrame + deltaFrames;

    if (isLooping) {
      nextFrame = (nextFrame % (totalFrames + 1) + (totalFrames + 1)) % (totalFrames + 1);
    } else {
      nextFrame = Math.max(0, Math.min(totalFrames, nextFrame));
    }

    set({ currentTime: nextFrame / fps, isPlaying: false });
  },

  setClipInfo: (name: string, duration: number, isTPose = false, fps = 30) => {
    const current = get();
    const nameChanged = current.clipName !== name;
    const durChanged = Math.abs(current.duration - duration) > 0.005;
    const tPoseChanged = current.isTPose !== isTPose;

    if (!nameChanged && !durChanged && !tPoseChanged) {
      return;
    }

    set({
      clipName: name,
      duration,
      fps,
      isTPose,
      currentTime: isTPose ? 0 : (nameChanged && !current.isScrubbing && current.isPlaying ? 0 : Math.min(current.currentTime, duration)),
    });
  },

  tick: (deltaSeconds: number) => {
    const { isPlaying, isScrubbing, currentTime, duration, speed, isLooping, isTPose } = get();
    if (!isPlaying || isScrubbing || isTPose || duration <= 0) {
      return currentTime;
    }

    let nextTime = currentTime + deltaSeconds * speed;
    if (nextTime >= duration) {
      if (isLooping) {
        nextTime = duration > 0 ? nextTime % duration : 0;
      } else {
        nextTime = duration;
        set({ isPlaying: false, currentTime: duration });
        return duration;
      }
    } else if (nextTime < 0) {
      nextTime = 0;
    }

    set({ currentTime: nextTime });
    return nextTime;
  },

  reset: () => set({
    isPlaying: true,
    currentTime: 0,
    duration: 0,
    fps: 30,
    speed: 1,
    isLooping: true,
    isScrubbing: false,
    clipName: 'Idle',
    isTPose: false,
  }),
}));
