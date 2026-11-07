import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { roofHeightAt } from './building/roofData';
import { useWeather } from './Weather';
import { windGust } from './WindPlant';
import { simulationClock } from './ai/laraLifeStore';
import { isAppIdle, useAppIdle } from './idleState';

export function WeatherAudio() {
  const audio = useRef<{ context: AudioContext; source: AudioBufferSourceNode; rain: GainNode; wind: GainNode } | null>(null);
  const idle = useAppIdle();
  useEffect(() => {
    const start = () => {
      if (!audio.current && useWeather.getState().rainVolume > 0) {
        const context = new AudioContext();
        const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
        const band = (frequency: number, type: BiquadFilterType) => {
          const filter = context.createBiquadFilter(); filter.type = type; filter.frequency.value = frequency;
          const gain = context.createGain(); gain.gain.value = 0;
          source.connect(filter).connect(gain).connect(context.destination);
          return gain;
        };
        audio.current = { context, source, rain: band(1800, 'lowpass'), wind: band(350, 'bandpass') };
        source.start();
      }
      if (audio.current && !document.hidden && !isAppIdle()) void audio.current.context.resume().catch(console.error);
    };
    const visibility = () => { if (!document.hidden) start(); else if (audio.current) void audio.current.context.suspend().catch(console.error); };
    document.addEventListener('pointerup', start, true); document.addEventListener('keyup', start, true);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('pointerup', start, true); document.removeEventListener('keyup', start, true);
      document.removeEventListener('visibilitychange', visibility);
      if (audio.current) { audio.current.source.stop(); void audio.current.context.close(); audio.current = null; }
    };
  }, []);
  useEffect(() => {
    if (audio.current) void (idle || document.hidden ? audio.current.context.suspend() : audio.current.context.resume()).catch(console.error);
  }, [idle]);
  useFrame(({ camera }) => {
    if (!audio.current) return;
    const { rain, rainVolume, windSpeed } = useWeather.getState();
    const indoors = camera.position.y < roofHeightAt(camera.position.x, camera.position.z);
    const volume = idle || document.hidden ? 0 : rainVolume * (indoors ? 0.27 : 1);
    const { context, rain: rainGain, wind } = audio.current;
    rainGain.gain.setTargetAtTime(rain * volume * 0.3, context.currentTime, 0.25);
    wind.gain.setTargetAtTime((windSpeed / 20) ** 2 * windGust(simulationClock.minutes) * volume * 0.3, context.currentTime, 0.25);
  });
  return null;
}
