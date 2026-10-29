import { LoopOnce, LoopRepeat, type AnimationClip, type AnimationMixer } from 'three';
import { useAnimPreviewStore } from './useAnimPreviewStore';

export function updateClipPreview(mixer: AnimationMixer, clip: AnimationClip, delta: number, label: string) {
  const store = useAnimPreviewStore.getState();
  store.setClipInfo(`${label} ${clip.name}`, clip.duration, false);
  const action = mixer.clipAction(clip);
  const animDelta = delta * (store.speed || 1);
  if (store.isPlaying && !store.isScrubbing) {
    if (action.paused) action.paused = false;
    if (!store.isLooping) {
      action.setLoop(LoopOnce, 0);
      action.clampWhenFinished = true;
      if (action.time >= clip.duration - 0.005) {
        action.time = 0;
      }
    } else {
      action.setLoop(LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    }
    mixer.update(animDelta);
    if (!store.isLooping && action.time >= clip.duration) {
      action.time = clip.duration;
      action.paused = true;
      store.setCurrentTime(clip.duration);
      store.pause();
    } else {
      store.setCurrentTime(action.time % clip.duration);
    }
  } else {
    action.setEffectiveWeight(1);
    action.time = store.currentTime;
    action.paused = true;
    mixer.update(0);
  }
}
