import * as THREE from 'three';
import { useEffect } from 'react';
import { useSceneStore } from '@features/scene/store/useSceneStore';

const VIDEO_SRC = 'videos/screenrecording.mp4';

let sharedVideo: HTMLVideoElement | null = null;
let sharedTexture: THREE.VideoTexture | null = null;
let activeUsersCount = 0;

export function getDeskVideoTexture(): { video: HTMLVideoElement; texture: THREE.VideoTexture } {
  if (!sharedVideo) {
    sharedVideo = document.createElement('video');
    sharedVideo.src = VIDEO_SRC;
    sharedVideo.crossOrigin = 'anonymous';
    sharedVideo.loop = true;
    sharedVideo.muted = true;
    sharedVideo.playsInline = true;
    sharedVideo.preload = 'auto';

    sharedTexture = new THREE.VideoTexture(sharedVideo);
    sharedTexture.colorSpace = THREE.SRGBColorSpace;
    sharedTexture.minFilter = THREE.LinearFilter;
    sharedTexture.magFilter = THREE.LinearFilter;
    sharedTexture.generateMipmaps = false;
  }
  return { video: sharedVideo, texture: sharedTexture! };
}

export function playDeskVideo() {
  activeUsersCount++;
  const { video } = getDeskVideoTexture();
  if (video.paused) {
    video.play().catch(() => {});
  }
}

export function pauseDeskVideo() {
  activeUsersCount = Math.max(0, activeUsersCount - 1);
  if (activeUsersCount === 0 && sharedVideo && !sharedVideo.paused) {
    sharedVideo.pause();
    sharedVideo.currentTime = 0;
  }
}

const activeDesk2Agents = new Set<string>();

export function setDesk2SmartActionState(characterId: string, active: boolean) {
  if (active) {
    activeDesk2Agents.add(characterId);
  } else {
    activeDesk2Agents.delete(characterId);
  }
  const isAnyActive = activeDesk2Agents.size > 0;
  useSceneStore.getState().setDesk2SmartActionActive(isAnyActive);
}

export function useDeskScreenVideo() {
  const isDesk2Active = useSceneStore(s => Boolean(s.desk2ScreenActive || s.extraStates.desk2Screen));
  const { video, texture } = getDeskVideoTexture();

  useEffect(() => {
    if (isDesk2Active) {
      playDeskVideo();
      return () => {
        pauseDeskVideo();
      };
    }
  }, [isDesk2Active]);

  return { isVideoActive: isDesk2Active, texture, video };
}
