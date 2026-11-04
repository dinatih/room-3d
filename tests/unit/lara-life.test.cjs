const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { createLife, evolveLife, chooseLifeActivity, LIFE_SETTINGS } = require('../../src/features/scene/ai/laraLife.ts');
const { load } = require('../support/load-ts.cjs');
const position = { x: 0, z: 0 };
const candidates = [
  { activity: 'work', id: 'desk', slotId: 'work', x: 0, z: 0 },
  { activity: 'rest', id: 'sofa', slotId: 'sit', x: 10, z: 0 },
  { activity: 'walk', id: 'garden', slotId: 'breathe', x: 100, z: 0 },
];

describe('Besoins de Lara Native', () => {
  it('évolue selon le temps écoulé, indépendamment de la fréquence des images', () => {
    const initial = { rest: 50, work: 90, walk: 50, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
    let needs = initial;
    for (let frame = 0; frame < 1800; frame++) needs = evolveLife(needs, 1 / 30, 'work', false);
    const expected = evolveLife(initial, 60, 'work', false);
    for (const key of Object.keys(needs)) assert(Math.abs(needs[key] - expected[key]) < 1e-8);
    assert.deepEqual(initial, { rest: 50, work: 90, walk: 50, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 });
  });

  it('ne récupère pas pendant un trajet ou une attente de navigation', () => {
    const initial = { rest: 50, work: 50, walk: 50, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
    const waiting = evolveLife(initial, 10, null, false);
    const walking = evolveLife(initial, 10, null, true);
    const resting = evolveLife(initial, 10, 'rest', false);
    assert(waiting.rest > initial.rest && waiting.walk > initial.walk);
    assert(walking.rest > initial.rest && walking.walk < initial.walk);
    assert(resting.rest < initial.rest);
    assert.deepEqual(evolveLife(initial, 0, 'rest', true), initial);
  });

  it('choisit selon l’urgence, puis la mémoire, la proximité et un ordre stable', () => {
    assert.equal(chooseLifeActivity({ rest: 90, work: 50, walk: 80, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 }, candidates, position, null, 8, {}, 0).activity, 'rest');
    assert.equal(chooseLifeActivity({ rest: 50, work: 50, walk: 50, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 }, candidates, position, 'work', 8, {}, 0).activity, 'rest');
    assert.equal(chooseLifeActivity({ rest: 50, work: 50, walk: 50, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 }, candidates, position, null, 8, {}, 0).activity, 'work');
    const seats = ['b', 'a'].map(id => ({ ...candidates[1], id }));
    assert.equal(chooseLifeActivity({ rest: 90, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 }, seats, position, null, 8, {}, 0).id, 'a');
  });

  it('fait une pause si les besoins sont faibles ou les activités indisponibles', () => {
    assert.equal(chooseLifeActivity({ rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 }, candidates, position, null, 8, {}, 0), null);
    assert.equal(chooseLifeActivity({ rest: 90, work: 90, walk: 90, meal: 90, hygiene: 0, toilet: 0, company: 0, environment: 0 }, [], position, null, 8, {}, 0), null);
    assert.equal(chooseLifeActivity({ rest: 90, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 }, [candidates[0]], position, null, 8, {}, 0).activity, 'work');
  });

  it('borne les besoins et signale explicitement les données invalides', () => {
    assert.deepEqual(evolveLife({ rest: 0, work: 100, walk: 100, meal: 100, hygiene: 100, toilet: 100, company: 100, environment: 0 }, 60, 'rest', false), { rest: 0, work: 100, walk: 100, meal: 100, hygiene: 100, toilet: 100, company: 100, environment: 0 });
    for (const seconds of [-1, NaN, Infinity]) assert.throws(() => evolveLife(createLife('native').needs, seconds, null, false));
    assert.throws(() => evolveLife({ rest: NaN, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 }, 1, null, false));
  });
});

it('sélectionne uniquement des places de repos adaptées et libres dans la configuration active', () => {
  const life = require('../../src/features/scene/ai/laraLife.ts');
  const occupied = new Set(['sofa:seat-1']);
  const objects = [
    { id: 'sofa', category: 'seating', position: [0, 0, 0], slots: [
      { slotId: 'seat-1', offset: [10, 0, 20], entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' },
      { slotId: 'seat-2', offset: [30, 0, 40], entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' },
      { slotId: 'duo', isDuo: true, entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' },
      { slotId: 'unconfigured' },
    ] },
    { id: 'private', category: 'seating', position: [0, 0, 0], slots: [{ slotId: 'sit', entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' }] },
    { id: 'garden-fresh-air', position: [100, 0, 200], slots: [{ slotId: 'breathe' }] },
  ];
  const { getLaraLifeCandidates, buildLaraLifeInstructions, MEAL_PREPARATION } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': life, './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => [{ type: 'USE_OBJECT', smartObjectId: id, slotId }] },
    './occupancyManager': { OccupancyManager: { canUseObject: id => id !== 'private',
      isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`) } },
  });
  const available = getLaraLifeCandidates('native', false);
  assert.deepEqual(available.filter(c => c.activity === 'rest').map(c => c.slotId), ['seat-2', 'duo']);
  assert.deepEqual([available[0].x, available[0].z], [30, 40]);
  const gardenSteps = buildLaraLifeInstructions('native', available.find(candidate => candidate.activity === 'walk'));
  assert.equal(gardenSteps[0].targetZoneId, 'garden');
  const garden = gardenSteps[1];
  assert.equal(garden.animation, undefined);
  assert.equal(garden.repeatCount, undefined);
  occupied.clear();
  assert.equal(getLaraLifeCandidates('native', false).filter(c => c.activity === 'rest').length, 3);
  assert(!getLaraLifeCandidates('native', false).some(c => c.activity === 'meal'), 'No meal without a kitchen');
  objects.push({ ...MEAL_PREPARATION, position: [80, 0, 370], slots: [{ slotId: MEAL_PREPARATION.slotId }] });
  const meals = getLaraLifeCandidates('native', false).filter(c => c.activity === 'meal');
  assert.equal(meals.length, 2, 'Each available real seat is a possible place to eat');
  const steps = buildLaraLifeInstructions('native', meals[0]);
  assert.deepEqual(steps.map(step => step.lifePhase), ['prepare-meal', 'eat-meal']);
  assert.equal(steps[0].smartObjectId, MEAL_PREPARATION.id);
  assert.equal(steps[1].smartObjectId, 'sofa');
  assert.equal(steps[1].animation, 'fab-daily-life-eat-with-fork');
  occupied.add(`${MEAL_PREPARATION.id}:${MEAL_PREPARATION.slotId}`);
  assert(!getLaraLifeCandidates('native', false).some(c => c.activity === 'meal'), 'A busy kitchen must prevent starting a meal');
});

it('fait monter la faim pendant la marche et les autres activités, puis la réduit en mangeant', () => {
  const initial = { rest: 0, work: 0, walk: 0, meal: 50, hygiene: 0, toilet: 0, company: 0, environment: 0 };
  for (const activity of [null, 'rest', 'work', 'walk', 'pause']) assert(evolveLife(initial, 10, activity, true).meal > initial.meal);
  assert.equal(evolveLife(initial, 10, 'meal', false).meal, 35);
  assert.equal(evolveLife(initial, 60, 'meal', false).meal, 0);
  assert.equal(chooseLifeActivity({ ...initial, meal: 90 }, [{ ...candidates[1], activity: 'meal' }], position, null, 8, {}, 0).activity, 'meal');
});

it('réserve le lit à la grande fatigue et choisit une pause assise si tous les lits sont indisponibles', () => {
  const bed = { activity: 'sleep', id: 'bed-west', slotId: 'lie-down', x: 1000, z: 0 };
  const mild = { rest: LIFE_SETTINGS.sleepPriority - 1, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
  assert.equal(chooseLifeActivity(mild, [...candidates, bed], position, null, 8, {}, 0).activity, 'rest');
  const tired = { ...mild, rest: LIFE_SETTINGS.sleepPriority };
  assert.equal(chooseLifeActivity(tired, [...candidates, bed], position, null, 8, {}, 0).activity, 'sleep', 'The nearer sofa must not replace an available bed');
  assert.equal(chooseLifeActivity(tired, candidates, position, null, 8, {}, 0).activity, 'rest');
  assert.equal(chooseLifeActivity(tired, [], position, null, 8, {}, 0), null);
  const rested = evolveLife(tired, 120, 'sleep', false);
  assert.equal(rested.rest, 0);
  assert(rested.meal > tired.meal);
  assert(evolveLife(tired, 60, 'rest', false).rest > evolveLife(tired, 60, 'sleep', false).rest);
});

it('finit par choisir le sommeil au cours d’une vie autonome, malgré les pauses courtes', () => {
  const bed = { activity: 'sleep', id: 'bed-west', slotId: 'lie-down', x: 0, z: 0 };
  let needs = createLife('native').needs, last = 'work', slept = false;
  needs = evolveLife(needs, LIFE_SETTINGS.activitySeconds, 'work', false);
  for (let seconds = LIFE_SETTINGS.activitySeconds; seconds < 15 * 60;) {
    const selected = chooseLifeActivity(needs, [...candidates, bed], position, last, 8, {}, 0);
    if (selected?.activity === 'sleep') { slept = true; break; }
    const activity = selected?.activity ?? 'pause';
    if (activity === 'walk') needs = evolveLife(needs, 8, null, true);
    const duration = activity === 'pause' ? LIFE_SETTINGS.pauseSeconds : LIFE_SETTINGS.activitySeconds;
    needs = evolveLife(needs, duration, activity, false);
    seconds += duration;
    last = activity;
  }
  assert(slept, 'Short rests must not prevent sleeping indefinitely');
});

it('garde la montée et la descente du lit et applique le sommeil uniquement à l’étape couchée', () => {
  let objects = [{ id: 'bed-west', category: 'bed', position: [0, 0, 0], slots: [{ slotId: 'lie-down' }, { slotId: 'seat-middle' }] }];
  const occupied = new Set();
  const route = [
    { type: 'MOVE_TO' }, { type: 'MOVE_TO', targetLocalPos: [0, 45, 28], navigation: 'interaction' },
    { type: 'USE_OBJECT', animation: 'laying-front-variation', duration: 7 },
    { type: 'MOVE_TO', targetLocalPos: [0, 45, 28], navigation: 'interaction' }, { type: 'MOVE_TO' },
  ];
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => route.map(step => ({ ...step, smartObjectId: id, slotId })) },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`) } },
  });
  const beds = getLaraLifeCandidates('native', false);
  assert.equal(beds.filter(candidate => candidate.activity === 'sleep').length, 1);
  const steps = buildLaraLifeInstructions('native', beds[0]);
  assert.deepEqual(steps.map(step => step.type), route.map(step => step.type));
  assert.deepEqual(steps[1].targetLocalPos, route[1].targetLocalPos);
  assert.equal(steps[2].animation, route[2].animation);
  assert.equal(steps[2].lifePhase, 'sleep');
  assert.equal(steps[2].duration, route[2].duration);
  assert(steps.slice(3).every(step => step.lifePhase === 'wake-up'));
  occupied.add('bed-west:lie-down');
  assert.equal(getLaraLifeCandidates('native', false).filter(candidate => candidate.activity === 'sleep').length, 0);
  objects = [{ id: 'bed-double', category: 'bed', position: [0, 0, 0], slots: [{ slotId: 'lie-down-left' }, { slotId: 'lie-down-right' }] }];
  assert.equal(getLaraLifeCandidates('native', false).length, 2);
});

it('distingue toilettes, douche et lavage des mains, sans récupération pendant la chasse ou les trajets', () => {
  const { lifeEffect } = require('../../src/features/scene/ai/laraLife.ts');
  const needs = { ...createLife('native').needs, hygiene: 90, toilet: 90 };
  assert.equal(evolveLife(needs, 30, 'toilet', false).toilet, 0);
  assert.equal(evolveLife(needs, 60, 'shower', false).hygiene, 0);
  assert(evolveLife(needs, 15, 'wash-hands', false).hygiene > 85, 'Handwashing cannot replace a shower');
  for (const phase of [undefined, 'flush']) assert.equal(lifeEffect('toilet', phase), null);
  assert.equal(lifeEffect('toilet', 'use-toilet'), 'toilet');
  assert.equal(lifeEffect('toilet', 'wash-hands'), 'wash-hands');
  const wash = { activity: 'wash-hands', id: 'sink', slotId: 'wash-hands', x: 100, z: 0 };
  assert.equal(chooseLifeActivity({ ...needs, rest: 100 }, [...candidates, wash], position, null, 8, {}, 0), wash);
});

it('préserve la chaîne sanitaire et les événements des objets, et interdit un repas avec les mains sales', () => {
  const objects = [
    { id: 'toilet', slots: [{ slotId: 'use' }, { slotId: 'flush' }] },
    { id: 'vasque-sdb', slots: [{ slotId: 'wash-hands' }, { slotId: 'brush-teeth' }] },
    { id: 'shower', slots: [{ slotId: 'take-shower-1' }] },
    { id: 'cuisine-group', slots: [{ slotId: 'cook-stove' }] },
    { id: 'sofa', category: 'seating', slots: [{ slotId: 'sit', entryAnimation: 'sit', exitAnimation: 'stand' }] },
  ].map(object => ({ position: [0, 0, 0], ...object }));
  const toilet = [
    { type: 'MOVE_TO', smartObjectId: 'toilet', slotId: 'use' },
    { type: 'WAIT', triggerEventKey: 'wc-lid-toggle', triggerEventValue: true },
    { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' },
    { type: 'WAIT', triggerEventKey: 'wc-lid-toggle', triggerEventValue: false },
    { type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'flush', triggerEventKey: 'wc-flush', duration: 2 },
    { type: 'USE_OBJECT', smartObjectId: 'vasque-sdb', slotId: 'wash-hands' },
  ];
  let busySink = false;
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects, buildSmartObjectInstructionSequence: id => id === 'toilet' ? toilet : [
      { type: 'MOVE_TO' }, { type: 'USE_OBJECT', smartObjectId: 'shower' }, { type: 'MOVE_TO' },
    ] },
    './occupancyManager': { OccupancyManager: { canUseObject: id => !(busySink && id === 'vasque-sdb'), isSlotOccupied: () => false } },
  });
  assert(getLaraLifeCandidates('native', false).some(c => c.activity === 'meal'));
  assert(!getLaraLifeCandidates('native', false).some(c => c.activity === 'wash-hands'));
  assert(!getLaraLifeCandidates('native', true).some(c => c.activity === 'meal'));
  assert(getLaraLifeCandidates('native', true).some(c => c.activity === 'wash-hands'));
  busySink = true;
  assert(!getLaraLifeCandidates('native', true).some(c => c.activity === 'wash-hands'));
  const steps = buildLaraLifeInstructions('native', { activity: 'toilet', id: 'toilet', slotId: 'use' });
  assert.deepEqual(steps.map(s => s.triggerEventKey), toilet.map(s => s.triggerEventKey));
  assert.deepEqual(steps.map(s => s.lifePhase), [undefined, undefined, 'use-toilet', undefined, 'flush', 'wash-hands']);
  assert.equal(steps[2].duration, toilet[2].duration);
  assert.equal(steps[5].duration, toilet[5].duration);
  const shower = buildLaraLifeInstructions('native', { activity: 'shower', id: 'shower', slotId: 'take-shower-1' });
  assert.deepEqual(shower.map(s => s.type), ['MOVE_TO', 'USE_OBJECT', 'MOVE_TO']);
  assert.equal(shower[1].animation, undefined);
  assert.equal(shower[1].lifePhase, 'shower');
});

it('fait évoluer l’humeur avec le besoin dominant puis retrouve son bien-être après satisfaction', () => {
  const { getLifeMood } = require('../../src/features/scene/ai/laraLife.ts');
  const satisfied = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 0, environment: 0 };
  assert.equal(getLifeMood(satisfied).label, 'Épanouie');
  assert.equal(getLifeMood({ ...satisfied, rest: LIFE_SETTINGS.priority - 1 }).uncomfortable, false);
  assert.equal(getLifeMood({ ...satisfied, rest: LIFE_SETTINGS.priority }).label, 'Fatiguée');
  const hungry = { ...satisfied, meal: 90, rest: 40 };
  assert.equal(getLifeMood(hungry).label, 'Affamée');
  const fed = evolveLife(hungry, 60, 'meal', false);
  assert.equal(getLifeMood(fed).label, 'Fatiguée', 'Relieving hunger must reveal the remaining fatigue');
  assert.equal(getLifeMood(evolveLife(fed, 60, 'sleep', false)).label, 'Épanouie');
  for (const key of Object.keys(satisfied)) {
    const mood = getLifeMood({ ...satisfied, [key]: 80 });
    assert(mood.uncomfortable);
    assert(mood.cause.includes('80 %'));
  }
  assert.deepEqual(hungry, { ...satisfied, meal: 90, rest: 40 }, 'Deriving a mood must preserve needs');
});

it('organise les loisirs, repas et sommeil selon l’heure sans ignorer les urgences', () => {
  const { lifeClock, routineActivities, lifeEffect } = require('../../src/features/scene/ai/laraLife.ts');
  assert.deepEqual(lifeClock(0), { day: 1, hour: 8, time: '08:00', period: 'Matin' });
  assert.equal(lifeClock(16 * 60).day, 2);
  assert.equal(lifeClock(16 * 60).time, '00:00');
  assert(routineActivities(12).includes('meal'));
  const options = ['work', 'read', 'watch-tv', 'social', 'meal', 'sleep', 'rest'].map(activity => ({ ...candidates[0], activity, id: activity }));
  const needs = { rest: 50, work: 50, walk: 0, meal: 40, hygiene: 0, toilet: 0, company: 50, environment: 0 };
  assert.equal(chooseLifeActivity(needs, options, position, null, 10, {}, 0).activity, 'work');
  assert.equal(chooseLifeActivity(needs, options, position, null, 12, {}, 0).activity, 'meal');
  assert.equal(chooseLifeActivity(needs, options, position, 'read', 21, {}, 0).activity, 'social');
  assert.equal(chooseLifeActivity(needs, options, position, null, 23, {}, 0).activity, 'sleep');
  assert.equal(chooseLifeActivity({ ...needs, meal: 100 }, options, position, null, 23, {}, 0).activity, 'meal');
  for (const activity of ['read', 'watch-tv', 'social']) {
    assert(evolveLife(needs, 10, activity, false).work < needs.work);
    assert.equal(lifeEffect(activity), null, 'Travelling to leisure must not relieve boredom');
    assert.equal(lifeEffect(activity, activity), activity);
  }
});

it('propose les loisirs libres et conserve leurs phases et les actions de la télé', () => {
  const objects = [
    { id: 'desk-bollsidan-2', slots: [{ slotId: 'work-standing', animation: 'standing-using-touchscreen-tablet' }] },
    { id: 'tv-view', slots: [{ slotId: 'watch', triggerEventKey: 'tv-toggle', triggerEventValue: true }] },
    { id: 'garden-conversation', slots: [{ slotId: 'chat', isDuo: true }] },
  ].map(object => ({ ...object, position: [0, 0, 0] }));
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => [{ type: 'USE_OBJECT', smartObjectId: id, ...objects.find(object => object.id === id).slots.find(slot => slot.slotId === slotId) }] },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: () => false } },
  });
  const options = getLaraLifeCandidates('native', false);
  for (const activity of ['read', 'watch-tv', 'social']) {
    const candidate = options.find(c => c.activity === activity);
    assert(candidate);
    const [step] = buildLaraLifeInstructions('native', candidate);
    assert.equal(step.lifePhase, activity);
    if (activity === 'watch-tv') {
      assert.equal(step.triggerEventKey, 'tv-toggle');
      assert.equal(step.triggerEventValue, true);
    }
    if (activity === 'read') assert.equal(step.animation, 'standing-using-touchscreen-tablet');
  }
});

it('apprend ses goûts uniquement grâce au soulagement réel et conserve les souvenirs sans modifier les besoins', () => {
  const { rememberLifeActivity, favoriteLifeActivity } = require('../../src/features/scene/ai/laraLife.ts');
  const life = createLife('native'), before = { ...life.needs, work: 80 };
  assert.equal(favoriteLifeActivity(life.memory), null);
  rememberLifeActivity(life, null, before, before);
  assert.deepEqual(life.memory, {});
  rememberLifeActivity(life, 'read', before, before);
  assert.equal(favoriteLifeActivity(life.memory), null, 'A remembered activity is not automatically enjoyable');
  life.elapsedSeconds = 60;
  const after = evolveLife(before, 20, 'read', false);
  rememberLifeActivity(life, 'read', before, after);
  assert.equal(life.memory.read.satisfaction, 24);
  assert.equal(life.memory.read.lastAt, 60);
  assert.equal(favoriteLifeActivity(life.memory), 'read');
  rememberLifeActivity(life, 'watch-tv', before, evolveLife(before, 30, 'watch-tv', false));
  assert.equal(favoriteLifeActivity(life.memory), 'watch-tv', 'Tastes must evolve with experience');
  assert.equal(before.work, 80);
});

it('varie ses loisirs avec la mémoire, garde une affinité pour ses favoris et respecte les urgences', () => {
  const needs = { rest: 0, work: 60, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 60, environment: 0 };
  const options = ['read', 'watch-tv', 'social'].map(activity => ({ ...candidates[0], id: activity, activity }));
  const memory = { read: { satisfaction: 60, lastAt: 0 }, 'watch-tv': { satisfaction: 10, lastAt: 0 } };
  const choose = (entries, at, available = options, values = needs) => chooseLifeActivity(values, available, position, null, 21, entries, at);
  assert.equal(choose(memory, 0).activity, 'social', 'An untried activity must compete with recent favorites');
  assert.equal(choose(memory, 600).activity, 'read', 'An older favorite can become attractive again');
  const equalTastes = { read: { satisfaction: 10, lastAt: 600 }, 'watch-tv': { satisfaction: 10, lastAt: 0 } };
  assert.equal(choose(equalTastes, 600, options.slice(0, 2)).activity, 'watch-tv');
  assert.equal(choose(memory, 600, [...options, { ...candidates[1], activity: 'meal' }], { ...needs, meal: 100 }).activity, 'meal');
  assert.equal(choose(memory, 600, [options[1]]).activity, 'watch-tv', 'An unavailable favorite must not prevent another activity');
});

it('construit les affinités seulement avec du temps réellement partagé et préserve les nouvelles rencontres', () => {
  const { rememberLifeConversation, closestLifeFriend, socialPartnerScore } = require('../../src/features/scene/ai/laraLife.ts');
  const life = createLife('native');
  assert.equal(closestLifeFriend(life.relationships), null);
  rememberLifeConversation(life, 'rosanna', 0);
  assert.deepEqual(life.relationships, {});
  life.elapsedSeconds = 60;
  rememberLifeConversation(life, 'rosanna', 30);
  rememberLifeConversation(life, 'rosanna', 30);
  assert.deepEqual(life.relationships.rosanna, { seconds: 60, lastAt: 60 });
  assert.equal(closestLifeFriend(life.relationships), 'rosanna');
  assert(socialPartnerScore(life.relationships, 'marissa', 60) > socialPartnerScore(life.relationships, 'rosanna', 60), 'A recent conversation must leave room to meet someone else');
  assert(socialPartnerScore(life.relationships, 'rosanna', 600) > socialPartnerScore(life.relationships, 'marissa', 600), 'Familiar company becomes attractive again after time apart');
  rememberLifeConversation(life, 'marissa', 90);
  assert.equal(closestLifeFriend(life.relationships), 'marissa');
  for (const seconds of [-1, NaN, Infinity]) assert.throws(() => rememberLifeConversation(life, 'rosanna', seconds));
  assert.throws(() => rememberLifeConversation(life, 'native', 1));
});

it('distingue la solitude de l’ennui et recherche une discussion pour le besoin de compagnie', () => {
  const { getLifeMood, lifeNeed, lifeEffect } = require('../../src/features/scene/ai/laraLife.ts');
  const lonely = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0, company: 90, environment: 0 };
  const conversation = { ...candidates[0], activity: 'social', id: 'garden-conversation' };
  assert.equal(lifeNeed('social'), 'company');
  assert.equal(getLifeMood(lonely).label, 'Seule');
  for (const activity of [null, 'read', 'watch-tv', 'work', 'walk', 'rest']) assert(evolveLife(lonely, 10, activity, false).company > lonely.company);
  assert(evolveLife(lonely, 10, 'sleep', false).company < evolveLife(lonely, 10, null, false).company, 'Solitude accumulates more slowly during sleep');
  const satisfied = evolveLife(lonely, 60, 'social', false);
  assert.equal(satisfied.company, 0);
  assert.equal(getLifeMood(satisfied).label, 'Épanouie');
  assert.equal(chooseLifeActivity(lonely, [...candidates, conversation], position, null, 10, {}, 0), conversation);
  assert.equal(chooseLifeActivity({ ...lonely, company: 0, environment: 0, work: 90 }, [conversation], position, null, 21, {}, 0), null, 'Boredom alone must not masquerade as loneliness');
  assert.equal(lifeEffect('social'), null, 'Moving or waiting for someone cannot satisfy company');
  assert.equal(chooseLifeActivity({ ...lonely, rest: 50 }, candidates, position, null, 10, {}, 0).activity, 'rest', 'A lonely Lara must keep living when a conversation is unavailable');
});

it('conserve les besoins, souvenirs et affinités propres à chacune des colocataires', () => {
  const { rememberLifeConversation, rememberLifeActivity } = require('../../src/features/scene/ai/laraLife.ts');
  const native = createLife('native'), cha = createLife('cha');
  const nativeBefore = structuredClone(native);
  cha.needs.meal = 90;
  cha.handsDirty = true;
  const before = cha.needs;
  cha.needs = evolveLife(before, 10, 'meal', false);
  rememberLifeActivity(cha, 'meal', before, cha.needs);
  rememberLifeConversation(cha, 'native', 10);
  assert.deepEqual(native, nativeBefore);
  assert.equal(cha.relationships.native.seconds, 10);
  assert.throws(() => rememberLifeConversation(cha, 'cha', 1));
});

it('publie uniquement les jauges du personnage concerné avec une vitesse commune', () => {
  const { useLaraLifeStore, publishLife } = load('src/features/scene/ai/laraLifeStore.ts', {
    zustand: require('zustand'),
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
  });
  const native = useLaraLifeStore.getState().characters.native;
  publishLife('cha', { activity: 'Manger', needs: { ...createLife('cha').needs, meal: 90 } });
  assert.equal(useLaraLifeStore.getState().characters.native, native);
  useLaraLifeStore.setState({ selectedCharacterId: 'cha', speed: 10 });
  assert.equal(useLaraLifeStore.getState().characters.cha.needs.meal, 90);
  assert.equal(useLaraLifeStore.getState().speed, 10);
});

it('utilise l’identité de Cha pour vérifier les places et construire ses interactions', () => {
  const calls = [];
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => [{ id: 'desk-bollsidan-2', position: [0, 0, 0], slots: [{ slotId: 'work-standing' }] }],
      buildSmartObjectInstructionSequence: (id, slot, character) => (calls.push(character), [{ type: 'USE_OBJECT', smartObjectId: id, slotId: slot }]) },
    './occupancyManager': { OccupancyManager: { canUseObject: (id, character) => (calls.push(character), true),
      isSlotOccupied: (id, slot, character) => (calls.push(character), false) } },
  });
  buildLaraLifeInstructions('cha', getLaraLifeCandidates('cha', false)[0]);
  assert(calls.length > 0 && calls.every(id => id === 'cha'));
});

it('conserve les animations, durées et répétitions des objets pour les trois vies', () => {
  const { buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { buildSmartObjectInstructionSequence: (id, slotId) => [
      { type: 'MOVE_TO', smartObjectId: id, slotId },
      { type: 'USE_OBJECT', smartObjectId: id, slotId, animation: undefined, repeatCount: 3, repeatVariation: true, triggerEventKey: 'water' },
      { type: 'MOVE_TO', smartObjectId: id, slotId },
    ] },
    './occupancyManager': {},
  });
  for (const character of ['native', 'cha', 'vivida']) for (const activity of ['shower', 'rest', 'sleep', 'walk', 'work', 'read', 'watch-tv', 'social']) {
    const steps = buildLaraLifeInstructions(character, { activity, id: 'shower', slotId: 'take-shower-1' });
    const use = steps.find(step => step.type === 'USE_OBJECT');
    assert.equal(use.animation, undefined, 'The slot must resolve its own random animation pool');
    assert.equal(use.duration, undefined, 'The clip must define its natural duration');
    assert.equal(use.repeatCount, 3);
    assert.equal(use.repeatVariation, true);
    assert.equal(use.triggerEventKey, 'water');
    assert(steps.filter(step => step.type === 'MOVE_TO').every(step => step.lifePhase !== 'shower'));
  }
  const needs = { ...createLife('native').needs, hygiene: 90 };
  const short = evolveLife(needs, 6, 'shower', false), long = evolveLife(needs, 18, 'shower', false);
  assert(needs.hygiene > short.hygiene && short.hygiene > long.hygiene && long.hygiene > 0);
});

it('propose le bain extérieur pour le repos, seulement sur les places libres', () => {
  const occupied = new Set();
  const objects = [
    { id: 'bathtub-garden', category: 'hygiene', position: [120, 0, -300], slots: ['center', 'west', 'east'].map(slotId => ({ slotId })) },
    { id: 'garden-fresh-air', position: [150, 0, -600], slots: [{ slotId: 'breathe' }] },
  ];
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => [
        { type: 'MOVE_TO', smartObjectId: id, slotId },
        { type: 'USE_OBJECT', smartObjectId: id, slotId, duration: 30, repeatVariation: true },
      ] },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true,
      isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`) } },
  });
  const { LIFE_CHARACTER_IDS, lifeEffect, favoriteLifeActivity, rememberLifeActivity } = require('../../src/features/scene/ai/laraLife.ts');
  for (const id of LIFE_CHARACTER_IDS) {
    const candidates = getLaraLifeCandidates(id, false);
    assert.equal(candidates.filter(candidate => candidate.activity === 'bath').length, 3);
    assert(!candidates.some(candidate => candidate.activity === 'meal'));
    const life = createLife(id);
    life.needs = { ...life.needs, rest: 50, work: 0, walk: 0 };
    const selected = chooseLifeActivity(life.needs, candidates, { x: 120, z: -300 }, null, 10, {}, 0);
    assert.equal(selected.id, 'bathtub-garden');
    assert.equal(selected.activity, 'bath');
    const [move, use] = buildLaraLifeInstructions(id, selected);
    assert.equal(move.lifePhase, undefined);
    assert.equal(lifeEffect(selected.activity), null);
    assert.equal(lifeEffect(selected.activity, use.lifePhase), 'bath');
    assert.equal(use.duration, 30);
    assert.equal(use.repeatVariation, true);
    const after = evolveLife(life.needs, 10, 'bath', false);
    assert(after.rest < life.needs.rest);
    assert(after.walk > life.needs.walk, 'A seated outdoor bath must not masquerade as walking');
    rememberLifeActivity(life, 'bath', life.needs, after);
    assert.equal(favoriteLifeActivity(life.memory), 'bath');
    const bed = { activity: 'sleep', id: 'bed-east', slotId: 'lie-down', x: 120, z: -300 };
    assert.equal(chooseLifeActivity({ ...life.needs, rest: 90 }, [...candidates, bed], { x: 120, z: -300 }, null, 23, {}, 0), bed);
  }
  occupied.add('bathtub-garden:center');
  assert(!getLaraLifeCandidates('vivida', false).some(candidate => candidate.id === 'bathtub-garden' && candidate.slotId === 'center'));
});

it('isole les jauges de Vivida et la sélection de son onglet', () => {
  const { useLaraLifeStore, publishLife } = load('src/features/scene/ai/laraLifeStore.ts', {
    zustand: require('zustand'), './laraLife': require('../../src/features/scene/ai/laraLife.ts'), './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
  });
  const before = useLaraLifeStore.getState();
  publishLife('vivida', { needs: { ...before.characters.vivida.needs, rest: 90 } });
  useLaraLifeStore.setState({ selectedCharacterId: 'vivida' });
  const after = useLaraLifeStore.getState();
  assert.equal(after.characters.native, before.characters.native);
  assert.equal(after.characters.cha, before.characters.cha);
  assert.equal(after.characters.vivida.needs.rest, 90);
  assert.equal(after.selectedCharacterId, 'vivida');
});

it('fait varier les assises et propose les bords de lit pour le repos et les repas', () => {
  const life = require('../../src/features/scene/ai/laraLife.ts');
  const objects = [
    { id: 'bed-east', category: 'bed', position: [0, 0, 0], slots: [{ slotId: 'seat-middle' }, { slotId: 'lie-down' }] },
    { id: 'sofa', category: 'seating', position: [20, 0, 0], slots: [{ slotId: 'sit-duo', isDuo: true }] },
    { id: 'cuisine-group', position: [80, 0, 370], slots: [{ slotId: 'cook-stove' }] },
  ];
  const { getLaraLifeCandidates } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': life, './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: () => false } },
  });
  const candidates = getLaraLifeCandidates('native', false, { 'bed-east:seat-middle': 1 });
  assert(candidates.some(candidate => candidate.id === 'bed-east' && candidate.slotId === 'seat-middle' && candidate.activity === 'meal'));
  assert(candidates.some(candidate => candidate.id === 'sofa' && candidate.activity === 'social'));
  assert(!candidates.some(candidate => candidate.id === 'sofa' && candidate.activity === 'meal'));
  const needs = { ...createLife('native').needs, rest: 50, work: 0, walk: 0 };
  assert.equal(chooseLifeActivity(needs, candidates, position, null, 10, {}, 0).id, 'sofa', 'The nearest seat must not monopolize every rest');
  const social = evolveLife({ ...needs, company: 80 }, 10, 'rest', false, true);
  assert(social.rest < needs.rest && social.company < 80);
  assert(evolveLife(needs, 30, null, false).environment === needs.environment, 'A timer cannot invent house dirt');
});

it('fait commencer les trois colocataires sans besoin de repos', () => {
  const { LIFE_CHARACTER_IDS } = require('../../src/features/scene/ai/laraLife.ts');
  for (const id of LIFE_CHARACTER_IDS) assert.equal(createLife(id).needs.rest, 0);
});

it('propose les huit places de yoga libres chez Églantine avec stimulation et exercice réellement joués', () => {
  const life = require('../../src/features/scene/ai/laraLife.ts');
  const occupied = new Set(['yoga-2']);
  const slots = ['yoga', 'yoga-2', 'yoga-3', 'yoga-4', 'yoga-5', 'yoga-6', 'yoga-7', 'yoga-8'];
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': life, './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': {
      getAllSmartObjects: () => [{ id: 'west-neighbor-flat', category: 'outdoor', position: [-200, 0, 500], slots: slots.map(slotId => ({ slotId })) }],
      buildSmartObjectInstructionSequence: (id, slotId) => [{ type: 'USE_OBJECT', smartObjectId: id, slotId, repeatCount: 6, repeatVariation: true }],
    },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: (id, slot) => occupied.has(slot) } },
  });
  for (const id of life.LIFE_CHARACTER_IDS) {
    const candidates = getLaraLifeCandidates(id, false);
    assert.equal(candidates.length, 7);
    assert(candidates.every(candidate => candidate.activity === 'yoga' && candidate.slotId !== 'yoga-2'));
    const [step] = buildLaraLifeInstructions(id, candidates[0]);
    assert.equal(step.lifePhase, 'yoga');
    assert.equal(step.repeatCount, 6);
    assert.equal(step.repeatVariation, true);
    assert.equal(step.animation, undefined, 'The smart object must choose its yoga poses');
    assert.equal(step.duration, undefined, 'Poses must retain their natural duration');
  }
  occupied.clear();
  assert.equal(getLaraLifeCandidates('native', false).length, 8);
  const needs = { ...createLife('native').needs, work: 80, walk: 80 };
  const after = evolveLife(needs, 10, life.lifeEffect('yoga', 'yoga'), false);
  assert(after.work < needs.work && after.walk < needs.walk);
  assert(after.rest > needs.rest, 'Exercise must not be treated as sleep');
  assert.equal(life.lifeEffect('yoga'), null, 'Travelling to a yoga slot must not give yoga benefits');
  const yoga = getLaraLifeCandidates('native', false)[0];
  assert.equal(chooseLifeActivity({ ...needs, work: 0 }, [yoga], position, null, 10, {}, 0), yoga,
    'Yoga must also be chosen for exercise when the character is not bored');
  assert.equal(chooseLifeActivity(needs, [{ ...candidates[0], visits: 1 }, yoga], position, 'work', 10,
    { work: { satisfaction: 20, lastAt: 0 } }, 0).activity, 'yoga', 'The daytime routine must allow alternatives to the computer');
});
