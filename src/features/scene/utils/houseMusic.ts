import { appLog } from '@features/ui/AppConsole';

const TRACKS = [
  'audio/house-music.mp3',
  'audio/Bvlaxj-YNyk.mp3',
  'audio/Xysgex3e6UE.mp3',
  'audio/VQvRrQhA--o.mp3',
];

let cleanup: (() => void) | undefined;

export function stopHouseMusic() { cleanup?.(); }

/** The scene reacts to audible playback, never to requesting play. */
export async function playHouseMusic() {
  stopHouseMusic();
  const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
  const audio = new Audio(track);
  let running = false, audible = false, disposed = false;
  const notify = () => {
    const next = running && !audio.muted && audio.volume > 0;
    if (next === audible) return;
    audible = next;
    document.dispatchEvent(new CustomEvent('npc-life-music', { detail: { playing: audible, room: 'living' } }));
  };
  const playing = () => { if (!disposed) { running = true; notify(); } };
  const paused = () => { running = false; notify(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    paused(); audio.pause(); audio.removeAttribute('src'); audio.load();
    if (cleanup === dispose) cleanup = undefined;
  };
  audio.addEventListener('playing', playing);
  for (const event of ['pause', 'waiting', 'stalled']) audio.addEventListener(event, paused);
  audio.addEventListener('volumechange', notify);
  audio.addEventListener('ended', dispose, { once: true });
  audio.addEventListener('error', () => {
    if (disposed) return;
    appLog('Musique', 'Lecture de la musique impossible.', { category: 'object', action: 'music_error', data: { error: audio.error?.message } });
    dispose();
  }, { once: true });
  cleanup = dispose;
  try { await audio.play(); }
  catch (error) {
    if (disposed) return;
    dispose();
    appLog('Musique', 'Lecture de la musique refusée.', { category: 'object', action: 'music_error', data: { error: String(error) } });
  }
}
