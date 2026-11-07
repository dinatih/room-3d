const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('réagit uniquement à une lecture audible et libère les pistes remplacées, terminées ou invalides', async () => {
  const previous = { Audio: global.Audio, document: global.document };
  const audios = [], events = [], released = [], logs = [];
  global.document = new EventTarget();
  document.addEventListener('npc-life-music', event => events.push(event.detail.playing));
  global.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.volume = 1; this.muted = false; audios.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.dispatchEvent(new Event('pause')); }
    removeAttribute() { released.push(this); } load() {}
  };
  const music = load('src/features/scene/utils/houseMusic.ts', { '@features/ui/AppConsole': { appLog: (...args) => logs.push(args) } });
  try {
    await music.playHouseMusic();
    assert.deepEqual(events, []);
    const audio = audios[0];
    audio.dispatchEvent(new Event('playing')); audio.dispatchEvent(new Event('playing'));
    assert.deepEqual(events, [true]);
    audio.muted = true; audio.dispatchEvent(new Event('volumechange'));
    audio.muted = false; audio.dispatchEvent(new Event('volumechange'));
    audio.dispatchEvent(new Event('waiting')); audio.dispatchEvent(new Event('playing'));
    audio.volume = 0; audio.dispatchEvent(new Event('volumechange'));
    assert.deepEqual(events, [true, false, true, false, true, false]);
    await music.playHouseMusic();
    assert.equal(released.length, 1);
    audio.dispatchEvent(new Event('playing'));
    assert.equal(events.at(-1), false);
    audios[1].dispatchEvent(new Event('playing')); audios[1].dispatchEvent(new Event('ended'));
    assert.equal(events.at(-1), false);
    assert.equal(released.length, 2);
    await music.playHouseMusic();
    audios[2].dispatchEvent(new Event('error'));
    assert.equal(logs[0][2].action, 'music_error');
    music.stopHouseMusic();
    assert.equal(released.length, 3);
  } finally {
    music.stopHouseMusic(); global.Audio = previous.Audio; global.document = previous.document;
  }
});
