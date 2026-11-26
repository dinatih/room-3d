import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { SCREEN_VIDEO_SOURCES, TV_CLIP_VIDEO_SOURCES, type ScreenVideoQuality } from '../screenVideoConfig';

interface ScreenVideo {
  key: string;
  video: HTMLVideoElement;
  texture: THREE.VideoTexture;
  quality: ScreenVideoQuality;
  users: number;
}

const sharedVideos = new Map<string, ScreenVideo>();

function acquireVideo(sources: Record<ScreenVideoQuality, string>, quality: ScreenVideoQuality, muted: boolean): ScreenVideo {
  const key = `${sources[quality]}:${quality}`;
  let resource = sharedVideos.get(key);
  if (!resource) {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = muted;
    video.playsInline = true;
    video.src = sources[quality];

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    resource = { key, video, texture, quality, users: 0 };
    sharedVideos.set(key, resource);
    video.play().catch((error: DOMException) => {
      if (error.name === 'NotAllowedError' && !video.muted) {
        video.muted = true;
        return video.play().catch((fallbackError: DOMException) => {
          if (fallbackError.name !== 'AbortError') console.error('Lecture vidéo écran impossible', fallbackError);
        });
      }
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
    sharedVideos.delete(resource.key);
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

function useScreenVideo(requested: boolean, sources: Record<ScreenVideoQuality, string>, muted: boolean) {
  const enabled = useSceneStore(s => s.screenVideosEnabled);
  const quality = useSceneStore(s => s.screenVideoQuality);
  const invalidate = useThree(s => s.invalidate);
  const [resource, setResource] = useState<ScreenVideo | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [stillTexture, setStillTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!requested) {
      setResource(null);
      setVideoReady(false);
      setStillTexture(null);
      return;
    }

    if (!enabled) {
      // En SD : les vidéos sont désactivées, charger l'image statique (poster)
      setResource(null);
      setVideoReady(false);
      const loader = new THREE.TextureLoader();
      const tex = loader.load('items/omarchy-screen/omarchy-screen.png', () => {
        tex.colorSpace = THREE.SRGBColorSpace;
        invalidate();
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      setStillTexture(tex);
      return () => {
        tex.dispose();
      };
    }

    setStillTexture(null);
    const acquired = acquireVideo(sources, quality, muted);
    setResource(acquired);
    const hasFrame = acquired.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    setVideoReady(hasFrame);
    const onLoadedData = () => {
      acquired.texture.needsUpdate = true;
      setVideoReady(true);
      invalidate();
    };
    if (hasFrame) {
      acquired.texture.needsUpdate = true;
    } else {
      acquired.video.addEventListener('loadeddata', onLoadedData, { once: true });
    }
    // Render on decoded video frames, rather than forcing a continuous render loop.
    let frameId: number;
    const onVideoFrame = () => {
      invalidate();
      frameId = acquired.video.requestVideoFrameCallback(onVideoFrame);
    };
    frameId = acquired.video.requestVideoFrameCallback(onVideoFrame);
    invalidate();
    return () => {
      acquired.video.removeEventListener('loadeddata', onLoadedData);
      acquired.video.cancelVideoFrameCallback(frameId);
      releaseVideo(acquired);
      invalidate();
    };
  }, [requested, enabled, quality, sources, muted, invalidate]);

  const active = requested && (enabled ? (resource?.quality === quality && videoReady) : Boolean(stillTexture));
  const currentTex = enabled ? (resource?.texture ?? null) : stillTexture;
  return { isVideoActive: active, texture: active ? currentTex : null };
}

export function useDeskScreenVideo(previewActive?: boolean) {
  const isDesk2Active = useSceneStore(s => Boolean(s.desk2ScreenActive || s.extraStates.desk2Screen));
  return useScreenVideo(previewActive ?? isDesk2Active, SCREEN_VIDEO_SOURCES, true);
}

export function useTvClipVideo(previewActive?: boolean) {
  const isTvClipActive = useSceneStore(s => Boolean(s.extraStates.tvClip));
  return useScreenVideo(previewActive ?? isTvClipActive, TV_CLIP_VIDEO_SOURCES, false);
}
