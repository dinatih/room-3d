const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const life = require('../../src/features/scene/ai/laraLife.ts');
const home = require('../../src/features/scene/ai/lifeHousekeeping.ts');
const persistence = require('../../src/features/scene/ai/lifePersistence.ts');
const freshSave = () => ({ version: 1, savedAt: 1000, characters: Object.fromEntries(life.LIFE_CHARACTER_IDS.map(id => [id, life.createLife(id)])),
  home: home.createHomeDirt(), speed: 1 });

function withBrowser(run, initialSave) {
  const previous = { window: global.window, document: global.document, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout, error: console.error };
  const storage = new Map([['other-setting', 'preserved']]);
  if (initialSave !== undefined) storage.set(persistence.LIFE_SAVE_KEY, initialSave);
  const timers = new Map(), errors = [];
  let nextTimer = 0, writes = 0, reloads = 0, failWrite = false;
  const browser = Object.assign(new EventTarget(), {
    localStorage: { getItem: key => storage.get(key) ?? null, removeItem: key => storage.delete(key),
      setItem: (key, text) => { if (failWrite) throw new Error('Storage full'); writes++; storage.set(key, text); } },
    location: { reload: () => { reloads++; browser.dispatchEvent(new Event('pagehide')); } },
  });
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  global.window = browser; global.document = document;
  global.setTimeout = (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; };
  global.clearTimeout = id => timers.delete(id);
  console.error = (...args) => errors.push(args);
  const loadStore = () => load('src/features/scene/ai/laraLifeStore.ts', {
    zustand: require('zustand'), './laraLife': life, './lifeHousekeeping': { ...home, homeDirt: home.createHomeDirt() }, './lifePersistence': persistence,
  });
  try { run({ browser, document, storage, timers, errors, loadStore, writes: () => writes, reloads: () => reloads, failWrite: value => { failWrite = value; },
    flush: () => { const pending = [...timers.values()]; timers.clear(); for (const { fn } of pending) fn(); } }); }
  finally { global.window = previous.window; global.document = previous.document; global.setTimeout = previous.setTimeout; global.clearTimeout = previous.clearTimeout; console.error = previous.error; }
}

it('valide un instantané complet avec souvenirs, habitudes, propreté et profils masqués', () => {
  const saved = freshSave();
  for (const [index, id] of life.LIFE_CHARACTER_IDS.entries()) {
    const character = saved.characters[id];
    character.elapsedSeconds = 120 + index;
    character.needs.meal = 40 + index;
    character.handsDirty = true;
    character.lastActivity = 'meal';
    character.places['bed-west:seat-middle'] = index + 1;
    const before = { ...character.needs, work: 90 };
    life.rememberLifeActivity(character, 'read', before, life.evolveLife(before, 10, 'read', false), 'desk-bollsidan-2:work-standing');
    life.rememberLifeConversation(character, id === 'native' ? 'cha' : 'native', 10, 'meal');
  }
  saved.home.dishes = 60;
  saved.speed = 10;
  assert.deepEqual(persistence.parseLifeSave(JSON.stringify(saved)), saved);
  assert(saved.characters.rajaa.memory.read.satisfaction > 0 && saved.characters.sandra.handsDirty);
});

it('rejette un instantané partiel ou corrompu avant toute restauration', () => {
  const corruptions = [
    s => { s.version = 2; }, s => { delete s.characters.sandra; }, s => { s.characters.native.characterId = 'cha'; },
    s => { s.speed = 2; }, s => { s.selectedCharacterId = 'unknown'; }, s => { s.home.dishes = 101; },
    s => { s.characters.native.needs.rest = -1; }, s => { s.characters.native.needs.work = NaN; },
    s => { s.characters.native.handsDirty = 'yes'; }, s => { s.characters.native.lastActivity = 'unknown'; },
    s => { s.characters.native.memory.unknown = { satisfaction: 1, lastAt: 0 }; },
    s => { s.characters.native.memory.read = { satisfaction: 1, lastAt: 1 }; },
    s => { s.characters.native.memory.read = { satisfaction: 1, lastAt: 0, periods: { bogus: 1 } }; },
    s => { s.characters.native.relationships.native = { seconds: 1, lastAt: 0 }; },
    s => { s.characters.native.relationships.unknown = { seconds: 1, lastAt: 0 }; },
    s => { s.characters.native.position = [1, 0, 2]; },
  ];
  for (const corrupt of corruptions) { const saved = freshSave(); corrupt(saved); assert.throws(() => persistence.parseLifeSave(JSON.stringify(saved))); }
  for (const text of ['null', '[]', '{}', '{']) assert.throws(() => persistence.parseLifeSave(text));
});

it('sauvegarde toute la colocation une seule fois par seconde et restaure le modèle et le panneau', () => {
  withBrowser(w => {
    const store = w.loadStore();
    const native = store.characterLives.native;
    native.needs.rest = 82; native.elapsedSeconds = 360; native.handsDirty = true;
    native.memory.yoga = { satisfaction: 20, lastAt: 300, places: { 'west-neighbor-flat:yoga': { satisfaction: 20, lastAt: 300 } }, periods: { Matin: 20 } };
    native.places['west-neighbor-flat:yoga'] = 2; native.lastActivity = 'yoga';
    store.characterLives.sandra.needs.toilet = 93;
    life.rememberLifeConversation(native, 'cha', 12, 'social');
    store.publishLife('native', { needs: { ...native.needs } });
    store.publishLife('cha', { activity: 'En route' });
    store.useLaraLifeStore.setState({ speed: 10 });
    assert.equal(w.timers.size, 1); assert.equal([...w.timers.values()][0].ms, 1000); assert.equal(w.writes(), 0);
    w.flush();
    assert.equal(w.writes(), 1); assert.equal(w.timers.size, 0, 'Publishing the saved status cannot trigger another save');
    const data = persistence.parseLifeSave(w.storage.get(persistence.LIFE_SAVE_KEY));
    assert.deepEqual(data.characters, store.characterLives);
    const restored = w.loadStore();
    assert.deepEqual(restored.characterLives, data.characters);
    const snapshot = restored.useLaraLifeStore.getState();
    assert.equal(snapshot.speed, 10);
    assert.equal(snapshot.characters.native.needs.rest, 82); assert.equal(snapshot.characters.native.elapsedSeconds, 360);
    assert.deepEqual(snapshot.characters.native.memory, native.memory);
    assert.deepEqual(snapshot.characters.native.relationships, native.relationships);
    assert.equal(restored.characterLives.sandra.needs.toilet, 93);
    assert.equal(snapshot.characters.native.activity, 'À reprendre');
    assert.equal(restored.characterLives.native.elapsedSeconds, native.elapsedSeconds, 'Restoration cannot advance time offline');
  });
});

it('enregistre les dernières mutations à la fermeture et lorsque l’onglet devient masqué', () => {
  withBrowser(w => {
    const store = w.loadStore();
    store.characterLives.native.needs.rest = 45;
    w.browser.dispatchEvent(new Event('pagehide'));
    assert.equal(persistence.parseLifeSave(w.storage.get(persistence.LIFE_SAVE_KEY)).characters.native.needs.rest, 45);
    store.characterLives.native.needs.rest = 46;
    w.document.visibilityState = 'hidden'; w.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(persistence.parseLifeSave(w.storage.get(persistence.LIFE_SAVE_KEY)).characters.native.needs.rest, 46);
  });
});

it('une nouvelle vie efface tous les historiques et empêche la sauvegarde de fermeture de les recréer', () => {
  const saved = freshSave();
  for (const id of life.LIFE_CHARACTER_IDS) {
    saved.characters[id].elapsedSeconds = 100;
    saved.characters[id].needs.rest = 90;
    saved.characters[id].memory.read = { satisfaction: 5, lastAt: 50 };
    saved.characters[id].places['desk:use'] = 3;
  }
  saved.home.living = 80; saved.speed = 10;
  withBrowser(w => {
    const store = w.loadStore();
    store.publishLife('native', { activity: 'En attente' });
    assert.equal(w.timers.size, 1);
    store.resetLives();
    assert.equal(w.reloads(), 1); assert.equal(w.timers.size, 0);
    assert.equal(w.storage.has(persistence.LIFE_SAVE_KEY), false);
    assert.equal(w.storage.get('other-setting'), 'preserved');
    assert.equal(w.writes(), 0, 'pagehide during the reset must not resurrect the old lives');
    const next = w.loadStore();
    for (const id of life.LIFE_CHARACTER_IDS) assert.deepEqual(next.characterLives[id], life.createLife(id));
    assert.deepEqual(next.useLaraLifeStore.getState().home, home.createHomeDirt());
    assert.equal(next.useLaraLifeStore.getState().speed, 1);
  }, JSON.stringify(saved));
});

it('signale une sauvegarde invalide sans l’écraser, puis permet une remise à zéro globale', () => {
  const saved = freshSave(); saved.characters.native.needs.rest = 90; delete saved.characters.sandra;
  const text = JSON.stringify(saved);
  withBrowser(w => {
    const store = w.loadStore();
    assert.equal(store.characterLives.native.needs.rest, 0, 'Validation must complete before applying even the first character');
    assert(store.useLaraLifeStore.getState().saveError && w.errors.length === 1);
    store.publishLife('native', { activity: 'En attente' }); store.saveLives(); w.browser.dispatchEvent(new Event('pagehide'));
    assert.equal(w.timers.size, 0); assert.equal(w.storage.get(persistence.LIFE_SAVE_KEY), text);
    store.resetLives();
    assert.equal(w.storage.has(persistence.LIFE_SAVE_KEY), false);
    assert.equal(w.loadStore().useLaraLifeStore.getState().saveError, null);
  }, text);
});

it('rend les erreurs d’écriture visibles et reprend la sauvegarde lorsque le stockage redevient disponible', () => {
  withBrowser(w => {
    const store = w.loadStore(); w.failWrite(true); store.saveLives();
    assert(store.useLaraLifeStore.getState().saveError); assert.equal(w.errors.length, 1);
    store.saveLives(); assert.equal(w.errors.length, 1, 'Do not spam the same storage error');
    w.failWrite(false); store.saveLives();
    assert.equal(store.useLaraLifeStore.getState().saveError, null);
    assert(store.useLaraLifeStore.getState().savedAt);
    assert(w.storage.has(persistence.LIFE_SAVE_KEY));
  });
});

it('applique aussi la remise à zéro globale aux autres onglets sans réécrire leurs anciens historiques', () => {
  withBrowser(w => {
    const store = w.loadStore();
    store.publishLife('native', { activity: 'En attente' });
    const event = key => Object.assign(new Event('storage'), { key, newValue: null });
    w.browser.dispatchEvent(event('other-setting'));
    assert.equal(w.reloads(), 0);
    w.browser.dispatchEvent(event(persistence.LIFE_SAVE_KEY));
    assert.equal(w.reloads(), 1); assert.equal(w.timers.size, 0); assert.equal(w.writes(), 0);
  });
});

it('conserve les portions partagées et réservées ainsi que les bilans journaliers, puis efface le tout ensemble', () => {
  let text, saved;
  withBrowser(w => {
    const store = w.loadStore();
    store.characterLives.native.elapsedSeconds = 1000;
    life.prepareLifeMeals('native', ['cha', 'vivida']);
    life.recordLifeDay('native', 959, 3, 'meal', store.characterLives.native.needs, 'cha');
    life.recordLifeEvent('native', 962, 'life_meal_shared');
    store.saveLives();
    text = w.storage.get(persistence.LIFE_SAVE_KEY);
    saved = persistence.parseLifeSave(text);
    assert.deepEqual(saved.household, life.lifeHousehold);
    assert.equal(saved.household.meals.portions, 2);
  });
  withBrowser(w => {
    const restored = w.loadStore();
    assert.deepEqual(restored.useLaraLifeStore.getState().household, saved.household);
    assert(life.claimLifeMeal('native'));
    assert.equal(life.lifeHousehold.meals.portions, 2, 'A restored reservation must not consume a second portion');
    restored.resetLives(); w.loadStore();
    assert.deepEqual(life.lifeHousehold, life.createLifeHousehold());
  }, text);
});

it('rejette les portions et bilans invalides avant restauration', () => {
  for (const corrupt of [
    h => { h.meals.portions = -1; }, h => { h.meals.portions = .5; }, h => { h.meals.held.unknown = true; },
    h => { h.meals.held.cha = false; }, h => { h.meals.preparedBy = 'unknown'; },
    h => { h.journal.unknown = {}; }, h => { h.journal.native = { 2: { activities: {}, partners: {}, unmet: {}, events: {} } }; },
    h => { h.journal.native[1].activities.unknown = 1; }, h => { h.journal.native[1].partners.native = 1; },
    h => { h.journal.native[1].unmet.work = -1; }, h => { h.journal.native[1].events.unknown = 1; },
  ]) {
    const saved = freshSave(); saved.household = life.createLifeHousehold();
    saved.household.journal.native = { 1: { activities: {}, partners: {}, unmet: {}, events: {} } };
    corrupt(saved.household);
    assert.throws(() => persistence.parseLifeSave(JSON.stringify(saved)));
  }
});
