const { it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const life = require('../../src/features/scene/ai/laraLife.ts');

beforeEach(() => { Object.assign(life.lifeHousehold, life.createLifeHousehold()); life.activeLifeDances.clear(); });

it('prépare pour les convives présents, réserve sans doubler et rend les portions non mangées', () => {
  life.prepareLifeMeals('native', ['cha', 'vivida', 'cha']);
  assert.equal(life.lifeHousehold.meals.portions, 2);
  assert(life.claimLifeMeal('native'));
  assert.equal(life.lifeHousehold.meals.portions, 2);
  assert(life.claimLifeMeal('cha') && life.claimLifeMeal('vivida'));
  assert(!life.claimLifeMeal('sabira'));
  life.releaseLifeMeal('cha');
  assert(life.claimLifeMeal('sabira'));
  life.releaseLifeMeal('native', true);
  life.releaseLifeMeal('native', true);
  assert.equal(life.lifeHousehold.meals.portions, 0);
  assert.equal(life.lifeHousehold.meals.preparedBy, 'native');
});

it('deux cuisinières finissant ensemble utilisent les mêmes portions disponibles', () => {
  life.prepareLifeMeals('native', ['cha', 'vivida']);
  life.prepareLifeMeals('cha', ['native', 'vivida']);
  assert.equal(life.lifeHousehold.meals.portions, 1);
  assert.deepEqual(Object.keys(life.lifeHousehold.meals.held).sort(), ['cha', 'native']);
});

it('un repas existant fonctionne sans appareil libre et ne soulage pas la faim avant de manger', () => {
  life.prepareLifeMeals('native', ['cha']);
  const needs = life.createLife('cha').needs;
  const { getLaraLifeCandidates, buildLaraLifeInstructions } = load('src/features/scene/ai/autonomousActivities.ts', {
    './laraLife': life, './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
    './smartObjectRegistry': { getAllSmartObjects: () => [{ id: 'sofa', category: 'seating', position: [0, 0, 0], slots: [{ slotId: 'sit', entryAnimation: 'stand-to-sit', exitAnimation: 'sit-to-stand' }] }], buildSmartObjectInstructionSequence: () => { throw Error('No cooking for a prepared meal'); } },
    './occupancyManager': { OccupancyManager: { canUseObject: () => true, isSlotOccupied: () => false, getReservations: () => [] } },
  });
  const meal = getLaraLifeCandidates('cha', false).find(candidate => candidate.activity === 'meal');
  assert(meal);
  const before = { ...needs }, steps = buildLaraLifeInstructions('cha', meal);
  assert.deepEqual(steps.map(step => step.lifePhase), ['eat-meal']);
  assert.deepEqual(needs, before);
  assert(life.lifeHousehold.meals.held.cha);
  assert(!getLaraLifeCandidates('cha', true).some(candidate => candidate.activity === 'meal'));
});

it('sépare précisément les journées à minuit et distingue attentes, besoins et moments partagés', () => {
  const needs = { ...life.createLife('native').needs, work: 80 };
  life.recordLifeDay('native', 959, 3, 'read', needs, 'cha');
  life.recordLifeDay('native', 962, 5, null, needs);
  life.recordLifeEvent('native', 962, 'life_reaction');
  const days = life.lifeHousehold.journal.native;
  assert.equal(days[1].activities.read, 1);
  assert.equal(days[2].activities.read, 2);
  assert.equal(days[2].partners.cha, 2);
  assert.equal(days[2].unmet.work, 7);
  assert.equal(days[2].events.life_reaction, 1);
  assert.throws(() => life.recordLifeDay('native', 0, NaN, null, needs));
});

it('danser ou combattre fatigue davantage que le bureau, et recevoir un massage repose', () => {
  const needs = { ...life.createLife('native').needs, rest: 20 };
  const after = activity => life.evolveLife(needs, 10, activity, false);
  assert(after('dance').rest > after('work').rest);
  assert(after('combat').rest > after('dance').rest);
  assert(after('massage').rest > needs.rest);
  assert(after('receive-massage').rest < needs.rest);
});

it('la compagnie de danse exige une activité réelle dans le même lieu, sans ennemie', () => {
  life.activeLifeDances.set('rosanna', 'est-neighbor-flat');
  life.activeLifeDances.set('marissa', 'est-neighbor-flat');
  life.activeLifeDances.set('delphina', 'rain-dance');
  assert.equal(life.getLifeDancePartner('sabira', 'est-neighbor-flat', life.createLife('sabira').relationships, 0), 'rosanna');
  life.activeLifeDances.delete('rosanna');
  assert.equal(life.getLifeDancePartner('sabira', 'est-neighbor-flat', {}, 0), undefined);
});
