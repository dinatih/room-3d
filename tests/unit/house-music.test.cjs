const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('réagit uniquement à une lecture audible et libère les pistes remplacées, terminées ou invalides', async () => {
  const previous = { Audio: global.Audio, document: global.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const audios = [], events = [], revoked = [], logs = [];
  global.document = new EventTarget();
  document.addEventListener('npc-life-music', event => events.push(event.detail.playing));
  global.Audio = class extends EventTarget {
    constructor() { super(); this.volume = 1; this.muted = false; audios.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.dispatchEvent(new Event('pause')); }
    removeAttribute() {} load() {}
  };
  URL.createObjectURL = () => `blob:${audios.length}`;
  URL.revokeObjectURL = url => revoked.push(url);
  const music = load('src/features/scene/utils/houseMusic.ts', { '@features/ui/AppConsole': { appLog: (...args) => logs.push(args) } });
  try {
    await music.playHouseMusic({ name: 'musique.wav' });
    assert.deepEqual(events, []);
    const audio = audios[0];
    audio.dispatchEvent(new Event('playing')); audio.dispatchEvent(new Event('playing'));
    assert.deepEqual(events, [true]);
    audio.muted = true; audio.dispatchEvent(new Event('volumechange'));
    audio.muted = false; audio.dispatchEvent(new Event('volumechange'));
    audio.dispatchEvent(new Event('waiting')); audio.dispatchEvent(new Event('playing'));
    audio.volume = 0; audio.dispatchEvent(new Event('volumechange'));
    assert.deepEqual(events, [true, false, true, false, true, false]);
    await music.playHouseMusic({ name: 'seconde.wav' });
    assert.equal(revoked.length, 1);
    audio.dispatchEvent(new Event('playing'));
    assert.equal(events.at(-1), false);
    audios[1].dispatchEvent(new Event('playing')); audios[1].dispatchEvent(new Event('ended'));
    assert.equal(events.at(-1), false);
    assert.equal(revoked.length, 2);
    await music.playHouseMusic({ name: 'invalide.wav' });
    audios[2].dispatchEvent(new Event('error'));
    assert.equal(logs[0][2].action, 'music_error');
    music.stopHouseMusic();
    assert.equal(revoked.length, 3);
  } finally {
    music.stopHouseMusic(); global.Audio = previous.Audio; global.document = previous.document;
    URL.createObjectURL = previous.create; URL.revokeObjectURL = previous.revoke;
  }
});
