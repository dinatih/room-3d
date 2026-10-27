import type { HdriResolution } from '../hdriConfig';
import type { ScreenVideoQuality } from '../screenVideoConfig';
import type { GraphicsPreset } from './layerUrlParams';

export const GRAPHICS_PRESETS: Record<GraphicsPreset, {
  hdriResolution: HdriResolution;
  screenVideosEnabled: boolean;
  screenVideoQuality?: ScreenVideoQuality;
  mirrorQuality: 'mid-low' | 'mid';
  layers: { mirrors: boolean; mirrorsHD: boolean };
}> = {
  low: { hdriResolution: '2k', screenVideosEnabled: false, mirrorQuality: 'mid-low', layers: { mirrors: false, mirrorsHD: false } },
  'mid-low': { hdriResolution: '2k', screenVideosEnabled: true, screenVideoQuality: 'ld', mirrorQuality: 'mid-low', layers: { mirrors: true, mirrorsHD: false } },
  mid: { hdriResolution: '4k', screenVideosEnabled: true, screenVideoQuality: 'hd', mirrorQuality: 'mid', layers: { mirrors: true, mirrorsHD: false } },
  high: { hdriResolution: '8k', screenVideosEnabled: true, screenVideoQuality: 'hd', mirrorQuality: 'mid', layers: { mirrors: true, mirrorsHD: true } },
};
