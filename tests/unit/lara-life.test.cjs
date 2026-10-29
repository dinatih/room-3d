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
    const initial = { rest: 50, work: 90, walk: 50, meal: 0, hygiene: 0, toilet: 0 };
    let needs = initial;
    for (let frame = 0; frame < 1800; frame++) needs = evolveLife(needs, 1 / 30, 'work', false);
    const expected = evolveLife(initial, 60, 'work', false);
    for (const key of Object.keys(needs)) assert(Math.abs(needs[key] - expected[key]) < 1e-8);
    assert.deepEqual(initial, { rest: 50, work: 90, walk: 50, meal: 0, hygiene: 0, toilet: 0 });
  });

  it('ne récupère pas pendant un trajet ou une attente de navigation', () => {
    const initial = { rest: 50, work: 50, walk: 50, meal: 0, hygiene: 0, toilet: 0 };
    const waiting = evolveLife(initial, 10, null, false);
    const walking = evolveLife(initial, 10, null, true);
    const resting = evolveLife(initial, 10, 'rest', false);
    assert(waiting.rest > initial.rest && waiting.walk > initial.walk);
    assert(walking.rest > initial.rest && walking.walk < initial.walk);
    assert(resting.rest < initial.rest);
    assert.deepEqual(evolveLife(initial, 0, 'rest', true), initial);
  });

  it('choisit selon l’urgence, puis la mémoire, la proximité et un ordre stable', () => {
    assert.equal(chooseLifeActivity({ rest: 90, work: 50, walk: 80, meal: 0, hygiene: 0, toilet: 0 }, candidates, position, null, 8).activity, 'rest');
    assert.equal(chooseLifeActivity({ rest: 50, work: 50, walk: 50, meal: 0, hygiene: 0, toilet: 0 }, candidates, position, 'work', 8).activity, 'rest');
    assert.equal(chooseLifeActivity({ rest: 50, work: 50, walk: 50, meal: 0, hygiene: 0, toilet: 0 }, candidates, position, null, 8).activity, 'work');
    const seats = ['b', 'a'].map(id => ({ ...candidates[1], id }));
    assert.equal(chooseLifeActivity({ rest: 90, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 }, seats, position, null, 8).id, 'a');
  });

  it('fait une pause si les besoins sont faibles ou les activités indisponibles', () => {
    assert.equal(chooseLifeActivity({ rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 }, candidates, position, null, 8), null);
    assert.equal(chooseLifeActivity({ rest: 90, work: 90, walk: 90, meal: 90, hygiene: 0, toilet: 0 }, [], position, null, 8), null);
    assert.equal(chooseLifeActivity({ rest: 90, work: 50, walk: 0, meal: 0, hygiene: 0, toilet: 0 }, [candidates[0]], position, null, 8).activity, 'work');
  });

  it('borne les besoins et signale explicitement les données invalides', () => {
    assert.deepEqual(evolveLife({ rest: 0, work: 100, walk: 100, meal: 100, hygiene: 100, toilet: 100 }, 60, 'rest', false), { rest: 0, work: 100, walk: 100, meal: 100, hygiene: 100, toilet: 100 });
    for (const seconds of [-1, NaN, Infinity]) assert.throws(() => evolveLife(createLife().needs, seconds, null, false));
    assert.throws(() => evolveLife({ rest: NaN, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 }, 1, null, false));
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
    './laraLife': life,
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => [{ type: 'USE_OBJECT', smartObjectId: id, slotId }] },
    './occupancyManager': { OccupancyManager: { canUseObject: id => id !== 'private',
      isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`) } },
  });
  const available = getLaraLifeCandidates(false);
  assert.deepEqual(available.map(c => c.slotId), ['seat-2', 'breathe']);
  assert.deepEqual([available[0].x, available[0].z], [30, 40]);
  const gardenSteps = buildLaraLifeInstructions(available[1]);
  assert.equal(gardenSteps[0].targetZoneId, 'garden');
  const garden = gardenSteps[1];
  assert.equal(garden.animation, 'looking');
  assert.equal(garden.repeatCount, 1);
  occupied.clear();
  assert.equal(getLaraLifeCandidates(false).filter(c => c.activity === 'rest').length, 2);
  assert(!getLaraLifeCandidates(false).some(c => c.activity === 'meal'), 'No meal without a kitchen');
  objects.push({ ...MEAL_PREPARATION, position: [80, 0, 370], slots: [{ slotId: MEAL_PREPARATION.slotId }] });
  const meals = getLaraLifeCandidates(false).filter(c => c.activity === 'meal');
  assert.equal(meals.length, 2, 'Each available real seat is a possible place to eat');
  const steps = buildLaraLifeInstructions(meals[0]);
  assert.deepEqual(steps.map(step => step.lifePhase), ['prepare-meal', 'eat-meal']);
  assert.equal(steps[0].smartObjectId, MEAL_PREPARATION.id);
  assert.equal(steps[1].smartObjectId, 'sofa');
  assert.equal(steps[1].animation, 'fab-daily-life-eat-with-fork');
  occupied.add(`${MEAL_PREPARATION.id}:${MEAL_PREPARATION.slotId}`);
  assert(!getLaraLifeCandidates(false).some(c => c.activity === 'meal'), 'A busy kitchen must prevent starting a meal');
});

it('fait monter la faim pendant la marche et les autres activités, puis la réduit en mangeant', () => {
  const initial = { rest: 0, work: 0, walk: 0, meal: 50, hygiene: 0, toilet: 0 };
  for (const activity of [null, 'rest', 'work', 'walk', 'pause']) assert(evolveLife(initial, 10, activity, true).meal > initial.meal);
  assert.equal(evolveLife(initial, 10, 'meal', false).meal, 35);
  assert.equal(evolveLife(initial, 60, 'meal', false).meal, 0);
  assert.equal(chooseLifeActivity({ ...initial, meal: 90 }, [{ ...candidates[1], activity: 'meal' }], position, null, 8).activity, 'meal');
});

it('réserve le lit à la grande fatigue et choisit une pause assise si tous les lits sont indisponibles', () => {
  const bed = { activity: 'sleep', id: 'bed-west', slotId: 'lie-down', x: 1000, z: 0 };
  const mild = { rest: LIFE_SETTINGS.sleepPriority - 1, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
  assert.equal(chooseLifeActivity(mild, [...candidates, bed], position, null, 8).activity, 'rest');
  const tired = { ...mild, rest: LIFE_SETTINGS.sleepPriority };
  assert.equal(chooseLifeActivity(tired, [...candidates, bed], position, null, 8).activity, 'sleep', 'The nearer sofa must not replace an available bed');
  assert.equal(chooseLifeActivity(tired, candidates, position, null, 8).activity, 'rest');
  assert.equal(chooseLifeActivity(tired, [], position, null, 8), null);
  const rested = evolveLife(tired, LIFE_SETTINGS.sleepSeconds, 'sleep', false);
  assert.equal(rested.rest, 0);
  assert(rested.meal > tired.meal);
  assert(evolveLife(tired, 60, 'rest', false).rest > evolveLife(tired, 60, 'sleep', false).rest);
});

it('finit par choisir le sommeil au cours d’une vie autonome, malgré les pauses courtes', () => {
  const bed = { activity: 'sleep', id: 'bed-west', slotId: 'lie-down', x: 0, z: 0 };
  let needs = createLife().needs, last = 'work', slept = false;
  needs = evolveLife(needs, LIFE_SETTINGS.activitySeconds, 'work', false);
  for (let seconds = LIFE_SETTINGS.activitySeconds; seconds < 15 * 60;) {
    const selected = chooseLifeActivity(needs, [...candidates, bed], position, last, 8);
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
    { type: 'USE_OBJECT' }, { type: 'MOVE_TO', targetLocalPos: [0, 45, 28], navigation: 'interaction' }, { type: 'MOVE_TO' },
  ];
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => route.map(step => ({ ...step, smartObjectId: id, slotId })) },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: (id, slotId) => occupied.has(`${id}:${slotId}`) } },
  });
  const beds = getLaraLifeCandidates(false);
  assert.equal(beds.length, 1);
  const steps = buildLaraLifeInstructions(beds[0]);
  assert.deepEqual(steps.map(step => step.type), route.map(step => step.type));
  assert.deepEqual(steps[1].targetLocalPos, route[1].targetLocalPos);
  assert.equal(steps[2].animation, 'laying-sleeping');
  assert.equal(steps[2].lifePhase, 'sleep');
  assert.equal(steps[2].duration, LIFE_SETTINGS.sleepSeconds);
  assert(steps.slice(3).every(step => step.lifePhase === 'wake-up'));
  occupied.add('bed-west:lie-down');
  assert.equal(getLaraLifeCandidates(false).length, 0);
  objects = [{ id: 'bed-double', category: 'bed', position: [0, 0, 0], slots: [{ slotId: 'lie-down-left' }, { slotId: 'lie-down-right' }] }];
  assert.equal(getLaraLifeCandidates(false).length, 2);
});

it('distingue toilettes, douche et lavage des mains, sans récupération pendant la chasse ou les trajets', () => {
  const { lifeEffect } = require('../../src/features/scene/ai/laraLife.ts');
  const needs = { ...createLife().needs, hygiene: 90, toilet: 90 };
  assert.equal(evolveLife(needs, 30, 'toilet', false).toilet, 0);
  assert.equal(evolveLife(needs, 60, 'shower', false).hygiene, 0);
  assert(evolveLife(needs, 15, 'wash-hands', false).hygiene > 85, 'Handwashing cannot replace a shower');
  for (const phase of [undefined, 'flush']) assert.equal(lifeEffect('toilet', phase), null);
  assert.equal(lifeEffect('toilet', 'use-toilet'), 'toilet');
  assert.equal(lifeEffect('toilet', 'wash-hands'), 'wash-hands');
  const wash = { activity: 'wash-hands', id: 'sink', slotId: 'wash-hands', x: 100, z: 0 };
  assert.equal(chooseLifeActivity({ ...needs, rest: 100 }, [...candidates, wash], position, null, 8), wash);
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
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects, buildSmartObjectInstructionSequence: id => id === 'toilet' ? toilet : [
      { type: 'MOVE_TO' }, { type: 'USE_OBJECT', smartObjectId: 'shower' }, { type: 'MOVE_TO' },
    ] },
    './occupancyManager': { OccupancyManager: { canUseObject: id => !(busySink && id === 'vasque-sdb'), isSlotOccupied: () => false } },
  });
  assert(getLaraLifeCandidates(false).some(c => c.activity === 'meal'));
  assert(!getLaraLifeCandidates(false).some(c => c.activity === 'wash-hands'));
  assert(!getLaraLifeCandidates(true).some(c => c.activity === 'meal'));
  assert(getLaraLifeCandidates(true).some(c => c.activity === 'wash-hands'));
  busySink = true;
  assert(!getLaraLifeCandidates(true).some(c => c.activity === 'wash-hands'));
  const steps = buildLaraLifeInstructions({ activity: 'toilet', id: 'toilet', slotId: 'use' });
  assert.deepEqual(steps.map(s => s.triggerEventKey), toilet.map(s => s.triggerEventKey));
  assert.deepEqual(steps.map(s => s.lifePhase), [undefined, undefined, 'use-toilet', undefined, 'flush', 'wash-hands']);
  assert.equal(steps[2].duration, LIFE_SETTINGS.toiletSeconds);
  assert.equal(steps[5].duration, LIFE_SETTINGS.handWashingSeconds);
  const shower = buildLaraLifeInstructions({ activity: 'shower', id: 'shower', slotId: 'take-shower-1' });
  assert.deepEqual(shower.map(s => s.type), ['MOVE_TO', 'USE_OBJECT', 'MOVE_TO']);
  assert.equal(shower[1].animation, 'taking-shower');
});

it('fait évoluer l’humeur avec le besoin dominant puis retrouve son bien-être après satisfaction', () => {
  const { getLifeMood } = require('../../src/features/scene/ai/laraLife.ts');
  const satisfied = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
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
  const needs = { rest: 50, work: 50, walk: 0, meal: 40, hygiene: 0, toilet: 0 };
  assert.equal(chooseLifeActivity(needs, options, position, null, 10).activity, 'work');
  assert.equal(chooseLifeActivity(needs, options, position, null, 12).activity, 'meal');
  assert.equal(chooseLifeActivity(needs, options, position, 'read', 21).activity, 'social');
  assert.equal(chooseLifeActivity(needs, options, position, null, 23).activity, 'sleep');
  assert.equal(chooseLifeActivity({ ...needs, meal: 100 }, options, position, null, 23).activity, 'meal');
  for (const activity of ['read', 'watch-tv', 'social']) {
    assert(evolveLife(needs, 10, activity, false).work < needs.work);
    assert.equal(lifeEffect(activity), null, 'Travelling to leisure must not relieve boredom');
    assert.equal(lifeEffect(activity, activity), activity);
  }
});

it('propose les loisirs libres et conserve leurs phases et les actions de la télé', () => {
  const objects = [
    { id: 'desk-bollsidan-2', slots: [{ slotId: 'work-standing' }] },
    { id: 'tv-view', slots: [{ slotId: 'watch', triggerEventKey: 'tv-toggle', triggerEventValue: true }] },
    { id: 'garden-conversation', slots: [{ slotId: 'chat', isDuo: true }] },
  ].map(object => ({ ...object, position: [0, 0, 0] }));
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': require('../../src/features/scene/ai/laraLife.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => objects,
      buildSmartObjectInstructionSequence: (id, slotId) => [{ type: 'USE_OBJECT', smartObjectId: id, ...objects.find(object => object.id === id).slots.find(slot => slot.slotId === slotId) }] },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: () => false } },
  });
  const options = getLaraLifeCandidates(false);
  for (const activity of ['read', 'watch-tv', 'social']) {
    const candidate = options.find(c => c.activity === activity);
    assert(candidate);
    const [step] = buildLaraLifeInstructions(candidate);
    assert.equal(step.lifePhase, activity);
    if (activity === 'watch-tv') {
      assert.equal(step.triggerEventKey, 'tv-toggle');
      assert.equal(step.triggerEventValue, true);
    }
    if (activity === 'read') assert.equal(step.animation, 'standing-using-touchscreen-tablet');
  }
});
