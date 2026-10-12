import { create } from 'zustand';

const getSession = (key: string, fallback: string) => {
  try { return sessionStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const getSessionJson = <T,>(key: string, fallback: T): T => {
  try {
    const s = sessionStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
};
const setSession = (key: string, val: string) => {
  try { sessionStorage.setItem(key, val); } catch {}
};

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
  animSearch: string;
  selectedCategories: string[];
  sortByDuration: boolean;
  /** Segments utiles actifs [start, end][]. Si non vide, la lecture saute les zones coupées. */
  activeSegments: Array<[number, number]>;
  /** Verrouiller le déplacement horizontal X/Z des hanches sur place */
  lockHipsXZ: boolean;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  toggleLockHipsXZ: () => void;
  setLockHipsXZ: (locked: boolean) => void;
  setSpeed: (speed: number) => void;
  setLooping: (loop: boolean) => void;
  setScrubbing: (scrubbing: boolean) => void;
  setCurrentTime: (time: number) => void;
  seekToTime: (time: number) => void;
  seekToFrame: (frame: number) => void;
  stepFrame: (deltaFrames: number) => void;
  setClipInfo: (name: string, duration: number, isTPose?: boolean, fps?: number) => void;
  setAnimSearch: (search: string) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSortByDuration: (sortByDuration: boolean) => void;
  setActiveSegments: (segments: Array<[number, number]> | undefined) => void;
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
  animSearch: getSession('anim_search_filter', ''),
  selectedCategories: getSessionJson('anim_selected_categories', []),
  sortByDuration: getSession('anim_sort_by_duration', 'false') === 'true',
  activeSegments: [],
  lockHipsXZ: getSession('anim_lock_hips_xz', 'false') === 'true',

  toggleLockHipsXZ: () => {
    const next = !get().lockHipsXZ;
    setSession('anim_lock_hips_xz', String(next));
    set({ lockHipsXZ: next });
  },
  setLockHipsXZ: (locked: boolean) => {
    setSession('anim_lock_hips_xz', String(locked));
    set({ lockHipsXZ: locked });
  },

  play: () => {
    const { currentTime, duration, isLooping, activeSegments } = get();
    if (activeSegments.length > 0) {
      const firstSeg = activeSegments[0];
      const lastSeg = activeSegments[activeSegments.length - 1];
      if (!isLooping && currentTime >= lastSeg[1] - 0.02) {
        set({ currentTime: firstSeg[0], isPlaying: true });
        return;
      }
    } else if (!isLooping && duration > 0 && currentTime >= duration - 0.02) {
      set({ currentTime: 0, isPlaying: true });
      return;
    }
    set({ isPlaying: true });
  },
  pause: () => set({ isPlaying: false }),
  togglePlay: () => {
    const { isPlaying, currentTime, duration, isLooping, activeSegments } = get();
    if (!isPlaying) {
      if (activeSegments.length > 0) {
        const firstSeg = activeSegments[0];
        const lastSeg = activeSegments[activeSegments.length - 1];
        if (!isLooping && currentTime >= lastSeg[1] - 0.02) {
          set({ currentTime: firstSeg[0], isPlaying: true });
          return;
        }
      } else if (!isLooping && duration > 0 && currentTime >= duration - 0.02) {
        set({ currentTime: 0, isPlaying: true });
        return;
      }
    }
    set({ isPlaying: !isPlaying });
  },

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
    const { currentTime, duration, fps, isLooping, activeSegments } = get();
    if (duration <= 0) return;
    const totalFrames = Math.max(1, Math.round(duration * fps));
    const currentFrame = Math.round(currentTime * fps);
    let nextFrame = currentFrame + deltaFrames;

    if (activeSegments.length > 0) {
      const minFrame = Math.round(activeSegments[0][0] * fps);
      const maxFrame = Math.round(activeSegments[activeSegments.length - 1][1] * fps);
      if (isLooping) {
        if (nextFrame > maxFrame) nextFrame = minFrame;
        else if (nextFrame < minFrame) nextFrame = maxFrame;
      } else {
        nextFrame = Math.max(minFrame, Math.min(maxFrame, nextFrame));
      }
    } else {
      if (isLooping) {
        nextFrame = (nextFrame % (totalFrames + 1) + (totalFrames + 1)) % (totalFrames + 1);
      } else {
        nextFrame = Math.max(0, Math.min(totalFrames, nextFrame));
      }
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

    const defaultStartTime = current.activeSegments.length > 0 ? current.activeSegments[0][0] : 0;

    set({
      clipName: name,
      duration,
      fps,
      isTPose,
      currentTime: isTPose ? 0 : (nameChanged && !current.isScrubbing && current.isPlaying ? defaultStartTime : Math.min(current.currentTime, duration)),
    });
  },

  setAnimSearch: (animSearch: string) => {
    setSession('anim_search_filter', animSearch);
    set({ animSearch });
  },

  setSelectedCategories: (selectedCategories: string[]) => {
    setSession('anim_selected_categories', JSON.stringify(selectedCategories));
    set({ selectedCategories });
  },

  setSortByDuration: (sortByDuration: boolean) => {
    setSession('anim_sort_by_duration', String(sortByDuration));
    set({ sortByDuration });
  },

  setActiveSegments: (segments: Array<[number, number]> | undefined) => {
    const valid = (segments || []).filter(s => s[1] > s[0]).sort((a, b) => a[0] - b[0]);
    set({ activeSegments: valid });
  },

  tick: (deltaSeconds: number) => {
    const { isPlaying, isScrubbing, currentTime, duration, speed, isLooping, isTPose, activeSegments } = get();
    if (!isPlaying || isScrubbing || isTPose || duration <= 0) {
      return currentTime;
    }

    let nextTime = currentTime + deltaSeconds * speed;

    // Gestion multi-segments (découpes au début, fin ou milieu)
    if (activeSegments.length > 0) {
      const firstSeg = activeSegments[0];
      const lastSeg = activeSegments[activeSegments.length - 1];

      // Si avant le premier segment, se placer au début du 1er segment
      if (nextTime < firstSeg[0]) {
        nextTime = firstSeg[0];
      } else if (nextTime >= lastSeg[1]) {
        if (isLooping) {
          nextTime = firstSeg[0];
        } else {
          nextTime = lastSeg[1];
          set({ isPlaying: false, currentTime: lastSeg[1] });
          return lastSeg[1];
        }
      } else {
        // Vérifier si nextTime tombe dans une zone coupée (entre deux segments)
        for (let i = 0; i < activeSegments.length; i++) {
          const seg = activeSegments[i];
          if (nextTime >= seg[0] && nextTime <= seg[1]) {
            // Dans un segment valide
            break;
          }
          if (i < activeSegments.length - 1 && nextTime > seg[1] && nextTime < activeSegments[i + 1][0]) {
            // Tombé dans le trou entre seg[i] et seg[i+1] -> Sauter directement au début de seg[i+1]
            nextTime = activeSegments[i + 1][0];
            break;
          }
        }
      }

      set({ currentTime: nextTime });
      return nextTime;
    }

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
