import type { HdriResolution } from '../hdriConfig';
import type { ScreenVideoQuality } from '../screenVideoConfig';
import type { GraphicsPreset } from './layerUrlParams';

export const GRAPHICS_PRESETS: Record<GraphicsPreset, {
  hdriResolution: HdriResolution;
  screenVideosEnabled: boolean;
  screenVideoQuality: ScreenVideoQuality;
  layers: { mirrors: boolean; mirrorsHD: boolean };
}> = {
  low: { hdriResolution: '2k', screenVideosEnabled: true, screenVideoQuality: 'ld', layers: { mirrors: false, mirrorsHD: false } },
  mid: { hdriResolution: '4k', screenVideosEnabled: true, screenVideoQuality: 'hd', layers: { mirrors: true, mirrorsHD: false } },
  high: { hdriResolution: '4k', screenVideosEnabled: true, screenVideoQuality: 'hd', layers: { mirrors: true, mirrorsHD: true } },
};
