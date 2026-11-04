import { appLog } from '@features/ui/AppConsole';

let cleanup: (() => void) | undefined;

export function stopHouseMusic() { cleanup?.(); }

/** The scene reacts to audible playback, never to choosing a file or requesting play. */
export async function playHouseMusic(file: File) {
  stopHouseMusic();
  const url = URL.createObjectURL(file), audio = new Audio(url);
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
    paused(); audio.pause(); audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url);
    if (cleanup === dispose) cleanup = undefined;
  };
  audio.addEventListener('playing', playing);
  for (const event of ['pause', 'waiting', 'stalled']) audio.addEventListener(event, paused);
  audio.addEventListener('volumechange', notify);
  audio.addEventListener('ended', dispose, { once: true });
  audio.addEventListener('error', () => {
    if (disposed) return;
    appLog('Musique', `Lecture audio impossible : ${file.name}`, { category: 'object', action: 'music_error', data: { error: audio.error?.message } });
    dispose();
  }, { once: true });
  cleanup = dispose;
  try { await audio.play(); }
  catch (error) {
    if (disposed) return;
    dispose();
    appLog('Musique', `Lecture audio refusée : ${file.name}`, { category: 'object', action: 'music_error', data: { error: String(error) } });
  }
}

export function chooseHouseMusic() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'audio/*';
  input.addEventListener('change', () => { if (input.files?.[0]) void playHouseMusic(input.files[0]); }, { once: true });
  input.click();
}
