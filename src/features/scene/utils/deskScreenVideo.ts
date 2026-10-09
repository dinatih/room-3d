import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { SCREEN_VIDEO_SOURCES, type ScreenVideoQuality } from '../screenVideoConfig';

interface ScreenVideo {
  video: HTMLVideoElement;
  texture: THREE.VideoTexture;
  quality: ScreenVideoQuality;
  users: number;
}

const sharedVideos = new Map<ScreenVideoQuality, ScreenVideo>();

function acquireVideo(quality: ScreenVideoQuality): ScreenVideo {
  let resource = sharedVideos.get(quality);
  if (!resource) {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.src = SCREEN_VIDEO_SOURCES[quality];

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    resource = { video, texture, quality, users: 0 };
    sharedVideos.set(quality, resource);
    video.play().catch((error: DOMException) => {
      // Removing the source during cleanup interrupts pending play requests.
      if (error.name !== 'AbortError') console.error('Lecture vidéo écran impossible', error);
    });
  }
  resource.users++;
  return resource;
}

function releaseVideo(resource: ScreenVideo) {
  resource.users--;
  if (resource.users === 0) {
    resource.video.pause();
    resource.texture.dispose();
    resource.video.removeAttribute('src');
    resource.video.load();
    sharedVideos.delete(resource.quality);
  }
}

const activeDesk2Agents = new Set<string>();

export function setDesk2SmartActionState(characterId: string, active: boolean) {
  if (active) {
    activeDesk2Agents.add(characterId);
  } else {
    activeDesk2Agents.delete(characterId);
  }
  useSceneStore.getState().setDesk2SmartActionActive(activeDesk2Agents.size > 0);
}

export function useDeskScreenVideo() {
  const isDesk2Active = useSceneStore(s => Boolean(s.desk2ScreenActive || s.extraStates.desk2Screen));
  const enabled = useSceneStore(s => s.screenVideosEnabled);
  const quality = useSceneStore(s => s.screenVideoQuality);
  const invalidate = useThree(s => s.invalidate);
  const [resource, setResource] = useState<ScreenVideo | null>(null);
  const requested = enabled && isDesk2Active;

  useEffect(() => {
    if (!requested) {
      setResource(null);
      return;
    }
    const acquired = acquireVideo(quality);
    setResource(acquired);
    // Render on decoded video frames, rather than forcing a continuous render loop.
    let frameId: number;
    const onVideoFrame = () => {
      invalidate();
      frameId = acquired.video.requestVideoFrameCallback(onVideoFrame);
    };
    frameId = acquired.video.requestVideoFrameCallback(onVideoFrame);
    invalidate();
    return () => {
      acquired.video.cancelVideoFrameCallback(frameId);
      releaseVideo(acquired);
      invalidate();
    };
  }, [requested, quality, invalidate]);

  const active = requested && resource?.quality === quality;
  return { isVideoActive: active, texture: active ? resource.texture : null };
}
