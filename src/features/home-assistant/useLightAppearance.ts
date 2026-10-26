import { useMemo } from 'react';
import { Color, SRGBColorSpace } from 'three';
import { useHomeAssistant, type LightKey } from './connection';

export function useLightAppearance(key: LightKey, defaultColor: number) {
  const remote = useHomeAssistant(state => state.enabled);
  const light = useHomeAssistant(state => state.lights[key]);
  const color = useMemo(() => {
    const result = new Color(defaultColor);
    if (remote && light.rgb) result.setRGB(light.rgb[0] / 255, light.rgb[1] / 255, light.rgb[2] / 255, SRGBColorSpace);
    return result;
  }, [remote, light.rgb, defaultColor]);
  return { remote, color, brightness: remote ? light.brightness : 1 };
}
